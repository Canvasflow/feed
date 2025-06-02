// eslint-disable-next-line @typescript-eslint/ban-ts-comment
/* @ts-expect-error */
import { parse, stringify } from 'himalaya';
import sanitizeHtml from 'sanitize-html';

import {
  isValidTextRole,
  type Component,
  type ImageComponent,
  type TextComponent,
  type TextType,
} from './Component';

const textAllowedTags = [
  ...new Set([
    'strong',
    'b',
    'em',
    'i',
    'a',
    'ul',
    'ol',
    'li',
    'br',
    'sup',
    'sub',
    'del',
    's',
    'p',
  ]),
];

export class HTMLMapper {
  static toComponents(content: string): Component[] {
    const nodes: Array<Node> = parse(content).filter(
      HTMLMapper.filterEmptyTextNode
    );

    return nodes.reduce(HTMLMapper.reduceComponents, []);
  }
  static reduceComponents(acc: Array<Component>, node: Node): Array<Component> {
    if (node.type === 'text') {
      acc.push({
        component: 'body',
        errors: [],
        warnings: [],
        text: node.content,
      } as TextComponent);
      return acc;
    }

    const { tagName } = node;
    switch (tagName) {
      case 'h1':
        acc.push(HTMLMapper.toText(node, 'headline'));
        return acc;
      case 'h2':
        acc.push(HTMLMapper.toText(node, 'title'));
        return acc;
      case 'h3':
        acc.push(HTMLMapper.toText(node, 'subtitle'));
        return acc;
      case 'h4':
        acc.push(HTMLMapper.toText(node, 'intro'));
        return acc;
      case 'footer':
        acc.push(HTMLMapper.toText(node, 'footer'));
        return acc;
      case 'blockquote':
        acc.push(HTMLMapper.toText(node, 'blockquote'));
        return acc;
      case 'p':
        acc.push(HTMLMapper.toText(node, 'body'));
        return acc;
      case 'figure':
      case 'img':
        acc.push(HTMLMapper.toImage(node));
        return acc;
      default:
        break;
    }

    if (node.children) {
      return node.children.reduce(HTMLMapper.reduceComponents, acc);
    }
    return acc;
  }

  static toText(node: ElementNode, component: TextType): TextComponent {
    const html = stringify([node]);
    const attributes = mapAttributes(node.attributes);
    const text = sanitizeHtml(html, {
      allowedTags: textAllowedTags,
    });
    const id = attributes.get('id');
    const role = attributes.get('role');
    if (role && isValidTextRole(role)) {
      component = role as TextType;
    }
    return {
      id,
      component,
      errors: [],
      warnings: [],
      text,
    };
  }

  // Aqui hay que procesar dos posibles casos, utilizando figure o img directo
  static toImage(node: ElementNode): ImageComponent {
    const { tagName } = node;
    const attributes = mapAttributes(node.attributes);
    const id = attributes.get('id');

    if (tagName === 'figure') {
      const imageComponent: ImageComponent = HTMLMapper.fromFigure(node);
      imageComponent.id = id;
      return imageComponent;
    }

    const errors: Error[] = [];
    const warnings: string[] = [];
    let imageurl = '';

    if (!attributes) {
      errors.push(new Error('Attribute in node not found'));
    }

    const src = attributes.get('src');
    if (src) {
      imageurl = src;
    }
    const width: string | undefined = attributes.get('width');
    const height: string | undefined = attributes.get('height');
    const caption: string | undefined = attributes.get('alt');

    return {
      id,
      component: 'image',
      imageurl,
      caption,
      width: width ? parseInt(`${width}`, 10) : undefined,
      height: height ? parseInt(`${height}`, 10) : undefined,
      errors,
      warnings,
    };
  }

  static fromFigure(node: ElementNode): ImageComponent {
    let imageurl = '';
    const errors: Error[] = [];
    const warnings: string[] = [];
    let caption: string | undefined;

    // Handle image
    const imageNodes = node.children.filter(
      (n) => n.type === 'element' && n.tagName === 'img'
    );
    if (imageNodes.length > 1) {
      warnings.push('Only one img tag per figure tag is valid');
    }
    for (const n of imageNodes) {
      if (n.type !== 'element') continue;
      const attributes = mapAttributes(n.attributes);
      const src = attributes.get('src');
      if (!src) {
        errors.push(new Error('src attribute is missing'));
      }

      imageurl = src || '';
      break;
    }

    // Handle caption
    const figcaptionNodes = node.children.filter(
      (n) => n.type === 'element' && n.tagName === 'figcaption'
    );
    if (figcaptionNodes.length > 1) {
      warnings.push('Only one figcaption per figure tag is valid');
    }
    for (const n of figcaptionNodes) {
      const html = stringify([n]);
      caption = sanitizeHtml(html, {
        allowedTags: ['span', 'b', 'strong', 'em', 'i'],
      });
      break;
    }

    if (!imageurl) {
      errors.push(new Error('imageurl is empty'));
    }

    return {
      component: 'image',
      imageurl,
      errors,
      warnings,
      caption,
    };
  }

  static filterEmptyTextNode(node: Node) {
    if (node.type !== 'text') return true;

    const { content } = node;
    if (!content) return false;

    return content.trim().length > 0;
  }
}

export type Node = TextNode | ElementNode;

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

interface Attribute {
  key: string;
  value: string;
}

function mapAttributes(attributes?: Array<Attribute>): Map<string, string> {
  const response: Map<string, string> = new Map();
  if (!attributes) {
    return response;
  }
  for (const { key, value } of attributes) {
    response.set(key, value);
  }
  return response;
}
