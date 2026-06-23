import sanitizeHtml from 'sanitize-html';

import {
  type AudioComponent,
  type Component,
  type CustomComponent,
  type DailymotionComponent,
  type GalleryComponent,
  type GalleryImage,
  type ImageComponent,
  type InfogramComponent,
  type TikTokComponent,
  type TwitterComponent,
  type VideoComponent,
  type VimeoComponent,
  type YoutubeComponent,
  isImageComponent,
  isYoutubeComponent,
} from '../Component';
import {
  type ElementNode,
  type Node,
  type NodeFilterFn,
  findDescendants,
  getAttributes,
} from '../node/Node';
import { imageTags, allowedCaptionTags } from './Mapping.constants';
import {
  sanitizeContentHtml,
  excludeNode,
  filterAllMapping,
  filterAnyMapping,
  fromFigcaption,
} from './Mapping.utils';
import {
  toInfogram,
  toYoutube,
  toTikTok,
  toDailymotion,
  toVimeo,
  isTikTokNode,
} from './Mapping.embeds';
import {
  type GalleryMapping,
  type LinkResponse,
  type Params,
  reduceComponents,
  fromNode,
  toCustom,
} from './Mapping';

/**
 * It process an `img` node into Canvasflow image component
 *
 * @param {ElementNode} node
 * @returns {ImageComponent}
 */
export function toImg(node: ElementNode): ImageComponent {
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
    element: {
      tag: node.tagName,
      attributes: Object.fromEntries(attributes),
    },
  };
}

/**
 * Transform an Image node into an ImageComponent
 *
 * @param {ElementNode} node
 * @returns {ImageComponent}
 */
export function toImage(node: ElementNode): ImageComponent {
  const { tagName } = node;
  const attributes = getAttributes(node.attributes);
  const id = attributes.get('id');

  if (tagName === 'figure') {
    const imageComponent: ImageComponent = fromFigure(node) as ImageComponent;
    imageComponent.id = id;
    return imageComponent;
  }

  if (tagName === 'picture') {
    const imageComponent: ImageComponent = fromPicture(node);
    imageComponent.id = id;
    return imageComponent;
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  let imageurl = '';

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

/**
 * It process a picture node and get back a Canvasflow Image component
 *
 * @param {ElementNode} node
 * @returns {ImageComponent}
 */
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
    /* v8 ignore next -- imageNodes are pre-filtered to elements */
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
    html: sanitizeContentHtml(node),
    alt,
    errors,
    warnings,
  };
}

/**
 * It process a figure node and get back a Canvasflow component
 *
 * @param {ElementNode} node
 * @returns {ImageComponent | VideoComponent | AudioComponent | YoutubeComponent | null}
 */
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
      /* v8 ignore next -- pictureNodes are pre-filtered to elements */
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
    html: sanitizeContentHtml(node),
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

/**
 * It gets an image link from a node
 *
 * @param {ElementNode} node
 * @returns {LinkResponse}
 */
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

/**
 * Transform an video HTML node into a Canvasflow Video Component
 *
 * @param {ElementNode} node
 * @returns {VideoComponent}
 */
export function toVideo(node: ElementNode): VideoComponent {
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
      /* v8 ignore next -- sources are pre-filtered to elements */
      if (n.type !== 'element') return '';
      const attr = getAttributes(n.attributes);
      /* v8 ignore next -- the empty fallback is filtered out below */
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
    html: sanitizeContentHtml(node),
    element: {
      tag: node.tagName,
      attributes: Object.fromEntries(attributes),
    },
  };
}

/**
 * Transform an audio HTML node into a Canvasflow Audio Component
 *
 * @param {ElementNode} node
 * @returns {AudioComponent}
 */
export function toAudio(node: ElementNode): AudioComponent {
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
      /* v8 ignore next -- sources are pre-filtered to elements */
      if (n.type !== 'element') return '';
      const attr = getAttributes(n.attributes);
      /* v8 ignore next -- the empty fallback is filtered out below */
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
    html: sanitizeContentHtml(node),
    element: {
      tag: node.tagName,
      attributes: Object.fromEntries(attributes),
    },
  };
}

/**
 * Transform an ifram HTML node with podcast url into a Canvasflow Audio Component
 *
 * @param {ElementNode} node
 * @returns {AudioComponent}
 */
export function toApplePodcast(node: ElementNode): AudioComponent {
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
    html: sanitizeContentHtml(node),
  };
}

/**
 * Transform an html node into a Canvasflow Gallery Component
 *
 * @param {ElementNode} node
 * @returns {GalleryComponent}
 */
