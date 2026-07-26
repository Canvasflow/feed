import { test, expect, describe } from 'vite-plus/test';

import { HTMLMapper } from '../../html/html-mapper';
import {
  type ComponentMapping,
  filterEmptyTextNode,
  isValidParams,
} from '../mapping';
import {
  matchesPattern,
  filterAllMapping,
  excludeNode,
} from '../mapping.utils';
import {
  toTikTok,
  toInfogram,
  toYoutube,
  toVimeo,
  toDailymotion,
} from '../mapping.embeds';
import { toImage, toApplePodcast } from '../mapping.media';
import {
  toButton,
  toAnchorButton,
  toFigureContainer,
} from '../mapping.container';
import {
  type ButtonComponent,
  type FigureContainerComponent,
  type GalleryComponent,
  type ImageComponent,
  type AudioComponent,
  type VideoComponent,
  isButtonComponent,
} from '../../component';
import type { ElementNode } from '../../node/node-helpers';
import type { FeedIssue } from '../../../feed-issue';

const tags = { tags: ['unit', 'html'] };

/**
 * `true` when some issue in `issues` has exactly `message`. Test-only
 * helper so assertions against `FeedIssue[]` read like the old
 * `toContain('exact string')` checks against `string[]`.
 */
function hasMessage(issues: FeedIssue[], message: string): boolean {
  return issues.some((issue) => issue.message === message);
}

describe('Embed URL builders', () => {
  test('toTikTok parses a valid video URL', tags, () => {
    const c = toTikTok(
      new URL('https://www.tiktok.com/@someuser/video/1234567890')
    );
    expect(c.params.username).toBe('@someuser');
    expect(c.params.id).toBe('1234567890');
    expect(c.errors).toHaveLength(0);
  });

  test('toTikTok rejects an invalid video URL', tags, () => {
    const c = toTikTok(new URL('https://www.tiktok.com/@someuser'));
    expect(hasMessage(c.errors, 'Invalid TikTok video URL format.')).toBe(true);
  });

  test('toInfogram extracts parent_url when present', tags, () => {
    const c = toInfogram(
      new URL('https://e.infogram.com/abc-123?parent_url=https://news.example')
    );
    expect(c.params.id).toBe('abc-123');
    expect(c.params.parentUrl).toBe('https://news.example');
  });

  test('toInfogram falls back to empty parent_url', tags, () => {
    const c = toInfogram(new URL('https://e.infogram.com/abc-123'));
    expect(c.params.parentUrl).toBe('');
  });

  test('toYoutube rejects a non-youtube URL', tags, () => {
    const c = toYoutube(new URL('https://example.com/watchme'));
    expect(hasMessage(c.errors, 'Invalid Youtube video URL format.')).toBe(
      true
    );
  });

  test('toYoutube rejects an invalid video id', tags, () => {
    const c = toYoutube(new URL('https://youtu.be/short'));
    expect(hasMessage(c.errors, 'Invalid YouTube video ID.')).toBe(true);
  });

  test('toVimeo accepts a valid vimeo URL', tags, () => {
    const c = toVimeo(new URL('https://vimeo.com/123456789'));
    expect(c.errors).toHaveLength(0);
    expect(c.params.id).toBe('123456789');
  });

  test('toVimeo rejects a non-vimeo URL', tags, () => {
    const c = toVimeo(new URL('https://example.com/123456789'));
    expect(c.errors.length).toBeGreaterThan(0);
  });

  test('toDailymotion builds a component from a URL', tags, () => {
    const c = toDailymotion(
      new URL('https://www.dailymotion.com/video/x7tgad0')
    );
    expect(c.component).toBe('video');
  });
});

