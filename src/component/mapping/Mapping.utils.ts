import { stringify } from 'himalaya';
import sanitizeHtml from 'sanitize-html';

import {
  type ElementNode,
  type Node,
  getAttributes,
  SetUtils,
} from '../node/Node';
import {
  allowedTags,
  textAllowedTags,
  textAllowedAttributes,
  allowedFigcaptionTags,
} from './Mapping.constants';
import type { Filter, Mapping } from './Mapping';

/**
 * Serialize a node back to HTML and sanitize it with the given options.
 *
 * @param {Node} node
 * @param {Parameters<typeof sanitizeHtml>[1]} options
 * @returns {string}
 */
export function sanitizeNode(
  node: Node,
  options: Parameters<typeof sanitizeHtml>[1]
): string {
  return sanitizeHtml(stringify([node]), options);
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

const patternCache = new Map<string, RegExp | null>();

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
  return sanitizeHtml(html, {
    allowedTags,
    allowedAttributes,
    transformTags: {
      a: function (tagName, attribs) {
        if (!attribs) {
          return {
            tagName,
            attribs: {},
          };
        }

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

        if (href.startsWith('//') || href.startsWith('./')) {
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
  return content.replace(/[\r\n\t]/g, '').trim().length === 0;
}

export interface FigcaptionResponse {
  caption?: string;
  credit?: string;
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
    return new Set(filter.items).has(tagName);
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
  const itemsSet = new Set(filter.items);
  const classesNamesSet: Set<string> = new Set(classNames.split(' '));
  switch (filter.match) {
    case 'equal':
      return SetUtils.equal(classesNamesSet, itemsSet);
    case 'all':
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
  const attributes = getAttributes(node.attributes);
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
  const attributes = getAttributes(node.attributes);
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

function getCredit(node: ElementNode): string | undefined {
  let credit: string | undefined;

  node.children = node.children.reduce((acc: Array<Node>, n: Node) => {
    if (n.type === 'element') {
      const attributes = getAttributes(n.attributes);
      const role = attributes.get('role');
      if (n.tagName === 'small' || role === 'credit') {
        if (credit) {
          return acc;
        }
        credit = sanitizeNode(n, {
          allowedTags: allowedFigcaptionTags,
        });
        return acc;
      }

      acc.push(n);
      return acc;
    }

    const content = n.content.replace(/[\r\n\t]/g, '').replace(/\s\s+/g, ' ');

    if (content.length) {
      n.content = content;
      acc.push(n);
    }

    return acc;
  }, []);
  return credit ? credit.trim() : credit;
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
  const figcaptionNodes =
    node.tagName === 'figcaption'
      ? [node]
      : node.children.filter(
          (n) => n.type === 'element' && n.tagName === 'figcaption'
        );
  for (const n of figcaptionNodes) {
    credit = getCredit(n as ElementNode);
    const html = stringify([n]);
    caption = sanitizeHtml(html, {
      allowedTags: allowedFigcaptionTags,
    });
    break;
  }

  return {
    caption: caption ? caption.trim() : caption,
    credit: credit ? credit.trim() : credit,
  };
}
