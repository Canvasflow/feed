import { stringify } from 'himalaya';
import sanitizeHtml from 'sanitize-html';

import { type HTMLTableComponent } from '../Component';
import { type ElementNode, getAttributes } from '../node/Node';
import {
  htmlTableAllowedTags,
  textAllowedAttributes,
} from './Mapping.constants';

/**
 * Transform an html table component to Canvasflow HTMLTable Component
 *
 * @param {ElementNode} node
 * @returns {HTMLTableComponent}
 */
export function toHTMLTable(node: ElementNode): HTMLTableComponent {
  let html = stringify([node]);
  const errors: string[] = [];
  const warnings: string[] = [];

  const attributes = getAttributes(node.attributes);

  const allowedTags = htmlTableAllowedTags;
  const allowedAttributes = textAllowedAttributes;

  html = sanitizeHtml(html, {
    allowedTags,
    allowedAttributes,
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
