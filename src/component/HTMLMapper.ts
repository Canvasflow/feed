// eslint-disable-next-line @typescript-eslint/ban-ts-comment
/* @ts-expect-error */
import { parse, stringify } from 'himalaya';
import { parseHTML } from 'linkedom';
import sanitizeHtml from 'sanitize-html';
import { z } from 'zod';

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
  type TikTokComponent,
  type ButtonComponent,
  type RecipeComponent,
  type HTMLTableComponent,
} from './Component';

const imageTags = new Set(['img', 'picture']);

export const textTags = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'footer',
  'blockquote',
  'ol',
  'ul',
  'a',
];

export const textTagsSet = new Set([...textTags]);
export const mappingTagsSet: Set<string> = new Set([...textTags, 'recipe']);

const textAllowedAttributes: Record<string, Array<string>> = {
  a: ['href', 'target', 'rel'],
};

for (const tag of textTags) {
  let attributes = ['id', 'role', 'style', 'class'];
  const allowedAttributes = textAllowedAttributes[tag] || [];
  if (allowedAttributes.length) {
    attributes = attributes.concat(allowedAttributes);
  }
  textAllowedAttributes[tag] = attributes;
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
    'span',
    'small',
  ]),
];

const allowedCaptionTags = ['b', 'strong', 'em', 'i'];

const htmlTableAllowedTags = [
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'em',
  'i',
  'b',
  'strong',
  'sup',
  'sub',
  'span',
  'br',
  'small',
  's',
  'span',
  'a',
];

