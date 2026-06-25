import { parse, stringify } from 'himalaya';
import { parseHTML } from 'linkedom';

import type { Component } from '../Component';
import type { Node } from '../node/Node';
import {
  type Mapping,
  type Params,
  filterEmptyTextNode,
  reduceComponents,
  reduceEmptyTextNode,
  getRootElement,
} from '../mapping/Mapping';

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
      ? stringify([rootNode]).replace(/=('([^']*)')/g, '="$2"')
      : null;
  }

  /**
   * Convert html string to canvasflow components
   *
   * @param {string} html
   * @param {Params | undefined} params
   * @returns {Component[]}
   */
  static toComponents(html: string, params?: Params): Component[] {
    html = removeBreaklines(html);
    html = sanitizeInvalidAnchorHrefs(html);
    html = preprocessHTML(html);

    const parsedContent = parse(html).map(mapEmptyText);

    const nodes: Array<Node> = parsedContent.filter(filterEmptyTextNode);

    return nodes.reduce(reduceComponents(params), []).filter((i) => !!i);
  }
}

/**
 * Run all DOM-based pre-processing mutations in a single linkedom pass and
 * return the serialized result. Replaces the previous pattern of calling
 * extractAnchorsWithImages + splitParagraphImages×7, each of which re-parsed
 * the HTML from scratch.
 *
 * @param {string} html
 * @returns {string}
 */
function preprocessHTML(html: string): string {
  if (!html.includes('<')) return html;

  const { document } = parseHTML(html);
  extractAnchorsWithImagesDOM(document);
  const tags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  for (const tag of tags) {
    splitParagraphImagesDOM(document, tag);
  }
  return document.toString().trim();
}

/**
 * Perform the anchor-extraction mutations on an already-parsed document.
 * Anchors containing <img> that are direct children of p/h1–h6 are hoisted
 * out of their parent element.
 *
 * @param {Document} document
 */
function extractAnchorsWithImagesDOM(document: Document): void {
  const REMOVABLE_PARENTS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

  const anchors = Array.from(document.querySelectorAll('a'));

  for (const anchor of anchors) {
    if (!anchor.querySelector('img')) continue;

    const parent = anchor.parentElement;
    if (!parent) continue;

    if (!REMOVABLE_PARENTS.has(parent.tagName.toLowerCase())) continue;

    // Clone before replacing to avoid a linkedom bug.
    const clonedAnchor = anchor.cloneNode(true) as HTMLElement;
    parent.replaceWith(clonedAnchor);
  }
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
 * Split paragraphs that have image inside.
 * Public wrapper kept for backwards compatibility — internal code uses
 * splitParagraphImagesDOM on a shared document via preprocessHTML.
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
 * Detect invalid anchor hrefs and replace them with '#'
 *
 * @param {string} html
 * @returns {string}
 */
function sanitizeInvalidAnchorHrefs(html: string): string {
  const { document } = parseHTML(html);

  const anchors = document.querySelectorAll('a[href]');

  for (const anchor of anchors) {
    const href = anchor.getAttribute('href');

    if (href && !isValidHref(href)) {
      anchor.setAttribute('href', '#');
    }
  }

  const response = document.toString();

  // linkedom preserves the original markup structure as much as possible
  return response;
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
 * Remove the breaklines in the string
 *
 * @param {string | undefined} value
 * @returns {string}
 */
function removeBreaklines(value: string | undefined): string {
  if (!value) return '';
  return value.replace(/(\r\n|\n|\r)/gm, '');
}

/**
 * Recursively walk a parsed node tree. Comment and text nodes are returned
 * as-is; element nodes have their children mapped through the same function.
 *
 * @param {Node} node
 * @returns {Node}
 */
function mapEmptyText(node: Node): Node {
  if (node.type === 'comment') return node;
  if (node.type === 'element' && node.children) {
    node.children = node.children.map(mapEmptyText);
  }

  return node;
}
