import type { Component } from '../component/Component';

export interface RSS {
  modules?: string[];
  channel: Channel;
  errors: Array<unknown>;
  warnings: string[];
}

export interface Channel {
  title?: string;
  link?: string;
  description?: string;
  language?: string;
  generator?: string;
  lastBuildDate?: string;
  docs?: string;
  image?: ChannelImage;
  pubDate?: string;
  category?: string[];
  items: Item[];
  ttl?: number;
  errors: string[];
  warnings: string[];
  'atom:link'?: {
    href?: string;
    rel?: string;
    type?: string;
  };
  'sy:updatePeriod'?: string;
  // `build()` normalises this to a number via parseInt when present, but the
  // untouched raw value flows through otherwise, so both shapes are valid.
  'sy:updateFrequency'?: string | number;
  'sy:updateBase'?: string;
}

export interface ChannelImage {
  height?: number;
  width?: number;
  link?: string;
  title?: string;
  url?: string;
}

export interface Item {
  guid?: string;
  title?: string;
  category?: string[];
  link?: string;
  description?: string;
  enclosure: Enclosure[];
  mediaGroup: MediaGroup[];
  mediaContent: MediaContent[];
  pubDate?: string;
  errors: string[];
  warnings: string[];
  components: Component[];
  'content:encoded'?: string;
  'cf:hasAffiliateLinks'?: boolean;
  'cf:isSponsored'?: boolean;
  'cf:isPaid'?: boolean;
  'cf:liveCoverageState'?: null | 'live' | 'completed';
  'cf:thumbnail'?: Thumbnail;
  'dc:creator'?: string;
  'dc:date'?: string;
  'dc:language'?: string;
  'dcterms:modified'?: string;
  'atom:updated'?: string;
  'atom:author'?: {
    'atom:name'?: string;
    'atom:uri'?: string;
    'atom:email'?: string;
  };
}

export interface Thumbnail {
  url: string;
  width?: number;
  height?: number;
  type?: string;
  fileSize?: number;
}

export interface Enclosure {
  length: number;
  type: string;
  url: string;
  errors: string[];
  warnings: string[];
}

export interface MediaGroup {
  title?: string;
  mediaContent?: MediaContent[];
  /**
   * Array of errors from the media content
   */
  errors: string[];
  /**
   * Array of warnings from the media content
   */
  warnings: string[];
}

/**
 * `JSON.stringify` replacer that serialises `Error` values to their message so
 * errors survive `RSSFeed.toString()`/`toJSON()`.
 *
 * @param {string} _ unused JSON key
 * @param {unknown} value
 * @returns {unknown}
 */
export function replaceErrors(_: string, value: unknown) {
  if (value instanceof Error) {
    const error: Record<string, unknown> = {};
    const source = value as unknown as Record<string, unknown>;
    Object.getOwnPropertyNames(value).forEach(function (propName) {
      error[propName] = source[propName];
    });
    return error.message;
  }
  return value;
}

export interface MediaContent {
  /**
   * Direct URL to the media object. (Required)
   */
  url: string;
  /**
   * Number of bytes of the media object. (Optional)
   */
  fileSize?: number;
  /**
   * Is the standard MIME type of the object. (Optional)
   */
  type?: string;
  /**
   * Is the type of object. (Optional)
   */
  medium?: 'image' | 'audio' | 'video' | 'document' | 'executable';
  /**
   * Determines if this is the default object that should be
   * used for the <media:group>. (Optional)
   */
  isDefault?: boolean;
  /**
   * The title of the particular media object. (Optional)
   */
  title?: string;
  /**
   * Short description describing the media object typically a sentence in length
   */
  description?: string;
  /**
   * Allows particular images to be used as representative images
   * for the media object. (Optional)
   */
  thumbnail?: string;
  /**
   * Notable entity and the contribution to the creation of the
   * media object. (Optional)
   */
  credit?: string;
  /**
   * Array of errors from the media content
   */
  errors: string[];
  /**
   * Array of warnings from the media content
   */
  warnings: string[];
}
