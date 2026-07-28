import {
  type TextComponent,
  type TextType,
  isValidTextRole,
} from '../component';
import {
  type ElementNode,
  type Node,
  getAttributes,
} from '../node/node-helpers';
import { textAllowedTags, textAllowedAttributes } from './mapping.constants';
import { sanitizeNodes } from '../html/sanitize-html';
import { type FeedIssue, warningIssue } from '../../feed-issue';

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
      child.content = child.content.replace(/ /g, ' ');
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
): TextComponent | null {
  preserveInlineWhitespace(node);
  const warnings: FeedIssue[] = [];
  const attributes = getAttributes(node.attributes);

  const rawText = sanitizeNodes([node], {
    allowedTags: textAllowedTags,
    allowedAttributes: textAllowedAttributes,
  });
  // sanitizeHtml always returns a string; the non-string arm is defensive.
  /* v8 ignore next */
  const text =
    typeof rawText === 'string'
      ? rawText.trim().replace(/\s{2,}/g, ' ')
      : rawText;
  const visibleContent =
    typeof text === 'string'
      ? text
          .replace(/<[^>]*>/g, '')
          .replace(/&nbsp;/g, ' ')
          .trim()
      : '';
  if (!visibleContent) return null;

  const id = attributes.get('id');
  const role = attributes.get('role');
  if (role) {
    // If the role was set and is valid we apply it
    if (isValidTextRole(role)) {
      component = role;
    } else {
      // If the role was invalid we use body as fallback
      warnings.push(
        warningIssue('INVALID_TEXT_ROLE', `role '${role}' is invalid`, 'role')
      );
      component = 'body';
    }
  }

  return {
    id,
    component,
    properties,
    text,
    errors: [],
    warnings,
    element: {
      tag: node.tagName,
      attributes: Object.fromEntries(attributes),
    },
  };
}
