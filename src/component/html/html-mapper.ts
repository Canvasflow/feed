import { parseHTML } from 'linkedom';

import { parse, stringify } from './parser';

import type { Component } from '../component';
import type { Attribute, Node } from '../node/node-helpers';
import {
  type Mapping,
  type Params,
  filterEmptyTextNode,
  reduceComponents,
  reduceEmptyTextNode,
  getRootElement,
} from '../mapping/mapping';

/**
 * Converts HTML strings into Canvasflow `Component[]` and exposes helpers for
 * extracting a scoped root element from a content fragment.
 */
export class HTMLMapper {
  /**
   * Get the root element inside the content
   *
   * @param {string} html
   * @param {Mapping} rootMapping
   * @returns {string | null}
   */
  static getRootElement(html: string, rootMapping: Mapping): string | null {
    html = html.replace(/(\r\n|\n|\r)/gm, '');
    const nodes: Array<Node> = parse(html).reduce(reduceEmptyTextNode, []);
    const rootNode = getRootElement(nodes, rootMapping);
    return rootNode
      ? stringify([rootNode]).replace(
          /=('([^']*)')/g,
          (_match, _quoted, inner: string) =>
            `="${inner.replace(/"/g, '&quot;')}"`
        )
      : null;
  }

  /**
   * Convert html string to canvasflow components
   *
   * @param {string} html
   * @param {Params | undefined} params
   * @param {Mapping | undefined} root
   * @returns {Component[]}
   */
  static toComponents(
    html: string,
    params?: Params,
    root?: Mapping
  ): Component[] {
    let nodes = sanitizeInvalidAnchorHrefs(
      splitImagesFromParagraphs(
        hoistAnchorsWithImages(stripBreaklines(parse(html)))
      )
    ).filter(filterEmptyTextNode);

    if (root) {
      const rootNode = getRootElement(nodes, root);
      nodes = rootNode ? [rootNode] : [];
    }

    return nodes.reduce(reduceComponents(params), []).filter((i) => !!i);
  }
}

const BLOCK_TAGS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

/**
 * Walk a `Node[]` tree and hoist any `<a>` element that (a) is a direct
 * child of a `p/h1–h6` and (b) contains an `<img>` descendant, replacing
 * the entire block element with the `<a>`. Matches the behaviour of the
 * former `extractAnchorsWithImagesDOM` pass.
 *
 * @param {Node[]} nodes
 * @returns {Node[]}
 */
function hoistAnchorsWithImages(nodes: Node[]): Node[] {
  return nodes.flatMap((node) => {
    if (node.type !== 'element') return [node];

    const children = hoistAnchorsWithImages(node.children);

    if (BLOCK_TAGS.has(node.tagName)) {
      const hoistable = children.filter(
        (c) => c.type === 'element' && c.tagName === 'a' && hasImgDescendant(c)
      );
      if (hoistable.length > 0) return hoistable;
    }

    return [{ ...node, children }];
  });
}

function hasImgDescendant(node: Node): boolean {
  if (node.type !== 'element') return false;
  if (node.tagName === 'img') return true;
  return node.children.some(hasImgDescendant);
}

/**
 * Walk a `Node[]` tree and split `p/h1–h6` elements that have `<img>`
 * direct children into sibling nodes — buffered non-image children become
 * new copies of the block tag; each `<img>` is hoisted as a sibling.
 * Handles all seven block tags in one pass. Matches the former
 * `splitParagraphImagesDOM` behaviour.
 *
 * @param {Node[]} nodes
 * @returns {Node[]}
 */
function splitImagesFromParagraphs(nodes: Node[]): Node[] {
  return nodes.flatMap((node) => {
    if (node.type !== 'element') return [node];

    const children = splitImagesFromParagraphs(node.children);

    if (!BLOCK_TAGS.has(node.tagName)) return [{ ...node, children }];

    // Empty block elements are silently dropped — matching the DOM behaviour of
    // splitParagraphImagesDOM, which always calls removeChild(p) and only
    // re-inserts content via flushBuffer (a no-op when buffer is empty).
    if (children.length === 0) return [];

    const hasDirectImg = children.some(
      (c) => c.type === 'element' && c.tagName === 'img'
    );
    if (!hasDirectImg) return [{ ...node, children }];

    const result: Node[] = [];
    let buffer: Node[] = [];

    for (const child of children) {
      if (child.type === 'element' && child.tagName === 'img') {
        if (buffer.length > 0) {
          result.push({ ...node, children: buffer });
          buffer = [];
        }
        result.push(child);
      } else {
        buffer.push(child);
      }
    }

    if (buffer.length > 0) result.push({ ...node, children: buffer });

    return result;
  });
}

/**
 * Perform the paragraph-image-split mutations for one tag on an
 * already-parsed document.
 *
 * @param {Document} document
 * @param {string} tag
 */
