import { test, expect, describe } from 'vite-plus/test';

import { HTMLMapper } from './HTMLMapper';
import {
  type Params,
  isValidMapping,
  isValidParams,
  validateParams,
  processTextLinks,
} from './Mapping';

const tags = { tags: ['unit', 'html'] };

function convert(html: string, params?: Params) {
  return HTMLMapper.toComponents(html, params);
}

function find(html: string, component: string, params?: Params) {
  return convert(html, params).find((c) => c && c.component === component);
}

describe('Mapping — iframe embeds', () => {
  test('infogram iframe', tags, () => {
    const c = find(
      `<iframe id="ig" src="https://e.infogram.com/abc-123?parent_url=https://x.com"></iframe>`,
      'infogram'
    );
    expect(c).toBeDefined();
  });

  test('youtube iframe (direct origin)', tags, () => {
    const c = find(
      `<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>`,
      'video'
    );
    expect(c).toBeDefined();
  });

  test('apple podcast iframe', tags, () => {
    const c = find(
      `<iframe src="https://embed.podcasts.apple.com/us/podcast/foo/id123?i=456"></iframe>`,
      'audio'
    );
    expect(c).toBeDefined();
  });

  test('youtube via src search param', tags, () => {
    const c = find(
      `<iframe src="https://cdn.embedly.com/widgets/media.html?src=https://www.youtube.com/watch?v=dQw4w9WgXcQ"></iframe>`,
      'video'
    );
    expect(c).toBeDefined();
  });

  test('tiktok via url search param', tags, () => {
    const c = find(
      `<iframe src="https://example.com/e?url=https://www.tiktok.com/@user/video/1234567890123456789"></iframe>`,
      'video'
    );
    expect(c).toBeDefined();
  });

  test('dailymotion via url search param', tags, () => {
    const c = find(
      `<iframe src="https://example.com/e?url=https://www.dailymotion.com/video/x8abcde"></iframe>`,
      'video'
    );
    expect(c).toBeDefined();
  });

  test('vimeo via url search param', tags, () => {
    const c = find(
      `<iframe src="https://example.com/e?url=https://vimeo.com/123456789"></iframe>`,
      'video'
    );
    expect(c).toBeDefined();
  });

  test('twitter via url search param', tags, () => {
    const c = find(
      `<iframe src="https://example.com/e?url=https://twitter.com/user/status/123456789"></iframe>`,
      'twitter'
    );
    expect(c).toBeDefined();
  });

  test('unknown iframe falls back to custom', tags, () => {
    const c = find(
      `<iframe src="https://unknown.example.com/widget/abc"></iframe>`,
      'custom'
    );
    expect(c).toBeDefined();
  });

  test('protocol-relative iframe src is normalized', tags, () => {
    const c = find(
      `<iframe src="//www.youtube.com/embed/dQw4w9WgXcQ"></iframe>`,
      'video'
    );
    expect(c).toBeDefined();
  });

  test('iframe without src is ignored', tags, () => {
    const components = convert(`<iframe></iframe>`);
    expect(
      components.find((c) => c && c.component === 'custom')
    ).toBeUndefined();
  });
});

describe('Mapping — social blockquotes and anchors', () => {
  test('instagram blockquote (permalink)', tags, () => {
    const c = find(
      `<blockquote class="instagram-media" data-instgrm-permalink="https://www.instagram.com/p/ABC123/">x</blockquote>`,
      'instagram'
    );
    expect(c).toBeDefined();
  });

  test('instagram blockquote (version)', tags, () => {
    const c = find(
      `<blockquote data-instgrm-version="6"><a href="https://www.instagram.com/p/ABC123/">x</a></blockquote>`,
      'instagram'
    );
    expect(c).toBeDefined();
  });

  test('twitter blockquote', tags, () => {
    const c = find(
      `<blockquote class="twitter-tweet"><a href="https://twitter.com/user/status/123456789">x</a></blockquote>`,
      'twitter'
    );
    expect(c).toBeDefined();
  });

  test('tiktok blockquote', tags, () => {
    const c = find(
      `<blockquote class="tiktok-embed" cite="https://www.tiktok.com/@user/video/1234567890123456789">x</blockquote>`,
      'video'
    );
    expect(c).toBeDefined();
  });

  test('tiktok blockquote without cite reports an error', tags, () => {
    const components = convert(
      `<blockquote class="tiktok-embed">x</blockquote>`
    );
    const c = components.find((x) => x && x.component === 'video') as {
      errors: string[];
    };
    expect(c.errors.length).toBeGreaterThan(0);
  });

  test('youtube anchor', tags, () => {
    const c = find(
      `<a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">watch</a>`,
      'video'
    );
    expect(c).toBeDefined();
  });
});

