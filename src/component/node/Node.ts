/**
 * Create a reducer that finds descendant element nodes matching a predicate.
 *
 * The predicate (findFn) may be:
 * - a string: match elements with the given tagName
 * - a string[]: match elements whose tagName is in the list
 * - a function: a callback that receives a Node and returns a boolean
 *
 * The returned reducer can be used with Array.prototype.reduce to collect
 * matching descendant nodes from a tree of ElementNodes.
 *
 * @param {FindFn} findFn - tag name, list of tag names, or a predicate function
 * @returns {DescendantsReducer} reducer that accumulates matching nodes
 */
export function findDescendants(findFn: FindFn): DescendantsReducer {
  const tagSet = Array.isArray(findFn) ? new Set(findFn) : null;
  return (acc: Node[], node: Node): Node[] => {
    if (node.type !== 'element') return acc;

    if (typeof findFn === 'string' && node.tagName === findFn) {
      acc.push(node);
    }

    if (tagSet !== null && tagSet.has(node.tagName)) {
      acc.push(node);
    }

    if (typeof findFn === 'function' && findFn(node)) {
      acc.push(node);
      return acc;
    }
    return node.children.reduce(findDescendants(findFn), acc);
  };
}

/**
 * Create a reducer that removes descendant element nodes matching a predicate.
 *
 * The predicate (findFn) may be:
 * - a string: remove elements with the given tagName
 * - a string[]: remove elements whose tagName is in the list
 * - a function: a callback that receives a Node and returns a boolean
 *
 * The returned reducer can be used with Array.prototype.reduce to produce
 * a new tree with matching descendant nodes excluded.
 *
 * @param {FindFn} findFn - tag name, list of tag names, or a predicate function
 * @returns {DescendantsReducer} reducer that accumulates non-matching nodes
 */
export function removeDescendants(findFn: FindFn): DescendantsReducer {
  const tagSet = Array.isArray(findFn) ? new Set(findFn) : null;
  return (acc: Node[], node: Node): Node[] => {
    if (node.type !== 'element') {
      acc.push(node);
      return acc;
    }

    const matched =
      (typeof findFn === 'string' && node.tagName === findFn) ||
      (tagSet !== null && tagSet.has(node.tagName)) ||
      (typeof findFn === 'function' && findFn(node));
    if (matched) return acc;

    acc.push({ ...node, children: node.children.reduce(removeDescendants(findFn), []) });
    return acc;
  };
}

/**
 * Predicate used to find nodes.
 */
export type FindFn = string | string[] | NodeFilterFn;

/**
 * Callback used to filter nodes.
 *
 * @param {Node} n - node to evaluate
 * @returns {boolean} true when the node matches the filter
 */
export type NodeFilterFn = (n: Node) => boolean;

/**
 * Reducer function for accumulating descendant nodes.
 *
 * @param {Node[]} acc - accumulated nodes
 * @param {Node} node - current node being processed
 * @returns {Node[]} updated accumulator
 */
export type DescendantsReducer = (acc: Node[], node: Node) => Node[];

/**
 * Transform an array of attribute to a map
 *
 * @param {Attribute[] | undefined} attributes
 * @returns {Map<string, string>}
 */
export function getAttributes(attributes?: Attribute[]): Map<string, string> {
  const response: Map<string, string> = new Map();
  if (!attributes) {
    return response;
  }
  for (const { key, value } of attributes) {
    response.set(key, value);
  }
  return response;
}

export type Node = TextNode | ElementNode | CommentNode;

export interface TextNode {
  type: 'text';
  content: string;
}

export interface ElementNode {
  type: 'element';
  children: Array<Node>;
  tagName: string;
  attributes?: Array<Attribute>;
}

export interface CommentNode {
  type: 'comment';
  content: string;
}

export interface Attribute {
  key: string;
  value: string;
}

/**
 * Small set helpers used when matching tag/class allow-lists.
 */
export class SetUtils {
  /**
   * Return the intersection of two sets.
   *
   * @param {Set<T>} a
   * @param {Set<T>} b
   * @returns {Set<T>}
   */
  static intersect<T>(a: Set<T>, b: Set<T>): Set<T> {
    return new Set([...a].filter((x) => b.has(x)));
  }

  /**
   * Return `true` when every member of `b` is also in `a`.
   *
   * @param {Set<T>} a
   * @param {Set<T>} b
   * @returns {boolean}
   */
  static subset<T>(a: Set<T>, b: Set<T>): boolean {
    for (const i of b) {
      if (!a.has(i)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Return `true` when both sets contain exactly the same members.
   *
   * @param {Set<T>} a
   * @param {Set<T>} b
   * @returns {boolean}
   */
  static equal<T>(a: Set<T>, b: Set<T>): boolean {
    if (a.size !== b.size) return false;
    return [...a].every((x) => b.has(x));
  }
}