export function toGallery(node: ElementNode): GalleryComponent {
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
    element: {
      tag: node.tagName,
      attributes: Object.fromEntries(attributes),
    },
  };
}

/**
 * Transform a HTML element into a Canvasflow Live Container component
 *
 * @param {ElementNode} node
 * @param {Params | undefined} params
 * @param {Record<string, unknown> | undefined} properties
 * @returns {GalleryComponent}
 */
export function toGalleryFromMapping(
  node: ElementNode,
  mapping: GalleryMapping,
  params?: Params,
  properties?: Record<string, unknown>
): GalleryComponent {
  const errors: string[] = [];
  const warnings: string[] = [];
  const attributes = getAttributes(node.attributes);
  const id = attributes.get('id');

  const slidesNodes: ElementNode[] = node.children
    ? node.children
        .reduce(
          findDescendants(filterGallerySlideDescendants(mapping, params)),
          []
        )
        .filter((node: Node) => node.type === 'element')
    : [];

  const images: GalleryImage[] = slidesNodes
    .reduce(reduceComponents(params), [])
    .filter((component: Component) => isImageComponent(component))
    .map(mapImageToGalleryImage);

  if (!images.length) {
    errors.push('slides not found in the gallery');
  }

  return {
    id,
    component: 'gallery',
    role: 'default',
    images,
    properties,
    html: sanitizeContentHtml(node),
    errors,
    warnings,
  };
}

/**
 * Filter the html nodes that match a live container
 *
 * @param {LiveContainerMapping} [mapping\
 * @param {Params} [params\
 * @returns {NodeFilterFn}
 */
