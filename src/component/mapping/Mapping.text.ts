import { stringify } from 'himalaya';
import sanitizeHtml from 'sanitize-html';

import {
  type TextComponent,
  type TextType,
  isValidTextRole,
} from '../Component';
import { type ElementNode, type Node, getAttributes } from '../node/Node';
import { textAllowedTags, textAllowedAttributes } from './Mapping.constants';

/**
 * Preserve whitespace that sits between inline elements inside a text
 * component by converting whitespace-only text nodes to non-breaking spaces.
 * This keeps the spacing in markup such as `<b>foo</b> <i>bar</i>` from being
 * collapsed away when the component's content is serialized.
 *
 * @param {Node} node
 * @returns {void}
 */
function preserveInlineWhitespace(node: Node): void {
  if (node.type !== 'element' || !node.children) return;
  for (const child of node.children) {
    if (child.type === 'text' && /^\s+$/.test(child.content)) {
      child.content = child.content.replace(/ /g, '&nbsp;');
    } else {
      preserveInlineWhitespace(child);
    }
  }
}

/**
 * Transform an html node into Canvasflow Text Component
 *
 * @param {ElementNode} node
 * @param {TextType} component
 * @param {Record<string, unknown>} [properties] - Properties that
 * applied to the component that matches
 * @returns {TextComponent} Text Component
 */
export function toText(
  node: ElementNode,
  component: TextType,
  properties?: Record<string, unknown>
): TextComponent {
  preserveInlineWhitespace(node);
  const html = stringify([node]);
  const warnings: string[] = [];
  const attributes = getAttributes(node.attributes);

  const allowedTags = textAllowedTags;
  const allowedAttributes = textAllowedAttributes;

  const text = sanitizeHtml(html, {
    allowedTags,
    allowedAttributes,
  });
  const id = attributes.get('id');
  const role = attributes.get('role');
  if (role) {
    // If the role was set and is valid we apply it
    if (isValidTextRole(role)) {
      component = role as TextType;
    } else {
      // If the role was invalid we use body as fallback
      warnings.push(`role '${role}' is invalid`);
      component = 'body';
    }
  }

  return {
    id,
    component,
    properties,
    // sanitizeHtml always returns a string; the non-string arm is defensive.
    /* v8 ignore next */
    text: typeof text === 'string' ? text.trim() : text,
    errors: [],
    warnings,
    element: {
      tag: node.tagName,
      attributes: Object.fromEntries(attributes),
    },
  };
}