describe('Button builder edge cases', () => {
  const el = (
    tagName: string,
    children: ElementNode['children'] = [],
    attrs?: { key: string; value: string }[]
  ): ElementNode => ({
    type: 'element',
    tagName,
    children,
    attributes: attrs,
  });
  const text = (content: string) => ({ type: 'text' as const, content });

  test('toButton flags an invalid implementation', tags, () => {
    const c = toButton(el('div'));
    expect(hasMessage(c.errors, 'invalid button implementation')).toBe(true);
  });

  test('toButton flags a button>a without text', tags, () => {
    const node = el('button', [
      el('a', [], [{ key: 'href', value: 'https://example.com' }]),
    ]);
    const c = toButton(node);
    expect(hasMessage(c.errors, 'Button text is required')).toBe(true);
    expect(c.link).toBe('https://example.com');
  });

  test('toButton flags a button>a without href', tags, () => {
    const node = el('button', [el('a', [text('Click')])]);
    const c = toButton(node);
    expect(
      hasMessage(c.errors, 'href attribute is required in a button link')
    ).toBe(true);
  });

  test('toButton warns when a bare button has no link', tags, () => {
    const node = el('button', [text('Press me')]);
    const c = toButton(node);
    expect(c.warnings.length).toBeGreaterThan(0);
    expect(c.text).toBe('Press me');
  });

  test('toAnchorButton flags a missing button text', tags, () => {
    const node = el(
      'a',
      [el('button')],
      [{ key: 'href', value: 'https://example.com' }]
    );
    const c = toAnchorButton(node);
    expect(hasMessage(c.errors, 'Button text is required')).toBe(true);
  });

  test('toAnchorButton flags a missing link', tags, () => {
    const node = el('a', [el('button', [text('Go')])]);
    const c = toAnchorButton(node);
    expect(hasMessage(c.errors, 'Button link is required')).toBe(true);
  });
});

describe('Container/columns/live empty paths', () => {
  const containerMapping: ComponentMapping = {
    component: 'container',
    match: 'all',
    filters: [{ type: 'class', match: 'any', items: ['cmc-container'] }],
  };

  test('columns mapping with no columns records an error', tags, () => {
    const mappings: ComponentMapping[] = [
      {
        component: 'columns',
        match: 'all',
        filters: [{ type: 'class', match: 'any', items: ['cmc-columns'] }],
        column: {
          match: 'any',
          filters: [{ type: 'class', match: 'any', items: ['cmc-column'] }],
        },
      },
    ];
    const content = `<article><div class="cmc-columns">no columns here</div></article>`;
    const [component] = HTMLMapper.toComponents(content, { mappings });
    expect(
      hasMessage(component!.errors, 'HTML node do not have children')
    ).toBe(true);
  });

  test('live container mapping with no posts records an error', tags, () => {
    const mappings: ComponentMapping[] = [
      {
        component: 'live_container',
        match: 'all',
        filters: [{ type: 'class', match: 'any', items: ['live-container'] }],
        post: {
          match: 'any',
          filters: [{ type: 'class', match: 'any', items: ['cmc-post'] }],
        },
      },
    ];
    const content = `<article><div class="live-container">no posts</div></article>`;
    const [component] = HTMLMapper.toComponents(content, { mappings });
    expect(
      hasMessage(component!.errors, 'HTML node do not have children')
    ).toBe(true);
  });

  test('live post with no components records an error', tags, () => {
    const mappings: ComponentMapping[] = [
      {
        component: 'live_container',
        match: 'all',
        filters: [{ type: 'class', match: 'any', items: ['live-container'] }],
        post: {
          match: 'any',
          filters: [{ type: 'class', match: 'any', items: ['cmc-post'] }],
        },
      },
    ];
    const content = `<article><div class="live-container"><div class="cmc-post"></div></div></article>`;
    const [component] = HTMLMapper.toComponents(content, { mappings });
    const live = component as unknown as {
      posts: Array<{ errors: FeedIssue[] }>;
    };
    expect(
      hasMessage(live.posts[0]!.errors, 'post do not have components')
    ).toBe(true);
  });

  test('container mapping still builds with only text content', tags, () => {
    const content = `<article><div class="cmc-container">just text</div></article>`;
    const components = HTMLMapper.toComponents(content, {
      mappings: [containerMapping],
    });
    expect(components.length).toBeGreaterThan(0);
  });

  test('gallery mapping with no image slides records an error', tags, () => {
    const mappings: ComponentMapping[] = [
      {
        component: 'gallery',
        match: 'any',
        filters: [{ type: 'class', match: 'any', items: ['gal'] }],
        slide: {
          match: 'all',
          filters: [{ type: 'class', match: 'any', items: ['slide'] }],
        },
      },
    ];
    const content = `<div class="gal"><div class="slide"><h2>not an image</h2></div></div>`;
    const [component] = HTMLMapper.toComponents(content, { mappings });
    const gallery = component as GalleryComponent;
    expect(hasMessage(gallery.errors, 'slides not found in the gallery')).toBe(
      true
    );
  });
});