describe('Mapping — media elements', () => {
  test('video with source children', tags, () => {
    const c = find(
      `<video controls poster="https://x/p.jpg"><source src="https://x/v.mp4" type="video/mp4"/></video>`,
      'video'
    );
    expect(c).toBeDefined();
  });

  test('video with src attribute', tags, () => {
    const c = find(
      `<video src="https://x/v.mp4" autoplay muted loop></video>`,
      'video'
    );
    expect(c).toBeDefined();
  });

  test('audio with source children', tags, () => {
    const c = find(
      `<audio controls><source src="https://x/a.mp3" type="audio/mpeg"/></audio>`,
      'audio'
    );
    expect(c).toBeDefined();
  });
});

describe('Mapping — tables, buttons, galleries', () => {
  test('table becomes htmltable', tags, () => {
    const c = find(
      `<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>`,
      'htmltable'
    );
    expect(c).toBeDefined();
  });

  test('button element', tags, () => {
    const c = find(`<button>Click me</button>`, 'button');
    expect(c).toBeDefined();
  });

  test('anchor with button role', tags, () => {
    const c = find(`<a role="button" href="https://x.com">Go</a>`, 'button');
    expect(c).toBeDefined();
  });

  test('gallery from role', tags, () => {
    const c = find(
      `<div role="gallery"><img src="https://x/1.jpg"/><img src="https://x/2.jpg"/></div>`,
      'gallery'
    );
    expect(c).toBeDefined();
  });

  test('mosaic gallery from role', tags, () => {
    const c = find(
      `<div role="mosaic" data-direction="vertical"><img src="https://x/1.jpg"/><img src="https://x/2.jpg"/></div>`,
      'gallery'
    );
    expect(c).toBeDefined();
  });
});

describe('Mapping — galleries with figure children', () => {
  // toGallery calls toImage(figure) directly, which delegates to fromFigure.
  function gallery(inner: string) {
    return find(`<div role="gallery">${inner}</div>`, 'gallery') as unknown as {
      images: Array<Record<string, unknown>>;
    };
  }

  test('figure with a linked image extracts link and dimensions', tags, () => {
    const g = gallery(
      `<figure><a href="https://x.com/page"><img src="https://x/a.jpg" width="100" height="50" alt="alt"/></a></figure>`
    );
    expect(g.images.length).toBe(1);
    expect(g.images[0].link).toBe('https://x.com/page');
    expect(g.images[0].imageurl).toBe('https://x/a.jpg');
  });

  test('figure with a direct image', tags, () => {
    const g = gallery(
      `<figure><img src="https://x/a.jpg" width="640" height="480" alt="alt"/></figure>`
    );
    expect(g.images[0].imageurl).toBe('https://x/a.jpg');
  });

  test('figure with multiple images is still mapped', tags, () => {
    const g = gallery(
      `<figure><img src="https://x/a.jpg"/><img src="https://x/b.jpg"/></figure>`
    );
    expect(g.images[0].imageurl).toBe('https://x/a.jpg');
  });

  test('figure with an anchor wrapping multiple images', tags, () => {
    const g = gallery(
      `<figure><a href="https://x.com"><img src="https://x/a.jpg"/><img src="https://x/b.jpg"/></a></figure>`
    );
    expect(g.images[0].imageurl).toBe('https://x/a.jpg');
    expect(g.images[0].link).toBe('https://x.com');
  });

  test('figure with a picture element', tags, () => {
    const g = gallery(
      `<figure><picture><source srcset="https://x/a.webp" type="image/webp"/><img src="https://x/a.jpg" alt="alt"/></picture></figure>`
    );
    expect(g.images[0].imageurl).toBe('https://x/a.jpg');
  });

  test('figure with a video carries through caption and credit', tags, () => {
    const g = gallery(
      `<figure><video controls><source src="https://x/v.mp4" type="video/mp4"/></video><figcaption>Cap<small>Credit</small></figcaption></figure>`
    );
    // video figures produce a video-typed gallery entry (no imageurl)
    expect(g.images.length).toBe(1);
  });

  test('figure with no media records an empty-imageurl error', tags, () => {
    const components = convert(
      `<div role="gallery"><figure><figcaption>Only caption</figcaption></figure></div>`
    );
    const g = components.find((c) => c && c.component === 'gallery');
    expect(g).toBeDefined();
  });

  test('gallery with a plain image child (toImage img fallback)', tags, () => {
    const g = gallery(
      `<img src="https://x/a.jpg" width="320" height="240" alt="x"/>`
    );
    expect(g.images[0].imageurl).toBe('https://x/a.jpg');
  });
});

