import { stringify } from 'himalaya';
import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';

import {
  type ButtonComponent,
  type Component,
  type CustomComponent,
  type FigureContainerComponent,
  type HTMLTableComponent,
  type LinkContainerComponent,
  type TextComponent,
  type TextType,
  type TikTokComponent,
  isAudioComponent,
  isFigureContainerComponent,
  isHTMLTableComponent,
  isImageComponent,
  isLinkContainerComponent,
  isTextComponent,
  isValidTextRole,
  isVideoComponent,
  isButtonComponent,
} from '../Component';
import {
  type ElementNode,
  type Node,
  findDescendants,
  getAttributes,
} from '../node/Node';
import {
  AttributeFilterSchema,
  AttributeValueFilterSchema,
  AttributePatternFilterSchema,
  ClassFilterSchema,
  ColumnsMappingSchema,
  ContainerMappingSchema,
  CustomMappingSchema,
  FilterSchema,
  LiveContainerMappingSchema,
  MappingSchema,
  MatchTypeSchema,
  RecipeMappingSchema,
  TagFilterSchema,
  TextMappingSchema,
  ParamsSchema,
  ComponentMappingSchema,
  LinkResponseSchema,
  GalleryMappingSchema,
} from './Mapping.schema';
import {
  textTags,
  textTagsSet,
  mappingTagsSet,
  textAllowedAttributes,
  allowedTags,
  textAllowedTags,
  htmlTableAllowedTags,
} from './Mapping.constants';
import {
  sanitizeNode,
  isYoutubeUrl,
  processTextLinks,
  isEmpty,
  excludeNode,
  filterAllMapping,
  filterAnyMapping,
} from './Mapping.utils';
import {
  toInstagram,
  toTikTok,
  toYoutubeFromAnchor,
  isInstagramNode,
  isTikTokNode,
} from './Mapping.embeds';
import {
  toImg,
  toImage,
  toVideo,
  toAudio,
  toGallery,
  toGalleryFromMapping,
  toTwitter,
  isTwitterNode,
  fromIframe,
} from './Mapping.media';
import {
  toContainer,
  toColumns,
  toLiveContainer,
  toFigureContainer,
  toLinkContainer,
} from './Mapping.container';

// Re-export the publicly consumed constants and helpers so the package surface
// is unchanged.
export { textTags, textTagsSet, mappingTagsSet };
export { processTextLinks, isEmpty };
export { mapLivePost } from './Mapping.container';

export type Filter = z.infer<typeof FilterSchema>;
export type TagFilter = z.infer<typeof TagFilterSchema>;
export type ClassFilter = z.infer<typeof ClassFilterSchema>;
export type AttributeFilter = z.infer<typeof AttributeFilterSchema>;
export type AttributeValueFilter = z.infer<typeof AttributeValueFilterSchema>;
export type AttributePatternFilter = z.infer<
  typeof AttributePatternFilterSchema
>;

export type Mapping = z.infer<typeof MappingSchema>;
export type LinkResponse = z.infer<typeof LinkResponseSchema>;
export type ComponentMapping = z.infer<typeof ComponentMappingSchema>;
export type MatchType = z.infer<typeof MatchTypeSchema>;

export type RecipeMapping = z.infer<typeof RecipeMappingSchema>;
export type ColumnsMapping = z.infer<typeof ColumnsMappingSchema>;
export type LiveContainerMapping = z.infer<typeof LiveContainerMappingSchema>;
export type ContainerMapping = z.infer<typeof ContainerMappingSchema>;
export type CustomMapping = z.infer<typeof CustomMappingSchema>;
export type TextMapping = z.infer<typeof TextMappingSchema>;
export type GalleryMapping = z.infer<typeof GalleryMappingSchema>;

/**
 * It gets the root node from a list of nodes
 *
 * @param {Node[]} nodes
 * @param {Mapping} mapping
 * @returns {ElementNode | null}
 */
