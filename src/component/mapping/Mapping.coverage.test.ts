import { test, expect, describe } from 'vite-plus/test';

import { HTMLMapper } from '../html/HTMLMapper';
import {
  type ComponentMapping,
  filterEmptyTextNode,
  isValidParams,
} from './Mapping';
import { matchesPattern, filterAllMapping, excludeNode } from './Mapping.utils';
import {
  toTikTok,
  toInfogram,
  toYoutube,
  toVimeo,
  toDailymotion,
} from './Mapping.embeds';
import { toButton, toAnchorButton } from './Mapping.container';
import {
  type ButtonComponent,
  type GalleryComponent,
  type ImageComponent,
  type AudioComponent,
  type VideoComponent,
  isButtonComponent,
} from '../Component';
import type { ElementNode } from '../node/Node';

const tags = { tags: ['unit', 'html'] };

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
    expect(c.errors).toContain('Invalid TikTok video URL format.');
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
    expect(c.errors).toContain('Invalid Youtube video URL format.');
  });

  test('toYoutube rejects an invalid video id', tags, () => {
    const c = toYoutube(new URL('https://youtu.be/short'));
    expect(c.errors).toContain('Invalid YouTube video ID.');
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
    expect(c.errors).toContain('invalid button implementation');
  });

  test('toButton flags a button>a without text', tags, () => {
    const node = el('button', [
      el('a', [], [{ key: 'href', value: 'https://example.com' }]),
    ]);
    const c = toButton(node);
    expect(c.errors).toContain('Button text is required');
    expect(c.link).toBe('https://example.com');
  });

  test('toButton flags a button>a without href', tags, () => {
    const node = el('button', [el('a', [text('Click')])]);
    const c = toButton(node);
    expect(c.errors).toContain('href attribute is required in a button link');
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
    expect(c.errors).toContain('Button text is required');
  });

  test('toAnchorButton flags a missing link', tags, () => {
    const node = el('a', [el('button', [text('Go')])]);
    const c = toAnchorButton(node);
    expect(c.errors).toContain('Button link is required');
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
    expect(component.errors).toContain('HTML node do not have children');
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
    expect(component.errors).toContain('HTML node do not have children');
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
      posts: Array<{ errors: string[] }>;
    };
    expect(live.posts[0].errors).toContain('post do not have components');
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
    expect(gallery.errors).toContain('slides not found in the gallery');
  });
});

describe('Media error paths', () => {
  test('picture without an img src records an error', tags, () => {
    const [c] = HTMLMapper.toComponents(`<picture><img alt="x" /></picture>`);
    expect((c as ImageComponent).errors).toContain(
      'Image src attribute is missing'
    );
  });

  test('picture with multiple imgs warns', tags, () => {
    const [c] = HTMLMapper.toComponents(
      `<picture><img src="a.jpg" /><img src="b.jpg" /></picture>`
    );
    expect((c as ImageComponent).warnings).toContain(
      'Only one img tag per picture tag is valid'
    );
  });

  test('figure img without src records an error', tags, () => {
    const [c] = HTMLMapper.toComponents(`<figure><img alt="x" /></figure>`);
    expect((c as ImageComponent).errors).toContain(
      'Image src attribute is missing'
    );
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
    expect((c as ImageComponent).errors).toContain(
      'Image src attribute is missing'
    );
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