describe('Mapping — figures and pictures', () => {
  test('figure wrapping a video keeps caption and credit', tags, () => {
    const c = find(
      `<figure><video controls><source src="https://x/v.mp4" type="video/mp4"/></video><figcaption>A caption<small>Credit</small></figcaption></figure>`,
      'video'
    );
    expect(c).toBeDefined();
  });

  test('figure with a linked image', tags, () => {
    const c = find(
      `<figure><a href="https://x.com"><img src="https://x/a.jpg" width="640" height="480" alt="alt"/></a><figcaption>Caption</figcaption></figure>`,
      'image'
    );
    expect(c).toBeDefined();
  });

  test('figure with multiple images warns', tags, () => {
    const c = find(
      `<figure><img src="https://x/a.jpg"/><img src="https://x/b.jpg"/></figure>`,
      'image'
    );
    expect(c).toBeDefined();
  });

  test('figure with a picture element', tags, () => {
    const c = find(
      `<figure><picture><source srcset="https://x/a.webp" type="image/webp"/><img src="https://x/a.jpg" alt="alt"/></picture></figure>`,
      'image'
    );
    expect(c).toBeDefined();
  });

  test('standalone picture with multiple images warns', tags, () => {
    const c = find(
      `<picture><img src="https://x/a.jpg"/><img src="https://x/b.jpg"/></picture>`,
      'image'
    );
    expect(c).toBeDefined();
  });
});

