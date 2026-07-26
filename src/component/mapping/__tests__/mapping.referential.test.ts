import { test, expect, describe } from 'vite-plus/test';

import { HTMLMapper } from '../../html/html-mapper';
import { reduceEmptyTextNode } from '../mapping';
import { fromFigcaption } from '../mapping.utils';
import type { ElementNode } from '../../node/node-helpers';

const tags = { tags: ['unit', 'html'] };

describe('Referential transparency — no in-place mutation', () => {
  test('reduceEmptyTextNode does not mutate text node content', tags, () => {
    const node = { type: 'text' as const, content: 'hello  world' };
    const originalContent = node.content;
    reduceEmptyTextNode([], node);
    expect(node.content).toBe(originalContent);
  });

  test(
    'reduceEmptyTextNode does not mutate element node children',
    tags,
    () => {
      const child = { type: 'text' as const, content: 'hello' };
      const node: ElementNode = {
        type: 'element',
        tagName: 'p',
        attributes: [],
        children: [child],
      };
      const originalChildren = node.children;
      reduceEmptyTextNode([], node);
      expect(node.children).toBe(originalChildren);
    }
  );

  test('fromFigcaption does not mutate figcaption children', tags, () => {
    const creditNode: ElementNode = {
      type: 'element',
      tagName: 'small',
      attributes: [],
      children: [{ type: 'text', content: 'Photo credit' }],
    };
    const captionText = { type: 'text' as const, content: 'A caption' };
    const figcaption: ElementNode = {
      type: 'element',
      tagName: 'figcaption',
      attributes: [],
      children: [captionText, creditNode],
    };
    const originalChildrenLength = figcaption.children.length;
    const originalChildren = [...figcaption.children];
    fromFigcaption(figcaption);
    expect(figcaption.children.length).toBe(originalChildrenLength);
    expect(figcaption.children).toEqual(originalChildren);
  });

  test(
    'toComponents does not mutate a parsed Node[] after round-trip',
    tags,
    () => {
      const html =
        '<p>Hello <strong>world</strong></p><figure><img src="x.jpg" /><figcaption>Cap<small>Credit</small></figcaption></figure>';
      const before = JSON.stringify(HTMLMapper.toComponents(html));
      const after = JSON.stringify(HTMLMapper.toComponents(html));
      expect(before).toBe(after);
    }
  );
});
