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
  isContainerComponent,
  isColumnsComponent,
  isCustomComponent,
} from '../component';
import {
  type ElementNode,
  type Node,
  type NodeFilterFn,
  findDescendants,
  getAttributes,
  removeDescendants,
} from '../node/node-helpers';
import { escapeText } from '../html/parser';
import {
  sanitizeNode,
  sanitizeContentHtml,
  excludeNode,
  filterAllMapping,
  filterAnyMapping,
  filterClassNameDescendants,
  fromFigcaption,
  trimAsciiWhitespace,
} from './mapping.utils';
import { filterFigureDescendants } from './mapping.media';
import {
  type ColumnsMapping,
  type LiveContainerMapping,
  type Params,
  reduceComponents,
} from './mapping';
import { type FeedIssue, errorIssue, warningIssue } from '../../feed-issue';

/**
 * It maps the live post inside a Live Container Component
 *
 * @param {Params | undefined} params
 * @returns {ReduceComponentsFn}
 */
export function mapLivePost(params?: Params): MapLivePostComponentsFn {
  return (node: ElementNode): LivePostComponent => {
    const errors: FeedIssue[] = [];
    const warnings: FeedIssue[] = [];
    const attributes = getAttributes(node.attributes);
    const id = attributes.get('id');
    const components: Array<Component> = node.children.length
      ? node.children.reduce(reduceComponents(params), [])
      : [];
    if (!components.length) {
      errors.push(
        errorIssue('MISSING_COMPONENTS', 'post do not have components')
      );
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
  const warnings: FeedIssue[] = [];
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
  const errors: FeedIssue[] = [];
  const warnings: FeedIssue[] = [];
  const attributes = getAttributes(node.attributes);
  const id = attributes.get('id');

  const columnEntries: ColumnEntry[] = node.children
    ? collectColumnEntries(node.children, mapping, params, null)
    : /* v8 ignore next -- children is always defined on an element node */ [];

  if (!columnEntries.length) {
    errors.push(
      errorIssue('MISSING_CHILDREN', 'HTML node do not have children')
    );
  }

  const columns: Component[][] = columnEntries.map(({ node, anchor }) => {
    if (!anchor) return node.children.reduce(reduceComponents(params), []);
    const anchorWithColumnChildren: ElementNode = {
      ...anchor,
      children: node.children,
    };
    const resolved: Component[] = [];
    appendLinkContainerComponents(
      resolved,
      toLinkContainer(anchorWithColumnChildren, params)
    );
    return resolved;
  });

  for (const [i, column] of columns.entries()) {
    if (!column.length) {
      warnings.push(
        warningIssue('EMPTY_COLUMN', `the column ${i} is empty`, `${i}`)
      );
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

type ColumnEntry = { node: ElementNode; anchor: ElementNode | null };

function collectColumnEntries(
  nodes: Node[],
  mapping: ColumnsMapping,
  params: Params | undefined,
  closestAnchor: ElementNode | null
): ColumnEntry[] {
  const result: ColumnEntry[] = [];

  for (const node of nodes) {
    if (node.type !== 'element') continue;

    if (params?.excludes?.length && excludeNode(node, params.excludes))
      continue;

    const { column } = mapping;
    const { match, filters } = column;
    const matched =
      (match === 'all' && filterAllMapping(node, filters)) ||
      (match === 'any' && filterAnyMapping(node, filters));

    if (matched) {
      result.push({ node, anchor: closestAnchor });
      continue;
    }

    const nextAnchor = node.tagName === 'a' ? node : closestAnchor;
    result.push(
      ...collectColumnEntries(node.children, mapping, params, nextAnchor)
    );
  }

  return result;
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
  const errors: FeedIssue[] = [];
  const warnings: FeedIssue[] = [];
  const attributes = getAttributes(node.attributes);
  const id = attributes.get('id');

  const posts: LivePostComponent[] = node.children
    ? node.children
        .reduce(findDescendants(filterLivePostDescendants(mapping, params)), [])
        .filter((node: Node) => node.type === 'element')
        .map(mapLivePost(params))
    : /* v8 ignore next -- children is always defined on an element node */ [];

  if (!posts.length) {
    errors.push(
      errorIssue('MISSING_CHILDREN', 'HTML node do not have children')
    );
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
 * Filter the html nodes that match a live post inside a live container.
 *
 * @param {LiveContainerMapping} mapping
 * @param {Params} [params]
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
  const warnings: FeedIssue[] = [];
  const errors: FeedIssue[] = [];
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
    link: link ?? '',
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
  const warnings: FeedIssue[] = [];
  const errors: FeedIssue[] = [];
  const attributes = getAttributes(node.attributes);
  const id = attributes.get('id');
  let caption = '';
  let credit = '';

  const creditFindFn = filterClassNameDescendants('credit');

  // Find the credit node and extract the credit from it
  const creditNodes = node.children.reduce(findDescendants(creditFindFn), []);

  // Strip credit nodes from the tree, then collect figcaption elements from
  // the pruned result so credit text is not included in the caption.
  const prunedChildren = node.children.reduce(
    removeDescendants(creditFindFn),
    []
  );
  const figcaptionNodes = prunedChildren.reduce(
    findDescendants('figcaption'),
    []
  );

  // If we have a figcaption node, we will extract the caption and credit from it
  const figcaptionNode = figcaptionNodes.find(
    (n): n is ElementNode => n.type === 'element'
  );
  if (figcaptionNode) {
    const ficaptionResponse = fromFigcaption(figcaptionNode);
    if (ficaptionResponse) {
      caption = ficaptionResponse.caption ?? '';
      credit = ficaptionResponse.credit ?? '';
    }
  }

  // If we have a credit node, we will extract the credit from it and override
  // the credit from the figcaption node
  const creditNode = creditNodes.find(
    (n): n is ElementNode => n.type === 'element'
  );
  if (creditNode) {
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
 * It appends figure container components into components
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
 * Join a node's direct text-child content into a single trimmed, HTML-safe
 * string. Text node `content` is decoded (unlike the previous himalaya-based
 * parser's raw passthrough), so it needs re-escaping wherever it's
 * interpolated directly rather than run through `stringify()`.
 *
 * @param {Node[]} nodes
 * @returns {string}
 */
function textContent(nodes: Node[]): string {
  return trimAsciiWhitespace(
    escapeText(
      nodes
        .filter((n) => n.type === 'text')
        .map((n) => n.content)
        .join(' ')
    )
  );
}

/**
 * Transform an html component to Canvasflow Button Component
 *
 * @param {ElementNode} node
 * @returns {ButtonComponent}
 */
export function toAnchorButton(node: ElementNode): ButtonComponent {
  const errors: FeedIssue[] = [];
  const warnings: FeedIssue[] = [];
  const attributes = getAttributes(node.attributes);
  let text: string | undefined;
  const link: string | undefined = attributes.get('href');

  const buttonsNode = node.children.reduce(findDescendants('button'), []);

  const button = buttonsNode.find(
    (n): n is ElementNode => n.type === 'element'
  );
  if (button) {
    text = textContent(button.children);
  }
  if (!text) {
    errors.push(errorIssue('MISSING_BUTTON_TEXT', 'Button text is required'));
  }

  if (!link) {
    errors.push(errorIssue('MISSING_BUTTON_LINK', 'Button link is required'));
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
  const errors: FeedIssue[] = [];
  const warnings: FeedIssue[] = [];
  const attributes = getAttributes(node.attributes);
  let text: string | undefined;
  let link: string | undefined;

  // Process from a tag with role button
  if (node.tagName === 'a') {
    link = attributes.get('href');
    text = textContent(node.children);
    if (!text) {
      errors.push(errorIssue('MISSING_BUTTON_TEXT', 'Button text is required'));
    }
  } else if (node.tagName === 'button') {
    const anchorNodes = node.children.reduce(findDescendants('a'), []);
    const aNode = anchorNodes.find(
      (n): n is ElementNode => n.type === 'element'
    );
    if (aNode) {
      const aAttributes = getAttributes(aNode.attributes);
      link = aAttributes.get('href');
      if (!link) {
        errors.push(
          errorIssue(
            'MISSING_BUTTON_LINK',
            'href attribute is required in a button link'
          )
        );
      }
      text = textContent(aNode.children);
      if (!text) {
        errors.push(
          errorIssue('MISSING_BUTTON_TEXT', 'Button text is required')
        );
      }
    } else {
      text = textContent(node.children);
      if (!text) {
        errors.push(
          errorIssue('MISSING_BUTTON_TEXT', 'Button text is required')
        );
      }
      warnings.push(
        warningIssue(
          'MISSING_BUTTON_LINK',
          'button without a link is not clickable, consider using an a tag with role button'
        )
      );
    }
  } else {
    errors.push(
      errorIssue(
        'INVALID_BUTTON_IMPLEMENTATION',
        'invalid button implementation'
      )
    );
  }

  if (!link) {
    errors.push(errorIssue('MISSING_BUTTON_LINK', 'Button link is required'));
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

/**
 * Build a reducer that applies a link container's `link` to each child
 * component: wrapping text in an anchor, setting image/button links.
 *
 * @param {string} [link]
 * @param {Map<string, string>} [attributes]
 * @param {{ tag: string; attributes?: Record<string, string> }} [element]
 * @returns {(acc: Component[], item: Component) => Component[]}
 */
function reduceLinkContainerComponent(
  link?: string,
  attributes?: Map<string, string>,
  element?: {
    tag: string;
    attributes?: Record<string, string> | undefined;
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

    if (isContainerComponent(component)) {
      console.log(component);
    }

    if (isCustomComponent(component)) {
      if (link) {
        component.content = `<a href="${link}">${component.content}</a>`;
      }
    }

    if (isColumnsComponent(component)) {
      component.columns = component.columns.map((column) => {
        const linkContainer: LinkContainerComponent = {
          component: 'container',
          type: 'link',
          link: link ?? '',
          attributes: attributes ?? new Map(),
          components: column,
          errors: [],
          warnings: [],
          element,
        };
        const resolved: Component[] = [];
        appendLinkContainerComponents(resolved, linkContainer);
        return resolved;
      });
    }

    acc.push(component);
    return acc;
  };
}