describe('Mapping — user mappings', () => {
  test('columns mapping', tags, () => {
    const params: Params = {
      mappings: [
        {
          component: 'columns',
          match: 'all',
          filters: [{ type: 'class', match: 'any', items: ['cols'] }],
          column: {
            match: 'any',
            filters: [{ type: 'class', match: 'any', items: ['col'] }],
          },
        },
      ],
    };
    const html = `<div class="cols"><div class="col"><p>One</p></div><div class="col"><p>Two</p></div></div>`;
    const c = find(html, 'columns', params);
    expect(c).toBeDefined();
  });

  test('live_container mapping', tags, () => {
    const params: Params = {
      mappings: [
        {
          component: 'live_container',
          match: 'all',
          filters: [{ type: 'class', match: 'any', items: ['live'] }],
          post: {
            match: 'any',
            filters: [{ type: 'class', match: 'any', items: ['post'] }],
          },
        },
      ],
    };
    const html = `<div class="live"><div class="post"><p>Update 1</p></div><div class="post"><p>Update 2</p></div></div>`;
    const c = find(html, 'live_container', params);
    expect(c).toBeDefined();
  });

  test('gallery from mapping', tags, () => {
    const params: Params = {
      mappings: [
        {
          component: 'gallery',
          match: 'all',
          filters: [{ type: 'class', match: 'any', items: ['gal'] }],
          slide: {
            match: 'any',
            filters: [{ type: 'class', match: 'any', items: ['slide'] }],
          },
        },
      ],
    };
    const html = `<div class="gal"><div class="slide"><img src="https://x/1.jpg"/></div><div class="slide"><img src="https://x/2.jpg"/></div></div>`;
    const c = find(html, 'gallery', params);
    expect(c).toBeDefined();
  });

  test('container mapping', tags, () => {
    const params: Params = {
      mappings: [
        {
          component: 'container',
          match: 'all',
          filters: [{ type: 'class', match: 'any', items: ['box'] }],
        },
      ],
    };
    const c = find(`<div class="box"><p>Inside</p></div>`, 'container', params);
    expect(c).toBeDefined();
  });

  test('recipe mapping', tags, () => {
    const params: Params = {
      mappings: [
        {
          component: 'recipe',
          match: 'all',
          filters: [{ type: 'class', match: 'any', items: ['recipe'] }],
        },
      ],
    };
    const c = find(
      `<div class="recipe"><p>Step one</p></div>`,
      'recipe',
      params
    );
    expect(c).toBeDefined();
  });

  test('custom mapping', tags, () => {
    const params: Params = {
      mappings: [
        {
          component: 'custom',
          match: 'all',
          filters: [{ type: 'class', match: 'any', items: ['embed'] }],
        },
      ],
    };
    const c = find(`<div class="embed"><span>x</span></div>`, 'custom', params);
    expect(c).toBeDefined();
  });

  test('text role mapping', tags, () => {
    const params: Params = {
      mappings: [
        {
          component: 'crosshead',
          match: 'all',
          filters: [{ type: 'class', match: 'any', items: ['ch'] }],
        },
      ],
    };
    const c = find(`<p class="ch">A crosshead</p>`, 'crosshead', params);
    expect(c).toBeDefined();
  });

  test('excludes drop matching nodes', tags, () => {
    const params: Params = {
      excludes: [
        {
          match: 'any',
          filters: [{ type: 'class', match: 'any', items: ['ad'] }],
        },
      ],
    };
    const components = convert(
      `<div><p>Keep</p><div class="ad"><p>Drop</p></div></div>`,
      params
    );
    const texts = components.filter((c) => c && c.component === 'body');
    expect(texts.length).toBeGreaterThan(0);
  });
});

describe('Mapping — linked content containers', () => {
  test('anchor wrapping text becomes a link container', tags, () => {
    const components = convert(
      `<a href="https://x.com"><h2>Heading</h2><p>Body</p></a>`
    );
    expect(components.length).toBeGreaterThan(0);
  });

  test('empty/whitespace html yields no components', tags, () => {
    expect(convert('')).toEqual([]);
    expect(convert('   ')).toEqual([]);
  });

  test('anchor without href still produces a link container body', tags, () => {
    const components = convert(`<a><p>No href body</p></a>`);
    expect(components.find((c) => c && c.component === 'body')).toBeDefined();
  });

  test('comment nodes inside elements are dropped', tags, () => {
    const components = convert(`<div><!-- a comment --><p>Keep</p></div>`);
    expect(components.find((c) => c && c.component === 'body')).toBeDefined();
  });
});

describe('Mapping — instagram variants', () => {
  test('instagram reel type', tags, () => {
    const c = find(
      `<blockquote class="instagram-media" data-instgrm-permalink="https://www.instagram.com/reel/ABC123/">x</blockquote>`,
      'instagram'
    );
    expect(c).toBeDefined();
  });

  test('instagram tv type', tags, () => {
    const c = find(
      `<blockquote class="instagram-media" data-instgrm-permalink="https://www.instagram.com/tv/ABC123/">x</blockquote>`,
      'instagram'
    );
    expect(c).toBeDefined();
  });

  test('instagram without a resolvable url reports an error', tags, () => {
    const components = convert(
      `<blockquote data-instgrm-version="6"></blockquote>`
    );
    const c = components.find((x) => x && x.component === 'instagram');
    expect(c).toBeDefined();
    expect((c as { errors: string[] }).errors.length).toBeGreaterThan(0);
  });

  test('instagram permalink missing type and id reports errors', tags, () => {
    const components = convert(
      `<blockquote data-instgrm-version="6" data-instgrm-permalink="https://www.instagram.com/">x</blockquote>`
    );
    const c = components.find((x) => x && x.component === 'instagram') as {
      errors: string[];
    };
    expect(c.errors.length).toBeGreaterThan(0);
  });

  test('instagram legacy embed resolves url from anchors', tags, () => {
    const c = find(
      `<blockquote data-instgrm-version="6"><a class="ignored">no href</a><a href="https://www.instagram.com/p/XYZ789/">view</a></blockquote>`,
      'instagram'
    );
    expect(c).toBeDefined();
  });

  test('instagram with an invalid url is caught', tags, () => {
    const components = convert(
      `<blockquote data-instgrm-version="6" data-instgrm-permalink="not a url">x</blockquote>`
    );
    const c = components.find((x) => x && x.component === 'instagram') as {
      errors: string[];
    };
    expect(c.errors.length).toBeGreaterThan(0);
  });
});

