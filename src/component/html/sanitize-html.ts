import { parse } from './parser';
import type { Attribute, Node } from '../node/node-helpers';

export interface SanitizeHTMLOptions {
  allowedTags?: string[];
  /** `false` strips every attribute; omitted falls back to a small built-in default (mirrors `sanitize-html`'s own default, which only covers `a`/`img`). */
  allowedAttributes?: Record<string, string[]> | false;
  transformTags?: Record<
    string,
    (
      tagName: string,
      attribs: Record<string, string>
    ) => { tagName: string; attribs: Record<string, string> }
  >;
}

type SanitizeAttribs = Record<string, string>;
type SanitizeTransform = NonNullable<
  SanitizeHTMLOptions['transformTags']
>[string];

// Mirrors sanitize-html's own `defaults.allowedTags` — only used when a
// caller omits `allowedTags` entirely, which none of this codebase's call
// sites currently do.
const DEFAULT_ALLOWED_TAGS = [
  'address',
  'article',
  'aside',
  'footer',
  'header',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hgroup',
  'main',
  'nav',
  'section',
  'blockquote',
  'dd',
  'div',
  'dl',
  'dt',
  'figcaption',
  'figure',
  'hr',
  'li',
  'menu',
  'ol',
  'p',
  'pre',
  'ul',
  'a',
  'abbr',
  'b',
  'bdi',
  'bdo',
  'br',
  'cite',
  'code',
  'data',
  'dfn',
  'em',
  'i',
  'kbd',
  'mark',
  'q',
  'rb',
  'rp',
  'rt',
  'rtc',
  'ruby',
  's',
  'samp',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'time',
  'u',
  'var',
  'wbr',
  'caption',
  'col',
  'colgroup',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
];

// Mirrors sanitize-html's own `defaults.allowedAttributes`, used only when a
// caller omits `allowedAttributes` (as opposed to passing `false`).
const DEFAULT_ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  a: ['href', 'name', 'target'],
  img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading'],
};

// Mirrors sanitize-html's `allowedEmptyAttributes` default: an attribute
// with an empty value is normally dropped entirely rather than rendered
// bare; these are the exceptions rendered as `attr=""`.
const DEFAULT_ALLOWED_EMPTY_ATTRIBUTES = new Set(['alt']);

// Mirrors sanitize-html's `allowedSchemes` + `allowedSchemesAppliedToAttributes`
// + `allowProtocolRelative` defaults.
const DEFAULT_ALLOWED_SCHEMES = new Set([
  'http',
  'https',
  'ftp',
  'mailto',
  'tel',
]);
const DEFAULT_SCHEME_ATTRIBUTES = new Set(['href', 'src', 'cite']);

// Tags whose text content is discarded (not unwrapped) when disallowed,
// since it isn't meant to be read as document content.
const DEFAULT_CONTENT_OPAQUE_TAGS = new Set([
  'script',
  'style',
  'textarea',
  'xmp',
]);

