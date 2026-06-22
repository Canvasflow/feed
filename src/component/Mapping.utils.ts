import { stringify } from 'himalaya';
import sanitizeHtml from 'sanitize-html';

import type { Node } from './Node';
import { textAllowedTags, textAllowedAttributes } from './Mapping.constants';

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
