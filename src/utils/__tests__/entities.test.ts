import { describe, test, expect } from 'vitest';
import { decodeEntities } from '../entities';

describe('decodeEntities', () => {
  test('decodes named character references', { tags: ['unit', 'rss'] }, () => {
    expect(decodeEntities('Artists &amp; Illustrators')).toBe(
      'Artists & Illustrators'
    );
  });

  test('decodes decimal numeric references', { tags: ['unit', 'rss'] }, () => {
    // &#160; = non-breaking space, &#038; = &, &#8230; = ellipsis (…)
    expect(decodeEntities('foo&#160;bar')).toBe('foo bar');
    expect(decodeEntities('Artists &#038; Illustrators')).toBe(
      'Artists & Illustrators'
    );
    expect(decodeEntities('continued&#8230;')).toBe('continued…');
  });

  test('decodes hex numeric references', { tags: ['unit', 'rss'] }, () => {
    expect(decodeEntities('&#x26;')).toBe('&');
    expect(decodeEntities('&#xA0;')).toBe(' ');
  });

  test('leaves plain text unchanged', { tags: ['unit', 'rss'] }, () => {
    expect(decodeEntities('no entities here')).toBe('no entities here');
  });

  test(
    'decodes named references beyond the common five',
    { tags: ['unit', 'rss'] },
    () => {
      // Verifies that the full HTML5 table is available, not a hand-rolled subset.
      expect(decodeEntities('&copy;')).toBe('©');
      expect(decodeEntities('&mdash;')).toBe('—');
      expect(decodeEntities('&laquo;&raquo;')).toBe('«»');
    }
  );
});
