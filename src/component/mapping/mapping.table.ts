import { type HTMLTableComponent } from '../component';
import { type ElementNode, getAttributes } from '../node/node-helpers';
import {
  htmlTableAllowedTags,
  textAllowedAttributes,
} from './mapping.constants';
import { sanitizeNodes } from '../html/sanitize-html';
import { type FeedIssue } from '../../feed-issue';

/**
 * Transform an html table component to Canvasflow HTMLTable Component
 *
 * @param {ElementNode} node
 * @returns {HTMLTableComponent}
 */
export function toHTMLTable(node: ElementNode): HTMLTableComponent {
  const errors: FeedIssue[] = [];
  const warnings: FeedIssue[] = [];

  const attributes = getAttributes(node.attributes);

  const html = sanitizeNodes([node], {
    allowedTags: htmlTableAllowedTags,
    allowedAttributes: textAllowedAttributes,
  })
    .replace(/[\r\n\t]/g, '')
    .replace(/\s\s+/g, ' ')
    .trim();

  const id = attributes.get('id');

  const component: HTMLTableComponent = {
    id,
    component: 'htmltable',
    html,
    errors,
    warnings,
    element: {
      tag: node.tagName,
      attributes: Object.fromEntries(attributes),
    },
  };

  return component;
}