describe('Media error paths', () => {
  test('picture without an img src records an error', tags, () => {
    const [c] = HTMLMapper.toComponents(`<picture><img alt="x" /></picture>`);
    expect(
      hasMessage((c as ImageComponent).errors, 'Image src attribute is missing')
    ).toBe(true);
  });

  test('picture with multiple imgs warns', tags, () => {
    const [c] = HTMLMapper.toComponents(
      `<picture><img src="a.jpg" /><img src="b.jpg" /></picture>`
    );
    expect(
      hasMessage(
        (c as ImageComponent).warnings,
        'Only one img tag per picture tag is valid'
      )
    ).toBe(true);
  });

  test('figure img without src records an error', tags, () => {
    const [c] = HTMLMapper.toComponents(`<figure><img alt="x" /></figure>`);
    expect(
      hasMessage((c as ImageComponent).errors, 'Image src attribute is missing')
    ).toBe(true);
  });

  test('figure img width/height attributes are parsed', tags, () => {
    const [c] = HTMLMapper.toComponents(
      `<figure><img src="a.jpg" width="640" height="480" /></figure>`
    );
    const img = c as ImageComponent;
    expect(img.width).toBe(640);
    expect(img.height).toBe(480);
  });

  test('anchor wrapping an img without src records an error', tags, () => {
    const [c] = HTMLMapper.toComponents(
      `<a href="https://example.com"><img alt="x" /></a>`
    );
    expect(
      hasMessage((c as ImageComponent).errors, 'Image src attribute is missing')
    ).toBe(true);
  });

  test('video without a source records an error', tags, () => {
    const [c] = HTMLMapper.toComponents(`<video></video>`);
    expect((c as VideoComponent).errors.length).toBeGreaterThan(0);
  });

  test('audio without a source records an error', tags, () => {
    const [c] = HTMLMapper.toComponents(`<audio></audio>`);
    expect((c as AudioComponent).errors.length).toBeGreaterThan(0);
  });

  test(
    'a twitter blockquote without a valid tweet link is dropped',
    tags,
    () => {
      const components = HTMLMapper.toComponents(
        `<blockquote class="twitter-tweet"><p>no links here</p></blockquote>`
      );
      expect(components.every((c) => c.component !== 'twitter')).toBe(true);
    }
  );

  test(
    'a twitter blockquote whose anchor lacks an href is dropped',
    tags,
    () => {
      const components = HTMLMapper.toComponents(
        `<blockquote class="twitter-tweet"><a>no href</a></blockquote>`
      );
      expect(components.every((c) => c.component !== 'twitter')).toBe(true);
    }
  );
});