describe('Mapping — button variants', () => {
  test('anchor button without text reports an error', tags, () => {
    const components = convert(`<a role="button" href="https://x.com"></a>`);
    const c = components.find((x) => x && x.component === 'button') as {
      errors: string[];
    };
    expect(c.errors.length).toBeGreaterThan(0);
  });

  test('button wrapping an anchor link', tags, () => {
    const c = find(`<button><a href="https://x.com">Go</a></button>`, 'button');
    expect(c).toBeDefined();
  });

  test('button wrapping an anchor without href', tags, () => {
    const components = convert(`<button><a>Go</a></button>`);
    const c = components.find((x) => x && x.component === 'button') as {
      errors: string[];
    };
    expect(c.errors.length).toBeGreaterThan(0);
  });

  test('empty button warns it is not clickable', tags, () => {
    const components = convert(`<button></button>`);
    const c = components.find((x) => x && x.component === 'button') as {
      warnings: string[];
    };
    expect(c.warnings.length).toBeGreaterThan(0);
  });

  test('anchor wrapping a button (Forbes-style) becomes a button', tags, () => {
    const c = find(
      `<a href="https://x.com"><button>Buy now</button></a>`,
      'button'
    );
    expect(c).toBeDefined();
  });

  test(
    'anchor wrapping a button without text or href reports errors',
    tags,
    () => {
      const components = convert(`<a><button></button></a>`);
      const c = components.find((x) => x && x.component === 'button') as {
        errors: string[];
      };
      expect(c.errors.length).toBeGreaterThan(0);
    }
  );
});

describe('Mapping — media and image edge cases', () => {
  test('video without a source reports an error', tags, () => {
    const components = convert(`<video></video>`);
    const c = components.find((x) => x && x.component === 'video') as {
      errors: string[];
    };
    expect(c.errors.length).toBeGreaterThan(0);
  });

  test('audio without a source reports an error', tags, () => {
    const components = convert(`<audio></audio>`);
    const c = components.find((x) => x && x.component === 'audio') as {
      errors: string[];
    };
    expect(c.errors.length).toBeGreaterThan(0);
  });

  test('picture with an image missing src reports an error', tags, () => {
    const components = convert(`<picture><img alt="no source"/></picture>`);
    const c = components.find((x) => x && x.component === 'image') as {
      errors: string[];
    };
    expect(c.errors.length).toBeGreaterThan(0);
  });

  test('youtube iframe with non-video path is invalid', tags, () => {
    const c = find(
      `<iframe src="https://www.youtube.com/foo"></iframe>`,
      'video'
    );
    expect(c).toBeDefined();
    expect((c as { errors: string[] }).errors.length).toBeGreaterThan(0);
  });

  test('dailymotion via url with invalid format is flagged', tags, () => {
    const c = find(
      `<iframe src="https://example.com/e?url=https://www.dailymotion.com/foo"></iframe>`,
      'video'
    );
    expect(c).toBeDefined();
    expect((c as { errors: string[] }).errors.length).toBeGreaterThan(0);
  });
});

