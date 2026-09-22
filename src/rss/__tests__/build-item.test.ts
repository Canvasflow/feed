import { test, expect, describe } from 'vite-plus/test';

import { buildItem, type BuildItemContext } from '../rss-feed';
import { clone } from '../rss-types';
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

describe('buildItem — cf:generationType', () => {
  test('"ai" state is preserved', { tags: ['unit', 'rss'] }, () => {
    const item = buildItem({ ...base, 'cf:generationType': ['ai'] }, ctx);
    expect(item['cf:generationType']).toEqual(['ai']);
  });

  test(
    '"ai" state is preserved being case insensitive',
    { tags: ['unit', 'rss'] },
    () => {
      const item = buildItem({ ...base, 'cf:generationType': ['AI'] }, ctx);
      expect(item['cf:generationType']).toEqual(['ai']);
    }
  );

  test('"syndicated" state is preserved', { tags: ['unit', 'rss'] }, () => {
    const item = buildItem(
      { ...base, 'cf:generationType': ['syndicated'] },
      ctx
    );
    expect(item['cf:generationType']).toEqual(['syndicated']);
  });

  test(
    '"syndicated" state is preserved being case insensitive',
    { tags: ['unit', 'rss'] },
    () => {
      const item = buildItem(
        { ...base, 'cf:generationType': ['SYNDICATED'] },
        ctx
      );
      expect(item['cf:generationType']).toEqual(['syndicated']);
    }
  );

  test(
    '"ai" and "syndicated" state are both present',
    { tags: ['unit', 'rss'] },
    () => {
      const item = buildItem(
        { ...base, 'cf:generationType': ['ai', 'syndicated'] },
        ctx
      );
      expect([...(item['cf:generationType'] ?? [])].sort()).toEqual([
        'ai',
        'syndicated',
      ]);
    }
  );

  test('invalid values are ignored', { tags: ['unit', 'rss'] }, () => {
    const item = buildItem({ ...base, 'cf:generationType': ['invalid'] }, ctx);
    expect(item['cf:generationType']?.length).toBe(0);
  });

  test('duplicate values are ignored', { tags: ['unit', 'rss'] }, () => {
    const item = buildItem(
      {
        ...base,
        'cf:generationType': ['ai', 'ai', 'syndicated', 'syndicated'],
      },
      ctx
    );
    expect(item['cf:generationType']?.length).toBe(2);
    expect([...(item['cf:generationType'] ?? [])].sort()).toEqual([
      'ai',
      'syndicated',
    ]);
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

describe('buildItem — source', () => {
  test(
    'a <source url="...">Name</source> is mapped with no errors or warnings',
    { tags: ['unit', 'rss'] },
    () => {
      const item = buildItem(
        {
          ...base,
          source: {
            '@_url': 'https://originaltechsite.com',
            '#text': 'Original Tech Journal',
          },
        },
        ctx
      );

      expect(item.source).toEqual({
        url: 'https://originaltechsite.com',
        title: 'Original Tech Journal',
        errors: [],
        warnings: [],
      });
    }
  );

  test(
    'the title is HTML-entity-decoded and trimmed',
    { tags: ['unit', 'rss'] },
    () => {
      const item = buildItem(
        {
          ...base,
          source: {
            '@_url': 'https://example.com/feed.xml',
            '#text': '  Tomalak&#8217;s Realm  ',
          },
        },
        ctx
      );

      expect(item.source?.title).toBe('Tomalak’s Realm');
    }
  );

  test(
    'a childless <source url="..."/> has no title and warns it is suggested',
    { tags: ['unit', 'rss'] },
    () => {
      const item = buildItem(
        {
          ...base,
          source: { '@_url': 'https://example.com/feed.xml' },
        },
        ctx
      );

      expect(item.source?.url).toBe('https://example.com/feed.xml');
      expect(item.source?.title).toBeUndefined();
      expect(item.source?.errors).toEqual([]);
      expect(
        item.source?.warnings.some(
          (w) => w.code === 'SUGGESTED_PROPERTY' && w.path === 'title'
        )
      ).toBe(true);
    }
  );

  test(
    'a <source> with no url attribute (parsed as a bare string) errors as missing url',
    { tags: ['unit', 'rss'] },
    () => {
      const item = buildItem(
        {
          ...base,
          source: 'Tomalak’s Realm',
        },
        ctx
      );

      expect(item.source?.url).toBe('');
      expect(item.source?.title).toBe('Tomalak’s Realm');
      expect(
        item.source?.errors.some(
          (e) => e.code === 'MISSING_URL' && e.path === 'url'
        )
      ).toBe(true);
    }
  );

  test(
    'an item without a <source> leaves source undefined',
    { tags: ['unit', 'rss'] },
    () => {
      const item = buildItem(base, ctx);
      expect(item.source).toBeUndefined();
    }
  );
});

describe('buildItem — does not mutate its input', () => {
  test('a single (non-array) enclosure is normalised to an array without mutating the input', () => {
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
  });

  test('a single (non-array) media:group is normalised to an array without mutating the input', () => {
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

describe('clone', () => {
  const tags = { tags: ['unit', 'rss'] };

  test('returns a deep copy with all arrays unfrozen', tags, () => {
    const item = buildItem(
      { ...base, pubDate: 'Mon, 01 Jan 2024 00:00:00 GMT' },
      ctx
    );
    const mutable = clone(item);

    expect(mutable.title).toBe(item.title);
    expect(mutable.errors).not.toBe(item.errors);
    expect(mutable.warnings).not.toBe(item.warnings);
    expect(mutable.enclosure).not.toBe(item.enclosure);
    expect(mutable.mediaGroup).not.toBe(item.mediaGroup);
    expect(mutable.mediaContent).not.toBe(item.mediaContent);
    expect(mutable.components).not.toBe(item.components);

    // Mutating the clone does not affect the original
    mutable.title = 'changed';
    expect(item.title).toBe('Test item');
  });

  test('clones category array when present', tags, () => {
    const item = buildItem({ ...base, category: ['food', 'travel'] }, ctx);
    const mutable = clone(item);
    expect(mutable.category).toEqual(['food', 'travel']);
    expect(mutable.category).not.toBe(item.category);
  });

  test('handles item with no category', tags, () => {
    const item = buildItem(base, ctx);
    const mutable = clone(item);
    // category with no input comes back as an empty array or undefined — not undefined only if empty array
    expect(mutable.category == null || Array.isArray(mutable.category)).toBe(
      true
    );
  });

  test('clones enclosure errors/warnings', tags, () => {
    const input: ParsedItem = {
      ...base,
      enclosure: [
        {
          '@_url': 'https://example.com/a.mp3',
          '@_type': 'audio/mpeg',
          '@_length': 1000,
        },
      ],
    };
    const item = buildItem(input, ctx);
    const mutable = clone(item);
    expect(mutable.enclosure[0]).not.toBe(item.enclosure[0]);
    expect(mutable.enclosure[0]?.errors).not.toBe(item.enclosure[0]?.errors);
  });

  test('clones source errors/warnings', tags, () => {
    const input: ParsedItem = {
      ...base,
      source: { '@_url': 'https://example.com/feed.xml' },
    };
    const item = buildItem(input, ctx);
    const mutable = clone(item);
    expect(mutable.source).not.toBe(item.source);
    expect(mutable.source?.errors).not.toBe(item.source?.errors);
    expect(mutable.source?.warnings).not.toBe(item.source?.warnings);
  });

  test('clone leaves source undefined when the item has none', tags, () => {
    const item = buildItem(base, ctx);
    const mutable = clone(item);
    expect(mutable.source).toBeUndefined();
  });

  test('clones mediaContent errors/warnings', tags, () => {
    const input: ParsedItem = {
      ...base,
      'media:content': [
        { '@_url': 'https://example.com/img.jpg', '@_type': 'image/jpeg' },
      ],
    };
    const item = buildItem(input, ctx);
    const mutable = clone(item);
    expect(mutable.mediaContent[0]).not.toBe(item.mediaContent[0]);
    expect(mutable.mediaContent[0]?.errors).not.toBe(
      item.mediaContent[0]?.errors
    );
  });

  test(
    'clones cf:generationType — pushing to the clone does not mutate the original',
    tags,
    () => {
      const input: ParsedItem = { ...base, 'cf:generationType': ['ai'] };
      const item = buildItem(input, ctx);
      const mutable = clone(item);
      expect(mutable['cf:generationType']).not.toBe(item['cf:generationType']);
      mutable['cf:generationType']?.push('syndicated');
      expect(item['cf:generationType']).toEqual(['ai']);
    }
  );
});
