// eslint-disable-next-line @typescript-eslint/ban-ts-comment
/* @ts-expect-error */
import { stringify } from 'himalaya';
import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';

import {
  isImageComponent,
  isLinkContainerComponent,
  isTextComponent,
  isValidTextRole,
  type AudioComponent,
  type ButtonComponent,
  type Component,
  type ContainerComponent,
  type CustomComponent,
  type DailymotionComponent,
  type GalleryComponent,
  type GalleryImage,
  type HTMLTableComponent,
  type ImageComponent,
  type InfogramComponent,
  type InstagramComponent,
  type LinkContainerComponent,
  type RecipeComponent,
  type TextComponent,
  type TextType,
  type TikTokComponent,
  type TwitterComponent,
  type VideoComponent,
  type VimeoComponent,
  type YoutubeComponent,
} from './Component';
import {
  findDescendants,
  getAttributes,
  SetUtils,
  type ElementNode,
  type Node,
} from './Node';

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
export const mappingTagsSet: Set<string> = new Set([
  ...textTags,
  'recipe',
  'container',
]);

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
  'a',
];

export function getRootElement(
  nodes: Array<Node>,
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

export function reduceComponents(
  params?: Params
): (acc: Array<Component>, node: Node) => Array<Component> {
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

        acc.push(c);
      }
      return acc;
    }

    if (isLinkContainerComponent(component)) {
      appendLinkContainerComponents(acc, component);
      return acc;
    }

    acc.push(component);
    return acc;
  };
}

function appendLinkContainerComponents(
  acc: Component[],
  linkContainer: LinkContainerComponent
): void {
  const link = linkContainer.link;
  const attributes = linkContainer.attributes;
  const components = linkContainer.components.reduce(
    reduceLinkComponent(link, attributes),
    []
  );
  for (const component of components) {
    acc.push(component);
  }
}

