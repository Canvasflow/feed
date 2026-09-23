import type * as Attributes from './attributes';
import type { ChannelImage } from './rss-types';
import type { FeedIssue } from '../feed-issue';

/**
 * Typed view of the raw `fast-xml-parser` output consumed by `RSSFeed`.
 *
 * fast-xml-parser produces a dynamically-shaped object: a leaf can be a
 * string, a number (numeric strings are coerced), a nested object (for
 * elements with attributes/children), or an array (for repeated elements).
 * These interfaces model the parts `RSSFeed` actually reads while keeping an
 * `unknown` index signature for the long tail of namespaced/extension tags it
 * only iterates over for validation. This replaces the previous
 * `Record<string, any>` boundary without pretending the feed is fully
 * validated — consumers should still read the typed `rss` property produced by
 * `build()`.
 */
export interface ParsedXml {
  rss: ParsedRss;
  [key: string]: unknown;
}

export interface ParsedRss {
  channel: ParsedChannel;
  [key: string]: unknown;
}

export interface ParsedChannel {
  title: string;
  link?: string;
  description?: string;
  language?: string;
  generator?: string;
  docs?: string;
  category?: string | string[];
  ttl?: number;
  image?: ChannelImage;
  lastBuildDate?: string | number;
  pubDate?: string | number;
  'atom:link'?: Attributes.AtomLink;
  'sy:updateFrequency'?: string | number;
  'sy:updatePeriod'?: string;
  'sy:updateBase'?: string;
  /**
   * The `isArray` parser option guarantees `ParsedItem[]` when parsing through
   * `RSSFeed`; the union also covers callers that construct a `ParsedChannel`
   * directly (e.g. unit tests).
   */
  item?: ParsedItem | ParsedItem[];
  [key: string]: unknown;
}

/**
 * A single `<item>` element as produced by fast-xml-parser. Known fields are
 * typed; the index signature covers extension-namespace tags that only flow
 * through validation loops.
 *
 * Union types (`T | T[]`) reflect that the parser may return either a single
 * value or an array for repeated elements. `RSSFeed` configures `fast-xml-parser`
 * with `isArray` for these tags so they always arrive as arrays at runtime;
 * the union also covers direct `buildItem` callers that construct `ParsedItem`
 * objects without going through the parser.
 */
export interface ParsedItem {
  guid?: string | { '#text'?: unknown; '@_isPermaLink'?: unknown };
  title?: string;
  description?: string;
  link?: string;
  'content:encoded'?: string;
  pubDate?: string;
  author?: string;
  category?: string | Array<string | Record<string, unknown>>;
  enclosure?: Attributes.Enclosure | Attributes.Enclosure[];
  /**
   * A bare `<source url="...">Name</source>` still has an attribute, so
   * fast-xml-parser always returns the `{ '@_url', '#text' }` object shape;
   * the plain-string branch covers direct `buildItem` callers (e.g. unit
   * tests) that construct a `ParsedItem` without an attribute-bearing value.
   */
  source?: Attributes.Source | string;
  'media:group'?: Attributes.MediaGroup | Attributes.MediaGroup[];
  'media:content'?: Attributes.MediaContent | Attributes.MediaContent[];
  /**
   * Elements with a `xmlns:dc` attribute are parsed as `{ '#text': string, '@_xmlns:dc': string }`
   * objects rather than plain strings; the string branch covers the common
   * attribute-free case.
   */
  'dc:creator'?: string | Array<string | Record<string, unknown>>;
  'dc:date'?: string;
  'dc:language'?: string;
  /**
   * Elements with a `xmlns:dcterms`/plain attribute are parsed as
   * `{ '#text': string, '@_xmlns:dcterms': string }` objects rather than
   * plain strings; the string branch covers the attribute-free case.
   */
  'dcterms:modified'?: string | { '#text'?: unknown };
  'atom:updated'?: string | { '#text'?: unknown };
  'atom:author'?: Record<string, unknown>;
  'atom:link'?: Record<string, unknown> | Array<Record<string, unknown>>;
  'sy:updatePeriod'?: string;
  'sy:updateFrequency'?: string | number;
  'cf:hasAffiliateLinks'?: unknown;
  'cf:isSponsored'?: unknown;
  'cf:isPaid'?: unknown;
  'cf:liveCoverageState'?: { '@_state'?: string };
  'cf:generationType'?: string | Array<string>;
  'cf:thumbnail'?: {
    '@_url'?: string;
    '@_width'?: string;
    '@_height'?: string;
    '@_type'?: string;
    '@_fileSize'?: string;
  };
  errors?: FeedIssue[];
  warnings?: FeedIssue[];
  [key: string]: unknown;
}
