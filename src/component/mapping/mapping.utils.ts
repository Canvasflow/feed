import {
  sanitizeHTML,
  sanitizeNodes,
  type SanitizeHTMLOptions,
} from '../html/sanitize-html';
import {
  type ElementNode,
  type Node,
  type NodeFilterFn,
  getAttributes,
  SetUtils,
} from '../node/node-helpers';
import {
  allowedTags,
  textAllowedTags,
  textAllowedAttributes,
  allowedFigcaptionTags,
} from './mapping.constants';
import type { Filter, Mapping } from './mapping';

/**
 * Serialize a node back to HTML and sanitize it with the given options.
 *
 * @param {Node} node
 * @param {SanitizeHTMLOptions} options
 * @returns {string}
 */
export function sanitizeNode(node: Node, options: SanitizeHTMLOptions): string {
  return sanitizeNodes([node], options);
}

/**
 * Serialize a node to sanitized HTML using the default content policy — the
 * shared `allowedTags` allow-list with every attribute stripped. This is the
 * common case used by component builders to populate their `html` field; it
 * keeps the sanitization policy in a single place.
 *
 * @param {Node} node
 * @returns {string}
 */
export function sanitizeContentHtml(node: Node): string {
  return sanitizeNode(node, {
    allowedTags,
    allowedAttributes: false,
  });
}

// Evict the oldest entry once this limit is reached. Prevents unbounded
// growth in long-lived processes where consumer-supplied params introduce
// many unique patterns over thousands of feed conversions.
const MAX_PATTERN_CACHE_SIZE = 500;
const patternCache = new Map<string, RegExp | null>();

// Cache the attribute Map for each ElementNode reference. Entries are held
// weakly, so they are GC'd with the node — no manual cleanup is needed and
// the cache is implicitly scoped to a single toComponents run at runtime.
const nodeAttributesCache = new WeakMap<object, Map<string, string>>();

function cachedGetAttributes(node: ElementNode): Map<string, string> {
  let map = nodeAttributesCache.get(node);
  if (!map) {
    map = getAttributes(node.attributes);
    nodeAttributesCache.set(node, map);
  }
  return map;
}

/**
 * Safely test a value against an attribute pattern filter's regular
 * expression. Compiled patterns are cached, and an invalid pattern is treated
 * as a non-match instead of throwing, so a single malformed mapping cannot
 * abort the whole conversion.
 *
 * @param {string} value
 * @param {string} pattern
 * @returns {boolean}
 */
export function matchesPattern(value: string, pattern: string): boolean {
  let regex = patternCache.get(pattern);
  if (regex === undefined) {
    try {
      regex = new RegExp(pattern);
    } catch {
      regex = null;
    }
    if (patternCache.size >= MAX_PATTERN_CACHE_SIZE) {
      patternCache.delete(patternCache.keys().next().value!);
    }
    patternCache.set(pattern, regex);
  }
  return regex !== null && regex.test(value);
}

/**
 * Check if url is a valid Youtube url
 *
 * @param {string} url
 * @returns {boolean}
 */
export function isYoutubeUrl(url: string): boolean {
  const regExp =
    /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;

  return regExp.test(url);
}

/**
 * Process the links in the text
 *
 * @param {string} html
 * @param {string} [link='/']
 * @returns {string}
 */
export function processTextLinks(html: string, link: string = '/'): string {
  if (link && !link.endsWith('/')) {
    link += '/';
  }

  const allowedTags = textAllowedTags;
  const allowedAttributes = textAllowedAttributes;
  const isRelative = (url: string) => !URL.canParse(url);
  return sanitizeHTML(html, {
    allowedTags,
    allowedAttributes,
    transformTags: {
      a: function (tagName, attribs) {
        let href = attribs.href;
        if (!href) {
          return {
            tagName,
            attribs,
          };
        }

        if (removeProtocol(href).includes(':')) {
          const port = getPortFromUrl(href);

          if (port === null) {
            attribs.href = '/';
            return {
              tagName,
              attribs,
            };
          }
        }

        if (href.startsWith('//')) {
          try {
            const u = new URL('https:' + href);
            // CMS-style paths (e.g. //link.aspx?id=…) parse with a hostname
            // that looks like a filename. Real protocol-relative URLs have a
            // proper domain (no file extension as the TLD).
            if (
              !/\.(aspx|php|html|htm|cfm|ashx|jsp|action)$/i.test(u.hostname)
            ) {
              return { tagName, attribs };
            }
          } catch {
            // unparseable — fall through to treat as relative
          }
          href = href.slice(2);
        }
        if (href.startsWith('./')) {
          href = href.slice(2);
        }
        if (isRelative(href)) {
          attribs.href = link + href;
        }

        return {
          tagName,
          attribs,
        };
      },
    },
  });
}