function fromNode(
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

    return {
      component: 'body',
      errors: [],
      warnings: [],
      text: `<p>${node.content.trim()}</p>`,
    } as TextComponent;
  }

  // We exclude first and then we process
  if (params?.excludes?.length) {
    const isNodeExcluded = excludeNode(node, params.excludes);
    if (isNodeExcluded) {
      return null;
    }
  }

  const { tagName } = node;

  // If the element is a script or a style it will get ignored
  if (tagName === 'script' || tagName === 'style') return null;

  const attributes = getAttributes(node.attributes);

  // If the element is specifically ignored
  if (attributes.get('data-cf-ignore') !== undefined) {
    return null;
  }

  const role = attributes.get('role');
  const classNames = attributes.get('class');

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

  // This is a hack for forbes
  if (tagName === 'a' && hasButton(node)) {
    return toAnchorButton(node);
  }

  // This process instagram
  if (tagName === 'blockquote' && attributes.get('data-instgrm-permalink')) {
    return toInstagram(node);
  }

  // This process html table
  if (tagName === 'table') {
    return toHTMLTable(node);
  }

  // This process html table inside figure
  if (tagName === 'figure' && hasTable(node)) {
    for (const child of node.children) {
      if (child.type === 'element' && child.tagName === 'table') {
        return toHTMLTable(child);
      }
    }
    return null;
  }

  if (
    tagName === 'blockquote' &&
    classNames &&
    classNames.includes('tiktok-embed')
  ) {
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

    return toTikTok(new URL(attributes.get('cite') || ''));
  }

  // This process twitter
  if (
    (tagName === 'blockquote' || tagName === 'a') &&
    classNames &&
    classNames
      .split(' ')
      .some((v) => new Set(['twitter-tweet', 'twitter-timeline']).has(v))
  ) {
    return toTwitter(node);
  }

  // This process button component
  if (tagName === 'button' || (tagName === 'a' && role === 'button')) {
    return toButton(node);
  }

  if (role === 'gallery' || role === 'mosaic') {
    return toGallery(node);
  }

  if (tagName === 'figure' && hasCaption(node)) {
    return fromFigure(node);
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
  const { mappedComponent, properties } = getMappingComponent(
    node,
    params?.mappings
  );

  if (tagName === 'a') {
    return toLinkContainer(node, params, properties);
  }

  if (tagName === 'img') {
    return fromImg(node);
  }

  // Check if the tag belongs to an image tag
  if (imageTags.has(tagName) || (tagName === 'a' && hasImage(node))) {
    return toImage(node);
  }

  if (mappedComponent) {
    if (mappedComponent === 'recipe' || mappedComponent === 'container') {
      return toContainer(mappedComponent, node, params, properties);
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

function fromFigcaption(node: ElementNode): FigcaptionResponse {
  let caption: string | undefined;
  let credit: string | undefined;
  const figcaptionNodes = node.children.filter(
    (n) => n.type === 'element' && n.tagName === 'figcaption'
  );
  for (const n of figcaptionNodes) {
    credit = getCredit(n as ElementNode);
    const html = stringify([n]);
    caption = sanitizeHtml(html, {
      allowedTags: ['span', 'b', 'strong', 'em', 'i'],
    });
    break;
  }

  return {
    caption: caption ? caption.trim() : caption,
    credit: credit ? credit.trim() : credit,
  };
}

function fromImg(node: ElementNode): ImageComponent {
  const errors: string[] = [];
  const warnings: string[] = [];
  let width: number | undefined;
  let height: number | undefined;
  const attributes = getAttributes(node.attributes);
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

  const alt = attributes.get('alt');
  if (!src) {
    errors.push('Image src attribute is missing');
  }

  return {
    component: 'image',
    imageurl: src || '',
    alt,
    width,
    height,
    errors,
    warnings,
  };
}

function fromFigure(
  node: ElementNode
): ImageComponent | VideoComponent | AudioComponent | YoutubeComponent | null {
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
    const r = fromFigcaption(node);
    if (r.credit) {
      credit = r.credit;
    }

    if (r.caption) {
      caption = r.caption;
    }
  }

  const components = node.children
    .map((n: Node) => fromNode(n))
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
    const imageLink = getImageLink(linkNodes[0] as ElementNode);
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
      const picture: ImageComponent = fromPicture(n);
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

function fromPicture(node: ElementNode): ImageComponent {
  let imageurl = '';
  let alt: string | undefined;
  const errors: string[] = [];
  const warnings: string[] = [];

  // Handle image
  const imageNodes = node.children.reduce(findDescendants('img'), []);
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

function fromIframe(
  node: ElementNode
):
  | YoutubeComponent
  | InfogramComponent
  | DailymotionComponent
  | TikTokComponent
  | VimeoComponent
  | TwitterComponent
  | CustomComponent
  | AudioComponent
  | null {
  const attributes = getAttributes(node.attributes);
  const id = attributes.get('id');

  let src = attributes.get('src') || '';

  // If the iframe do not have a src we just ignore it
  if (!src || src.length === 0) {
    return null;
  }

  if (src.startsWith('//')) {
    src = `https:${src}`;
  }

  let builtComponent;

  const url = new URL(src);

  switch (url.origin) {
    case 'https://e.infogram.com':
      builtComponent = toInfogram(url);
      builtComponent.id = id;
      return builtComponent;
    case 'https://www.youtube.com':
      builtComponent = toYoutube(url);
      builtComponent.id = id;
      return builtComponent;
    case 'https://embed.podcasts.apple.com':
      builtComponent = toApplePodcast(node);
      builtComponent.id = id;
      return builtComponent;
  }

  const searchParams = {
    src: url.searchParams.get('src'),
    url: url.searchParams.get('url'),
  };

  // Check if youtube is in the source url
  if (
    searchParams.src &&
    searchParams.src.startsWith('https://www.youtube.com')
  ) {
    builtComponent = toYoutube(new URL(searchParams.src));
    builtComponent.id = id;
    return builtComponent;
  }

  // Check if youtube is in the source url
  if (
    searchParams.url &&
    searchParams.url.startsWith('https://www.tiktok.com')
  ) {
    builtComponent = toTikTok(new URL(searchParams.url));
    builtComponent.id = id;
    return builtComponent;
  }

  // Check if Dailymotion is in the source url
  if (
    searchParams.url &&
    searchParams.url.startsWith('https://www.dailymotion.com')
  ) {
    builtComponent = toDailymotion(new URL(searchParams.url));
    builtComponent.id = id;
    return builtComponent;
  }

  // Check if Dailymotion is in the source url
  if (searchParams.url && searchParams.url.startsWith('https://vimeo.com')) {
    builtComponent = toVimeo(new URL(searchParams.url));
    builtComponent.id = id;
    return builtComponent;
  }

  if (
    searchParams.url &&
    (searchParams.url.startsWith('https://twitter.com') ||
      searchParams.url.startsWith('https://x.com'))
  ) {
    builtComponent = toTwitter(new URL(searchParams.url));
    builtComponent.id = id;
    return builtComponent;
  }

  return toCustom(node);
}

function hasButton(node: ElementNode): boolean {
  for (const child of node.children) {
    if (child.type === 'element' && child.tagName === 'button') {
      return true;
    }
  }
  return false;
}

function hasTable(node: ElementNode): boolean {
  for (const child of node.children) {
    if (child.type === 'element' && child.tagName === 'table') {
      return true;
    }
  }

  return false;
}

function hasCaption(node: ElementNode): boolean {
  for (const child of node.children) {
    if (child.type === 'element' && child.tagName === 'figcaption') {
      return true;
    }
  }

  return false;
}

function hasImage(node: ElementNode): boolean {
  const imageTagNames = ['img', 'figure', 'picture'];
  return !!node.children.reduce(findDescendants(imageTagNames), []).length;
}

function toInstagram(node: ElementNode): InstagramComponent {
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
  };
}

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
  };

  return component;
}

function toTikTok(url: URL): TikTokComponent {
  const errors: string[] = [];
  const warnings: string[] = [];

  const params = {
    username: '',
    id: '',
  };

  const match = url
    .toString()
    .match(
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
  };
}

function toTwitter(node: ElementNode | URL): TwitterComponent {
  if (node instanceof URL) {
    return toTweetFromUrl(node);
  }
  const errors: string[] = [];
  const warnings: string[] = [];
  let tweetNode: ElementNode | undefined;
  const params: { id?: string; account?: string } = {};

  for (const child of node.children) {
    if (child.type !== 'element') continue;
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

function toTweetFromUrl(uri: URL): TwitterComponent {
  const errors: string[] = [];
  const warnings: string[] = [];
  const params: { id?: string; account?: string } = {};

  const url = uri.toString();

  if (
    !url.startsWith('https://x.com') &&
    !url.startsWith('https://twitter.com')
  ) {
    errors.push('Invalid Twitter video URL format.');
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

  const tweetUrl = uri.pathname;

  const twitterRegex = /\/(?:#!\/)?(\w+)\/status(es)?\/(\d+)/;

  const values: Array<string> = twitterRegex.exec(tweetUrl) || [];
  params.id = values[3];
  params.account = values[1];

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

function toGallery(node: ElementNode): GalleryComponent {
  const errors: string[] = [];
  const warnings: string[] = [];
  const attributes = getAttributes(node.attributes);
  const role = attributes.get('role') === 'mosaic' ? 'mosaic' : 'default';
  const direction =
    attributes.get('data-direction') === 'vertical' ? 'vertical' : 'horizontal';

  const galleryTags = new Set([...imageTags, 'figure']);
  const images: Array<GalleryImage> = node.children
    // Validate the only image tag are supported
    .filter((n) => n.type === 'element' && galleryTags.has(n.tagName))
    // Map the node to an image component
    .map((n: Node): ImageComponent => {
      return toImage(n as ElementNode);
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

  const { caption } = fromFigcaption(node);

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
function toImage(node: ElementNode): ImageComponent {
  let link: string | undefined;
  if (node.tagName === 'a') {
    const nodeResp = getLinkFromImageNode(node);
    if (nodeResp.node) {
      node = nodeResp.node;
    }

    link = nodeResp.link;
  }

  const { tagName } = node;
  const attributes = getAttributes(node.attributes);
  const id = attributes.get('id');

  if (tagName === 'figure') {
    const imageComponent: ImageComponent = fromFigure(node) as ImageComponent;
    imageComponent.id = id;
    if (link) {
      imageComponent.link = link;
    }

    return imageComponent;
  }

  if (tagName === 'picture') {
    const imageComponent: ImageComponent = fromPicture(node);
    imageComponent.id = id;
    if (link) {
      imageComponent.link = link;
    }
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
    link,
    width: width ? parseInt(`${width}`, 10) : undefined,
    height: height ? parseInt(`${height}`, 10) : undefined,
    errors,
    warnings,
  };
}

function toInfogram(url: URL): InfogramComponent {
  const errors: string[] = [];
  const warnings: string[] = [];

  return {
    component: 'infogram',
    params: {
      id: url.pathname.replace('/', ''),
      parentUrl: url.searchParams.get('parent_url') || '',
      src: 'embed',
    },
    errors,
    warnings,
  };
}

function toYoutube(url: URL): YoutubeComponent {
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

function toDailymotion(url: URL): DailymotionComponent {
  const errors: string[] = [];
  const warnings: string[] = [];

  const regExp =
    /(?:dailymotion\.com\/(?:video|hub)|dai\.ly)\/([0-9a-z]+)(?:[-_0-9a-zA-Z]+#video=([a-z0-9]+))?/;

  if (!regExp.test(url.href)) {
    errors.push('Invalid  Dailymotion video URL format.');
  }

  const id = url.pathname.split('/').pop() as string;

  return {
    component: 'video',
    vidtype: 'dailymotion',
    params: {
      id,
    },
    errors,
    warnings,
  };
}

function toVimeo(url: URL): VimeoComponent {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!url.toString().startsWith('https://vimeo.com')) {
    errors.push('Invalid  Dailymotion video URL format.');
  }

  const id = url.pathname.split('/').pop() as string;

  return {
    component: 'video',
    vidtype: 'vimeo',
    params: {
      id,
    },
    errors,
    warnings,
  };
}

function toVideo(node: ElementNode): VideoComponent {
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

function toAudio(node: ElementNode): AudioComponent {
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

function toApplePodcast(node: ElementNode): AudioComponent {
  const errors: string[] = [];
  const warnings: string[] = [];
  const attributes = getAttributes(node.attributes);
  let url = '';
  const src = attributes.get('src');
  const allow = attributes.get('allow');
  if (src) {
    url = src;
  }

  if (!url) {
    errors.push('src is required');
  }

  let autoplay = false;
  if (allow) {
    const allowProps = new Set(allow.split(';').map((p) => p.trim()));
    autoplay = allowProps.has('autoplay *');
  }

  return {
    component: 'audio',
    url,
    controls: false,
    autoplay,
    muted: false,
    loop: false,
    errors,
    warnings,
  };
}

function toCustom(node: ElementNode): CustomComponent {
  const content = stringify([node]);
  const attributes = getAttributes(node.attributes);
  const id = attributes.get('id');
  return {
    id,
    component: 'custom',
    errors: [],
    warnings: [],
    content,
  };
}

function toContainer(
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
  };
}

function toLinkContainer(
  node: ElementNode,
  params?: Params,
  properties?: Record<string, unknown>
): LinkContainerComponent {
  const warnings: string[] = [];
  const errors: string[] = [];
  const attributes = getAttributes(node.attributes);
  const id = attributes.get('id');

  const link: string | undefined = attributes.get('href');

  const components: Array<Component> = node.children.length
    ? node.children.reduce(reduceComponents(params), [])
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
  };

  return component;
}

function reduceLinkComponent(
  link?: string,
  attributes?: Map<string, string>
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
    }

    if (isImageComponent(component)) {
      component.link = link;
    }

    acc.push(component);
    return acc;
  };
}

function toText(
  node: ElementNode,
  component: TextType,
  properties?: Record<string, unknown>
): TextComponent {
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
    properties,
    text: typeof text === 'string' ? text.trim() : text,
  };
}

function getLinkFromImageNode(node: ElementNode): {
  node: ElementNode;
  link?: string;
} {
  let link: string | undefined;
  if (node.tagName === 'a') {
    const attributes = getAttributes(node.attributes);
    const href = attributes.get('href');
    if (href) {
      link = href;
    }
    if (node.children) {
      for (const c of node.children) {
        if (
          c.type === 'element' &&
          (c.tagName === 'img' ||
            c.tagName === 'picture' ||
            c.tagName === 'figure')
        ) {
          node = c;
          break;
        }
      }
    }
  }

  return {
    node,
    link,
  };
}

function getCredit(node: ElementNode): string | undefined {
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

    const content = n.content.replace(/[\r\n\t]/g, '').replace(/\s\s+/g, ' ');

    if (content.length) {
      n.content = content;
      acc.push(n);
    }

    return acc;
  }, []);
  return credit ? credit.trim() : credit;
}

function getImageLink(node: ElementNode): LinkResponse {
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
    const imageNodes = node.children.reduce(findDescendants('img'), []);
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

// If at least one filter matches then is valid
function filterAnyMapping(node: ElementNode, filters: Filter[]): boolean {
  const { tagName } = node;
  const attributes = getAttributes(node.attributes);
  for (const filter of filters) {
    if (filter.type === 'tag') {
      if (new Set([...filter.items]).has(tagName)) return true;
    }
    if (filter.type === 'attribute') {
      const attributeValue = attributes.get(filter.key);
      if (attributeValue === undefined) return false;
      return attributeValue === filter.value;
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
    if (filter.type === 'attribute') {
      const attributeValue = attributes.get(filter.key);
      if (attributeValue === undefined) return false;
      return attributeValue === filter.value;
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

export function isValidMapping(mapping: unknown): boolean {
  if (!mapping) return false;
  // Zod Schema validation
  const ParamsSchema = z.object({
    mappings: z
      .object({
        match: z.custom<MatchType>(),
        filters: z.custom<Filter>().array(),
      })
      .array(),
  });
  try {
    ParamsSchema.parse(mapping);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return false;
    }
    return false;
  }
  return true;
}

export interface Params {
  mappings?: ComponentMapping[];
  excludes?: Mapping[];
}

export function filterEmptyTextNode(node: Node): boolean {
  if (node.type === 'comment') return false;
  if (node.type !== 'text') return true;

  const { content } = node;
  if (!content) return false;

  return !isEmpty(content);
}

export function processTextLinks(html: string, link: string = '/'): string {
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

export function isValidParams(params: unknown): boolean {
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

export interface Mapping {
  match: MatchType;
  filters: Filter[];
}

export interface ComponentMapping extends Mapping {
  name?: string;
  component: TextType | 'recipe' | 'container';
  properties?: Record<string, unknown>;
}

export type Filter = TagFilter | ClassFilter | AttributeFilter;

interface TagFilter {
  type: 'tag';
  items: string[];
}

interface ClassFilter {
  type: 'class';
  match: MatchType | 'equal';
  items: string[];
}

interface AttributeFilter {
  type: 'attribute';
  key: string;
  value: string | null;
}

export interface LinkResponse {
  link: string;
  imageurl: string;
  alt: string;
  warnings: string[];
  errors: string[];
  width: number | undefined;
  height: number | undefined;
}

export type MatchType = 'any' | 'all';

interface FigcaptionResponse {
  caption?: string;
  credit?: string;
}

export function isEmpty(content: string) {
  return content.replace(/[\r\n\t]/g, '').trim().length === 0;
}

function getMappingComponent(
  node: ElementNode,
  mappings?: Array<ComponentMapping>
): MappingComponentResponse /*TextType | undefined | 'recipe' | 'container'*/ {
  //const { tagName } = node;
  if (!mappings || !mappings.length) {
    return {
      mappedComponent: undefined,
      properties: undefined,
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
        };
      }
    }
    if (match === 'any') {
      if (filterAnyMapping(node, filters)) {
        return {
          mappedComponent: component,
          properties,
        };
      }
    }
  }

  return {
    mappedComponent: undefined,
    properties: undefined,
  };
}

interface MappingComponentResponse {
  mappedComponent?: TextType | 'recipe' | 'container';
  properties?: Record<string, unknown>;
}

function excludeNode(node: ElementNode, excludes: Mapping[]): boolean {
  for (const mapping of excludes) {
    const { match, filters } = mapping;
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
  }

  return false;
}
