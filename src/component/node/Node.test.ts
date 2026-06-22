import { test, expect, describe } from 'vite-plus/test';

import { findDescendants, getAttributes, SetUtils, type Node } from './Node';

describe('Node helpers', () => {
  test(
    'findDescendants matches against an array of tag names',
    {
      tags: ['unit', 'html'],
    },
    () => {
      const tree: Node[] = [
        {
          type: 'element',
          tagName: 'div',
          children: [
            { type: 'element', tagName: 'p', children: [] },
            { type: 'element', tagName: 'span', children: [] },
            {
              type: 'element',
              tagName: 'section',
              children: [{ type: 'element', tagName: 'p', children: [] }],
            },
          ],
        },
      ];
      const found = tree.reduce(findDescendants(['p', 'span']), []);
      expect(found.length).toBe(3);
      expect(
        found.every(
          (n) => n.type === 'element' && ['p', 'span'].includes(n.tagName)
        )
      ).toBe(true);
    }
  );

  test(
    'getAttributes returns an empty map when attributes are missing',
    {
      tags: ['unit', 'html'],
    },
    () => {
      expect(getAttributes(undefined).size).toBe(0);
      const map = getAttributes([{ key: 'id', value: 'main' }]);
      expect(map.get('id')).toBe('main');
    }
  );

  test(
    'SetUtils intersect, subset and equal',
    {
      tags: ['unit', 'html'],
    },
    () => {
      const a = new Set([1, 2, 3]);
      const b = new Set([2, 3, 4]);
      expect([...SetUtils.intersect(a, b)].sort()).toEqual([2, 3]);
      expect(SetUtils.subset(a, new Set([1, 2]))).toBe(true);
      expect(SetUtils.subset(a, new Set([1, 9]))).toBe(false);
      expect(SetUtils.equal(new Set([1, 2]), new Set([2, 1]))).toBe(true);
      expect(SetUtils.equal(new Set([1]), new Set([1, 2]))).toBe(false);
    }
  );
});