export function getRootElement(
  nodes: Node[],
  mapping: Mapping
): ElementNode | null {
  const { match, filters } = mapping;
  for (const node of nodes) {
    if (node.type !== 'element') continue;
    if (match === 'all') {
      if (filterAllMapping(node, filters)) {
        return node;
      }
    }

    if (match === 'any') {
      if (filterAnyMapping(node, filters)) {
        return node;
      }
    }

    if (node.children) {
      const rootElement = getRootElement(node.children, mapping);
      if (!rootElement) continue;
      return rootElement;
    }
  }

  return null;
}

/**
 * It reduce a list of nodes and remove the comments and empty text elements
 *
 * @param {Node[]} nodes
 * @param {Node} node
 * @returns {Node[]}
 */
export function reduceEmptyTextNode(nodes: Node[], node: Node): Node[] {
  if (node.type === 'comment') return nodes;

  if (node.type === 'text') {
    let { content } = node;
    if (content) {
      content = content.replace(/\s\s+/g, ' ');
      node.content = content;
    }

    if (content.length >= 1 && !content.trim().length) {
      node.content = ' ';
      nodes.push(node);
      return nodes;
    }
    if (!isEmpty(node.content)) {
      nodes.push(node);
    }
    return nodes;
  }

  if (node.type === 'element' && node.children) {
    node.children = node.children.reduce(reduceEmptyTextNode, []);
  }
  nodes.push(node);
  return nodes;
}

/**
 * It process the html node and returns a list of canvasflow components
 *
 * @param {Params | undefined} params
 * @returns {ReduceComponentsFn}
 */
export function reduceComponents(params?: Params): ReduceComponentsFn {
  return (acc: Array<Component>, node: Node): Array<Component> => {
    const component = fromNode(node, params);

    if (!component) {
      return acc;
    }

    if (Array.isArray(component)) {
      for (const c of component) {
        if (!c) continue;
        if (isLinkContainerComponent(c)) {
          appendLinkContainerComponents(acc, c);
          continue;
        }

        if (isFigureContainerComponent(c)) {
          appendFigureContainerComponents(acc, c);
          continue;
        }

        acc.push(c);
      }
      return acc;
    }

    if (isLinkContainerComponent(component)) {
      appendLinkContainerComponents(acc, component);
      return acc;
    }

    if (isFigureContainerComponent(component)) {
      appendFigureContainerComponents(acc, component);
      return acc;
    }

    acc.push(component);
    return acc;
  };
}

type ReduceComponentsFn = (
  acc: Array<Component>,
  node: Node
) => Array<Component>;

/**
 * It appends link container components into components
 *
 * @param {Component[]} acc
 * @param {LinkContainerComponent} container
 * @returns {void}
 */
function appendLinkContainerComponents(
  acc: Component[],
  container: LinkContainerComponent
): void {
  const link = container.link;
  const attributes = container.attributes;
  const components = container.components.reduce(
    reduceLinkContainerComponent(link, attributes, container.element),
    []
  );
  for (const component of components) {
    acc.push(component);
  }
}

/**
 * It appends fgure container components into components
 *
 * @param {Component[]} acc
 * @param {FigureContainerComponent} container
 * @returns {void}
 */
function appendFigureContainerComponents(
  acc: Component[],
  container: FigureContainerComponent
): void {
  const { credit, caption, components } = container;

  for (const component of components) {
    if (
      isAudioComponent(component) ||
      isImageComponent(component) ||
      isVideoComponent(component) ||
      isHTMLTableComponent(component)
    ) {
      component.caption = caption;
      component.credit = credit;
    }
    acc.push(component);
  }
}

/**
 * It process a node individually and transform it into a single canvasflow
 * component
 *
 * @param {Node} node
 * @param {Params | undefined} params
 * @returns {Component | Array<Component> | null}
 */