describe('Link container reduce paths', () => {
  test(
    'wraps a text component in an anchor carrying its attributes',
    tags,
    () => {
      const link = 'https://example.org';
      const content = `<a href="${link}" target="_blank"><div><h1>Heading</h1></div></a>`;
      const [component] = HTMLMapper.toComponents(content, { mappings: [] });
      expect((component as unknown as { text: string }).text).toBe(
        `<a href="${link}" target="_blank">Heading</a>`
      );
    }
  );

  test('applies the link to a wrapped image component', tags, () => {
    const content = `<a href="https://example.org" target="_blank"><div><h1>x</h1></div><img src="a.jpg" /></a>`;
    const components = HTMLMapper.toComponents(content, { mappings: [] });
    const image = components.find((c) => 'imageurl' in c) as ImageComponent;
    expect(image.link).toBe('https://example.org');
  });

  test(
    'applies the link to a wrapped button without its own link',
    tags,
    () => {
      // The button is nested (not a direct child) so the anchor becomes a link
      // container instead of an anchor-button.
      const content = `<a href="https://example.org" target="_blank"><div><h1>x</h1></div><div><button>Press</button></div></a>`;
      const components = HTMLMapper.toComponents(content, { mappings: [] });
      const button = components.find((c) => isButtonComponent(c)) as
        | ButtonComponent
        | undefined;
      expect(button).toBeDefined();
      expect(button?.link).toBe('https://example.org');
    }
  );
});

describe('Mapping.utils direct branches', () => {
  test(
    'matchesPattern caches and returns false for an invalid regex',
    tags,
    () => {
      // `[` is an invalid RegExp; it is cached as null and never matches.
      expect(matchesPattern('anything', '([')).toBe(false);
      expect(matchesPattern('anything', '([')).toBe(false);
    }
  );

  test('matchesPattern matches a valid regex', tags, () => {
    expect(matchesPattern('hello-world', '^hello')).toBe(true);
  });

  test('filterAllMapping returns false when there are no filters', tags, () => {
    const node: ElementNode = { type: 'element', tagName: 'div', children: [] };
    expect(filterAllMapping(node, [])).toBe(false);
  });

  test('excludeNode matches via an any-filter', tags, () => {
    const node: ElementNode = {
      type: 'element',
      tagName: 'div',
      children: [],
      attributes: [{ key: 'class', value: 'ad' }],
    };
    const excluded = excludeNode(node, [
      {
        match: 'any',
        filters: [{ type: 'class', match: 'any', items: ['ad'] }],
      },
    ]);
    expect(excluded).toBe(true);
  });
});

describe('Mapping core direct branches', () => {
  test('filterEmptyTextNode drops empty text nodes', tags, () => {
    expect(filterEmptyTextNode({ type: 'text', content: '' })).toBe(false);
    expect(filterEmptyTextNode({ type: 'text', content: 'hi' })).toBe(true);
    expect(filterEmptyTextNode({ type: 'comment', content: 'x' })).toBe(false);
  });
});

describe('AttributePatternFilterSchema regex validation', () => {
  const unitTags = { tags: ['unit'] };

  test('isValidParams rejects an invalid regex pattern', unitTags, () => {
    expect(
      isValidParams({
        mappings: [
          {
            match: 'any',
            filters: [{ type: 'attribute', key: 'class', pattern: '[invalid' }],
            component: 'body',
          },
        ],
      })
    ).toBe(false);
  });

  test('isValidParams accepts a valid regex pattern', unitTags, () => {
    expect(
      isValidParams({
        mappings: [
          {
            match: 'any',
            filters: [{ type: 'attribute', key: 'class', pattern: '^valid$' }],
            component: 'body',
          },
        ],
      })
    ).toBe(true);
  });
});