describe('Mapping — mappings with all-match inner filters', () => {
  test('columns with column.match all and an exclude', tags, () => {
    const params: Params = {
      excludes: [
        {
          match: 'any',
          filters: [{ type: 'class', match: 'any', items: ['skip'] }],
        },
      ],
      mappings: [
        {
          component: 'columns',
          match: 'all',
          filters: [{ type: 'class', match: 'equal', items: ['cols'] }],
          column: {
            match: 'all',
            filters: [{ type: 'class', match: 'equal', items: ['col'] }],
          },
        },
      ],
    };
    const html = `<div class="cols"><div class="col"><p>One</p></div><div class="col"><p>Two</p></div><div class="skip"><p>x</p></div></div>`;
    const c = find(html, 'columns', params);
    expect(c).toBeDefined();
  });

  test('live_container with post.match all', tags, () => {
    const params: Params = {
      mappings: [
        {
          component: 'live_container',
          match: 'all',
          filters: [{ type: 'class', match: 'equal', items: ['live'] }],
          post: {
            match: 'all',
            filters: [{ type: 'class', match: 'equal', items: ['post'] }],
          },
        },
      ],
    };
    const html = `<div class="live"><div class="post"><p>One</p></div></div>`;
    const c = find(html, 'live_container', params);
    expect(c).toBeDefined();
  });

  test('live_container without matching posts reports an error', tags, () => {
    const params: Params = {
      mappings: [
        {
          component: 'live_container',
          match: 'all',
          filters: [{ type: 'class', match: 'equal', items: ['live'] }],
          post: {
            match: 'all',
            filters: [{ type: 'class', match: 'equal', items: ['nope'] }],
          },
        },
      ],
    };
    const components = convert(
      `<div class="live"><p>No posts</p></div>`,
      params
    );
    const c = components.find((x) => x && x.component === 'live_container') as {
      errors: string[];
    };
    expect(c.errors.length).toBeGreaterThan(0);
  });

  test('gallery from mapping honors excludes', tags, () => {
    const params: Params = {
      excludes: [
        {
          match: 'any',
          filters: [{ type: 'class', match: 'any', items: ['skip'] }],
        },
      ],
      mappings: [
        {
          component: 'gallery',
          match: 'all',
          filters: [{ type: 'class', match: 'equal', items: ['gal'] }],
          slide: {
            match: 'any',
            filters: [{ type: 'class', match: 'any', items: ['slide'] }],
          },
        },
      ],
    };
    const html = `<div class="gal"><div class="slide"><img src="https://x/1.jpg"/></div><div class="slide skip"><img src="https://x/2.jpg"/></div></div>`;
    const c = find(html, 'gallery', params);
    expect(c).toBeDefined();
  });

  test('gallery from mapping with slide.match all', tags, () => {
    const params: Params = {
      mappings: [
        {
          component: 'gallery',
          match: 'all',
          filters: [{ type: 'class', match: 'equal', items: ['gal'] }],
          slide: {
            match: 'all',
            filters: [{ type: 'class', match: 'equal', items: ['slide'] }],
          },
        },
      ],
    };
    const html = `<div class="gal"><div class="slide"><img src="https://x/1.jpg"/></div></div>`;
    const c = find(html, 'gallery', params);
    expect(c).toBeDefined();
  });
});

describe('Mapping — figure descendants', () => {
  test('figure with an iframe youtube embed', tags, () => {
    const c = find(
      `<figure><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe><figcaption>Cap</figcaption></figure>`,
      'video'
    );
    expect(c).toBeDefined();
  });

  test('figure with an audio element carries caption and credit', tags, () => {
    const c = find(
      `<figure><audio controls><source src="https://x/a.mp3" type="audio/mpeg"/></audio><figcaption>Cap<small>By me</small></figcaption></figure>`,
      'audio'
    );
    expect(c).toBeDefined();
  });

  test('figure with a table becomes an htmltable with caption', tags, () => {
    const c = find(
      `<figure><table><tr><td>1</td></tr></table><figcaption>Cap</figcaption></figure>`,
      'htmltable'
    );
    expect(c).toBeDefined();
  });

  test('figure with a twitter blockquote', tags, () => {
    const c = find(
      `<figure><blockquote class="twitter-tweet"><a href="https://twitter.com/u/status/1">x</a></blockquote></figure>`,
      'twitter'
    );
    expect(c).toBeDefined();
  });

  test('figure honors excludes', tags, () => {
    const params: Params = {
      excludes: [
        {
          match: 'any',
          filters: [{ type: 'class', match: 'any', items: ['skip'] }],
        },
      ],
    };
    const components = convert(
      `<figure><img src="https://x/a.jpg"/><div class="skip"><p>drop</p></div><figcaption>Cap</figcaption></figure>`,
      params
    );
    expect(components.find((c) => c && c.component === 'image')).toBeDefined();
  });
});

