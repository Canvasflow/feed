import { parseHTML } from 'linkedom';

import type {
  Attribute,
  CommentNode,
  ElementNode,
  Node,
  TextNode,
} from '../node/node-helpers';

/**
 * Void (self-closing) HTML elements — matches the WHATWG list, mirroring
 * the set the previous himalaya-based parser treated as childless.
 */
const VOID_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

/**
 * Rewrite explicitly self-closed non-void start tags (`<audio ... />`,
 * `<div />`, …) into an empty tag pair (`<audio ...></audio>`) before
 * handing the string to linkedom.
 *
 * Per the HTML5 parsing algorithm — which linkedom follows, like every real
 * browser — a trailing `/` on a *non-void* element's start tag is ignored;
 * only elements on the fixed void-element list ever self-close. So
 * `<audio src="..." />` opens a normal two-sided tag that keeps consuming
 * every subsequent sibling as a *child* of `<audio>` until it finds a real
 * `</audio>` — which publisher HTML using XHTML-style self-closing syntax
 * on a non-void tag (a common pattern for widget embeds, e.g. an audio
 * player) never supplies. Left unhandled, that swallows the rest of the
 * document into the "self-closed" element.
 *
 * This restores the author's explicit intent — matching how the project's
 * previous (himalaya-based) parser treated `/>` — without granting every
 * tag void-element status: only a tag actually written with `/>` in the
 * source is affected, and only when that `/` reads unambiguously as a
 * self-close marker (immediately after the tag name, after whitespace, or
 * after a quoted attribute value) rather than as the tail of a bare
 * unquoted attribute value (`<div data-x=foo/>`, which HTML5 parses as
 * `data-x="foo/"`, not as self-closing).
 *
 * @param {string} html
 * @returns {string}
 */