function filterGallerySlideDescendants(
  mapping: GalleryMapping,
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

    const { slide } = mapping;
    const { match, filters } = slide;

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

function mapImageToGalleryImage(component: ImageComponent): GalleryImage {
  const { imageurl, caption, link, alt, credit, width, height } = component;
  return {
    imageurl,
    caption,
    link,
    alt,
    credit,
    width,
    height,
  };
}

/**
 * Transform an html component to Canvasflow Twitter Component
 *
 * @param {ElementNode | URL} node
 * @returns {TwitterComponent}
 */
export function toTwitter(node: ElementNode | URL): TwitterComponent | null {
  if (node instanceof URL) {
    return toTweetFromUrl(node);
  }
  const twitterRegex = /\/(?:#!\/)?(\w+)\/status(es)?\/(\d+)/;
  const errors: string[] = [];
  const warnings: string[] = [];
  const params: { id?: string; account?: string } = {};
  let attrs: Record<string, string> = {};

  const anchorNodes = node.children.reduce(
    findDescendants('a'),
    []
  ) as ElementNode[];
  const validAnchorNodes = anchorNodes.filter((node: ElementNode) => {
    const attributes = getAttributes(node.attributes);
    attrs = Object.fromEntries(attributes);
    const url = attributes.get('href') || '';
    if (!url) return false;
    if (twitterRegex.test(url)) return true;
    return false;
  });

  if (!validAnchorNodes.length) return null;

  const tweetNode = validAnchorNodes.pop();

  /* v8 ignore next 2 -- validAnchorNodes is non-empty here, so pop() is defined */
  if (tweetNode) {
    const attributes = getAttributes(tweetNode.attributes);
    attrs = Object.fromEntries(attributes);
    /* v8 ignore next -- a valid tweet anchor always has an href */
    const tweetUrl = attributes.get('href') || '';

    let values: Array<string> = [];
    /* v8 ignore next -- the regex already matched, so exec never returns null */
    values = twitterRegex.exec(tweetUrl) || [];
    params.id = values[3];
    params.account = values[1];
  }

  return {
    height: '350',
    fixedheight: 'on',
    bleed: 'on',
    params,
    component: 'twitter',
    errors,
    warnings,
    element: {
      tag: node.tagName,
      attributes: attrs,
    },
  };
}

/**
 * Transform an tweet URL to Canvasflow Twitter Component
 *
 * @param {URL} uri
 * @returns {TwitterComponent}
 */
function toTweetFromUrl(uri: URL): TwitterComponent {
  const errors: string[] = [];
  const warnings: string[] = [];
  const params: { id?: string; account?: string } = {};

  const tweetUrl = uri.pathname;

  const twitterRegex = /\/(?:#!\/)?(\w+)\/status(es)?\/(\d+)/;

  const values: Array<string> = twitterRegex.exec(tweetUrl) || [];
  params.id = values[3];
  params.account = values[1];

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

/**
 * It checks if an html node is an valid Twitter Node
 *
 * @param {ElementNode} node
 * @returns {boolean}
 */
export function isTwitterNode(node: ElementNode): boolean {
  const { tagName } = node;
  const attributes = getAttributes(node.attributes);
  const classNames = attributes.get('class');

  if (
    (tagName === 'blockquote' || tagName === 'a') &&
    classNames &&
    classNames
      .split(' ')
      .some((v) => new Set(['twitter-tweet', 'twitter-timeline']).has(v))
  ) {
    return true;
  }

  return false;
}

/**
 * It process an iframe node and returns a Canvasflow component
 *
 * @param {ElementNode} node
 * @returns {YoutubeComponent | InfogramComponent | DailymotionComponent | TikTokComponent | VimeoComponent | TwitterComponent | CustomComponent | AudioComponent | null}
 */
export function fromIframe(
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
      builtComponent.element = {
        tag: node.tagName,
        attributes: Object.fromEntries(attributes),
      };
      builtComponent.html = sanitizeContentHtml(node);
      return builtComponent;
    case 'https://www.youtube.com':
      builtComponent = toYoutube(url);
      builtComponent.element = {
        tag: node.tagName,
        attributes: Object.fromEntries(attributes),
      };
      builtComponent.html = sanitizeContentHtml(node);
      builtComponent.id = id;
      return builtComponent;
    case 'https://embed.podcasts.apple.com':
      builtComponent = toApplePodcast(node);
      builtComponent.element = {
        tag: node.tagName,
        attributes: Object.fromEntries(attributes),
      };
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
    builtComponent.html = sanitizeContentHtml(node);
    builtComponent.element = {
      tag: node.tagName,
      attributes: Object.fromEntries(attributes),
    };
    builtComponent.id = id;
    return builtComponent;
  }

  // Check if youtube is in the source url
  if (
    searchParams.url &&
    searchParams.url.startsWith('https://www.tiktok.com')
  ) {
    builtComponent = toTikTok(new URL(searchParams.url));
    builtComponent.html = sanitizeContentHtml(node);
    builtComponent.element = {
      tag: node.tagName,
      attributes: Object.fromEntries(attributes),
    };
    builtComponent.id = id;
    return builtComponent;
  }

  // Check if Dailymotion is in the source url
  if (
    searchParams.url &&
    searchParams.url.startsWith('https://www.dailymotion.com')
  ) {
    builtComponent = toDailymotion(new URL(searchParams.url));
    builtComponent.element = {
      tag: node.tagName,
      attributes: Object.fromEntries(attributes),
    };
    builtComponent.html = sanitizeContentHtml(node);
    builtComponent.id = id;
    return builtComponent;
  }

  // Check if Dailymotion is in the source url
  if (searchParams.url && searchParams.url.startsWith('https://vimeo.com')) {
    builtComponent = toVimeo(new URL(searchParams.url));
    builtComponent.element = {
      tag: node.tagName,
      attributes: Object.fromEntries(attributes),
    };
    builtComponent.html = sanitizeContentHtml(node);
    builtComponent.id = id;
    return builtComponent;
  }

  if (
    searchParams.url &&
    (searchParams.url.startsWith('https://twitter.com') ||
      searchParams.url.startsWith('https://x.com'))
  ) {
    builtComponent = toTwitter(new URL(searchParams.url));
    if (!builtComponent) return builtComponent;

    builtComponent.html = sanitizeContentHtml(node);
    builtComponent.element = {
      tag: node.tagName,
      attributes: Object.fromEntries(attributes),
    };
    builtComponent.id = id;
    return builtComponent;
  }

  return toCustom(node);
}

/**
 * Filter the valid descendants for figures
 *
 * @param {Params} [params\
 * @returns {NodeFilterFn}
 */
export function filterFigureDescendants(params?: Params): NodeFilterFn {
  return (node: Node): boolean => {
    const { type } = node;
    /* v8 ignore next -- findDescendants only ever passes element nodes */
    if (type !== 'element') return false;
    const { tagName } = node;
    // Exclude the nodes that we need to ignore
    if (params?.excludes?.length) {
      const isNodeExcluded = excludeNode(node, params.excludes);
      if (isNodeExcluded) {
        return false;
      }
    }

    const validFigureTags = new Set([
      'audio',
      'img',
      'picture',
      'table',
      'video',
    ]);

    if (validFigureTags.has(tagName)) {
      return true;
    }
    if (isTwitterNode(node)) {
      return true;
    }

    if (isTikTokNode(node)) {
      return true;
    }

    if (tagName === 'iframe') {
      const iframeComponent = fromIframe(node);
      return isYoutubeComponent(iframeComponent);
    }

    return false;
  };
}
