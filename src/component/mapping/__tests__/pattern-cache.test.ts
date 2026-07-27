import { test, expect, describe } from 'vite-plus/test';

import { matchesPattern } from '../mapping.utils';

const tags = { tags: ['unit'] };

describe('patternCache — bounded at 500 entries', () => {
  test(
    'correct results are returned for patterns added after the cache is full',
    tags,
    () => {
      // Warm the cache past its 500-entry limit with unique patterns.
      for (let i = 0; i < 600; i++) {
        matchesPattern(`value-${i}`, `^value-${i}$`);
      }

      // Patterns added after the eviction boundary must still work correctly.
      expect(matchesPattern('value-599', '^value-599$')).toBe(true);
      expect(matchesPattern('value-599', '^value-0$')).toBe(false);
      expect(matchesPattern('nope', '^value-599$')).toBe(false);
    }
  );

  test(
    'invalid patterns never throw regardless of cache pressure',
    tags,
    () => {
      expect(() => {
        for (let i = 0; i < 600; i++) {
          matchesPattern('x', `[invalid-${i}`);
        }
      }).not.toThrow();
    }
  );

  test(
    'heap does not grow proportionally when hammered with unique patterns',
    tags,
    () => {
      const before = process.memoryUsage().heapUsed;

      for (let i = 0; i < 2_000; i++) {
        matchesPattern(`subject-${i}`, `^unique-pattern-${i}-[a-z]+$`);
      }

      // Allow a generous 5 MB headroom — the bounded cache should never
      // accumulate more than ~500 compiled RegExps regardless of call count.
      const after = process.memoryUsage().heapUsed;
      const deltaMB = (after - before) / 1024 / 1024;
      expect(deltaMB).toBeLessThan(5);
    }
  );
});