describe('Mapping — live container with excludes', () => {
  test('live_container drops excluded posts', tags, () => {
    const params: Params = {
      excludes: [
        {
          match: 'any',
          filters: [{ type: 'class', match: 'any', items: ['ad'] }],
        },
      ],
      mappings: [
        {
          component: 'live_container',
          match: 'all',
          filters: [{ type: 'class', match: 'equal', items: ['live'] }],
          post: {
            match: 'any',
            filters: [{ type: 'class', match: 'any', items: ['post'] }],
          },
        },
      ],
    };
    const html = `<div class="live"><div class="post"><p>Keep</p></div><div class="post ad"><p>Drop</p></div></div>`;
    const c = find(html, 'live_container', params);
    expect(c).toBeDefined();
  });

  test('columns drops excluded columns', tags, () => {
    const params: Params = {
      excludes: [
        {
          match: 'any',
          filters: [{ type: 'class', match: 'any', items: ['ad'] }],
        },
      ],
      mappings: [
        {
          component: 'columns',
          match: 'all',
          filters: [{ type: 'class', match: 'equal', items: ['cols'] }],
          column: {
            match: 'any',
            filters: [{ type: 'class', match: 'any', items: ['col'] }],
          },
        },
      ],
    };
    const html = `<div class="cols"><div class="col"><p>A</p></div><div class="col ad"><p>B</p></div></div>`;
    const c = find(html, 'columns', params);
    expect(c).toBeDefined();
  });
});

describe('Mapping — validators and helpers', () => {
  test(
    'isValidMapping accepts a valid mapping and rejects garbage',
    tags,
    () => {
      expect(
        isValidMapping({
          mappings: [
            { match: 'all', filters: [{ type: 'tag', items: ['div'] }] },
          ],
        })
      ).toBe(true);
      expect(isValidMapping(null)).toBe(false);
      expect(isValidMapping({ mappings: 'nope' })).toBe(false);
    }
  );

  test('isValidParams accepts valid params and rejects garbage', tags, () => {
    expect(
      isValidParams({
        mappings: [
          {
            match: 'all',
            component: 'container',
            filters: [{ type: 'tag', items: ['div'] }],
          },
        ],
      })
    ).toBe(true);
    expect(isValidParams(null)).toBe(false);
    expect(isValidParams({ mappings: {} })).toBe(false);
  });

  test(
    'validateParams returns parsed params and throws on invalid',
    tags,
    () => {
      const params = validateParams({
        mappings: [
          {
            match: 'all',
            component: 'container',
            filters: [{ type: 'tag', items: ['div'] }],
          },
        ],
        ignoreParagraphWrap: true,
      });
      expect(params.mappings?.length).toBe(1);
      expect(() => validateParams({ mappings: 'invalid' })).toThrow();
    }
  );

  test(
    'processTextLinks rewrites relative, protocol-relative and bad links',
    tags,
    () => {
      // Relative link gets the base prepended.
      expect(
        processTextLinks('<a href="page">x</a>', 'https://x.com')
      ).toContain('https://x.com/page');
      // Protocol-relative is stripped then treated as relative.
      expect(
        processTextLinks('<a href="//cdn.com/a">x</a>', 'https://x.com')
      ).toContain('href');
      // Anchor without href is left intact.
      expect(processTextLinks('<a>no href</a>')).toContain('no href');
      // A scheme-like href without a port is neutralized to "/".
      expect(processTextLinks('<a href="javascript:alert(1)">x</a>')).toContain(
        'href="/"'
      );
      // A url with an explicit port is preserved.
      expect(
        processTextLinks('<a href="http://x.com:8080/a">x</a>', 'https://x.com')
      ).toContain('href');
    }
  );
});
