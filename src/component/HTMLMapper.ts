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
  type BlockquoteComponent,
  type TwitterComponent,
  type InstagramComponent,
  type TableComponent,
  type YoutubeComponent,
  type InfogramComponent,
} from './Component';

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
        text: `<p>${node.content}</p>`,
      } as TextComponent);
      return acc;
    }

    const { tagName } = node;
    const attributes = mapAttributes(node.attributes);
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
    if (tagName === 'blockquote' && attributes.get('data-instgrm-permalink')) {
      acc.push(HTMLMapper.processInstagram(node));
      return acc;
    }

    // This process twitter
    if (
      (tagName === 'blockquote' || tagName === 'a') &&
      classNames &&
      new Set(['twitter-tweet', 'twitter-timeline']).has(classNames)
    ) {
      acc.push(HTMLMapper.processTwitter(node));
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

    // This section validates the rest of the tags components
    switch (tagName) {
      case 'figure':
      case 'img':
        acc.push(HTMLMapper.toImage(node));
        return acc;

      case 'video':
        acc.push(HTMLMapper.processHostedVideo(node));
        return acc;

      /*case 'blockquote':
        acc.push(HTMLMapper.processBlockquote(node));
        return acc;*/

      case 'iframe':
        acc.push(HTMLMapper.processIframe(node));
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
    const warnings: string[] = [];
    const attributes = mapAttributes(node.attributes);

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

  static processHostedVideo(node: ElementNode): VideoComponent {
    const attributes = mapAttributes(node.attributes);

    const errors: Error[] = [];

    if (!attributes) {
      errors.push(new Error('Attribute in node not found'));
    }

    return {
      component: 'video',
      controlsenabled: 'on',
      autoplay: 'off',
      posterenabled: 'off',
      movietype: 'hosted',
      videourl: '',
      caption: '',
      credit: '',
      aspectRatio: 'auto',
      errors,
      warnings: [],
    };
  }

  static processTable(node: ElementNode): TableComponent {
    const errors: Error[] = [];

    if (!node.children || node.children.length === 0) {
      errors.push(new Error('No children found for table component'));
    }

    const thead: any = node.children[0];
    const tbody = node.children;
    let headings = [];
    const rows: Array<any> = [];

    if (thead.children) {
      headings = thead.children.map((value: any) => {
        return stringify([...value.children]);
      });
    }

    for (const line of tbody) {
      if (line) {
        const rowsAcc = {};
        // TODO pendiente este reduce
        // line.reduce((acc, value) => {
        //   if (value.children) {
        //     acc.push(this.getRowContent(value));
        //   }
        //   return acc;
        // }, []);

        rows.push(rowsAcc);
      }
    }

    return {
      component: 'table',
      headings,
      rows,
      errors,
      warnings: [],
    };
  }

  protected getRowContent(element: any) {
    const rows: Array<any> = [];
    let index = 0;
    for (const row of element.children) {
      const rowValue = this.getRowChild(row);
      if (rowValue !== '') {
        rows[index] = rowValue;
        index++;
      }
    }
    return rows;
  }

  protected getRowChild(row: any) {
    if (row.children) {
      const value = stringify([...row.children]);
      return value;
    } else {
      const value = row.content;
      return value.trim();
    }
  }

  /*static processBlockquote(
    node: ElementNode
  ): BlockquoteComponent | TwitterComponent | InstagramComponent {
    const errors: Error[] = [];
    const attributes = mapAttributes(node.attributes);
    let builtComponent: any;

    if (!attributes) {
      errors.push(new Error('No Attributes found in node'));
    }

    if (attributes.get('data-instgrm-permalink')) {
      builtComponent = HTMLMapper.processInstagram(node);
    } else if (attributes.get('class') === 'twitter-tweet') {
      builtComponent = HTMLMapper.processTwitter(node);
    } else {
      builtComponent = HTMLMapper.processBlockquoteElement(node);
    }
    return builtComponent;
  }*/

  static processInstagram(node: ElementNode): InstagramComponent {
    const errors: Error[] = [];
    const warnings: string[] = [];

    const attributes = mapAttributes(node.attributes);
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

  static processTwitter(node: ElementNode): TwitterComponent {
    const errors: Error[] = [];
    const warnings: string[] = [];
    let builtComponent: any;
    for (let index = 0; index < node.children.length; index++) {
      const tweet: any = node.children[index];
      if (tweet.tagName === 'a') {
        const tweetAttrs = mapAttributes(tweet.attributes);
        const tweetUrl = tweetAttrs.get('href') || '';

        const twitterRegex =
          /^https?:\/\/twitter\.com\/(?:#!\/)?(\w+)\/status(es)?\/(\d+)/;
        const twitterValues: Array<any> = twitterRegex.exec(tweetUrl) || [];

        //validamos si tiene los valores 1 y 3 para errors

        builtComponent = {
          height: '350',
          fixedheight: 'on',
          bleed: 'on',
          tweetid: twitterValues[3],
          accountid: twitterValues[1],
          component: 'twitter',
          errors,
          warnings,
        };
      }
    }

    return builtComponent;
  }

  static processBlockquoteElement(node: ElementNode): BlockquoteComponent {
    const errors: Error[] = [];
    const warnings: string[] = [];
    return {
      component: 'blockquote',
      text: `<p>${stringify([...node.children])}</p>`, // TODO remove tags??
      errors,
      warnings,
    };
  }

  static processIframe(
    node: ElementNode
  ): YoutubeComponent | InfogramComponent {
    const errors: Error[] = [];
    const attributes = mapAttributes(node.attributes);
    const id = attributes.get('id');

    const src = attributes.get('src') || '';
    if (!src || src.length === 0) {
      errors.push(new Error('Iframe URL not found.'));
    }

    let builtComponent: any; // TODO preguntar a chuck si esto puede quedar asi o hay que ponerle el type, cae en error

    const url = new URL(src);
    switch (url.origin) {
      case 'https://e.infogram.com':
        builtComponent = HTMLMapper.processInfogram(url);
        builtComponent.id = id;
        break;

      case 'https://www.youtube.com':
        builtComponent = HTMLMapper.processYoutube(url);
        builtComponent.id = id;
        break;
    }

    return builtComponent;
  }

  static processYoutube(url: URL): YoutubeComponent {
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

  static processInfogram(url: URL): InfogramComponent {
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

  // TODO Implement gallery mapper
  static toGallery(node: ElementNode): GalleryComponent {
    const errors: Error[] = [];
    const warnings: string[] = [];
    const attributes = mapAttributes(node.attributes);
    const images: Array<GalleryImage> = [];
    const role = attributes.get('role') === 'mosaic' ? 'mosaic' : 'default';
    const direction =
      attributes.get('data-direction') === 'vertical'
        ? 'vertical'
        : 'horizontal';
    return {
      component: 'gallery',
      role,
      images,
      direction,
      errors,
      warnings,
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