export function fromNode(
  node: Node,
  params?: Params
): Component | Array<Component> | null {
  // If the node is a comment it get's ignore
  if (node.type === 'comment') return null;

  // If the node is a text, it get's wrapped in a p tag
  if (node.type === 'text') {
    if (!node.content.trim().length) {
      return null;
    }

    const text = params?.ignoreParagraphWrap
      ? node.content.trim()
      : `<p>${node.content.trim()}</p>`;

    return {
      component: 'body',
      errors: [],
      warnings: [],
      text,
    } as TextComponent;
  }

  const { tagName } = node;

  // If the element is a script or a style it will get ignored
  if (tagName === 'script' || tagName === 'style') return null;

  const attributes = getAttributes(node.attributes);

  // We exclude first and then we process
  if (params?.excludes?.length) {
    const isNodeExcluded = excludeNode(node, params.excludes);
    if (isNodeExcluded) {
      return null;
    }
  }

  // If the element is specifically ignored
  if (attributes.get('data-cf-ignore') !== undefined) {
    return null;
  }

  const role = attributes.get('role');

  const textTagMapping: Record<string, TextType> = {
    h1: 'headline',
    h2: 'title',
    h3: 'subtitle',
    h4: 'intro',
    h5: 'crosshead',
    h6: 'byline',
    footer: 'footer',
    blockquote: 'blockquote',
    p: 'body',
    ol: 'body',
    ul: 'body',
    a: 'body',
  };

  if (tagName === 'a' && isYoutubeUrl(attributes.get('href') || '')) {
    return toYoutubeFromAnchor(node);
  }

  // This is a hack for forbes
  if (tagName === 'a' && hasButton(node)) {
    return toAnchorButton(node);
  }

  if (isInstagramNode(node)) {
    return toInstagram(node);
  }

  if (tagName === 'table') {
    return toHTMLTable(node);
  }

  if (isTikTokNode(node)) {
    if (!attributes.get('cite')) {
      return {
        component: 'video',
        vidtype: 'tiktok',
        params: {
          username: '',
          id: '',
        },
        warnings: [],
        errors: ['cite attribute is required'],
      } as TikTokComponent;
    }
    const tiktokComponent = toTikTok(new URL(attributes.get('cite') || ''));
    if (tagName) {
      tiktokComponent.element = {
        tag: tagName,
        attributes: Object.fromEntries(attributes),
      };
    }
    return tiktokComponent;
  }

  if (isTwitterNode(node)) {
    return toTwitter(node);
  }

  if (isButtonNode(node)) {
    return toButton(node);
  }

  if (role === 'gallery' || role === 'mosaic') {
    return toGallery(node);
  }

  // This section validates the rest of the tags components
  switch (tagName) {
    case 'video':
      return toVideo(node);
    case 'audio':
      return toAudio(node);
    case 'iframe':
      return fromIframe(node);
    default:
      break;
  }

  // Handle mapping send by the user
  const { mappedComponent, properties, mapping } = getMappingComponent(
    node,
    params?.mappings
  );

  if (tagName === 'figure') {
    return toFigureContainer(node, params, properties);
  }

  if (tagName === 'a') {
    return toLinkContainer(node, params, properties);
  }

  if (tagName === 'img') {
    return toImg(node);
  }

  if (tagName === 'picture') {
    return toImage(node);
  }

  if (mappedComponent && mapping) {
    if (mappedComponent === 'recipe' || mappedComponent === 'container') {
      return toContainer(mappedComponent, node, params, properties);
    }
    if (mappedComponent === 'columns') {
      return toColumns(node, mapping as ColumnsMapping, params, properties);
    }
    if (mappedComponent === 'live_container') {
      return toLiveContainer(
        node,
        mapping as LiveContainerMapping,
        params,
        properties
      );
    }
    if (mappedComponent === 'gallery') {
      return toGalleryFromMapping(
        node,
        mapping as GalleryMapping,
        params,
        properties
      );
    }
    if (mappedComponent === 'custom') {
      return toCustom(node, properties);
    }

    return toText(node, mappedComponent, properties);
  }

  // This section validates text tags
  for (const tag in textTagMapping) {
    if (tagName === tag) {
      return toText(node, textTagMapping[tag]);
    }
  }

  if (node.children) {
    const components: Array<Component> = [];
    for (const n of node.children) {
      const c = fromNode(n, params);
      if (!c) continue;
      if (Array.isArray(c)) {
        if (!c.length) continue;
        components.push(...c);
      } else {
        components.push(c);
      }
    }

    return components;
  }

  return null;
}