/**
 * Get port from url
 *
 * @param {string} url
 * @returns {number | null}
 */
function getPortFromUrl(url: string): number | null {
  const regex = /:(\d+)/;
  const match = url.match(regex);

  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return null;
}

/**
 * Remove the protocol from string
 *
 * @param {string} url
 * @returns {string}
 */
function removeProtocol(url: string): string {
  if (url.startsWith('https:')) {
    url = url.slice(6);
  }
  if (url.startsWith('http:')) {
    url = url.slice(5);
  }
  return url;
}

/**
 * Check if the string is empty
 *
 * @param {string} content
 * @returns {boolean}
 */
export function isEmpty(content: string): boolean {
  return trimAsciiWhitespace(content.replace(/[\r\n\t]/g, '')).length === 0;
}

/**
 * Trim leading/trailing ASCII whitespace only. Unlike `String.trim()`, this
 * does not strip U+00A0 (non-breaking space) — a decoded `&nbsp;`/`&#160;`
 * at a text node boundary is meaningful, visible content, not insignificant
 * whitespace to discard.
 *
 * @param {string} value
 * @returns {string}
 */
export function trimAsciiWhitespace(value: string): string {
  return value.replace(/^[ \t\n\r\f\v]+|[ \t\n\r\f\v]+$/g, '');
}

/**
 * Collapse runs of 2+ ASCII whitespace characters into a single space.
 * Unlike a plain `/\s\s+/` replace, this leaves U+00A0 (non-breaking space)
 * alone so decoded `&nbsp;`/`&#160;` sequences aren't silently merged away.
 *
 * @param {string} value
 * @returns {string}
 */
export function collapseAsciiWhitespace(value: string): string {
  return value.replace(/[ \t\n\r\f\v]{2,}/g, ' ');
}

export interface FigcaptionResponse {
  caption?: string | undefined;
  credit?: string | undefined;
}

// Cache the Set for each filter object so it is built at most once per
// filter reference, not once per element-filter pair during a pipeline run.
const filterItemsCache = new WeakMap<object, Set<string>>();

function getFilterItemsSet(filter: { items: string[] }): Set<string> {
  let set = filterItemsCache.get(filter);
  if (!set) {
    set = new Set(filter.items);
    filterItemsCache.set(filter, set);
  }
  return set;
}

/**
 * Determine whether a single filter matches an element, described by its tag
 * name and attribute map.
 *
 * @param {string} tagName
 * @param {Map<string, string>} attributes
 * @param {Filter} filter
 * @returns {boolean}
 */
function matchesFilter(
  tagName: string,
  attributes: Map<string, string>,
  filter: Filter
): boolean {
  if (filter.type === 'tag') {
    return getFilterItemsSet(filter).has(tagName);
  }

  if (filter.type === 'attribute') {
    const attributeValue = attributes.get(filter.key);
    if ('pattern' in filter) {
      return (
        attributeValue !== undefined &&
        matchesPattern(attributeValue, filter.pattern)
      );
    }
    return attributeValue === filter.value;
  }

  // class filter
  const classNames = attributes.get('class');
  // An element without a class attribute can never match a class filter.
  if (!classNames) return false;
  const itemsSet = getFilterItemsSet(filter);
  const classList = classNames.trim().split(/\s+/);
  const classesNamesSet: Set<string> = new Set(classList);
  switch (filter.match) {
    case 'equal':
      // Strict version of `all`: the element must carry exactly the filter
      // items and in the same order they were declared.
      return (
        classList.length === filter.items.length &&
        classList.every((className, i) => className === filter.items[i])
      );
    case 'all':
      // Every filter item must be present, in any order.
      return SetUtils.subset(classesNamesSet, itemsSet);
    default:
      // Use match any as the default case
      return SetUtils.intersect(classesNamesSet, itemsSet).size > 0;
  }
}

