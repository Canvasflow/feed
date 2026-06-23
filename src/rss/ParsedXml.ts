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
 * A single `<item>` element. Its fields are read defensively by
 * `RSSFeed.buildItem()` (each value re-checked with `typeof`/`Array.isArray`),
 * so the loose `unknown`-valued record is the honest shape here.
 */
export type ParsedItem = Record<string, unknown>;