/**
 * Transform an html component to Canvasflow Button Component
 *
 * @param {ElementNode} node
 * @returns {ButtonComponent}
 */
function toAnchorButton(node: ElementNode): ButtonComponent {
  const errors: string[] = [];
  const warnings: string[] = [];
  const attributes = getAttributes(node.attributes);
  let text: string | undefined;
  const link: string | undefined = attributes.get('href');

  const buttonsNode = node.children.reduce(findDescendants('button'), []);

  if (buttonsNode.length > 0) {
    const button = buttonsNode[0] as ElementNode;

    text = button.children
      .filter((n) => n.type === 'text')
      .map((n) => n.content)
      .join(' ')
      .trim();
  }
  if (!text) {
    errors.push('Button text is required');
  }

  if (!link) {
    errors.push('Button link is required');
  }

  return {
    component: 'button',
    text,
    link,
    errors,
    warnings,
    element: {
      tag: node.tagName,
      attributes: Object.fromEntries(attributes),
    },
  };
}

/**
 * Transform an html component to Canvasflow Button Component
 *
 * @param {ElementNode} node
 * @returns {ButtonComponent}
 */
function toButton(node: ElementNode): ButtonComponent {
  const errors: string[] = [];
  const warnings: string[] = [];
  const attributes = getAttributes(node.attributes);
  let text: string | undefined;
  let link: string | undefined;

  // Process from a tag with role button
  if (node.tagName === 'a') {
    link = attributes.get('href');
    text = node.children
      .filter((n) => n.type === 'text')
      .map((n) => n.content)
      .join(' ')
      .trim();
    if (!text) {
      errors.push('Button text is required');
    }
  } else if (node.tagName === 'button') {
    const anchorNodes = node.children.reduce(findDescendants('a'), []);
    if (anchorNodes.length > 0) {
      const aNode = anchorNodes[0] as ElementNode;
      const aAttributes = getAttributes(aNode.attributes);
      link = aAttributes.get('href');
      if (!link) {
        errors.push('href attribute is required in a button link');
      }
      text = aNode.children
        .filter((n) => n.type === 'text')
        .map((n) => n.content)
        .join(' ')
        .trim();
      if (!text) {
        errors.push('Button text is required');
      }
    } else {
      text = node.children
        .filter((n) => n.type === 'text')
        .map((n) => n.content)
        .join(' ')
        .trim();
      if (!text) {
        errors.push('Button text is required');
      }
      warnings.push(
        'button without a link is not clickable, consider using an a tag with role button'
      );
    }
  } else {
    errors.push('invalid button implementation');
  }

  if (!link) {
    errors.push('Button link is required');
  }

  return {
    component: 'button',
    text,
    link,
    errors,
    warnings,
    element: {
      tag: node.tagName,
      attributes: Object.fromEntries(attributes),
    },
  };
}

/**
 * Transform an html table component to Canvasflow HTMLTable Component
 *
 * @param {ElementNode} node
 * @returns {HTMLTableComponent}
 */
function toHTMLTable(node: ElementNode): HTMLTableComponent {
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
    html: sanitizeNode(node, {
      allowedTags,
      allowedAttributes: false,
    }),
    element: {
      tag: node.tagName,
      attributes: Object.fromEntries(attributes),
    },
  };
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

function toText(
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
    text: typeof text === 'string' ? text.trim() : text,
    errors: [],
    warnings,
    element: {
      tag: node.tagName,
      attributes: Object.fromEntries(attributes),
    },
  };
}

/**
 * It returns `true` if the node has a button as a children
 *
 * @param {ElementNode} node
 * @returns {boolean}
 */
