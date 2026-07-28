import { test, expect, describe } from 'vite-plus/test';

import { RSSFeed } from '../rss-feed';
import type { Params } from '../../component/mapping/mapping';

// ---------------------------------------------------------------------------
// No-throw property tests for the Section 3 contract: for any string input
// and any params-shaped value, `new RSSFeed(x, p).build()` must resolve
// without throwing. Mirrors the seeded-PRNG approach in
// `html-mapper.fuzz.test.ts`, but drives the whole `RSSFeed` lifecycle
// (constructor -> validate -> build) instead of `HTMLMapper.toComponents`
// alone, so it also exercises the XML parser, the params/root Zod boundary,
// and every mapping/media converter reachable through `content:encoded`.
// ---------------------------------------------------------------------------

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomString(rand: () => number, maxLen = 300): string {
  const len = Math.floor(rand() * maxLen);
  const chars =
    'abcdefghijklmnopqrstuvwxyz<>/="\'&; \n\t0123456789!@#$%^*()[]{}\\|`~:%.';
  return Array.from({ length: len }, () =>
    chars.charAt(Math.floor(rand() * chars.length))
  ).join('');
}

function randomJsonValue(rand: () => number, depth = 0): unknown {
  if (depth > 3) return rand() < 0.5 ? randomString(rand, 20) : rand();
  const kind = Math.floor(rand() * 6);
  switch (kind) {
    case 0:
      return randomString(rand, 30);
    case 1:
      return rand() * 1000 - 500;
    case 2:
      return rand() < 0.5;
    case 3:
      return null;
    case 4:
      return Array.from({ length: Math.floor(rand() * 4) }, () =>
        randomJsonValue(rand, depth + 1)
      );
    default: {
      const obj: Record<string, unknown> = {};
      const keys = [
        'mappings',
        'excludes',
        'match',
        'filters',
        'type',
        'items',
        'component',
        'properties',
      ];
      const n = Math.floor(rand() * 4);
      for (let i = 0; i < n; i++) {
        const key = keys[Math.floor(rand() * keys.length)] as string;
        obj[key] = randomJsonValue(rand, depth + 1);
      }
      return obj;
    }
  }
}

function buildFeed(itemBody: string, channelExtra = ''): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:cf="urn:cf" xmlns:media="urn:media" xmlns:dc="urn:dc">
  <channel>
    <title>Test Feed</title>
    ${channelExtra}
    <item>
      <title>An item</title>
      <guid>item-1</guid>
      <pubDate>Mon, 02 Jun 2025 10:00:00 GMT</pubDate>
      ${itemBody}
    </item>
  </channel>
</rss>`;
}

async function buildsWithoutThrowing(
  content: string,
  params?: Params
): Promise<void> {
  const feed = new RSSFeed(content, params);
  await feed.validate();
  const rss = await feed.build();
  expect(rss).toBeDefined();
  expect(Array.isArray(rss.errors)).toBe(true);
}

// ---------------------------------------------------------------------------
// Known-tricky feed/content edge cases, including the exact throw sites fixed
// earlier in Section 3 (channel <link>, iframe src, tiktok cite, youtube
// anchor href, relative media:content url resolution).
// ---------------------------------------------------------------------------
const feedEdgeCases: Array<[string, string]> = [
  ['empty string', ''],
  ['whitespace only', '   \n\t  '],
  ['unclosed tag', '<unclosed'],
  ['double opening bracket', '<<double'],
  ['random garbage', 'not xml at all %%$#'],
  ['null bytes', '\x00\x01\x02'],
  ['no rss root', '<foo><bar/></foo>'],
  ['invalid channel link', buildFeed('', '<link>not a url</link>')],
  ['link missing protocol', buildFeed('', '<link>example.com</link>')],
  [
    'iframe with unparseable src in content:encoded',
    buildFeed(
      `<content:encoded><![CDATA[<iframe src="not a valid url %"></iframe>]]></content:encoded>`
    ),
  ],
  [
    'tiktok blockquote with unparseable cite',
    buildFeed(
      `<content:encoded><![CDATA[<blockquote class="tiktok-embed" cite="not a url %">x</blockquote>]]></content:encoded>`
    ),
  ],
  [
    'youtube-shaped href with embedded percent',
    buildFeed(
      `<content:encoded><![CDATA[<a href="https://www.youtube.com%embed/xyz">watch</a>]]></content:encoded>`
    ),
  ],
  [
    'search-param embeds with unparseable inner url',
    buildFeed(
      `<content:encoded><![CDATA[<iframe src="https://example.com/e?url=https://www.tiktok.com%"></iframe>]]></content:encoded>`
    ),
  ],
  [
    'relative media:content url with no channel origin',
    buildFeed(`<media:content url="/images/a.jpg" type="image/jpeg"/>`),
  ],
  [
    'relative media:content url with malformed channel origin',
    buildFeed(
      `<media:content url="%zz" type="image/jpeg"/>`,
      '<link>https://example.com</link>'
    ),
  ],
  [
    'deeply nested content',
    buildFeed(
      `<content:encoded><![CDATA[${'<div>'.repeat(60)}x${'</div>'.repeat(60)}]]></content:encoded>`
    ),
  ],
  [
    'unknown top-level tags',
    '<rss><channel><title>T</title><weird>x</weird><item><title>i</title><guid>g</guid><pubDate>Mon, 02 Jun 2025 10:00:00 GMT</pubDate></item></channel></rss>',
  ],
];

describe('RSSFeed lifecycle — never throws on edge-case inputs', () => {
  for (const [label, content] of feedEdgeCases) {
    test(`edge case: ${label}`, { tags: ['unit', 'rss'] }, async () => {
      await expect(buildsWithoutThrowing(content)).resolves.toBeUndefined();
    });
  }
});

describe('RSSFeed lifecycle — never throws on random XML-ish input', () => {
  const rand = mulberry32(0xc0ffee);
  const N = 150;

  for (let i = 0; i < N; i++) {
    const content = randomString(rand);
    test(
      `random feed content #${i + 1}`,
      { tags: ['unit', 'rss'] },
      async () => {
        await expect(buildsWithoutThrowing(content)).resolves.toBeUndefined();
      }
    );
  }
});

describe('RSSFeed lifecycle — never throws on random params-shaped input', () => {
  const rand = mulberry32(0xfeedface);
  const N = 100;
  const validContent = buildFeed('');

  for (let i = 0; i < N; i++) {
    const params = randomJsonValue(rand) as Params;
    test(`random params #${i + 1}`, { tags: ['unit', 'rss'] }, async () => {
      await expect(
        buildsWithoutThrowing(validContent, params)
      ).resolves.toBeUndefined();
    });
  }
});
