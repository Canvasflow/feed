// eslint-disable-next-line @typescript-eslint/ban-ts-comment
/* @ts-expect-error */
import { parse, stringify } from 'himalaya';
import sanitizeHtml from 'sanitize-html';

import {
  isValidTextRole,
  type Component,
  type GalleryComponent,
  type GalleryImage,
  type ImageComponent,
  type TextComponent,
  type TextType,
  type VideoComponent,
  type TwitterComponent,
  type InstagramComponent,
  type YoutubeComponent,
  type InfogramComponent,
  type AudioComponent,
} from './Component';

const imageTags = new Set(['img', 'picture', 'figure']);

const textTags = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'footer',
  'blockquote',
];

const textTagsSet = new Set([...textTags]);

const textAllowedAttributes: Record<string, Array<string>> = {
  a: ['href', 'target', 'rel'],
};
for (const tag of textTags) {
  textAllowedAttributes[tag] = ['id', 'role', 'style', 'class'];
}

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
  static toComponents(content: string, params?: Params): Component[] {
    const nodes: Array<Node> = parse(content).filter(
      HTMLMapper.filterEmptyTextNode
    );

    return nodes
      .reduce(HTMLMapper.reduceComponents(params), [])
      .filter((i) => !!i);
  }

  static reduceComponents(
    params?: Params
  ): (acc: Array<Component>, node: Node) => Array<Component> {
    return (acc: Array<Component>, node: Node): Array<Component> => {
      if (node.type === 'text') {
        if (isEmpty(node.content)) {
          return acc;
        }

        acc.push({
          component: 'body',
          errors: [],
          warnings: [],
          text: `<p>${node.content}</p>`,
        } as TextComponent);
        return acc;
      }

      const { tagName } = node;
      const attributes = getAttributes(node.attributes);
      const role = attributes.get('role');
      const classNames = attributes.get('class');

      const textTagMapping: Record<string, TextType> = {
        h1: 'headline',
        h2: 'title',
        h3: 'subtitle',
        h4: 'intro',
        h5: 'body',
        h6: 'body',
        footer: 'footer',
        blockquote: 'blockquote',
        p: 'body',
        ol: 'body',
        ul: 'body',
      };

      // This process instagram
      if (
        tagName === 'blockquote' &&
        attributes.get('data-instgrm-permalink')
      ) {
        acc.push(HTMLMapper.toInstagram(node));
        return acc;
      }

      // This process twitter
      if (
        (tagName === 'blockquote' || tagName === 'a') &&
        classNames &&
        new Set(['twitter-tweet', 'twitter-timeline']).has(classNames)
      ) {
        acc.push(HTMLMapper.toTwitter(node));
        return acc;
      }

      // Handle mapping send by the user
      const textType = getMappingComponent(node, params?.mappings);
      if (textType) {
        acc.push(HTMLMapper.toText(node, textType));
        return acc;
      }

      // This section validates text tags
      for (const tag in textTagMapping) {
        if (tagName === tag) {
          acc.push(HTMLMapper.toText(node, textTagMapping[tag]));
          return acc;
        }
      }

      if (role === 'gallery' || role === 'mosaic') {
        acc.push(HTMLMapper.toGallery(node));
        return acc;
      }

      // Check if the tag belongs to an image tag
      if (imageTags.has(tagName)) {
        acc.push(HTMLMapper.toImage(node));
        return acc;
      }

      // This section validates the rest of the tags components
      let component: Component | undefined;
      switch (tagName) {
        case 'video':
          acc.push(HTMLMapper.toVideo(node));
          return acc;
        case 'audio':
          acc.push(HTMLMapper.toAudio(node));
          return acc;

        case 'iframe':
          component = HTMLMapper.fromIframe(node);
          if (component) {
            acc.push(component);
          }
          return acc;

        default:
          break;
      }

      if (node.children) {
        return node.children.reduce(HTMLMapper.reduceComponents(params), acc);
      }
      return acc;
    };
  }

  static toText(node: ElementNode, component: TextType): TextComponent {
    const html = stringify([node]);
    const warnings: string[] = [];
    const attributes = getAttributes(node.attributes);

    const text = sanitizeHtml(html, {
      allowedTags: textAllowedTags,
      allowedAttributes: textAllowedAttributes,
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
      errors: [],
      warnings,
      text,
    };
  }

  static toVideo(node: ElementNode): VideoComponent {
    const errors: Error[] = [];
    const warnings: string[] = [];
    const attributes = getAttributes(node.attributes);
    let url = '';
    const controls = attributes.has('controls');
    const autoplay = attributes.has('autoplay');
    const poster = attributes.get('poster');
    const muted = attributes.has('muted');
    const loop = attributes.has('loop');
    const src = attributes.get('src');
    if (src) {
      url = src;
    }

    const sources = node.children
      .filter((n) => n.type === 'element' && n.tagName === 'source')
      .map((n: Node) => {
        if (n.type !== 'element') return '';
        const attr = getAttributes(n.attributes);
        return attr.get('src') || '';
      })
      .filter((i) => !!i);

    if (sources.length) {
      url = sources.shift() as string;
    }

    if (!url) {
      errors.push(new Error('video source is required'));
    }

    return {
      component: 'video',
      url,
      controls,
      autoplay,
      muted,
      loop,
      poster,
      movietype: 'hosted',
      errors,
      warnings,
    };
  }

  static toAudio(node: ElementNode): AudioComponent {
    const errors: Error[] = [];
    const warnings: string[] = [];
    const attributes = getAttributes(node.attributes);
    let url = '';
    const controls = attributes.has('controls');
    const autoplay = attributes.has('autoplay');
    const muted = attributes.has('muted');
    const loop = attributes.has('loop');
    const src = attributes.get('src');
    if (src) {
      url = src;
    }

    const sources = node.children
      .filter((n) => n.type === 'element' && n.tagName === 'source')
      .map((n: Node) => {
        if (n.type !== 'element') return '';
        const attr = getAttributes(n.attributes);
        return attr.get('src') || '';
      })
      .filter((i) => !!i);

    if (sources.length) {
      url = sources.shift() as string;
    }

    if (!url) {
      errors.push(new Error('audio source is required'));
    }

    return {
      component: 'audio',
      url,
      controls,
      autoplay,
      muted,
      loop,
      errors,
      warnings,
    };
  }

  static toInstagram(node: ElementNode): InstagramComponent {
    const errors: Error[] = [];
    const warnings: string[] = [];

    const attributes = getAttributes(node.attributes);
    const IG = attributes.get('data-instgrm-permalink') || '';
    const urlInfo = new URL(IG);
    const splitUrl = urlInfo.pathname.split('/');
    const type = splitUrl[1] ? splitUrl[1].toLowerCase() : 'post';

    if (!splitUrl[1]) {
      errors.push(new Error('Url do not contain Type '));
    }

    if (!splitUrl[2]) {
      errors.push(new Error('Url do not contain ID '));
    }

    const component: InstagramComponent = {
      id: splitUrl[2],
      component: 'instagram',
      type: 'post',
      errors,
      warnings,
    };

    switch (type) {
      case 'p':
        component.type = 'post';
        break;
      case 'reel':
      case 'tv':
        component.type = type;
        break;
    }
    return component;
  }

  static toTwitter(node: ElementNode): TwitterComponent {
    const errors: Error[] = [];
    const warnings: string[] = [];
    let tweetNode: ElementNode | undefined;
    const params: { id?: string; account?: string } = {};

    for (const child of node.children) {
      if (child.type === 'text') continue;
      if (child.tagName === 'a') {
        tweetNode = child;
        break;
      }
    }
    if (tweetNode) {
      const attributes = getAttributes(tweetNode.attributes);
      const tweetUrl = attributes.get('href') || '';

      const twitterRegex =
        /^https?:\/\/twitter\.com\/(?:#!\/)?(\w+)\/status(es)?\/(\d+)/;
      const values: Array<string> = twitterRegex.exec(tweetUrl) || [];
      params.id = values[3];
      params.account = values[1];
    }

    //validamos si tiene los valores 1 y 3 para errors

    return {
      height: '350',
      fixedheight: 'on',
      bleed: 'on',
      params,
      component: 'twitter',
      errors,
      warnings,
    };
  }

  static fromIframe(
    node: ElementNode
  ): YoutubeComponent | InfogramComponent | undefined {
    const attributes = getAttributes(node.attributes);
    const id = attributes.get('id');

    const src = attributes.get('src') || '';

    // If the iframe do not have a src we just ignore it
    if (!src || src.length === 0) {
      return;
    }

    let builtComponent;

    const url = new URL(src);
    switch (url.origin) {
      case 'https://e.infogram.com':
        builtComponent = HTMLMapper.toInfogram(url);
        builtComponent.id = id;
        break;

      case 'https://www.youtube.com':
        builtComponent = HTMLMapper.toYoutube(url);
        builtComponent.id = id;
        break;
    }

    return builtComponent;
  }

  static toYoutube(url: URL): YoutubeComponent {
    const errors: Error[] = [];
    const warnings: string[] = [];

    const regExp =
      /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;

    if (!regExp.test(url.href)) {
      errors.push(new Error('Youtube video URL not properly formatted.'));
    }

    const id = url.pathname.split('/').pop() as string;

    if (id.length !== 11) {
      errors.push(new Error('Youtube video ID length should be 11'));
    }
    return {
      component: 'video',
      vidtype: 'youtube',
      params: {
        id,
      },
      errors,
      warnings,
    };
  }

  static toInfogram(url: URL): InfogramComponent {
    const errors: Error[] = [];
    const warnings: string[] = [];

    return {
      component: 'infogram',
      params: {
        id: url.pathname.replace('/', ''),
        parentUrl: url.searchParams.get('parent_url') || '', // TODO validar si searchparams puede ser not null
        src: 'embed',
      },
      errors,
      warnings,
    };
  }

  static toGallery(node: ElementNode): GalleryComponent {
    const errors: Error[] = [];
    const warnings: string[] = [];
    const attributes = getAttributes(node.attributes);
    const role = attributes.get('role') === 'mosaic' ? 'mosaic' : 'default';
    const direction =
      attributes.get('data-direction') === 'vertical'
        ? 'vertical'
        : 'horizontal';

    const images: Array<GalleryImage> = node.children
      // Validate the only image tag are supported
      .filter((n) => n.type === 'element' && imageTags.has(n.tagName))
      // Map the node to an image component
      .map((n: Node): ImageComponent => {
        return HTMLMapper.toImage(n as ElementNode);
      })
      // If some is invalid and return undefined we remove them
      .filter((i) => !!i)
      // Map Valid image components to gallery items
      .map((imageComponent: ImageComponent): GalleryImage => {
        return {
          imageurl: imageComponent.imageurl,
          caption: imageComponent.caption,
        };
      });

    const { caption } = HTMLMapper.fromFigcaption(node);

    return {
      component: 'gallery',
      role,
      images,
      direction,
      errors,
      warnings,
      caption,
    };
  }

  // Aqui hay que procesar dos posibles casos, utilizando figure o img directo
  static toImage(node: ElementNode): ImageComponent {
    const { tagName } = node;
    const attributes = getAttributes(node.attributes);
    const id = attributes.get('id');

    if (tagName === 'figure') {
      const imageComponent: ImageComponent = HTMLMapper.fromFigure(node);
      imageComponent.id = id;
      return imageComponent;
    }

    if (tagName === 'picture') {
      const imageComponent: ImageComponent = HTMLMapper.fromPicture(node);
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
    let credit: string | undefined;

    // Handle image
    const imageNodes = node.children.filter(
      (n) => n.type === 'element' && n.tagName === 'img'
    );
    if (imageNodes.length > 1) {
      warnings.push('Only one img tag per figure tag is valid');
    }
    for (const n of imageNodes) {
      if (n.type !== 'element') continue;
      const attributes = getAttributes(n.attributes);
      const src = attributes.get('src');
      if (!src) {
        errors.push(new Error('src attribute is missing'));
      }

      imageurl = src || '';
      break;
    }

    if (!imageurl) {
      const pictureNodes = node.children.filter(
        (n) => n.type === 'element' && n.tagName === 'picture'
      );

      if (pictureNodes.length > 1) {
        warnings.push('Only one picture tag per figure tag is valid');
      }

      for (const n of pictureNodes) {
        if (n.type !== 'element') continue;
        const picture: ImageComponent = HTMLMapper.fromPicture(n);
        imageurl = picture.imageurl;
        break;
      }
    }

    // Handle caption
    if (node.type === 'element') {
      const r = HTMLMapper.fromFigcaption(node);
      if (r.credit) {
        credit = r.credit;
      }

      if (r.caption) {
        caption = r.caption;
      }
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
      credit,
    };
  }

  static fromPicture(node: ElementNode): ImageComponent {
    let imageurl = '';
    const errors: Error[] = [];
    const warnings: string[] = [];

    // Handle image
    const imageNodes = node.children.filter(
      (n) => n.type === 'element' && n.tagName === 'img'
    );
    if (imageNodes.length > 1) {
      warnings.push('Only one img tag per picture tag is valid');
    }

    for (const n of imageNodes) {
      if (n.type !== 'element') continue;
      const attributes = getAttributes(n.attributes);
      const src = attributes.get('src');
      if (!src) {
        errors.push(new Error('src attribute is missing'));
      }

      imageurl = src || '';
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
    };
  }

  static filterEmptyTextNode(node: Node) {
    if (node.type !== 'text') return true;

    const { content } = node;
    if (!content) return false;

    return !isEmpty(content);
  }

  static fromFigcaption(node: ElementNode): FigcaptionResponse {
    let caption: string | undefined;
    let credit: string | undefined;
    const figcaptionNodes = node.children.filter(
      (n) => n.type === 'element' && n.tagName === 'figcaption'
    );
    for (const n of figcaptionNodes) {
      credit = HTMLMapper.getCredit(n as ElementNode);
      const html = stringify([n]);
      caption = sanitizeHtml(html, {
        allowedTags: ['span', 'b', 'strong', 'em', 'i'],
      });
      break;
    }

    return {
      caption,
      credit,
    };
  }

  static getCredit(node: ElementNode): string | undefined {
    let credit: string | undefined;

    node.children = node.children.reduce((acc: Array<Node>, n: Node) => {
      if (n.type === 'element') {
        const attributes = getAttributes(n.attributes);
        const role = attributes.get('role');
        if (n.tagName === 'small' || role === 'credit') {
          if (credit) {
            return acc;
          }
          credit = sanitizeHtml(stringify([n]), {
            allowedTags: ['span', 'b', 'strong', 'em', 'i'],
          });
          return acc;
        }

        acc.push(n);
        return acc;
      }

      const content = n.content
        .replace(/[\r\n\t]/g, '')
        .replace(/\s\s+/g, ' ')
        .trim();

      if (content.length) {
        n.content = content;
        acc.push(n);
      }

      return acc;
    }, []);
    return credit;
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

interface FigcaptionResponse {
  caption?: string;
  credit?: string;
}

function getAttributes(attributes?: Array<Attribute>): Map<string, string> {
  const response: Map<string, string> = new Map();
  if (!attributes) {
    return response;
  }
  for (const { key, value } of attributes) {
    response.set(key, value);
  }
  return response;
}

function isEmpty(content: string) {
  return content.replace(/[\r\n\t]/g, '').trim().length === 0;
}

function getMappingComponent(
  node: ElementNode,
  mappings?: Array<Mapping>
): TextType | undefined {
  const { tagName } = node;
  if (!mappings || !mappings.length) return;
  if (!textTagsSet.has(tagName)) return;

  for (const mapping of mappings) {
    const { component, match, filters } = mapping;
    if (match === 'any') {
      if (filterAnyMapping(node, filters)) {
        return component;
      }
    }
  }
}

// If at least one filter matches then is valid
function filterAnyMapping(node: ElementNode, filters: Filter[]): boolean {
  const { tagName } = node;
  const attributes = getAttributes(node.attributes);
  for (const filter of filters) {
    if (filter.type === 'tag') {
      if (new Set([...filter.items]).has(tagName)) return true;
    }
    if (filter.type === 'class') {
      const classNames = attributes.get('class');

      // It doesn't have a class in the element so is going to ignore it
      if (!classNames) continue;
      const itemsSet = new Set([...filter.items]);
      const classesNamesSet: Set<string> = new Set([...classNames.split(' ')]);
      switch (filter.match) {
        case 'equal':
          return SetUtils.equal(classesNamesSet, itemsSet);
        case 'all':
          return SetUtils.subset(classesNamesSet, itemsSet);
      }
      return SetUtils.intersect(classesNamesSet, itemsSet).size > 0;
    }
  }
  return false;
}

export type MatchType = 'any' | 'all';

export interface Params {
  mappings: Mapping[];
}

export interface Mapping {
  name?: string;
  component: TextType;
  match: MatchType;
  filters: Filter[];
}

export type Filter = TagFilter | ClassFilter;

interface TagFilter {
  type: 'tag';
  items: string[];
}

interface ClassFilter {
  type: 'class';
  match: MatchType | 'equal';
  items: string[];
}

export class SetUtils {
  static intersect<T>(a: Set<T>, b: Set<T>): Set<T> {
    return new Set([...a].filter((x) => b.has(x)));
  }

  static subset<T>(a: Set<T>, b: Set<T>): boolean {
    for (const i of [...b]) {
      if (!a.has(i)) {
        return false;
      }
    }

    return true;
  }

  static equal<T>(a: Set<T>, b: Set<T>): boolean {
    if (a.size !== b.size) return false;
    return [...a].every((x) => b.has(x));
  }
}