function hasButton(node: ElementNode): boolean {
  for (const child of node.children) {
    if (child.type === 'element' && child.tagName === 'button') {
      return true;
    }
  }
  return false;
}

/**
 * It checks if an html node is an valid Button Node
 *
 * @param {ElementNode} node
 * @returns {boolean}
 */
function isButtonNode(node: ElementNode): boolean {
  const { tagName } = node;
  const attributes = getAttributes(node.attributes);
  const role = attributes.get('role');
  return tagName === 'button' || (tagName === 'a' && role === 'button');
}

function reduceLinkContainerComponent(
  link?: string,
  attributes?: Map<string, string>,
  element?: {
    tag: string;
    attributes?: Record<string, string>;
  }
): (acc: Component[], item: Component) => Component[] {
  return (acc: Component[], component: Component): Component[] => {
    // You don't have a link so return as it is
    if (!link) {
      acc.push(component);
      return acc;
    }

    if (isTextComponent(component)) {
      if (attributes && attributes.size > 0) {
        attributes.set('href', link);
        const linkAttributes: string[] = [];
        for (const [attr, value] of attributes) {
          linkAttributes.push(`${attr}="${value}"`);
        }
        component.text = `<a ${linkAttributes.join(' ')}>${component.text}</a>`;
      } else {
        component.text = `<a href="${link}">${component.text}</a>`;
      }

      if (element) {
        component.element = element;
      }
    }

    if (isImageComponent(component)) {
      component.link = link;
    }

    if (isButtonComponent(component)) {
      if (!component.link) {
        component.link = link;
        component.errors = [];
      }
    }

    acc.push(component);
    return acc;
  };
}

/**
 * Check if a valid has the correct structure
 *
 * @param {unknown} mapping
 * @returns {boolean}
 */
export function isValidMapping(mapping: unknown): boolean {
  return z.object({ mappings: z.array(MappingSchema) }).safeParse(mapping)
    .success;
}

export type Params = z.infer<typeof ParamsSchema>;

/**
 * Filter the nodes that has empty text node
 *
 * @param {Node} node
 * @returns {boolean}
 */
export function filterEmptyTextNode(node: Node): boolean {
  if (node.type === 'comment') return false;
  if (node.type !== 'text') return true;

  const { content } = node;
  if (!content) return false;

  return !isEmpty(content);
}

/**
 * Check if a param is valid
 *
 * @param {unknown} params
 * @returns {boolean}
 */
export function isValidParams(params: unknown): boolean {
  return ParamsSchema.safeParse(params).success;
}

export function validateParams(params: unknown): Params {
  const result = ParamsSchema.safeParse(params);
  if (!result.success) {
    throw new Error(result.error.message);
  }
  return result.data;
}

/**
 * Get the mapping of the component
 *
 * @param {ElementNode} node
 * @param {ComponentMapping[]} [mappings]
 * @returns {MappingComponentResponse}
 */
function getMappingComponent(
  node: ElementNode,
  mappings?: ComponentMapping[]
): MappingComponentResponse {
  if (!mappings || !mappings.length) {
    return {
      mappedComponent: undefined,
      properties: undefined,
      mapping: undefined,
    };
  }
  // if (!mappingTagsSet.has(tagName)) return;

  for (const mapping of mappings) {
    const { component, match, filters, properties } = mapping;
    if (match === 'all') {
      if (filterAllMapping(node, filters)) {
        return {
          mappedComponent: component,
          properties,
          mapping,
        };
      }
    }
    if (match === 'any') {
      if (filterAnyMapping(node, filters)) {
        return {
          mappedComponent: component,
          properties,
          mapping,
        };
      }
    }
  }

  return {
    mappedComponent: undefined,
    properties: undefined,
    mapping: undefined,
  };
}

interface MappingComponentResponse {
  mappedComponent?:
    | TextType
    | 'recipe'
    | 'container'
    | 'columns'
    | 'live_container'
    | 'gallery'
    | 'custom';
  properties?: Record<string, unknown>;
  mapping?: ComponentMapping;
}
