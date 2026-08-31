import { type DividerComponent, type SpacerComponent } from '../component';
import { type ElementNode, getAttributes } from '../node/node-helpers';
import { serializeOriginalHtml } from './mapping.utils';

const DEFAULT_SPACER_MARGIN: SpacerComponent['margin'] = 'margin-20';

/**
 * Transform an html node (typically `<hr>`, or any node matched via a
 * `divider` mapping) into a Canvasflow Divider Component
 *
 * @param {ElementNode} node
 * @param {Record<string, unknown>} [properties] - Properties that
 * applied to the component that matches
 * @returns {DividerComponent} Divider Component
 */
export function toDivider(
  node: ElementNode,
  properties?: Record<string, unknown>
): DividerComponent {
  const attributes = getAttributes(node.attributes);
  const id = attributes.get('id');

  return {
    id,
    component: 'divider',
    properties,
    errors: [],
    warnings: [],
    html: serializeOriginalHtml(node),
    element: {
      tag: node.tagName,
      attributes: Object.fromEntries(attributes),
    },
  };
}

/**
 * Transform an html node (typically `<br>`, or any node matched via a
 * `spacer` mapping) into a Canvasflow Spacer Component
 *
 * @param {ElementNode} node
 * @param {Record<string, unknown>} [properties] - Properties that
 * applied to the component that matches
 * @returns {SpacerComponent} Spacer Component
 */
export function toSpacer(
  node: ElementNode,
  properties?: Record<string, unknown>
): SpacerComponent {
  const attributes = getAttributes(node.attributes);
  const id = attributes.get('id');

  return {
    id,
    component: 'spacer',
    margin: DEFAULT_SPACER_MARGIN,
    properties,
    errors: [],
    warnings: [],
    html: serializeOriginalHtml(node),
    element: {
      tag: node.tagName,
      attributes: Object.fromEntries(attributes),
    },
  };
}