export class HTMLMapper {
  static toComponents(content: string, params?: Params): Component[] {
    content = content.replace(/(\r\n|\n|\r)/gm, '');
    const tags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    for (const tag of tags) {
      content = splitParagraphImages(content, tag);
    }

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
      const component = HTMLMapper.fromNode(node, params);

      if (component) {
        if (Array.isArray(component)) {
          for (const c of component) {
            if (c) {
              acc.push(c);
            }
          }
        } else {
          acc.push(component);
        }
      }
      return acc;
    };
  }

  static fromNode(
    node: Node,
    params?: Params
  ): Component | Array<Component> | null {
    if (node.type === 'text') {
      if (isEmpty(node.content)) {
        return null;
      }

      return {
        component: 'body',
        errors: [],
        warnings: [],
        text: `<p>${node.content}</p>`,
      } as TextComponent;
    }

    const { tagName } = node;
    const attributes = getAttributes(node.attributes);
    const role = attributes.get('role');
    const classNames = attributes.get('class');

    if (attributes.get('data-cf-ignore') !== undefined) {
      return null;
    }

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

    if (tagName === 'style') {
      return null;
    }

    // This is a hack for forbes
    if (tagName === 'a' && HTMLMapper.hasButton(node)) {
      return HTMLMapper.toAnchorButton(node);
    }

    // This process instagram
    if (tagName === 'blockquote' && attributes.get('data-instgrm-permalink')) {
      return HTMLMapper.toInstagram(node);
    }

    // This process html table
    if (tagName === 'table') {
      return HTMLMapper.toHTMLTable(node);
    }

    // This process html table inside figure
    if (tagName === 'figure' && HTMLMapper.hasTable(node)) {
      for (const child of node.children) {
        if (child.type === 'element' && child.tagName === 'table') {
          return HTMLMapper.toHTMLTable(child);
        }
      }
      return null;
    }

    if (
      tagName === 'blockquote' &&
      classNames &&
      classNames.includes('tiktok-embed')
    ) {
      return HTMLMapper.toTikTok(node);
    }

    // This process button component
    if (tagName === 'button' || (tagName === 'a' && role === 'button')) {
      return HTMLMapper.toButton(node);
    }

    // This process twitter
    if (
      (tagName === 'blockquote' || tagName === 'a') &&
      classNames &&
      new Set(['twitter-tweet', 'twitter-timeline']).has(classNames)
    ) {
      return HTMLMapper.toTwitter(node);
    }

    if (role === 'gallery' || role === 'mosaic') {
      return HTMLMapper.toGallery(node);
    }

    if (tagName === 'figure' && HTMLMapper.hasCaption(node)) {
      return HTMLMapper.fromFigure(node);
    }

    // Check if the tag belongs to an image tag
    if (imageTags.has(tagName)) {
      return HTMLMapper.toImage(node);
    }

    // This section validates the rest of the tags components
    switch (tagName) {
      case 'video':
        return HTMLMapper.toVideo(node);
      case 'audio':
        return HTMLMapper.toAudio(node);
      case 'iframe':
        return HTMLMapper.fromIframe(node);
      default:
        break;
    }

    // Handle mapping send by the user
    const mappedComponent = getMappingComponent(node, params?.mappings);
    if (mappedComponent) {
      if (mappedComponent === 'recipe') {
        return HTMLMapper.toRecipe(node, params);
      }
      return HTMLMapper.toText(node, mappedComponent);
    }

    // This section validates text tags
    for (const tag in textTagMapping) {
      if (tagName === tag) {
        return HTMLMapper.toText(node, textTagMapping[tag]);
      }
    }

    if (node.children) {
      const components: Array<Component> = [];
      for (const n of node.children) {
        const c = HTMLMapper.fromNode(n, params);
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

  static toRecipe(node: ElementNode, params?: Params): RecipeComponent {
    const warnings: string[] = [];
    const attributes = getAttributes(node.attributes);
    const id = attributes.get('id');

    const components: Array<Component> = node.children.length
      ? HTMLMapper.toComponents(stringify(node.children), params)
      : [];
    return {
      id,
      component: 'recipe',
      components,
      errors: [],
      warnings,
    };
  }

  static toText(node: ElementNode, component: TextType): TextComponent {
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
      errors: [],
      warnings,
      text,
    };
  }

  static toButton(node: ElementNode): ButtonComponent {
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
      const anchorNodes = node.children.filter(
        (n) => n.type === 'element' && n.tagName === 'a'
      );
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
    };
  }

  static toAnchorButton(node: ElementNode): ButtonComponent {
    const errors: string[] = [];
    const warnings: string[] = [];
    const attributes = getAttributes(node.attributes);
    let text: string | undefined;
    const link: string | undefined = attributes.get('href');
    const buttonsNode = node.children.filter(
      (n) => n.type === 'element' && n.tagName === 'button'
    );

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
    };
  }

  static toVideo(node: ElementNode): VideoComponent {
    const errors: string[] = [];
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
      errors.push('Video source is required');
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
    const errors: string[] = [];
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
      errors.push('Audio source is required');
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
    const errors: string[] = [];
    const warnings: string[] = [];

    const attributes = getAttributes(node.attributes);
    const IG = attributes.get('data-instgrm-permalink') || '';
    const urlInfo = new URL(IG);
    const splitUrl = urlInfo.pathname.split('/');
    const type = splitUrl[1] ? splitUrl[1].toLowerCase() : 'post';

    if (!splitUrl[1]) {
      errors.push('URL does not contain a type.');
    }

    if (!splitUrl[2]) {
      errors.push('URL does not contain an ID.');
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

  static toHTMLTable(node: ElementNode): HTMLTableComponent {
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
    };

    return component;
  }

  static toTikTok(node: ElementNode): TikTokComponent {
    const errors: string[] = [];
    const warnings: string[] = [];
    const attributes = getAttributes(node.attributes);
    const params = {
      username: '',
      id: '',
    };
    const cite = attributes.get('cite') || '';
    if (!cite) {
      errors.push('cite attribute is required');
    }

    const match = cite.match(
      /^https:\/\/www\.tiktok\.com\/(@[\w.\-_]+)\/video\/(\d+)(?:[/?].*)?$/
    );
    if (match) {
      params.username = match[1] || '';
      params.id = match[2] || '';
    } else {
      errors.push('Invalid TikTok video URL format.');
    }
    const component: TikTokComponent = {
      component: 'video',
      vidtype: 'tiktok',
      params,
      errors,
      warnings,
    };
    return component;
  }

  static toTwitter(node: ElementNode): TwitterComponent {
    const errors: string[] = [];
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
  ): YoutubeComponent | InfogramComponent | null {
    const attributes = getAttributes(node.attributes);
    const id = attributes.get('id');

    const src = attributes.get('src') || '';

    // If the iframe do not have a src we just ignore it
    if (!src || src.length === 0) {
      return null;
    }

    let builtComponent;

    const url = new URL(src);
    switch (url.origin) {
      case 'https://e.infogram.com':
        builtComponent = HTMLMapper.toInfogram(url);
        builtComponent.id = id;
        return builtComponent;
      case 'https://www.youtube.com':
        builtComponent = HTMLMapper.toYoutube(url);
        builtComponent.id = id;
        return builtComponent;
    }

    return null;
  }

  static toYoutube(url: URL): YoutubeComponent {
    const errors: string[] = [];
    const warnings: string[] = [];

    const regExp =
      /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;

    if (!regExp.test(url.href)) {
      errors.push('Invalid Youtube video URL format.');
    }

    const id = url.pathname.split('/').pop() as string;

    if (!/^[a-zA-Z0-9_-]{11}$/.test(id)) {
      errors.push('Invalid YouTube video ID.');
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
    const errors: string[] = [];
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

  static processTextLinks(html: string, link: string = '/'): string {
    if (link && !link.endsWith('/')) {
      link += '/';
    }

    const allowedTags = textAllowedTags;
    const allowedAttributes = textAllowedAttributes;
    const isRelative = (url: string) => !URL.canParse(url);
    return sanitizeHtml(html, {
      allowedTags,
      allowedAttributes,
      transformTags: {
        a: function (tagName, attribs) {
          if (!attribs) {
            return {
              tagName,
              attribs: {},
            };
          }

          let href = attribs.href;
          if (!href) {
            return {
              tagName,
              attribs,
            };
          }

          if (removeProtocol(href).includes(':')) {
            const port = getPortFromUrl(href);

            if (port === null) {
              attribs.href = '/';
              return {
                tagName,
                attribs,
              };
            }
          }

          if (href.startsWith('//') || href.startsWith('./')) {
            href = href.slice(2);
          }
          if (isRelative(href)) {
            attribs.href = link + href;
          }

          return {
            tagName,
            attribs,
          };
        },
      },
    });
  }

  static toGallery(node: ElementNode): GalleryComponent {
    const errors: string[] = [];
    const warnings: string[] = [];
    const attributes = getAttributes(node.attributes);
    const role = attributes.get('role') === 'mosaic' ? 'mosaic' : 'default';
    const direction =
      attributes.get('data-direction') === 'vertical'
        ? 'vertical'
        : 'horizontal';

    const galleryTags = new Set([...imageTags, 'figure']);
    const images: Array<GalleryImage> = node.children
      // Validate the only image tag are supported
      .filter((n) => n.type === 'element' && galleryTags.has(n.tagName))
      // Map the node to an image component
      .map((n: Node): ImageComponent => {
        return HTMLMapper.toImage(n as ElementNode);
      })
      // If some is invalid and return undefined we remove them
      .filter((i) => !!i)
      // Map Valid image components to gallery items
      .map((imageComponent: ImageComponent): GalleryImage => {
        const { link, alt, credit, width, height, imageurl, caption } =
          imageComponent;
        return {
          imageurl,
          caption,
          link,
          alt,
          credit,
          width,
          height,
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
      const imageComponent: ImageComponent = HTMLMapper.fromFigure(
        node
      ) as ImageComponent;
      imageComponent.id = id;
      return imageComponent;
    }

    if (tagName === 'picture') {
      const imageComponent: ImageComponent = HTMLMapper.fromPicture(node);
      imageComponent.id = id;
      return imageComponent;
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    let imageurl = '';

    if (!attributes) {
      errors.push('No attributes found on image node');
    }

    const src = attributes.get('src');
    if (src) {
      imageurl = src;
    }
    const width: string | undefined = attributes.get('width');
    const height: string | undefined = attributes.get('height');
    const alt: string | undefined = attributes.get('alt');

    return {
      id,
      component: 'image',
      imageurl,
      alt,
      width: width ? parseInt(`${width}`, 10) : undefined,
      height: height ? parseInt(`${height}`, 10) : undefined,
      errors,
      warnings,
    };
  }

  static hasCaption(node: ElementNode): boolean {
    for (const child of node.children) {
      if (child.type === 'element' && child.tagName === 'figcaption') {
        return true;
      }
    }

    return false;
  }

  static hasTable(node: ElementNode): boolean {
    for (const child of node.children) {
      if (child.type === 'element' && child.tagName === 'table') {
        return true;
      }
    }

    return false;
  }

  static hasButton(node: ElementNode): boolean {
    for (const child of node.children) {
      if (child.type === 'element' && child.tagName === 'button') {
        return true;
      }
    }
    return false;
  }

  static fromFigure(
    node: ElementNode
  ):
    | ImageComponent
    | VideoComponent
    | AudioComponent
    | YoutubeComponent
    | null {
    let imageurl = '';
    const errors: string[] = [];
    const warnings: string[] = [];
    let caption: string | undefined;
    let credit: string | undefined;
    let link: string | undefined;
    let alt: string | undefined;
    let width: number | undefined;
    let height: number | undefined;

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

    const components = node.children
      .map((n: Node) => HTMLMapper.fromNode(n))
      .flat()
      .filter(
        (c) =>
          c &&
          !Array.isArray(c) &&
          (c.component === 'video' || c.component === 'audio')
      );
    if (components.length) {
      const component: VideoComponent | AudioComponent = components.pop() as
        | VideoComponent
        | AudioComponent;
      component.caption = caption;
      component.credit = credit;
      return component;
    }

    const linkNodes = node.children.filter(
      (n) => n.type === 'element' && n.tagName === 'a'
    );
    if (linkNodes.length > 0) {
      const imageLink = HTMLMapper.getImageLink(linkNodes[0] as ElementNode);
      if (imageLink.errors.length > 0) {
        errors.push(...imageLink.errors);
      }
      if (imageLink.warnings.length > 0) {
        warnings.push(...imageLink.warnings);
      }
      imageurl = imageLink.imageurl;
      link = imageLink.link;
      if (imageLink.alt) {
        alt = imageLink.alt;
      }

      if (imageLink.width) {
        width = imageLink.width;
      }

      if (imageLink.height) {
        height = imageLink.height;
      }
    } else {
      // Handle image
      const imageNodes = node.children.filter(
        (n) => n.type === 'element' && n.tagName === 'img'
      );
      if (imageNodes.length > 1) {
        warnings.push('Only one <img> tag is allowed per <figure> element');
      }
      for (const n of imageNodes) {
        if (n.type !== 'element') continue;
        const attributes = getAttributes(n.attributes);
        const src = attributes.get('src');
        const widthAttr = attributes.get('width');
        const heightAttr = attributes.get('height');
        if (widthAttr) {
          const w = parseInt(`${widthAttr}`, 10);
          if (!Number.isNaN(w)) {
            width = w;
          }
        }
        if (heightAttr) {
          const h = parseInt(heightAttr, 10);
          if (!Number.isNaN(h)) {
            height = h;
          }
        }
        alt = attributes.get('alt');
        if (!src) {
          errors.push('Image src attribute is missing');
        }

        imageurl = src || '';
        break;
      }
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
        alt = picture.alt;
        link = picture.link;
        break;
      }
    }

    if (!imageurl) {
      errors.push('imageurl is empty');
    }

    return {
      component: 'image',
      imageurl,
      alt,
      link,
      width,
      height,
      errors,
      warnings,
      caption: caption
        ? sanitizeHtml(caption, {
            allowedTags: [...allowedCaptionTags],
          })
        : undefined,
      credit: credit
        ? sanitizeHtml(credit, {
            allowedTags: [...allowedCaptionTags],
          })
        : undefined,
    };
  }

  static fromPicture(node: ElementNode): ImageComponent {
    let imageurl = '';
    let alt: string | undefined;
    const errors: string[] = [];
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
        errors.push('Image src attribute is missing');
      }

      alt = attributes.get('alt');

      imageurl = src || '';
      break;
    }

    if (!imageurl) {
      errors.push('imageurl is empty');
    }

    return {
      component: 'image',
      imageurl,
      alt,
      errors,
      warnings,
    };
  }

  static getImageLink(node: ElementNode): LinkResponse {
    const attributes = getAttributes(node.attributes);
    const link = attributes.get('href') || '';
    const errors: string[] = [];
    const warnings: string[] = [];
    let height: number | undefined;
    let width: number | undefined;

    let imageurl = '';
    let alt: string = '';
    if (node.children) {
      // Handle image
      const imageNodes = node.children.filter(
        (n) => n.type === 'element' && n.tagName === 'img'
      );
      if (imageNodes.length > 1) {
        warnings.push('Only one img tag per a tag is valid');
      }

      for (const n of imageNodes) {
        if (n.type !== 'element') continue;
        const attributes = getAttributes(n.attributes);
        const src = attributes.get('src');
        alt = attributes.get('alt') || '';
        if (!src) {
          errors.push('Image src attribute is missing');
        }

        const widthAttr = attributes.get('width');
        if (widthAttr) {
          width = parseInt(`${widthAttr}`, 10);
        }

        const heightAttr = attributes.get('height');
        if (heightAttr) {
          height = parseInt(`${heightAttr}`, 10);
        }

        imageurl = src || '';
        break;
      }
    }

    if (!link) {
      warnings.push('Image link is empty');
    }

    return {
      link,
      alt,
      imageurl,
      warnings,
      width,
      height,
      errors,
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
): TextType | undefined | 'recipe' {
  //const { tagName } = node;
  if (!mappings || !mappings.length) return;
  // if (!mappingTagsSet.has(tagName)) return;

  for (const mapping of mappings) {
    const { component, match, filters } = mapping;
    if (match === 'all') {
      if (filterAllMapping(node, filters)) {
        return component;
      }
    }
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
      // Use match any as the default case
      return SetUtils.intersect(classesNamesSet, itemsSet).size > 0;
    }
  }
  return false;
}

// All the filters need to match to be considered valid
function filterAllMapping(node: ElementNode, filters: Filter[]): boolean {
  const { tagName } = node;
  const attributes = getAttributes(node.attributes);
  // If there aren't any filter, this is invalid
  if (!filters.length) return false;

  for (const filter of filters) {
    if (filter.type === 'tag') {
      if (!new Set([...filter.items]).has(tagName)) return false;
    }
    if (filter.type === 'class') {
      const classNames = attributes.get('class');

      // It doesn't have a class in the element and has a filter of type class
      // is invalid
      if (!classNames) return false;

      const itemsSet = new Set([...filter.items]);
      const classesNamesSet: Set<string> = new Set([...classNames.split(' ')]);
      switch (filter.match) {
        case 'equal':
          if (!SetUtils.equal(classesNamesSet, itemsSet)) {
            return false;
          }
          continue;
        case 'all':
          if (!SetUtils.subset(classesNamesSet, itemsSet)) {
            return false;
          }
          continue;
      }
      // Use match any as the default case
      if (SetUtils.intersect(classesNamesSet, itemsSet).size === 0) {
        return false;
      }
    }
  }
  return true;
}

// eslint-disable-next-line
export function isValidParams(params: any): boolean {
  if (!params) return false;
  // Zod Schema validation
  const ParamsSchema = z.object({
    mappings: z
      .object({
        name: z.string().optional(),
        match: z.custom<MatchType>(),
        component: z.custom<TextType>(),
        filters: z.custom<Filter>().array(),
      })
      .array(),
  });
  try {
    ParamsSchema.parse(params);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return false;
    }
    return false;
  }
  return true;
}

export type MatchType = 'any' | 'all';

export interface Params {
  mappings?: Mapping[];
}

export interface Mapping {
  name?: string;
  component: TextType | 'recipe';
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

interface LinkResponse {
  link: string;
  imageurl: string;
  alt: string;
  warnings: string[];
  errors: string[];
  width: number | undefined;
  height: number | undefined;
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

function getPortFromUrl(url: string) {
  const regex = /:(\d+)/;
  const match = url.match(regex);

  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return null;
}

function removeProtocol(url: string) {
  if (url.startsWith('https:')) {
    url = url.slice(6);
  }
  if (url.startsWith('http:')) {
    url = url.slice(5);
  }
  return url;
}

export function splitParagraphImages(html: string, tag: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parsed = parseHTML(html) as any;

  // Always treat content as a fragment (RSS-safe)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const root: any =
    parsed.fragment ??
    parsed.document ??
    (() => {
      throw new Error('Unable to parse HTML snippet');
    })();

  const paragraphs = Array.from(root.querySelectorAll(tag));

  for (const paragraph of paragraphs) {
    const p = paragraph as Element;
    const parent = p.parentNode;
    if (!parent) continue;

    const children = Array.from(p.childNodes);
    let buffer: ChildNode[] = [];

    // Extract original attributes once
    const originalAttrs = Array.from(p.attributes).map((attr) => ({
      name: attr.name,
      value: attr.value,
    }));

    const createNewP = () => {
      const newP = root.createElement(tag);
      // copy attributes
      for (const { name, value } of originalAttrs) {
        newP.setAttribute(name, value);
      }
      return newP;
    };

    const flushBuffer = () => {
      if (buffer.length === 0) return;
      const newP = createNewP();
      for (const node of buffer) {
        newP.appendChild(node);
      }
      parent.insertBefore(newP, p);
      buffer = [];
    };

    for (const node of children) {
      const isImg =
        node.nodeType === node.ELEMENT_NODE &&
        (node as Element).tagName.toLowerCase() === 'img';

      if (isImg) {
        flushBuffer();
        parent.insertBefore(node, p); // move the img out
      } else {
        buffer.push(node);
      }
    }

    flushBuffer();
    parent.removeChild(p);
  }

  return root.toString().trim();
}
