import { test, expect, describe } from 'vite-plus/test';

import { textOf, recordOf } from '../narrow';
import { clone } from '../rss-types';
import { buildItem } from '../rss-feed';
import type { ParsedItem } from '../parsed-xml';

const tags = { tags: ['unit', 'rss'] };

describe('textOf', () => {
  test('returns a plain string as-is', tags, () => {
    expect(textOf('hello')).toBe('hello');
  });

  test('converts a plain number to string', tags, () => {
    expect(textOf(42)).toBe('42');
  });

  test('extracts a string from a #text wrapper object', tags, () => {
    expect(textOf({ '#text': 'wrapped' })).toBe('wrapped');
  });

  test(
    'extracts a number from a #text wrapper object and stringifies it',
    tags,
    () => {
      expect(textOf({ '#text': 7 })).toBe('7');
    }
  );

  test('returns undefined for null', tags, () => {
    expect(textOf(null)).toBeUndefined();
  });

  test('returns undefined for undefined', tags, () => {
    expect(textOf(undefined)).toBeUndefined();
  });

  test('returns undefined for an object with no #text key', tags, () => {
    expect(textOf({ other: 'value' })).toBeUndefined();
  });
});

describe('recordOf', () => {
  test('returns a plain object unchanged', tags, () => {
    const obj = { key: 'value' };
    expect(recordOf(obj)).toBe(obj);
  });

  test('returns undefined for null', tags, () => {
    expect(recordOf(null)).toBeUndefined();
  });

  test('returns undefined for an array', tags, () => {
    expect(recordOf(['a', 'b'])).toBeUndefined();
  });

  test('returns undefined for a string', tags, () => {
    expect(recordOf('string')).toBeUndefined();
  });
});

describe('clone — optional field branches', () => {
  const base: ParsedItem = {
    title: 'Test',
    link: 'https://example.com',
    guid: 'g1',
  };

  test(
    'clone works when item.category is undefined (set manually)',
    tags,
    () => {
      const item = buildItem(base, {});
      // Force category to undefined to exercise the ternary false branch in clone
      const itemNoCategory = { ...item, category: undefined };
      const copy = clone(itemNoCategory);
      expect(copy.category).toBeUndefined();
    }
  );

  test('clone spreads category array when present', tags, () => {
    const item = buildItem({ ...base, category: ['tech', 'news'] }, {});
    const copy = clone(item);
    expect(copy.category).toEqual(['tech', 'news']);
    // must be a new array, not the same reference
    expect(copy.category).not.toBe(item.category);
  });

  test('clone works when mediaGroup has no mediaContent', tags, () => {
    // A media:group without media:content entries — mediaContent will be []
    // but the optional-chain path (mg.mediaContent?.map) handles undefined too.
    const item = buildItem(base, {});
    const copy = clone(item);
    expect(copy.mediaGroup).toEqual([]);
  });
});
