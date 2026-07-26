import type { Component } from '../component/component';
import type {
  FeedIssue,
  FeedIssueCode,
  FeedIssueSeverity,
} from '../feed-issue';

export type { FeedIssue, FeedIssueCode, FeedIssueSeverity };

export interface RSS {
  modules?: string[] | undefined;
  channel: Channel;
  errors: FeedIssue[];
  warnings: FeedIssue[];
}

export interface Channel {
  title?: string | undefined;
  link?: string | undefined;
  description?: string | undefined;
  language?: string | undefined;
  generator?: string | undefined;
  lastBuildDate?: string | undefined;
  docs?: string | undefined;
  image?: ChannelImage | undefined;
  pubDate?: string | undefined;
  category?: string[] | undefined;
  items: Item[];
  ttl?: number | undefined;
  errors: FeedIssue[];
  warnings: FeedIssue[];
  'atom:link'?: {
    href?: string | undefined;
    rel?: string | undefined;
    type?: string | undefined;
  };
  'sy:updatePeriod'?: string | undefined;
  // `build()` normalises this to a number via parseInt when present, but the
  // untouched raw value flows through otherwise, so both shapes are valid.
  'sy:updateFrequency'?: string | number | undefined;
  'sy:updateBase'?: string | undefined;
}

export interface ChannelImage {
  height?: number | undefined;
  width?: number | undefined;
  link?: string | undefined;
  title?: string | undefined;
  url?: string | undefined;
}

export interface Item {
  guid?: string | undefined;
  title?: string | undefined;
  category?: string[] | undefined;
  link?: string | undefined;
  description?: string | undefined;
  enclosure: Enclosure[];
  mediaGroup: MediaGroup[];
  mediaContent: MediaContent[];
  pubDate?: string | undefined;
  errors: FeedIssue[];
  warnings: FeedIssue[];
  components: Component[];
  'content:encoded'?: string | undefined;
  'cf:hasAffiliateLinks'?: boolean | undefined;
  'cf:isSponsored'?: boolean | undefined;
  'cf:isPaid'?: boolean | undefined;
  'cf:liveCoverageState'?: null | 'live' | 'completed' | undefined;
  'cf:thumbnail'?: Thumbnail | undefined;
  'dc:creator'?: string | undefined;
  'dc:date'?: string | undefined;
  'dc:language'?: string | undefined;
  'dcterms:modified'?: string | undefined;
  'atom:updated'?: string | undefined;
  'atom:author'?:
    | {
        'atom:name'?: string | undefined;
        'atom:uri'?: string | undefined;
        'atom:email'?: string | undefined;
      }
    | undefined;
}

export interface Thumbnail {
  url: string;
  width?: number | undefined;
  height?: number | undefined;
  type?: string | undefined;
  fileSize?: number | undefined;
}

export interface Enclosure {
  length: number;
  type: string;
  url: string;
  errors: FeedIssue[];
  warnings: FeedIssue[];
}

export interface MediaGroup {
  title?: string | undefined;
  mediaContent?: MediaContent[] | undefined;
  /**
   * Array of errors from the media content
   */
  errors: FeedIssue[];
  /**
   * Array of warnings from the media content
   */
  warnings: FeedIssue[];
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
  fileSize?: number | undefined;
  /**
   * Is the standard MIME type of the object. (Optional)
   */
  type?: string | undefined;
  /**
   * Is the type of object. (Optional)
   */
  medium?: 'image' | 'audio' | 'video' | 'document' | 'executable' | undefined;
  /**
   * Determines if this is the default object that should be
   * used for the <media:group>. (Optional)
   */
  isDefault?: boolean | undefined;
  /**
   * The title of the particular media object. (Optional)
   */
  title?: string | undefined;
  /**
   * Short description describing the media object typically a sentence in length
   */
  description?: string | undefined;
  /**
   * Allows particular images to be used as representative images
   * for the media object. (Optional)
   */
  thumbnail?: string | undefined;
  /**
   * Notable entity and the contribution to the creation of the
   * media object. (Optional)
   */
  credit?: string | undefined;
  /**
   * Array of errors from the media content
   */
  errors: FeedIssue[];
  /**
   * Array of warnings from the media content
   */
  warnings: FeedIssue[];
}
