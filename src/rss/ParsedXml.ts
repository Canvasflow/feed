import type * as Attributes from './Attributes';
import type { ChannelImage } from './RSS';

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
  category?: string[];
  ttl?: number;
  image?: ChannelImage;
  lastBuildDate?: string | number;
  pubDate?: string | number;
  'atom:link'?: Attributes.AtomLink;
  'sy:updateFrequency'?: string | number;
  'sy:updatePeriod'?: string;
  'sy:updateBase'?: string;
  item?: ParsedItem | ParsedItem[];
  [key: string]: unknown;
}

/**
 * A single `<item>` element as produced by fast-xml-parser. Known fields are
 * typed; the index signature covers extension-namespace tags that only flow
 * through validation loops. Defensive `typeof`/`Array.isArray` guards in
 * `buildItem()` remain for fields typed as `unknown` or as unions where the
 * parser's coercion behaviour is ambiguous.
 */
export interface ParsedItem {
  guid?: string | { '#text'?: unknown; '@_isPermaLink'?: unknown };
  title?: string;
  description?: string;
  link?: string;
  'content:encoded'?: string;
  pubDate?: string;
  author?: string;
  category?:
    | string
    | string[]
    | Record<string, unknown>
    | Array<Record<string, unknown>>;
  enclosure?: Record<string, unknown> | Array<Record<string, unknown>>;
  'media:group'?: Record<string, unknown> | Array<Record<string, unknown>>;
  'media:content'?: Record<string, unknown> | Array<Record<string, unknown>>;
  'dc:creator'?: string | string[];
  'dc:date'?: string;
  'dc:language'?: string;
  'dcterms:modified'?: string;
  'atom:updated'?: string;
  'atom:author'?: Record<string, unknown>;
  'atom:link'?: Record<string, unknown> | Array<Record<string, unknown>>;
  'sy:updatePeriod'?: string;
  'sy:updateFrequency'?: string | number;
  'cf:hasAffiliateLinks'?: unknown;
  'cf:isSponsored'?: unknown;
  'cf:isPaid'?: unknown;
  'cf:liveCoverageState'?: { '@_state'?: unknown };
  'cf:thumbnail'?: Record<string, unknown>;
  errors?: string[];
  warnings?: string[];
  [key: string]: unknown;
}
