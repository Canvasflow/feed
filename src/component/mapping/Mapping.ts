import { z } from 'zod';

import {
  type Component,
  type TextComponent,
  type TextType,
  type TikTokComponent,
  isFigureContainerComponent,
  isLinkContainerComponent,
} from '../Component';
import { type ElementNode, type Node, getAttributes } from '../node/Node';
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
import { textTags, textTagsSet, mappingTagsSet } from './Mapping.constants';
import {
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
  appendLinkContainerComponents,
  appendFigureContainerComponents,
  toAnchorButton,
  toButton,
  isButtonNode,
} from './Mapping.container';
import { toHTMLTable } from './Mapping.table';
import { toCustom } from './Mapping.custom';
import { toText } from './Mapping.text';

// Re-export the publicly consumed constants and helpers so the package surface
// is unchanged.
export { textTags, textTagsSet, mappingTagsSet };
export { processTextLinks, isEmpty };
export { mapLivePost } from './Mapping.container';
export { toCustom } from './Mapping.custom';

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
        /* v8 ignore next -- fromNode never yields falsy array entries */
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
    /* v8 ignore next -- cite presence is checked above; `|| ''` is defensive */
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

  /* v8 ignore next -- element nodes always expose a children array */
  return null;
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
 * Check whether `mapping` matches the expected `{ mappings: Mapping[] }` shape.
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

/**
 * Parse and return typed `Params`, throwing if `params` is invalid.
 *
 * @param {unknown} params
 * @returns {Params}
 */
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
