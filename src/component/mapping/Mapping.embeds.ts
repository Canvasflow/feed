import type {
  InstagramComponent,
  TikTokComponent,
  InfogramComponent,
  DailymotionComponent,
  YoutubeComponent,
  VimeoComponent,
} from '../Component';
import {
  type ElementNode,
  type Node,
  findDescendants,
  getAttributes,
} from '../node/Node';
import { allowedTags } from './Mapping.constants';
import { sanitizeNode, isYoutubeUrl } from './Mapping.utils';

/**
 * Transform an html component to Canvasflow Instagram Component
 *
 * @param {ElementNode} node
 * @returns {InstagramComponent}
 */
export function toInstagram(node: ElementNode): InstagramComponent {
  const errors: string[] = [];
  const warnings: string[] = [];
  const component: InstagramComponent = {
    id: '',
    component: 'instagram',
    type: 'post',
    errors,
    warnings,
    element: {
      tag: node.tagName,
    },
  };

  const attributes = getAttributes(node.attributes);
  if (component.element && attributes) {
    component.element.attributes = Object.fromEntries(attributes);
  }
  const url =
    attributes.get('data-instgrm-permalink') || getLegacyInstagramUrl(node);

  if (!url) {
    errors.push('URL not found on node');
    component.errors = errors;
    return component;
  }

  try {
    const urlInfo = new URL(url);
    const splitUrl = urlInfo.pathname.split('/');
    const type = splitUrl[1] ? splitUrl[1].toLowerCase() : 'post';

    if (!splitUrl[1]) {
      errors.push('URL does not contain a type.');
    }

    if (!splitUrl[2]) {
      errors.push('URL does not contain an ID.');
    }

    component.id = splitUrl[2];

    switch (type) {
      case 'p':
        component.type = 'post';
        break;
      case 'reel':
      case 'tv':
        component.type = type;
        break;
    }
  } catch (e: unknown) {
    const err = e as { message?: unknown; input?: unknown };
    errors.push(`${err.message}: "${err.input}"`);
  }

  component.errors = errors;

  return component;
}

/**
 * Uses Instagram legacy embed API to detect the url
 *
 * @param {ElementNode} node
 * @returns {string}
 */
function getLegacyInstagramUrl(node: ElementNode): string {
  const anchorNodes: Node[] = node.children
    .reduce(findDescendants('a'), [])
    .filter(filterInstagramAnchor);

  if (!anchorNodes.length) return '';

  const anchorNode = anchorNodes.shift() as ElementNode;
  const anchorNodeAttributes = getAttributes(anchorNode.attributes);

  return anchorNodeAttributes.get('href') || '';
}

/**
 * Filters if anchor tag nodes have a valid instagram url
 *
 * @param {ElementNode} node
 * @returns {boolean}
 */
function filterInstagramAnchor(node: Node): boolean {
  if (node.type !== 'element') return false;
  if (!node.attributes) return false;
  const attributes = getAttributes(node.attributes);
  const href = attributes.get('href');
  if (!href) return false;
  return /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/.test(
    href
  );
}

/**
 * Transform an URL into a TikTokComponent
 *
 * @param {URL} url
 * @returns {TikTokComponent}
 */
export function toTikTok(url: URL): TikTokComponent {
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

/**
 * Transform an infogram url into an Canvasflow Infogram Component
 *
 * @param {URL} url
 * @returns {InfogramComponent}
 */
export function toInfogram(url: URL): InfogramComponent {
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

/**
 * Transform an Dailymotion url into a Canvasflow DailyMotion Component
 *
 * @param {URL} url
 * @returns {DailymotionComponent}
 */
export function toDailymotion(url: URL): DailymotionComponent {
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

/**
 * Creates a Youtube Component from an anchor element
 *
 * @param {ElementNode} node
 * @returns {YoutubeComponent}
 */
export function toYoutubeFromAnchor(node: ElementNode): YoutubeComponent {
  const attributes = getAttributes(node.attributes);
  const url = attributes.get('href') || '';
  const component = toYoutube(new URL(url));
  component.element = {
    tag: node.tagName,
    attributes: Object.fromEntries(attributes),
  };
  component.id = attributes.get('id');
  component.html = sanitizeNode(node, {
    allowedTags,
    allowedAttributes: false,
  });
  return component;
}

/**
 * Transform an youtube url into a Canvasflow Youtube Component
 *
 * @param {URL} url
 * @returns {YoutubeComponent}
 */
export function toYoutube(url: URL): YoutubeComponent {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isYoutubeUrl(url.href)) {
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

/**
 * Transform an vimeo url into a Canvasflow Vimeo Component
 *
 * @param {URL} url
 * @returns {VimeoComponent}
 */
export function toVimeo(url: URL): VimeoComponent {
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

/**
 * It checks if an html node is an valid Instragram Node
 *
 * @param {ElementNode} node
 * @returns {boolean}
 */
export function isInstagramNode(node: ElementNode): boolean {
  const { tagName } = node;
  const attributes = getAttributes(node.attributes);
  return (
    tagName === 'blockquote' &&
    (attributes.get('data-instgrm-version') === '6' ||
      attributes.get('data-instgrm-permalink') !== undefined)
  );
}

/**
 * It checks if an html node is an valid TikTok Node
 *
 * @param {ElementNode} node
 * @returns {boolean}
 */
export function isTikTokNode(node: ElementNode): boolean {
  const { tagName } = node;
  const attributes = getAttributes(node.attributes);
  const classNames = attributes.get('class');
  if (
    tagName === 'blockquote' &&
    classNames &&
    classNames.includes('tiktok-embed')
  ) {
    return true;
  }
  return false;
}