function closeExplicitlySelfClosedTags(html: string): string {
  const parts: string[] = [];
  const { length } = html;
  let i = 0;

  while (i < length) {
    const lt = html.indexOf('<', i);
    if (lt === -1) {
      parts.push(html.slice(i));
      break;
    }
    parts.push(html.slice(i, lt));

    // Only a start tag can be self-closed — end tags, comments, doctypes,
    // and a stray '<' are copied through untouched.
    const next = html[lt + 1];
    if (next === undefined || !/[a-zA-Z]/.test(next)) {
      parts.push('<');
      i = lt + 1;
      continue;
    }

    let nameEnd = lt + 1;
    while (nameEnd < length && /[a-zA-Z0-9-]/.test(html[nameEnd]!)) nameEnd++;
    const tagName = html.slice(lt + 1, nameEnd).toLowerCase();

    // Scan to the matching unquoted '>', tracking quote state so a '>'
    // inside an attribute value doesn't end the tag early.
    let tagEnd = nameEnd;
    let quote: string | null = null;
    while (tagEnd < length) {
      const ch = html[tagEnd]!;
      if (quote) {
        if (ch === quote) quote = null;
      } else if (ch === '"' || ch === "'") {
        quote = ch;
      } else if (ch === '>') {
        break;
      }
      tagEnd++;
    }

    if (tagEnd >= length) {
      // Unterminated tag — nothing more to scan.
      parts.push(html.slice(lt));
      break;
    }

    // Find the last non-whitespace character before '>'. `slashPos` is
    // always > lt here: nameEnd is at least lt + 2 (a tag name is never
    // empty), so `slashPos - 1` is always a valid index into `html`.
    let slashPos = tagEnd - 1;
    while (slashPos > nameEnd && /\s/.test(html[slashPos]!)) slashPos--;
    const isUnambiguousSelfClose =
      html[slashPos] === '/' &&
      (slashPos === nameEnd || /[\s"']/.test(html[slashPos - 1]!));

    if (isUnambiguousSelfClose && !VOID_TAGS.has(tagName)) {
      parts.push(`${html.slice(lt, slashPos)}></${tagName}>`);
    } else {
      parts.push(html.slice(lt, tagEnd + 1));
    }
    i = tagEnd + 1;
  }

  return parts.join('');
}

/**
 * Parse an HTML fragment into the flat `Node[]` AST the mapping engine
 * consumes — the same shape the previous himalaya `parse()` produced —
 * using linkedom as the underlying HTML parser.
 *
 * @param {string} html
 * @returns {Node[]}
 */
export function parse(html: string): Node[] {
  // linkedom's fragment handling for input not already wrapped in
  // <html><body> is unreliable (it can nest an empty head/body inside the
  // first element instead of parsing it as document content), so the
  // fragment is parsed as a full document and unwrapped from document.body.
  const { document } = parseHTML(
    `<html><body>${closeExplicitlySelfClosedTags(html)}</body></html>`
  );
  // linkedom's tokenizer splits text into separate sibling Text nodes at
  // decoded-entity boundaries (e.g. "a &amp; b" becomes three text nodes
  // instead of one) — normalize() merges them back, matching how every
  // other parser (and the previous himalaya-based one) represents them.
  document.normalize();
  return Array.from(document.body.childNodes).map(fromDomNode);
}

/**
 * Serialize a `Node[]` AST back into an HTML string. Void elements
 * self-close without children; text/comment content is escaped since (unlike
 * the previous himalaya-based parser) this AST stores decoded text.
 *
 * @param {Node[]} nodes
 * @returns {string}
 */
export function stringify(nodes: Node[]): string {
  return nodes.map(nodeToHtml).join('');
}

function fromDomNode(node: globalThis.Node): Node {
  if (node.nodeType === node.COMMENT_NODE) {
    return {
      type: 'comment',
      content: (node as Comment).data,
    } satisfies CommentNode;
  }

  if (node.nodeType === node.TEXT_NODE) {
    return {
      type: 'text',
      content: (node as Text).data,
    } satisfies TextNode;
  }

  const element = node as Element;

  return {
    type: 'element',
    tagName: element.tagName.toLowerCase(),
    attributes: parseOpeningTagAttributes(element.outerHTML),
    children: Array.from(element.childNodes).map(fromDomNode),
  } satisfies ElementNode;
}

/**
 * Extract `{key, value}` pairs directly from a serialized opening tag,
 * instead of reading `element.attributes`/`Attr#value`. The DOM API only
 * exposes decoded values (`&quot;` and a literal `"` both read back as `"`),
 * but himalaya's original tokenizer worked on source text and never decoded
 * anything — so a value like `alt="a &quot;b&quot; c"` round-tripped
 * byte-for-byte. This reads from linkedom's own re-serialization instead,
 * which is guaranteed well-formed (always double-quoted, with any embedded
 * `"` correctly escaped back to `&quot;`), so entities in attribute values
 * survive exactly as himalaya would have left them. A bare attribute (e.g.
 * `<input disabled>`) has no `=` at all and maps to `value: null`, matching
 * himalaya's own convention.
 *
 * @param {string} outerHTML
 * @returns {Attribute[]}
 */
function parseOpeningTagAttributes(outerHTML: string): Attribute[] {
  let inQuotes = false;
  let openTagEnd = outerHTML.length;
  for (let i = 0; i < outerHTML.length; i++) {
    const char = outerHTML[i];
    if (char === '"') inQuotes = !inQuotes;
    else if (char === '>' && !inQuotes) {
      openTagEnd = i;
      break;
    }
  }
  // Skip past the tag name to the start of the attribute list.
  const nameEnd = outerHTML.search(/[\s/>]/);
  const openTag = outerHTML.slice(nameEnd === -1 ? 1 : nameEnd, openTagEnd);

  const attributes: Attribute[] = [];
  const attributePattern = /([^\s"'>/=]+)(?:="([^"]*)")?/g;
  let match: RegExpExecArray | null;
  while ((match = attributePattern.exec(openTag))) {
    attributes.push({
      // Group 1 is a mandatory `+` capture — always defined on a successful match.
      key: match[1]!,
      value: match[2] !== undefined ? match[2] : (null as unknown as string),
    });
  }
  return attributes;
}

function nodeToHtml(node: Node): string {
  if (node.type === 'text') return escapeText(node.content);
  if (node.type === 'comment') return `<!--${node.content}-->`;

  const attributes = (node.attributes ?? []).map(formatAttribute).join('');

  if (VOID_TAGS.has(node.tagName)) {
    return `<${node.tagName}${attributes}>`;
  }

  const children = node.children.map(nodeToHtml).join('');
  return `<${node.tagName}${attributes}>${children}</${node.tagName}>`;
}

function formatAttribute(attribute: Attribute): string {
  if (attribute.value === null || attribute.value === undefined) {
    return ` ${attribute.key}`;
  }
  // Attribute values are already raw HTML source text (see
  // parseOpeningTagAttributes) — matching himalaya's own stringify, which
  // never escapes and only picks a quote style (single quotes unless the
  // value itself contains one) so output is byte-identical for consumers
  // that read it directly (e.g. CustomComponent#content).
  const quote = attribute.value.includes("'") ? '"' : "'";
  return ` ${attribute.key}=${quote}${attribute.value}${quote}`;
}

/**
 * Escape a decoded text/attribute string back into safe HTML source. Also
 * re-encodes U+00A0 (non-breaking space) as `&#160;`, matching linkedom's
 * own serializer convention (and, incidentally, keeping it immune to
 * accidental `String.trim()` stripping downstream, since trim() treats
 * U+00A0 as whitespace).
 *
 * @param {string} value
 * @returns {string}
 */
export function escapeText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/ /g, '&#160;');
}
