import sanitizeHtml from 'sanitize-html';

import {
  type AudioComponent,
  type Component,
  type GalleryComponent,
  type GalleryImage,
  type ImageComponent,
  type VideoComponent,
  type YoutubeComponent,
  isImageComponent,
} from '../Component';
import {
  type ElementNode,
  type Node,
  type NodeFilterFn,
  findDescendants,
  getAttributes,
} from '../node/Node';
import {
  imageTags,
  allowedTags,
  allowedCaptionTags,
} from './Mapping.constants';
import {
  sanitizeNode,
  excludeNode,
  filterAllMapping,
  filterAnyMapping,
  fromFigcaption,
} from './Mapping.utils';
import {
  type GalleryMapping,
  type LinkResponse,
  type Params,
  reduceComponents,
  fromNode,
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
    html: sanitizeNode(node, {
      allowedTags,
      allowedAttributes: false,
    }),
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
    html: sanitizeNode(node, {
      allowedTags,
      allowedAttributes: false,
    }),
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
    html: sanitizeNode(node, {
      allowedTags,
      allowedAttributes: false,
    }),
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
    html: sanitizeNode(node, {
      allowedTags,
      allowedAttributes: false,
    }),
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
