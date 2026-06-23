import { stringify } from 'himalaya';

import { type CustomComponent } from '../Component';
import { type ElementNode, getAttributes } from '../node/Node';
import { sanitizeContentHtml } from './Mapping.utils';

/**
 * Transform an html node into a Canvasflow Custom Component
 *
 * @param {ElementNode} node
 * @param {Record<string, unknown> | undefined} properties
 * @returns {CustomComponent}
 */
export function toCustom(
  node: ElementNode,
  properties?: Record<string, unknown>
): CustomComponent {
  const content = stringify([node]);
  const attributes = getAttributes(node.attributes);
  const id = attributes.get('id');
  return {
    id,
    component: 'custom',
    errors: [],
    warnings: [],
    content,
    node,
    properties,
    html: sanitizeContentHtml(node),
    element: {
      tag: node.tagName,
      attributes: Object.fromEntries(attributes),
    },
  };
}