/**
 * Filter is at least one filter matches
 *
 * @param {ElementNode} node
 * @param {Filter[]} filters
 * @returns {boolean}
 */
export function filterAnyMapping(
  node: ElementNode,
  filters: Filter[]
): boolean {
  const { tagName } = node;
  const attributes = cachedGetAttributes(node);
  return filters.some((filter) => matchesFilter(tagName, attributes, filter));
}

/**
 * All the filters need to match to be considered valid
 *
 * @param {ElementNode} node
 * @param {Filter[]} filters
 * @returns {boolean}
 */
export function filterAllMapping(
  node: ElementNode,
  filters: Filter[]
): boolean {
  // If there aren't any filter, this is invalid
  if (!filters.length) return false;
  const { tagName } = node;
  const attributes = cachedGetAttributes(node);
  return filters.every((filter) => matchesFilter(tagName, attributes, filter));
}

/**
 * Check if a node should be excluded
 *
 * @param {ElementNode} node
 * @param {Mapping[]} [excludes]
 * @returns {boolean}
 */
export function excludeNode(node: ElementNode, excludes: Mapping[]): boolean {
  for (const mapping of excludes) {
    const { match, filters } = mapping;
    if (match === 'all') {
      if (filterAllMapping(node, filters)) {
        return true;
      }
    }
    if (match === 'any') {
      if (filterAnyMapping(node, filters)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Extract a credit string from a node's `<small>`/`role="credit"` children.
 * Returns the credit and the remaining children with credit nodes removed.
 * Pure — does not mutate the input node. Only the first credit is kept.
 *
 * @param {ElementNode} node
 * @returns {{ credit: string | undefined; children: Node[] }}
 */
function getCredit(node: ElementNode): {
  credit: string | undefined;
  children: Node[];
} {
  let credit: string | undefined;
  const children: Node[] = [];

  for (const n of node.children) {
    if (n.type === 'element') {
      const attributes = cachedGetAttributes(n);
      const role = attributes.get('role');
      const classes = attributes.get('class')?.split(' ') ?? [];
      if (
        n.tagName === 'small' ||
        role === 'credit' ||
        classes.includes('credit')
      ) {
        /* v8 ignore next 3 -- keeps only the first credit; extra credits are rare */
        if (credit) {
          continue;
        }
        credit = sanitizeNode(n, {
          allowedTags: allowedFigcaptionTags,
        });
        continue;
      }
      children.push(n);
    } else {
      const content = n.content.replace(/[\r\n\t]/g, '').replace(/\s\s+/g, ' ');
      /* v8 ignore next -- text nodes in figcaption that become empty after strip are extremely rare */
      if (content.length) {
        children.push(content === n.content ? n : { ...n, content });
      }
    }
  }

  return { credit: credit ? credit.trim() : credit, children };
}

/**
 * It process a figcaption node and get the caption and credit
 *
 * @param {ElementNode} node
 * @returns {FigcaptionResponse}
 */
export function fromFigcaption(node: ElementNode): FigcaptionResponse {
  let caption: string | undefined;
  let credit: string | undefined;
  const figcaptionNodes: ElementNode[] =
    node.tagName === 'figcaption'
      ? [node]
      : node.children.filter(
          (n): n is ElementNode =>
            n.type === 'element' && n.tagName === 'figcaption'
        );
  for (const n of figcaptionNodes) {
    const result = getCredit(n);
    credit = result.credit;
    const captionNode = { ...n, children: result.children };
    caption = sanitizeNodes([captionNode], {
      allowedTags: allowedFigcaptionTags,
    });
    break;
  }

  return {
    caption: caption ? caption.trim() : caption,
    credit: credit ? credit.trim() : credit,
  };
}

/**
 * Build a `NodeFilterFn` that returns `true` for element nodes whose `class`
 * attribute contains the given class name as one of its space-separated tokens.
 *
 * @param {string} className - the CSS class name to match
 * @returns {NodeFilterFn}
 */
export function filterClassNameDescendants(className: string): NodeFilterFn {
  return (node: Node): boolean => {
    /* v8 ignore next -- findDescendants only ever passes element nodes */
    if (node.type !== 'element') return false;
    const classNames = cachedGetAttributes(node).get('class');
    if (!classNames) return false;
    return classNames.split(' ').includes(className);
  };
}
