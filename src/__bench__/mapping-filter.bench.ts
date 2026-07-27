import { bench, describe } from 'vite-plus/test';

import {
  findDescendants,
  removeDescendants,
  type ElementNode,
  type Node,
} from '../component/node/node-helpers';
import {
  filterAllMapping,
  filterAnyMapping,
  type Filter,
  type Mapping,
} from '../component/mapping/mapping';

// Build a balanced tree: depth 6, branching 4 → 5461 nodes total.
function buildTree(depth: number, branching: number): ElementNode {
  const children: Node[] =
    depth > 0
      ? Array.from({ length: branching }, (_, i) =>
          i % 3 === 0
            ? buildTree(depth - 1, branching)
            : ({
                type: 'text',
                content: `text node at depth ${depth}`,
              } as const)
        )
      : [];
  return {
    type: 'element',
    tagName: depth % 2 === 0 ? 'div' : 'span',
    attributes: [
      { key: 'class', value: `level-${depth} widget-${depth % 5}` },
      { key: 'data-depth', value: String(depth) },
    ],
    children,
  };
}

const tree = buildTree(6, 4);

// 15 class filters — realistic custom-mapping workload
const classFilters: Filter[] = Array.from({ length: 15 }, (_, i) => ({
  type: 'class' as const,
  items: [`widget-${i}`, `box-${i}`],
  match: 'any' as const,
}));

// 10 tag filters
const tagFilters: Filter[] = [
  { type: 'tag', items: ['section', 'aside', 'nav', 'header', 'footer'] },
  { type: 'tag', items: ['article', 'main', 'div', 'span', 'ul'] },
];

// Mixed excludes list used to exercise excludeNode indirectly
const excludes: Mapping[] = [
  ...Array.from({ length: 5 }, (_, i) => ({
    match: 'any' as const,
    filters: [
      {
        type: 'class' as const,
        items: [`widget-${i}`],
        match: 'any' as const,
      },
    ],
  })),
  ...Array.from({ length: 5 }, () => ({
    match: 'all' as const,
    filters: tagFilters,
  })),
];

// A node that will match some class filters (widget-3)
const matchingNode: ElementNode = {
  type: 'element',
  tagName: 'div',
  attributes: [{ key: 'class', value: 'widget-3 featured' }],
  children: [],
};

// A node that matches no filters — exercises the full scan
const nonMatchingNode: ElementNode = {
  type: 'element',
  tagName: 'section',
  attributes: [{ key: 'class', value: 'unrelated' }],
  children: [],
};

describe('filter engine — per-node matching', () => {
  bench('filterAnyMapping — 15 class filters, matching node', () => {
    filterAnyMapping(matchingNode, classFilters);
  });

  bench('filterAnyMapping — 15 class filters, non-matching node', () => {
    filterAnyMapping(nonMatchingNode, classFilters);
  });

  bench('filterAllMapping — 15 class filters, matching node', () => {
    filterAllMapping(matchingNode, classFilters);
  });

  bench('filterAnyMapping — 10 tag+class mixed excludes', () => {
    for (const { filters } of excludes) {
      filterAnyMapping(matchingNode, filters);
    }
  });
});

describe('tree traversal — depth-6 tree (5461 nodes)', () => {
  bench('findDescendants("div")', () => {
    tree.children.reduce(findDescendants('div'), []);
  });

  bench('findDescendants(["div","span"])', () => {
    tree.children.reduce(findDescendants(['div', 'span']), []);
  });

  bench('removeDescendants("span")', () => {
    tree.children.reduce(removeDescendants('span'), []);
  });
});
