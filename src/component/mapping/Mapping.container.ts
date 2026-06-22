import {
  type Component,
  type ColumnsComponent,
  type ContainerComponent,
  type LiveContainerComponent,
  type LivePostComponent,
  type RecipeComponent,
} from '../Component';
import {
  type ElementNode,
  type Node,
  type NodeFilterFn,
  findDescendants,
  getAttributes,
} from '../node/Node';
import { allowedTags } from './Mapping.constants';
import {
  sanitizeNode,
  excludeNode,
  filterAllMapping,
  filterAnyMapping,
} from './Mapping.utils';
import {
  type ColumnsMapping,
  type LiveContainerMapping,
  type Params,
  reduceComponents,
} from './Mapping';

/**
 * It maps the live post inside a Live Container Component
 *
 * @param {Params | undefined} params
 * @returns {ReduceComponentsFn}
 */
export function mapLivePost(params?: Params): MapLivePostComponentsFn {
  return (node: ElementNode): LivePostComponent => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const attributes = getAttributes(node.attributes);
    const id = attributes.get('id');
    const components: Array<Component> = node.children.length
      ? node.children.reduce(reduceComponents(params), [])
      : [];
    if (!components.length) {
      errors.push('post do not have components');
    }
    return {
      id,
      component: 'live_post',
      html: sanitizeNode(node, {
        allowedTags,
        allowedAttributes: false,
      }),
      components,
      errors,
      warnings,
      element: {
        tag: node.tagName,
        attributes: Object.fromEntries(attributes),
      },
    };
  };
}

type MapLivePostComponentsFn = (node: ElementNode) => LivePostComponent;

/**
 * Transform a container element into a Canvasflow Container component
 *
 * @param {'container' | 'recipe'} component
 * @param {ElementNode} node
 * @param {Params | undefined} params
 * @param {Record<string, unknown> | undefined} properties
 * @returns {RecipeComponent | ContainerComponent}
 */
export function toContainer(
  component: 'container' | 'recipe',
  node: ElementNode,
  params?: Params,
  properties?: Record<string, unknown>
): RecipeComponent | ContainerComponent {
  const warnings: string[] = [];
  const attributes = getAttributes(node.attributes);
  const id = attributes.get('id');

  const components: Array<Component> = node.children.length
    ? node.children.reduce(reduceComponents(params), [])
    : [];

  return {
    id,
    component,
    components,
    errors: [],
    warnings,
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
 * Transform a HTML element into a Canvasflow Columns component
 *
 * @param {ElementNode} node
 * @param {Params | undefined} params
 * @param {Record<string, unknown> | undefined} properties
 * @returns {ColumnsComponent}
 */
export function toColumns(
  node: ElementNode,
  mapping: ColumnsMapping,
  params?: Params,
  properties?: Record<string, unknown>
): ColumnsComponent {
  const errors: string[] = [];
  const warnings: string[] = [];
  const attributes = getAttributes(node.attributes);
  const id = attributes.get('id');

  const columnNodes: ElementNode[] = node.children
    ? node.children
        .reduce(findDescendants(filterColumnsDescendants(mapping, params)), [])
        .filter((node: Node) => node.type === 'element')
    : [];

  if (!columnNodes.length) {
    errors.push('HTML node do not have children');
  }

  const columns: Component[][] = columnNodes.map((node) =>
    node.children.reduce(reduceComponents(params), [])
  );

  for (let i = 0; i < columns.length; i++) {
    const column = columns[i];
    if (!column.length) {
      warnings.push(`the column ${i} is empty`);
    }
  }

  return {
    id,
    component: 'columns',
    html: sanitizeNode(node, {
      allowedTags,
      allowedAttributes: false,
    }),
    columns,
    errors,
    warnings,
    properties,
    element: {
      tag: node.tagName,
      attributes: Object.fromEntries(attributes),
    },
  };
}

/**
 * Filter the html nodes that match a column
 *
 * @param {ColumnsMapping} [mapping\
 * @param {Params} [params\
 * @returns {NodeFilterFn}
 */
function filterColumnsDescendants(
  mapping: ColumnsMapping,
  params?: Params
): NodeFilterFn {
  return (node: Node): boolean => {
    const { type } = node;
    if (type !== 'element') return false;
    // Exclude the nodes that we need to ignore
    if (params?.excludes?.length) {
      const isNodeExcluded = excludeNode(node, params.excludes);
      if (isNodeExcluded) {
        return false;
      }
    }

    const { column } = mapping;
    const { match, filters } = column;

    if (match === 'all') {
      if (filterAllMapping(node, filters)) {
        return true;
      }
    }
    if (match === 'any') {
      if (filterAnyMapping(node, filters)) {
        return true;
      }
    }

    return false;
  };
}

/**
 * Transform a HTML element into a Canvasflow Live Container component
 *
 * @param {ElementNode} node
 * @param {Params | undefined} params
 * @param {Record<string, unknown> | undefined} properties
 * @returns {LiveContainerComponent}
 */
export function toLiveContainer(
  node: ElementNode,
  mapping: LiveContainerMapping,
  params?: Params,
  properties?: Record<string, unknown>
): LiveContainerComponent {
  const errors: string[] = [];
  const warnings: string[] = [];
  const attributes = getAttributes(node.attributes);
  const id = attributes.get('id');

  const posts: LivePostComponent[] = node.children
    ? node.children
        .reduce(findDescendants(filterLivePostDescendants(mapping, params)), [])
        .filter((node: Node) => node.type === 'element')
        .map(mapLivePost(params))
    : [];

  if (!posts.length) {
    errors.push('HTML node do not have children');
  }

  return {
    id,
    component: 'live_container',
    html: sanitizeNode(node, {
      allowedTags,
      allowedAttributes: false,
    }),
    posts,
    errors,
    warnings,
    properties,
    element: {
      tag: node.tagName,
      attributes: Object.fromEntries(attributes),
    },
  };
}

/**
 * Filter the html nodes that match a live container
 *
 * @param {LiveContainerMapping} [mapping\
 * @param {Params} [params\
 * @returns {NodeFilterFn}
 */
function filterLivePostDescendants(
  mapping: LiveContainerMapping,
  params?: Params
): NodeFilterFn {
  return (node: Node): boolean => {
    const { type } = node;
    if (type !== 'element') return false;
    // Exclude the nodes that we need to ignore
    if (params?.excludes?.length) {
      const isNodeExcluded = excludeNode(node, params.excludes);
      if (isNodeExcluded) {
        return false;
      }
    }

    const { post } = mapping;
    const { match, filters } = post;

    if (match === 'all') {
      if (filterAllMapping(node, filters)) {
        return true;
      }
    }
    if (match === 'any') {
      if (filterAnyMapping(node, filters)) {
        return true;
      }
    }

    return false;
  };
}