function splitParagraphImagesDOM(document: Document, tag: string): void {
  const paragraphs = Array.from(document.querySelectorAll(tag));

  for (const paragraph of paragraphs) {
    const p = paragraph as Element;
    const parent = p.parentNode;
    /* v8 ignore next -- matched elements always have a parent node */
    if (!parent) continue;

    const children = Array.from(p.childNodes);
    let buffer: (typeof children)[number][] = [];

    const originalAttrs = Array.from(p.attributes).map((attr) => ({
      name: attr.name,
      value: attr.value,
    }));

    const createNewP = () => {
      const newP = document.createElement(tag);
      for (const { name, value } of originalAttrs) {
        newP.setAttribute(name, value);
      }
      return newP;
    };

    const flushBuffer = () => {
      if (buffer.length === 0) return;
      const newP = createNewP();
      for (const node of buffer) {
        newP.appendChild(node);
      }
      parent.insertBefore(newP, p);
      buffer = [];
    };

    for (const node of children) {
      const isImg =
        node.nodeType === node.ELEMENT_NODE &&
        (node as Element).tagName.toLowerCase() === 'img';

      if (isImg) {
        flushBuffer();
        parent.insertBefore(node, p);
      } else {
        buffer.push(node);
      }
    }

    flushBuffer();
    parent.removeChild(p);
  }
}

/**
 * Split paragraphs that have an image inside — public string wrapper for
 * external callers. Internal `toComponents` uses `splitImagesFromParagraphs`
 * (the `Node[]` tree pass) instead.
 *
 * @param {string} html
 * @param {string} tag
 * @returns {string}
 */
export function splitParagraphImages(html: string, tag: string): string {
  const { document } = parseHTML(html);
  /* v8 ignore next 3 -- parseHTML always yields a document; defensive guard */
  if (!document) {
    throw new Error('Unable to parse HTML snippet');
  }
  splitParagraphImagesDOM(document, tag);
  return document.toString().trim();
}

/**
 * Walk a `Node[]` tree and rewrite any `<a href="…">` where the href fails
 * `isValidHref` to `href="#"`. Pure — returns new node objects where changed,
 * leaves unchanged nodes untouched (referential equality preserved for
 * unaffected subtrees).
 *
 * @param {Node[]} nodes
 * @returns {Node[]}
 */
function sanitizeInvalidAnchorHrefs(nodes: Node[]): Node[] {
  return nodes.map(sanitizeNodeHref);
}

function sanitizeNodeHref(node: Node): Node {
  if (node.type !== 'element') return node;

  const children = node.children.map(sanitizeNodeHref);
  let { attributes } = node;

  if (node.tagName === 'a' && attributes) {
    const hrefIdx = attributes.findIndex((a: Attribute) => a.key === 'href');
    if (hrefIdx !== -1 && !isValidHref(attributes[hrefIdx].value)) {
      attributes = [...attributes];
      attributes[hrefIdx] = { key: 'href', value: '#' };
    }
  }

  return { ...node, attributes, children };
}

/**
 * Determines whether an href value is valid
 *
 * Rules:
 * - Allow relative URLs
 * - Allow hash and query links
 * - Validate absolute URLs via URL constructor
 *
 * @param {string} href
 * @returns {boolean}
 */
function isValidHref(href: string): boolean {
  /* v8 ignore next -- callers guard against empty href before invoking */
  if (!href) return false;

  const value = href.trim();

  if (value === '') return false;

  // Valid relative / in-page references
  if (
    value.startsWith('/') ||
    value.startsWith('./') ||
    value.startsWith('../') ||
    value.startsWith('#') ||
    value.startsWith('?')
  ) {
    return true;
  }

  // Absolute URL validation
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Walk a `Node[]` tree and strip `\r\n`, `\n`, and `\r` from text node
 * content. Text nodes that become empty (zero-length) after stripping are
 * dropped — this lets `splitImagesFromParagraphs` see block elements left
 * childless by the strip and discard them, matching the old `removeBreaklines`
 * string pre-processor behaviour. Pure — returns new node objects only where
 * content or children change; unchanged nodes preserve referential equality.
 *
 * @param {Node[]} nodes
 * @returns {Node[]}
 */
function stripBreaklines(nodes: Node[]): Node[] {
  return nodes.flatMap<Node>((node) => {
    if (node.type === 'comment') return [node];
    if (node.type === 'text') {
      const content = node.content.replace(/(\r\n|\n|\r)/g, '');
      if (content.length === 0) return [];
      return [
        content === node.content ? node : { type: 'text' as const, content },
      ];
    }
    const attributes = node.attributes?.map((attr) => {
      if (!attr.value) return attr;
      const value = attr.value.replace(/(\r\n|\n|\r)/g, '');
      return value === attr.value ? attr : { ...attr, value };
    });
    const children = stripBreaklines(node.children);
    return [{ ...node, attributes, children }];
  });
}
