import { describe, test, expect } from 'vitest';
import { parseDate } from '../date';

describe('parseDate', () => {
  describe('RFC 2822', () => {
    test('parses with +0000 offset', { tags: ['unit', 'rss'] }, () => {
      // luxon serialises UTC offsets as Z
      expect(parseDate('Fri, 04 Apr 2025 11:29:23 +0000')).toBe(
        '2025-04-04T11:29:23.000Z'
      );
    });

    test('parses with negative offset', { tags: ['unit', 'rss'] }, () => {
      expect(parseDate('Fri, 06 Jun 2025 06:30:00 -0400')).toBe(
        '2025-06-06T06:30:00.000-04:00'
      );
    });

    test('parses with positive offset', { tags: ['unit', 'rss'] }, () => {
      expect(parseDate('Fri, 16 May 2025 05:01:02 +0100')).toBe(
        '2025-05-16T05:01:02.000+01:00'
      );
    });

    test('parses with GMT zone name', { tags: ['unit', 'rss'] }, () => {
      expect(parseDate('Tue, 30 Sep 2025 09:58:53 GMT')).toBe(
        '2025-09-30T09:58:53.000Z'
      );
    });

    test('preserves timezone offset', { tags: ['unit', 'rss'] }, () => {
      expect(parseDate('Tue, 31 Mar 2026 08:00:00 -0400')).toBe(
        '2026-03-31T08:00:00.000-04:00'
      );
    });
  });

  describe('ISO 8601', () => {
    test(
      'parses with Z suffix and milliseconds',
      { tags: ['unit', 'rss'] },
      () => {
        expect(parseDate('2024-03-04T16:54:01.381Z')).toBe(
          '2024-03-04T16:54:01.381Z'
        );
      }
    );

    test('parses with +0000 offset', { tags: ['unit', 'rss'] }, () => {
      expect(parseDate('2025-05-19T16:00:00+0000')).toBe(
        '2025-05-19T16:00:00.000Z'
      );
    });

    test('preserves timezone offset', { tags: ['unit', 'rss'] }, () => {
      expect(parseDate('2025-05-19T18:07:36+0000')).toBe(
        '2025-05-19T18:07:36.000Z'
      );
    });
  });

  describe('invalid input', () => {
    test(
      'returns null for unparseable string',
      { tags: ['unit', 'rss'] },
      () => {
        expect(parseDate('not a date')).toBeNull();
      }
    );

    test('returns null for empty string', { tags: ['unit', 'rss'] }, () => {
      expect(parseDate('')).toBeNull();
    });
  });
});
