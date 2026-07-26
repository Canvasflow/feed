import { test, expect, describe } from 'vite-plus/test';

import { buildItem, type BuildItemContext } from '../rss-feed';
import type { ParsedItem } from '../parsed-xml';

const ctx: BuildItemContext = {};

const base: ParsedItem = {
  title: 'Test item',
  link: 'https://example.com/article',
  guid: 'guid-1',
};

describe('buildItem — pubDate normalisation', () => {
  test(
    'valid RFC 2822 pubDate is converted to an ISO string',
    { tags: ['unit', 'rss'] },
    () => {
      const item = buildItem(
        { ...base, pubDate: 'Mon, 01 Jan 2024 00:00:00 GMT' },
        ctx
      );
      expect(item.pubDate).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  );

  test(
    'unparseable pubDate is kept as-is and adds a warning',
    { tags: ['unit', 'rss'] },
    () => {
      const item = buildItem({ ...base, pubDate: 'not-a-date' }, ctx);
      expect(item.pubDate).toBe('not-a-date');
      expect(item.warnings.some((w) => w.message.includes('pubDate'))).toBe(
        true
      );
    }
  );

  test('absent pubDate results in undefined', { tags: ['unit', 'rss'] }, () => {
    const item = buildItem({ ...base }, ctx);
    expect(item.pubDate).toBeUndefined();
  });
});

describe('buildItem — content:encoded and components', () => {
  test(
    'content:encoded present populates components array',
    { tags: ['unit', 'rss'] },
    () => {
      const item = buildItem(
        { ...base, 'content:encoded': '<p>Hello world</p>' },
        ctx
      );
      expect(item.components.length).toBeGreaterThan(0);
    }
  );

  test(
    'absent content:encoded leaves components empty',
    { tags: ['unit', 'rss'] },
    () => {
      const item = buildItem({ ...base }, ctx);
      expect(item.components).toEqual([]);
    }
  );
});

describe('buildItem — cf:hasAffiliateLinks', () => {
  test('boolean true is mapped correctly', { tags: ['unit', 'rss'] }, () => {
    const item = buildItem({ ...base, 'cf:hasAffiliateLinks': true }, ctx);
    expect(item['cf:hasAffiliateLinks']).toBe(true);
  });

  test('boolean false is mapped correctly', { tags: ['unit', 'rss'] }, () => {
    const item = buildItem({ ...base, 'cf:hasAffiliateLinks': false }, ctx);
    expect(item['cf:hasAffiliateLinks']).toBe(false);
  });

  test('invalid string value adds an error', { tags: ['unit', 'rss'] }, () => {
    const item = buildItem({ ...base, 'cf:hasAffiliateLinks': 'yes' }, ctx);
    expect(
      item.errors.some((e) => e.message.includes('cf:hasAffiliateLinks'))
    ).toBe(true);
  });
});

describe('buildItem — cf:liveCoverageState', () => {
  test('"live" state is preserved', { tags: ['unit', 'rss'] }, () => {
    const item = buildItem(
      { ...base, 'cf:liveCoverageState': { '@_state': 'live' } },
      ctx
    );
    expect(item['cf:liveCoverageState']).toBe('live');
  });

  test('"completed" state is preserved', { tags: ['unit', 'rss'] }, () => {
    const item = buildItem(
      { ...base, 'cf:liveCoverageState': { '@_state': 'completed' } },
      ctx
    );
    expect(item['cf:liveCoverageState']).toBe('completed');
  });

  test('unknown state becomes null', { tags: ['unit', 'rss'] }, () => {
    const item = buildItem(
      { ...base, 'cf:liveCoverageState': { '@_state': 'unknown' } },
      ctx
    );
    expect(item['cf:liveCoverageState']).toBeNull();
  });
});

describe('buildItem — cf:thumbnail', () => {
  test('missing url adds an error', { tags: ['unit', 'rss'] }, () => {
    const item = buildItem(
      { ...base, 'cf:thumbnail': { '@_width': '200' } },
      ctx
    );
    expect(item['cf:thumbnail']).toBeDefined();
    expect(item.errors.some((e) => e.message.includes('cf:thumbnail'))).toBe(
      true
    );
  });

  test('invalid MIME type adds a warning', { tags: ['unit', 'rss'] }, () => {
    const item = buildItem(
      {
        ...base,
        'cf:thumbnail': {
          '@_url': 'https://example.com/img.jpg',
          '@_type': 'application/pdf',
        },
      },
      ctx
    );
    expect(item.warnings.some((w) => w.message.includes('cf:thumbnail'))).toBe(
      true
    );
  });
});

describe('buildItem — media:group', () => {
  test(
    'multiple media:content entries inside a group are all mapped',
    { tags: ['unit', 'rss'] },
    () => {
      const item = buildItem(
        {
          ...base,
          'media:group': [
            {
              'media:content': [
                { '@_url': 'https://example.com/a.jpg', '@_medium': 'image' },
                { '@_url': 'https://example.com/b.jpg', '@_medium': 'image' },
              ],
            },
          ],
        },
        ctx
      );
      expect(item.mediaGroup).toHaveLength(1);
      expect(item.mediaGroup[0]!.mediaContent).toHaveLength(2);
    }
  );
});

describe('buildItem — does not mutate its input', () => {
  test('a single (non-array) enclosure is not rewritten onto the input', () => {
    const input: ParsedItem = {
      ...base,
      enclosure: {
        '@_url': 'https://example.com/a.mp3',
        '@_type': 'audio/mpeg',
      },
    };
    const before = input.enclosure;
    const item = buildItem(input, ctx);
    expect(item.enclosure).toHaveLength(1);
    expect(input.enclosure).toBe(before);
    expect(Array.isArray(input.enclosure)).toBe(false);
  });

  test('a single (non-array) media:group is not rewritten onto the input', () => {
    const input: ParsedItem = {
      ...base,
      'media:group': {
        'media:content': [{ '@_url': 'https://example.com/a.jpg' }],
      },
    };
    const before = input['media:group'];
    const item = buildItem(input, ctx);
    expect(item.mediaGroup).toHaveLength(1);
    expect(input['media:group']).toBe(before);
    expect(Array.isArray(input['media:group'])).toBe(false);
  });

  test('an array dc:creator is not collapsed onto the input', () => {
    const input: ParsedItem = {
      ...base,
      'dc:creator': ['Jane Doe', 'John Smith'],
    };
    const before = input['dc:creator'];
    const item = buildItem(input, ctx);
    expect(item['dc:creator']).toBe('Jane Doe, John Smith');
    expect(input['dc:creator']).toBe(before);
    expect(Array.isArray(input['dc:creator'])).toBe(true);
  });
});
