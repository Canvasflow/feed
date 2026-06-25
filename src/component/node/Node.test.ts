import { test, expect, describe } from 'vite-plus/test';

import {
  findDescendants,
  removeDescendants,
  getAttributes,
  SetUtils,
  type Node,
} from './Node';

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
    'removeDescendants(string) returns new nodes with matched elements removed from children',
    { tags: ['unit', 'html'] },
    () => {
      const original: Node = {
        type: 'element',
        tagName: 'div',
        children: [
          { type: 'element', tagName: 'p', children: [] },
          { type: 'element', tagName: 'span', children: [] },
        ],
      };
      const result = [original].reduce(removeDescendants('p'), []);
      expect(result).toHaveLength(1);
      const div = result[0] as { tagName: string; children: Node[] };
      expect(div.tagName).toBe('div');
      expect(div.children).toHaveLength(1);
      expect((div.children[0] as { tagName: string }).tagName).toBe('span');
      // original is not mutated
      expect((original as { children: Node[] }).children).toHaveLength(2);
    }
  );

  test(
    'removeDescendants(array) strips all listed tags from nested children',
    { tags: ['unit', 'html'] },
    () => {
      const tree: Node[] = [
        {
          type: 'element',
          tagName: 'div',
          children: [
            { type: 'element', tagName: 'p', children: [] },
            { type: 'element', tagName: 'h1', children: [] },
            {
              type: 'element',
              tagName: 'span',
              children: [{ type: 'element', tagName: 'h2', children: [] }],
            },
          ],
        },
      ];
      const result = tree.reduce(removeDescendants(['p', 'h1', 'h2']), []);
      expect(result).toHaveLength(1);
      const div = result[0] as { tagName: string; children: Node[] };
      expect(div.tagName).toBe('div');
      expect(div.children).toHaveLength(1);
      const span = div.children[0] as { tagName: string; children: Node[] };
      expect(span.tagName).toBe('span');
      expect(span.children).toHaveLength(0);
    }
  );

  test(
    'removeDescendants(fn) removes matched nodes and their subtrees from the returned tree',
    { tags: ['unit', 'html'] },
    () => {
      const tree: Node[] = [
        {
          type: 'element',
          tagName: 'div',
          children: [
            {
              type: 'element',
              tagName: 'section',
              children: [{ type: 'element', tagName: 'p', children: [] }],
            },
            {
              type: 'element',
              tagName: 'article',
              children: [{ type: 'element', tagName: 'p', children: [] }],
            },
          ],
        },
      ];
      const result = tree.reduce(
        removeDescendants((n) => n.type === 'element' && n.tagName === 'section'),
        []
      );
      expect(result).toHaveLength(1);
      const div = result[0] as { tagName: string; children: Node[] };
      expect(div.tagName).toBe('div');
      expect(div.children).toHaveLength(1);
      const article = div.children[0] as { tagName: string; children: Node[] };
      expect(article.tagName).toBe('article');
      expect(article.children).toHaveLength(1);
      expect((article.children[0] as { tagName: string }).tagName).toBe('p');
    }
  );

  test(
    'removeDescendants returns a structurally equal tree when nothing matches',
    { tags: ['unit', 'html'] },
    () => {
      const tree: Node[] = [
        {
          type: 'element',
          tagName: 'div',
          children: [
            { type: 'element', tagName: 'p', children: [] },
            { type: 'element', tagName: 'span', children: [] },
          ],
        },
      ];
      const result = tree.reduce(removeDescendants('article'), []);
      expect(result).toHaveLength(1);
      expect((result[0] as { children: Node[] }).children).toHaveLength(2);
    }
  );

  test(
    'removeDescendants preserves text and comment nodes inside returned elements',
    { tags: ['unit', 'html'] },
    () => {
      const tree: Node[] = [
        {
          type: 'element',
          tagName: 'figcaption',
          children: [
            { type: 'text', content: 'Caption text' },
            { type: 'element', tagName: 'span', children: [{ type: 'text', content: 'credit' }], attributes: [{ key: 'class', value: 'credit' }] },
          ],
        },
      ];
      const result = tree.reduce(
        removeDescendants((n) => n.type === 'element' && (n as { attributes?: { key: string; value: string }[] }).attributes?.some((a) => a.key === 'class' && a.value === 'credit') === true),
        []
      );
      expect(result).toHaveLength(1);
      const figcaption = result[0] as { tagName: string; children: Node[] };
      expect(figcaption.tagName).toBe('figcaption');
      expect(figcaption.children).toHaveLength(1);
      expect(figcaption.children[0]).toMatchObject({ type: 'text', content: 'Caption text' });
    }
  );

  test(
    'removeDescendants returns empty array for an empty tree',
    { tags: ['unit', 'html'] },
    () => {
      expect([].reduce(removeDescendants('p'), [])).toEqual([]);
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
    'getAttributes preserves empty-string attribute values',
    { tags: ['unit', 'html'] },
    () => {
      const map = getAttributes([{ key: 'alt', value: '' }]);
      expect(map.has('alt')).toBe(true);
      expect(map.get('alt')).toBe('');
    }
  );

  test(
    'getAttributes preserves falsy-but-valid string values ("0", "false")',
    { tags: ['unit', 'html'] },
    () => {
      const map = getAttributes([
        { key: 'tabindex', value: '0' },
        { key: 'aria-hidden', value: 'false' },
      ]);
      expect(map.get('tabindex')).toBe('0');
      expect(map.get('aria-hidden')).toBe('false');
    }
  );

  test(
    'getAttributes last-write-wins on duplicate attribute keys',
    { tags: ['unit', 'html'] },
    () => {
      const map = getAttributes([
        { key: 'class', value: 'first' },
        { key: 'class', value: 'second' },
      ]);
      expect(map.get('class')).toBe('second');
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
