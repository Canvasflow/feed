// eslint-disable-next-line @typescript-eslint/ban-ts-comment
/* @ts-expect-error */
import { parse, stringify } from 'himalaya';
import { parseHTML } from 'linkedom';

import { type Component } from './Component';
import {
  filterEmptyTextNode,
  reduceComponents,
  type Mapping,
  type Params,
  reduceEmptyTextNode,
  getRootElement,
} from './Mapping';
import { type Node } from './Node';

export class HTMLMapper {
  static getRootElement(content: string, rootMapping: Mapping): string | null {
    content = content.replace(/(\r\n|\n|\r)/gm, '');
    const nodes: Array<Node> = parse(content).reduce(reduceEmptyTextNode, []);
    const rootNode = getRootElement(nodes, rootMapping);
    return rootNode
      ? stringify([rootNode]).replace(/=('([^']*)')/g, '="$2"')
      : null;
  }

  static toComponents(content: string, params?: Params): Component[] {
    content = removeBreaklines(content);
    content = sanitizeInvalidAnchorHrefs(content);
    content = extractAnchorsWithImages(content);
    const tags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    for (const tag of tags) {
      content = splitParagraphImages(content, tag);
    }

    const parsedContent = parse(content).map(mapEmptyText);

    const nodes: Array<Node> = parsedContent.filter(filterEmptyTextNode);

    return nodes.reduce(reduceComponents(params), []).filter((i) => !!i);
  }
}

/**
 * Extract all <a> elements that contain <img> tags
 * and are wrapped inside p or heading tags.
 */
export function extractAnchorsWithImages(html: string): string {
  // Fast path: plain text
  if (!html.includes('<')) {
    return html;
  }

  const REMOVABLE_PARENTS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

  const { document } = parseHTML(html);

  const anchors = Array.from(document.querySelectorAll('a'));

  for (const anchor of anchors) {
    // Only anchors with images
    if (!anchor.querySelector('img')) continue;

    const parent = anchor.parentElement;
    if (!parent) continue;

    // Only unwrap p or h1–h6
    if (!REMOVABLE_PARENTS.has(parent.tagName.toLowerCase())) continue;

    // 🔑 CLONE before replacing to avoid linkedom bug
    const clonedAnchor = anchor.cloneNode(true) as HTMLElement;

    // Replace the parent with the anchor
    parent.replaceWith(clonedAnchor);
  }
  // We need an outer wrapper to serialize correctly
  const wrapper = document.createElement('div');

  // move all top-level nodes into wrapper
  while (document.firstChild) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    wrapper.appendChild(document.firstChild as any);
  }

  // return the HTML of the wrapper — this is your final HTML string
  return wrapper.innerHTML;
}

export function splitParagraphImages(html: string, tag: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parsed = parseHTML(html) as any;

  // Always treat content as a fragment (RSS-safe)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const root: any =
    parsed.fragment ??
    parsed.document ??
    (() => {
      throw new Error('Unable to parse HTML snippet');
    })();

  const paragraphs = Array.from(root.querySelectorAll(tag));

  for (const paragraph of paragraphs) {
    const p = paragraph as Element;
    const parent = p.parentNode;
    if (!parent) continue;

    const children = Array.from(p.childNodes);
    let buffer: unknown[] = [];

    // Extract original attributes once
    const originalAttrs = Array.from(p.attributes).map((attr) => ({
      name: attr.name,
      value: attr.value,
    }));

    const createNewP = () => {
      const newP = root.createElement(tag);
      // copy attributes
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
        parent.insertBefore(node, p); // move the img out
      } else {
        buffer.push(node);
      }
    }

    flushBuffer();
    parent.removeChild(p);
  }

  return root.toString().trim();
}

/**
 * Detect invalid anchor hrefs and replace them with '#'
 *
 * @param {string} html
 * @returns {string}
 */
export function sanitizeInvalidAnchorHrefs(html: string) {
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
 */
function isValidHref(href: string) {
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

function removeBreaklines(value: string | undefined): string {
  if (!value) return '';
  return value.replace(/(\r\n|\n|\r)/gm, '');
}

function mapEmptyText(node: Node): Node {
  if (node.type === 'comment') return node;
  if (node.type === 'element') {
    if (node.children) {
      node.children = node.children.map(mapEmptyText);
    }
    return node;
  }

  if (node.type !== 'text') return node;

  const { content } = node;
  if (!content.length) return node;

  if (content.length >= 1 && /^\s+$/.test(content) && content.trim().length) {
    node.content = content.replace(/ /g, '&nbsp;');
  }

  return node;
}
