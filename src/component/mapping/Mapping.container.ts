import {
  type ButtonComponent,
  type Component,
  type ColumnsComponent,
  type ContainerComponent,
  type FigureContainerComponent,
  type LinkContainerComponent,
  type LiveContainerComponent,
  type LivePostComponent,
  type RecipeComponent,
  isAudioComponent,
  isButtonComponent,
  isHTMLTableComponent,
  isImageComponent,
  isTextComponent,
  isVideoComponent,
} from '../Component';
import {
  type ElementNode,
  type Node,
  type NodeFilterFn,
  findDescendants,
  getAttributes,
} from '../node/Node';
import {
  sanitizeNode,
  sanitizeContentHtml,
  excludeNode,
  filterAllMapping,
  filterAnyMapping,
  fromFigcaption,
} from './Mapping.utils';
import { filterFigureDescendants } from './Mapping.media';
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
      html: sanitizeContentHtml(node),
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
    html: sanitizeContentHtml(node),
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
    : /* v8 ignore next -- children is always defined on an element node */ [];

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
    html: sanitizeContentHtml(node),
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
    /* v8 ignore next -- findDescendants only ever passes element nodes */
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
    : /* v8 ignore next -- children is always defined on an element node */ [];

  if (!posts.length) {
    errors.push('HTML node do not have children');
  }

  return {
    id,
    component: 'live_container',
    html: sanitizeContentHtml(node),
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
    /* v8 ignore next -- findDescendants only ever passes element nodes */
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

function filterClassNameDescendants(className: string): NodeFilterFn {
  return (node: Node): boolean => {
    const { type } = node;
    /* v8 ignore next -- findDescendants only ever passes element nodes */
    if (type !== 'element') return false;

    const attributes = getAttributes(node.attributes);
    const classNames = attributes.get('class');
    if (!classNames) return false;
    /* v8 ignore next -- attribute map values are always strings */
    if (typeof classNames !== 'string') return false;
    for (const name of classNames.split(' ')) {
      if (name === className) {
        return true;
      }
    }

    return false;
  };
}

/**
 * Transform an a tag into a Canvasflow LinkContainer Component
 *
 * @param {ElementNode} node
 * @param {Params} [params]
 * @param {Record<string, unknown>} [properties]
 * @returns {LinkContainerComponent}
 */
export function toLinkContainer(
  node: ElementNode,
  params?: Params,
  properties?: Record<string, unknown>
): LinkContainerComponent {
  const warnings: string[] = [];
  const errors: string[] = [];
  const attributes = getAttributes(node.attributes);
  const id = attributes.get('id');

  const link: string | undefined = attributes.get('href');

  const containerParams: Params = params
    ? structuredClone({
        ...params,
        ignoreParagraphWrap: true,
      })
    : { ignoreParagraphWrap: true };

  const components: Array<Component> = node.children.length
    ? node.children.reduce(reduceComponents(containerParams), [])
    : [];

  const component: LinkContainerComponent = {
    id,
    attributes,
    component: 'container',
    type: 'link',
    link: link || '',
    components,
    errors,
    warnings,
    properties,
    element: {
      tag: node.tagName,
      attributes: Object.fromEntries(attributes),
    },
  };

  return component;
}

/**
 * Transform an a Figure elemento into a Canvasflow FigureContainer Component
 *
 * @param {ElementNode} node
 * @param {Params} [params]
 * @param {Record<string, unknown>} [properties]
 * @returns {FigureContainerComponent}
 */
export function toFigureContainer(
  node: ElementNode,
  params?: Params,
  properties?: Record<string, unknown>
): FigureContainerComponent {
  const warnings: string[] = [];
  const errors: string[] = [];
  const attributes = getAttributes(node.attributes);
  const id = attributes.get('id');
  let caption = '';
  let credit = '';

  // Get the figcaption section
  const figcaptionNodes = node.children.reduce(
    findDescendants('figcaption'),
    []
  );
  if (figcaptionNodes.length) {
    const figcaptionNode = figcaptionNodes.shift() as ElementNode;
    const ficaptionResponse = fromFigcaption(figcaptionNode);
    if (ficaptionResponse) {
      caption = ficaptionResponse.caption || '';
      credit = ficaptionResponse.credit || '';
    }
  }

  const creditNodes = node.children.reduce(
    findDescendants(filterClassNameDescendants('credit')),
    []
  );

  if (creditNodes.length) {
    const creditNode = creditNodes.shift() as ElementNode;
    credit = sanitizeNode(creditNode, {
      allowedTags: [],
      allowedAttributes: {},
    });
  }

  const components = node.children
    .reduce(findDescendants(filterFigureDescendants(params)), [])
    .reduce(reduceComponents(params), []);

  const component: FigureContainerComponent = {
    id,
    component: 'container',
    type: 'figure',
    components,
    caption,
    credit,
    errors,
    warnings,
    properties,
    element: {
      tag: node.tagName,
      attributes: Object.fromEntries(attributes),
    },
  };

  return component;
}

/* ---------------------------------------------------------------------------
 * Button + link/figure container helpers (moved from Mapping.ts)
 * ------------------------------------------------------------------------- */

/**
 * It appends link container components into components
 *
 * @param {Component[]} acc
 * @param {LinkContainerComponent} container
 * @returns {void}
 */
export function appendLinkContainerComponents(
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
export function appendFigureContainerComponents(
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
 * Transform an html component to Canvasflow Button Component
 *
 * @param {ElementNode} node
 * @returns {ButtonComponent}
 */
export function toAnchorButton(node: ElementNode): ButtonComponent {
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
export function toButton(node: ElementNode): ButtonComponent {
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
 * It checks if an html node is an valid Button Node
 *
 * @param {ElementNode} node
 * @returns {boolean}
 */
export function isButtonNode(node: ElementNode): boolean {
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
        /* v8 ignore next 3 -- the link container always carries an href attribute */
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
