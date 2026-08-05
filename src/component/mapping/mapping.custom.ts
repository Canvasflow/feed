import { stringify } from '../html/parser';

import { type CustomComponent } from '../component';
import { type ElementNode, getAttributes } from '../node/node-helpers';
import { serializeOriginalHtml } from './mapping.utils';

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
    html: serializeOriginalHtml(node),
    element: {
      tag: node.tagName,
      attributes: Object.fromEntries(attributes),
    },
  };
}