const DEFAULT_VOID_TAGS = new Set([
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
 * Allow-list sanitizer that runs directly over an already-parsed `Node[]`
 * tree — no string-to-parse round-trip. A disallowed tag is *unwrapped*
 * (its children are kept) rather than dropped with its subtree, matching
 * `sanitize-html`'s default `disallowedTagsMode: 'discard'` behaviour.
 *
 * @param {Node[]} nodes
 * @param {SanitizeHTMLOptions} [options]
 * @returns {string}
 */
export function sanitizeNodes(
  nodes: Node[],
  options: SanitizeHTMLOptions = {}
): string {
  const allowedTagSet = new Set(options.allowedTags ?? DEFAULT_ALLOWED_TAGS);
  const allowedAttributeMap =
    options.allowedAttributes === false
      ? {}
      : (options.allowedAttributes ?? DEFAULT_ALLOWED_ATTRIBUTES);
  const transformTags = options.transformTags ?? {};

  return nodes
    .map((node) =>
      renderSanitizedNode(
        node,
        allowedTagSet,
        allowedAttributeMap,
        transformTags
      )
    )
    .join('');
}

/**
 * Allow-list HTML sanitizer over the library's own `Node` AST — a drop-in
 * replacement for `sanitize-html`'s default export covering the subset of
 * its API this codebase actually uses (`allowedTags`, `allowedAttributes`,
 * `transformTags`). Parses `html` and delegates to `sanitizeNodes`.
 *
 * @param {string} html
 * @param {SanitizeHTMLOptions} [options]
 * @returns {string}
 */
export function sanitizeHTML(
  html: string,
  options: SanitizeHTMLOptions = {}
): string {
  return sanitizeNodes(parse(html), options);
}

function renderSanitizedNode(
  node: Node,
  allowedTagSet: Set<string>,
  allowedAttributeMap: Record<string, string[]>,
  transformTags: Record<string, SanitizeTransform>
): string {
  if (node.type === 'comment') return '';
  if (node.type === 'text') return escapeSanitizedText(node.content);

  let tagName = node.tagName;
  let attribs = attributesToRecord(node.attributes);

  const transform = transformTags[tagName];
  if (transform) {
    const transformed = transform(tagName, attribs);
    tagName = transformed.tagName;
    attribs = transformed.attribs;
  }

  const children = () =>
    node.children
      .map((child) =>
        renderSanitizedNode(
          child,
          allowedTagSet,
          allowedAttributeMap,
          transformTags
        )
      )
      .join('');

  if (!allowedTagSet.has(tagName)) {
    if (DEFAULT_CONTENT_OPAQUE_TAGS.has(tagName)) return '';
    return children();
  }

  const attrString = formatSanitizedAttributes(
    tagName,
    attribs,
    allowedAttributeMap
  );

  if (DEFAULT_VOID_TAGS.has(tagName)) {
    return `<${tagName}${attrString} />`;
  }

  return `<${tagName}${attrString}>${children()}</${tagName}>`;
}

function attributesToRecord(attributes?: Attribute[]): SanitizeAttribs {
  const record: SanitizeAttribs = {};
  for (const { key, value } of attributes ?? []) {
    record[key] = value ?? '';
  }
  return record;
}

function formatSanitizedAttributes(
  tagName: string,
  attribs: SanitizeAttribs,
  allowedAttributeMap: Record<string, string[]>
): string {
  const allowedForTag = new Set(allowedAttributeMap[tagName] ?? []);
  let result = '';
  for (const [key, rawValue] of Object.entries(attribs)) {
    if (!allowedForTag.has(key)) continue;
    if (DEFAULT_SCHEME_ATTRIBUTES.has(key) && !isAllowedScheme(rawValue))
      continue;

    const value = key === 'style' ? normalizeStyleValue(rawValue) : rawValue;
    if (key === 'style' && !value.length) continue;

    result += ` ${key}`;
    if (value && value.length) {
      result += `="${escapeSanitizedAttribute(value)}"`;
    } else if (DEFAULT_ALLOWED_EMPTY_ATTRIBUTES.has(key)) {
      result += '=""';
    }
  }
  return result;
}

/**
 * Mirror sanitize-html's postcss-based normalization of the `style`
 * attribute: each `prop: value;` declaration is reduced to `prop:value`
 * (no space after the colon, no trailing semicolon), declarations are
 * joined with `;`, and empty declarations are dropped.
 *
 * @param {string} value
 * @returns {string}
 */
function normalizeStyleValue(value: string): string {
  return value
    .split(';')
    .map((declaration) => declaration.trim())
    .filter((declaration) => declaration.length > 0)
    .map((declaration) => {
      const separator = declaration.indexOf(':');
      if (separator === -1) return declaration;
      const property = declaration.slice(0, separator).trim();
      const propertyValue = declaration.slice(separator + 1).trim();
      return `${property}:${propertyValue}`;
    })
    .join(';');
}

function isAllowedScheme(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed === '') return true;
  if (
    trimmed.startsWith('#') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('?')
  ) {
    return true;
  }
  const match = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(trimmed);
  if (!match) return true;
  return DEFAULT_ALLOWED_SCHEMES.has(match[1].toLowerCase());
}

function escapeSanitizedText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeSanitizedAttribute(value: string): string {
  return escapeSanitizedText(value).replace(/"/g, '&quot;');
}