describe('Media direct-call error paths', () => {
  const el = (
    tagName: string,
    children: ElementNode['children'] = [],
    attrs: { key: string; value: string }[] = []
  ): ElementNode => ({
    type: 'element',
    tagName,
    children,
    attributes: attrs,
  });

  test('toImage figure with multiple pictures warns', tags, () => {
    const node = el('figure', [
      el('picture', [el('img', [], [{ key: 'src', value: 'a.jpg' }])]),
      el('picture', [el('img', [], [{ key: 'src', value: 'b.jpg' }])]),
    ]);
    const c = toImage(node) as ImageComponent;
    expect(
      hasMessage(c.warnings, 'Only one picture tag per figure tag is valid')
    ).toBe(true);
  });

  test(
    'toImage figure with anchor img missing src records an error',
    tags,
    () => {
      const node = el('figure', [
        el(
          'a',
          [el('img', [], [{ key: 'alt', value: 'x' }])],
          [{ key: 'href', value: 'https://example.com' }]
        ),
      ]);
      const c = toImage(node) as ImageComponent;
      expect(hasMessage(c.errors, 'Image src attribute is missing')).toBe(true);
    }
  );

  test('toImage figure with anchor missing href warns', tags, () => {
    const node = el('figure', [
      el('a', [el('img', [], [{ key: 'src', value: 'a.jpg' }])]),
    ]);
    const c = toImage(node) as ImageComponent;
    expect(hasMessage(c.warnings, 'Image link is empty')).toBe(true);
  });

  test('toApplePodcast without src records an error', tags, () => {
    const node = el('iframe');
    const c = toApplePodcast(node);
    expect(hasMessage(c.errors, 'src is required')).toBe(true);
  });

  test(
    'toImage figure with class-credit in figcaption extracts credit',
    tags,
    () => {
      const node = el('figure', [
        el(
          'img',
          [],
          [
            { key: 'src', value: 'a.jpg' },
            { key: 'alt', value: 'A photo' },
          ]
        ),
        el('figcaption', [
          el(
            'div',
            [{ type: 'text', content: 'Photo credit' }],
            [{ key: 'class', value: 'credit' }]
          ),
        ]),
      ]);
      const c = toImage(node) as ImageComponent;
      expect(c.credit).toContain('Photo credit');
      expect(c.caption).toBeUndefined();
    }
  );
});

describe('toFigureContainer direct paths', () => {
  const el = (
    tagName: string,
    children: ElementNode['children'] = [],
    attrs: { key: string; value: string }[] = []
  ): ElementNode => ({
    type: 'element',
    tagName,
    children,
    attributes: attrs,
  });
  const text = (content: string) => ({ type: 'text' as const, content });

  test('extracts credit from class-credit node inside figcaption', tags, () => {
    const node = el('figure', [
      el('img', [], [{ key: 'src', value: 'a.jpg' }]),
      el('figcaption', [
        el('div', [text('Caption text')]),
        el('div', [text('Credit text')], [{ key: 'class', value: 'credit' }]),
      ]),
    ]);
    const c = toFigureContainer(node) as FigureContainerComponent;
    expect(c.credit).toContain('Credit text');
    expect(c.caption).not.toContain('Credit text');
  });

  test('extracts credit from class-credit sibling of figcaption', tags, () => {
    const node = el('figure', [
      el('img', [], [{ key: 'src', value: 'a.jpg' }]),
      el('figcaption', [el('div', [text('Caption text')])]),
      el('div', [text('Sibling credit')], [{ key: 'class', value: 'credit' }]),
    ]);
    const c = toFigureContainer(node) as FigureContainerComponent;
    expect(c.credit).toContain('Sibling credit');
  });

  test(
    'credit nested deeper than direct figcaption child is stripped',
    tags,
    () => {
      const node = el('figure', [
        el('img', [], [{ key: 'src', value: 'a.jpg' }]),
        el('figcaption', [
          el('div', [
            el('span', [text('Caption')]),
            el(
              'div',
              [text('Deep credit')],
              [{ key: 'class', value: 'credit' }]
            ),
          ]),
        ]),
      ]);
      const c = toFigureContainer(node) as FigureContainerComponent;
      expect(c.credit).toContain('Deep credit');
      expect(c.caption).not.toContain('Deep credit');
    }
  );
});
