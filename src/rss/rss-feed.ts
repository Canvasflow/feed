import { decodeEntities } from '../utils/entities';
import { parseDate } from '../utils/date';
import { XMLParser } from 'fast-xml-parser';
import { getHtmlContent, getRecipeFromUrl } from './recipe';

import type {
  RSS,
  Item,
  Enclosure,
  MediaContent,
  MediaGroup,
  Thumbnail,
} from './rss-types';
import {
  type FeedIssue,
  type FeedIssueCode,
  errorIssue,
  warningIssue,
} from '../feed-issue';
import { replaceErrors } from './rss-types';
export { replaceErrors };
import { Tag } from './tag';
import * as Attributes from './attributes';
import { HTMLMapper } from '../component/html/html-mapper';
import type { Recipe } from '../component/schema/recipe-schema';
import { type Mapping, type Params } from '../component/mapping/mapping';
import {
  MappingSchema,
  ParamsSchema,
} from '../component/mapping/mapping.schema';
import { sanitizeHTML as sanitizeHtml } from '../component/html/sanitize-html';
import type { ParsedXml, ParsedItem } from './parsed-xml';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * Context consumed by the standalone `buildItem` function.
 * Mirrors the three private fields of `RSSFeed` that `buildItem` previously
 * accessed via `this`.
 */
export interface BuildItemContext {
  origin?: string | undefined;
  root?: Mapping | undefined;
  params?: Params | undefined;
}

// ---------------------------------------------------------------------------
// Private types (module-level)
// ---------------------------------------------------------------------------

type CanvasflowBooleanTag =
  | 'cf:hasAffiliateLinks'
  | 'cf:isSponsored'
  | 'cf:isPaid';

/**
 * Narrow target for `processCanvasflowBooleanTag`. Contains only the fields
 * the function actually reads or writes, eliminating the previous
 * `as unknown as Item` cast.
 */
type CanvasflowBooleanTarget = {
  [K in CanvasflowBooleanTag]: boolean;
} & { errors: FeedIssue[]; warnings: FeedIssue[] };

// ---------------------------------------------------------------------------
// RSSFeed class
// ---------------------------------------------------------------------------

/**
 * Parses an RSS/Atom XML string and exposes `validate()` (populates
 * errors/warnings against the tag allow-lists) and `build()` (produces a typed
 * `RSS` object whose items' HTML content is converted to components).
 */
export class RSSFeed {
  public content: string;
  private readonly data: ParsedXml;
  public rss: RSS;
  public errors: FeedIssue[] = [];
  private params: Params | undefined;
  private origin: string | undefined;
  private _root: Mapping | undefined;
  private _validated = false;

  /**
   * @param {string} content - Raw RSS/Atom XML string to parse.
   * @param {Params} [params] - Optional mapping configuration passed to
   *   `HTMLMapper.toComponents()` during `build()`.
   */
  constructor(content: string, params?: Params) {
    this.content = content;

    this.rss = {
      errors: [],
      warnings: [],
      channel: {
        items: [],
        errors: [],
        warnings: [],
      },
    };

    const parser = new XMLParser({
      ignoreAttributes: false,
      processEntities: false,
    });

    try {
      this.data = parser.parse(content);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      this.data = {} as unknown as ParsedXml;
      const issue = errorIssue(
        'XML_PARSE_ERROR',
        `XML parse error: ${message}`
      );
      this.errors.push(issue);
      this.rss.errors.push(issue);
      return;
    }

    // Stored as-is, even when invalid: `build()` is the single place that
    // validates and reports `params` (via `validateParams`), so there is one
    // consistent behavior instead of the constructor silently dropping bad
    // config that `build()` never gets a chance to see.
    this.params = params;
  }

  set root(rootMapping: Mapping | undefined) {
    this._root = rootMapping;
  }

  /**
   * @deprecated Thin backward-compatible wrapper around
   * `getRecipeFromUrl` in `./recipe` — the network I/O this performs is not
   * really part of an XML-parsing library's job. Prefer importing
   * `getRecipeFromUrl` from `@canvasflow/feed` directly, which also accepts
   * an injected `fetch`, a timeout, and a body-size cap.
   */
  static async getRecipeFromUrl(url: string): Promise<Recipe | null> {
    return getRecipeFromUrl(url);
  }

  /**
   * @deprecated Thin backward-compatible wrapper around `getHtmlContent` in
   * `./recipe`. Prefer importing `getHtmlContent` from `@canvasflow/feed`
   * directly, which also accepts an injected `fetch`, a timeout, and a
   * body-size cap.
   */
  static async getHtmlContent(url: string, headers?: HeadersInit) {
    return getHtmlContent(url, { headers });
  }

  async validate(): Promise<void> {
    const { data } = this;
    this.errors = [];
    this._validated = true;

    // Reset accumulators so repeated `validate()` calls are idempotent —
    // `validateRSS`/`validateChannel`/`validateItem` no longer delete
    // offending keys from `this.data` to prevent re-detection, so the
    // reset has to happen here instead.
    this.rss.errors = [];
    this.rss.warnings = [];
    this.rss.channel.errors = [];
    this.rss.channel.warnings = [];

    if (!data.rss) {
      const issue = errorIssue(
        'MISSING_ROOT_RSS',
        'Required property "rss" is missing at the root level'
      );
      this.errors.push(issue);
      this.rss.errors.push(issue);
      return;
    }

    this.validateRSS();

    this.validateChannel();
    if (this.rss.channel.errors.length) {
      return;
    }

    const items = data.rss?.channel?.item;

    /* v8 ignore next 3 -- channel validation guarantees an item is present here */
    if (items === null || items === undefined) {
      return;
    }

    if (Array.isArray(items)) {
      this.validateItems(items);
    } else {
      this.validateItems([items]);
    }
  }

  /**
   * Validate `params` and an optional `root` mapping against their Zod
   * schemas. Returns structured `FeedIssue`s (one per invalid schema,
   * summarizing every underlying Zod issue) instead of raw Zod output.
   *
   * @param {Params} [params]
   * @param {Mapping} [root]
   * @returns {FeedIssue[]}
   */
  static validateParams(params?: Params, root?: Mapping): FeedIssue[] {
    const errors: FeedIssue[] = [];
    if (params) {
      try {
        const result = ParamsSchema.safeParse(params);

        if (!result.success) {
          errors.push(toFeedIssue('INVALID_PARAMS', result.error.issues));
        }
      } catch (e) {
        errors.push(errorIssue('INVALID_PARAMS', String(e)));
      }
    }

    if (root) {
      try {
        const result = MappingSchema.safeParse(root);

        if (!result.success) {
          errors.push(toFeedIssue('INVALID_ROOT_MAPPING', result.error.issues));
        }
      } catch (e) {
        errors.push(errorIssue('INVALID_ROOT_MAPPING', String(e)));
      }
    }

    return errors;
  }

  /**
   * Constructs the typed `RSS` object from the parsed XML.
   * `validate()` must be called before `build()`.
   */
  async build(): Promise<RSS> {
    if (!this._validated) {
      await this.validate();
    }

    if (this.rss.errors.length) {
      return this.rss;
    }

    const { data } = this;
    const { rss } = data;
    const { channel } = rss;

    const {
      title,
      link,
      description,
      language,
      image,
      generator,
      docs,
      category,
      ttl,
    } = channel;

    const paramsErrors = RSSFeed.validateParams(this.params, this._root);
    if (paramsErrors.length) {
      this.rss.errors = [...this.rss.errors, ...paramsErrors];
      return this.rss;
    }

    if (link) {
      if (URL.canParse(link)) {
        this.origin = new URL(link).origin;
      } else {
        this.rss.channel.warnings.push(
          warningIssue(
            'INVALID_LINK',
            `Invalid value for property "link": "${link}"`,
            'link'
          )
        );
      }
    }

    let lastBuildDate: undefined | string;
    if (channel.lastBuildDate) {
      lastBuildDate = parseDate(`${channel.lastBuildDate}`) ?? undefined;
    }

    let pubDate: undefined | string;
    if (channel.pubDate) {
      pubDate = parseDate(`${channel.pubDate}`) ?? undefined;
    }

    this.rss.channel.title = decodeEntities(title);
    if (this.rss.channel.title) {
      this.rss.channel.title = this.rss.channel.title.trim();
    }
    this.rss.channel.link = link;
    this.rss.channel.description = description
      ? removeHTMLTags(description)
      : `${description}`.trim();
    this.rss.channel.language = language;
    this.rss.channel.lastBuildDate = lastBuildDate;
    this.rss.channel.docs = docs;
    this.rss.channel.category = category;
    if (image?.title) {
      image.title = decodeEntities(image.title);
    }
    this.rss.channel.image = image;
    this.rss.channel.ttl = ttl;
    this.rss.channel.pubDate = pubDate;
    this.rss.channel.generator = generator;
    const atomLink: undefined | Attributes.AtomLink = channel['atom:link'];
    if (atomLink) {
      this.rss.channel['atom:link'] = {
        href: atomLink['@_href'],
        rel: atomLink['@_rel'],
        type: atomLink['@_type'],
      };
    }

    this.rss.channel['sy:updateFrequency'] = channel['sy:updateFrequency']
      ? parseInt(`${channel['sy:updateFrequency']}`)
      : channel['sy:updateFrequency'];
    this.rss.channel['sy:updatePeriod'] = channel['sy:updatePeriod'];
    this.rss.channel['sy:updateBase'] = channel['sy:updateBase'];

    const rawItems = channel.item;
    if (rawItems) {
      const items = Array.isArray(rawItems) ? rawItems : [rawItems];
      const ctx: BuildItemContext = {
        origin: this.origin,
        root: this._root,
        params: this.params,
      };
      for (const item of items) {
        this.rss.channel.items.push(buildItem(item, ctx));
      }
    } else {
      this.rss.channel.errors.push(
        errorIssue(
          'MISSING_REQUIRED_TAG',
          'Required property "item" is missing in channel',
          'item'
        )
      );
    }

    return this.rss;
  }

  /**
   * Serialize an `RSS` object to a plain JSON value, with `Error` instances
   * converted to serializable objects via the `replaceErrors` replacer.
   *
   * @param {RSS} rss
   * @returns {unknown}
   */
  static toJSON(rss: RSS): unknown {
    return JSON.parse(this.toString(rss));
  }

  /**
   * Serialize an `RSS` object to a formatted JSON string, with `Error`
   * instances converted to serializable objects via the `replaceErrors`
   * replacer.
   *
   * @param {RSS} rss
   * @returns {string}
   */
  static toString(rss: RSS): string {
    return JSON.stringify(rss, replaceErrors, 2);
  }

  private validateRSS() {
    const { rss } = this.data;
    // Validate first required tags
    const requiredTags = new Set(Tag.rss.requiredTags);
    for (const key in rss) {
      if (requiredTags.has(key)) {
        requiredTags.delete(key);
      }
    }

    if (requiredTags.size) {
      for (const key of requiredTags) {
        const issue = errorIssue(
          'MISSING_REQUIRED_TAG',
          `Required property "${key}" is missing`,
          key
        );
        this.errors.push(issue);
        this.rss.errors.push(issue);
      }
      return;
    }

    // Warn on tags that are invalid at the rss level. Not deleted from
    // `this.data`: `build()` only ever reads known, explicitly destructured
    // fields, so leaving unrecognized keys in place costs nothing and keeps
    // validate() from mutating the parsed input.
    for (const key in rss) {
      if (!Tag.rss.validTags.has(key)) {
        this.rss.warnings.push(
          warningIssue('INVALID_TAG', `Invalid property "${key}"`, key)
        );
      }
    }
  }

  private validateChannel() {
    const { channel } = this.data.rss;
    // Validate first required tags
    const requiredTags = new Set(Tag.rss.channel.requiredTags);
    for (const key in channel) {
      if (requiredTags.has(key)) {
        requiredTags.delete(key);
      }
    }

    if (requiredTags.size) {
      for (const key of requiredTags) {
        const issue = errorIssue(
          'MISSING_REQUIRED_TAG',
          `Required property "${key}" is missing`,
          key
        );
        this.errors.push(issue);
        this.rss.channel.errors.push(issue);
      }
      return;
    }

    // Warn without deleting — see the comment in `validateRSS`.
    for (const key in channel) {
      if (!Tag.rss.channel.validTags.has(key)) {
        this.rss.channel.warnings.push(
          warningIssue('INVALID_TAG', `Invalid property "${key}"`, key)
        );
      }
    }
  }

  private validateItems(items: Array<Record<string, unknown>>) {
    /* v8 ignore next 3 -- validateItems is only ever called with arrays */
    if (!isIterable(items)) {
      return;
    }
    for (const item of items) {
      this.validateItem(item);
    }
  }

  private validateItem(item: Record<string, unknown>) {
    // Validate first required tags
    const requiredTags = new Set(Tag.rss.channel.item.requiredTags);
    for (const key in item) {
      if (requiredTags.has(key)) {
        requiredTags.delete(key);
      }
    }

    const errors: FeedIssue[] = [];
    if (requiredTags.size) {
      for (const key of requiredTags) {
        const issue = errorIssue(
          'MISSING_REQUIRED_TAG',
          `Required property "${key}" is missing`,
          key
        );
        errors.push(issue);
        this.errors.push(issue);
      }
      return;
    }

    const warnings: FeedIssue[] = [];
    for (const key in item) {
      if (!Tag.rss.channel.item.validTags.has(key)) {
        warnings.push(
          warningIssue('INVALID_TAG', `Invalid property "${key}"`, key)
        );
      }
    }

    item.errors = errors;
    item.warnings = warnings;
  }
}

// ---------------------------------------------------------------------------
// Exported standalone item builder
// ---------------------------------------------------------------------------

/**
 * Build a typed `Item` from a raw `ParsedItem`. Extracted from `RSSFeed` so
 * it can be unit-tested directly with a plain `ParsedItem` object — no XML
 * round-trip or `RSSFeed` instance required.
 *
 * @param {ParsedItem} item
 * @param {BuildItemContext} ctx
 * @returns {Item}
 */

export function buildItem(item: ParsedItem, ctx: BuildItemContext): Item {
  const { origin, root, params } = ctx;

  let guid: string | undefined = undefined;
  if (typeof item.guid === 'string') {
    guid = item.guid;
  } else if (typeof item.guid === 'object' && item?.guid) {
    const g = item.guid as { '#text'?: unknown };
    guid = `${g['#text']}`;
  }
  const title = item.title?.trim();
  const description = item.description
    ? removeHTMLTags(`${item.description}`)
    : undefined;
  const link = item.link?.trim();
  let contentEncoded =
    typeof item['content:encoded'] === 'string'
      ? item['content:encoded'].trim()
      : '';

  const rawContent = `${contentEncoded}`;
  contentEncoded = decodeEntities(rawContent);
  if (root && contentEncoded) {
    const rootElement = HTMLMapper.getRootElement(contentEncoded, root);
    if (rootElement) {
      contentEncoded = rootElement;
    }
  }
  const errors: FeedIssue[] = item.errors ?? [];
  const warnings: FeedIssue[] = item.warnings ?? [];

  let pubDate: string | undefined;
  if (item.pubDate) {
    const parsedPubDate = parseDate(item.pubDate);
    if (parsedPubDate) {
      pubDate = parsedPubDate;
    } else {
      pubDate = item.pubDate;
      warnings.push(
        warningIssue(
          'UNPARSEABLE_DATE',
          `Unable to parse pubDate: "${item.pubDate}"`,
          'pubDate'
        )
      );
    }
  }

  const category: Array<string | { '#text': string }> = item.category
    ? Array.isArray(item.category)
      ? item.category.map((c) =>
          typeof c === 'string' || typeof c === 'number'
            ? `${c}`.trim()
            : (c as { '#text': string })
        )
      : [
          typeof item.category === 'string'
            ? item.category.trim()
            : (item.category as { '#text': string }),
        ]
    : [];

  const dcCreator = Array.isArray(item['dc:creator'])
    ? item['dc:creator'].map((c) => c.trim()).join(', ')
    : item['dc:creator'];
  const mediaContent = getMediaContent(item, origin);

  const response: Item = {
    guid,
    title: title ? decodeEntities(title.trim()) : '',
    category: category
      .filter((i) => !!i)
      .map((c) => {
        if (typeof c === 'string') return c.trim();
        return c['#text'].trim();
      }),
    description: description
      ? removeHTMLTags(decodeEntities(description))
      : description,
    link,
    pubDate,
    enclosure: getEnclosure(item),
    mediaGroup: getMediaGroup(item, origin),
    mediaContent,
    components: [],
    warnings,
    errors,
    'content:encoded': contentEncoded,
    'cf:hasAffiliateLinks': false,
    'cf:isSponsored': false,
    'cf:liveCoverageState': undefined,
    'cf:isPaid': false,
    'dc:creator': dcCreator ? `${dcCreator}`.trim() : undefined,
    'dc:date': item['dc:date'] ? `${item['dc:date']}` : undefined,
    'dc:language': item['dc:language']
      ? `${item['dc:language']}`.trim()
      : undefined,
    'dcterms:modified': item['dcterms:modified']
      ? `${item['dcterms:modified']}`
      : undefined,
    'atom:author': item['atom:author'] ?? undefined,
    'atom:updated': item['atom:updated']
      ? `${item['atom:updated']}`
      : undefined,
  };

  Object.assign(
    response,
    buildCanvasflowFlags(item, response.errors, response.warnings)
  );

  response['cf:thumbnail'] = buildThumbnail(
    item,
    response.errors,
    response.warnings
  );

  if (contentEncoded) {
    response.components = HTMLMapper.toComponents(contentEncoded, params, root);
  }

  return response;
}

// ---------------------------------------------------------------------------
// Module-level helpers (not exported — internal to the RSS module)
// ---------------------------------------------------------------------------

function buildThumbnail(
  item: ParsedItem,
  errors: FeedIssue[],
  warnings: FeedIssue[]
): Thumbnail | undefined {
  if (!item['cf:thumbnail']) return undefined;

  const cfThumbnail = item['cf:thumbnail'] as {
    '@_url'?: string;
    '@_width'?: string;
    '@_height'?: string;
    '@_type'?: string;
    '@_fileSize'?: string;
  };
  const thumbnail: Thumbnail = {
    url: cfThumbnail['@_url'] ?? '',
    width: cfThumbnail['@_width']
      ? parseInt(cfThumbnail['@_width'], 10)
      : undefined,
    height: cfThumbnail['@_height']
      ? parseInt(cfThumbnail['@_height'], 10)
      : undefined,
    type: cfThumbnail['@_type'] || undefined,
    fileSize: cfThumbnail['@_fileSize']
      ? parseInt(cfThumbnail['@_fileSize'], 10)
      : undefined,
  };
  if (!thumbnail.url) {
    errors.push(
      errorIssue(
        'MISSING_URL',
        `Required property "url" is missing in 'cf:thumbnail'`,
        'cf:thumbnail.url'
      )
    );
  }
  if (thumbnail.type !== undefined) {
    /* v8 ignore next 5 -- @_type is parsed as a string when present */
    if (typeof thumbnail.type !== 'string') {
      warnings.push(
        warningIssue(
          'INVALID_THUMBNAIL_TYPE',
          `Invalid value for property 'type' in 'cf:thumbnail'`,
          'cf:thumbnail.type'
        )
      );
      thumbnail.type = undefined;
    } else {
      const validMimeTypes = new Set([
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
      ]);
      if (!validMimeTypes.has(thumbnail.type)) {
        warnings.push(
          warningIssue(
            'INVALID_THUMBNAIL_TYPE',
            `Invalid value for property 'type' in 'cf:thumbnail'.`,
            'cf:thumbnail.type'
          )
        );
        thumbnail.type = undefined;
      }
    }
  }
  if (thumbnail.width !== undefined && isNaN(thumbnail.width)) {
    warnings.push(
      warningIssue(
        'INVALID_THUMBNAIL_DIMENSION',
        `Invalid value for property 'width' in 'cf:thumbnail'`,
        'cf:thumbnail.width'
      )
    );
    thumbnail.width = undefined;
  }
  if (thumbnail.height !== undefined && isNaN(thumbnail.height)) {
    warnings.push(
      warningIssue(
        'INVALID_THUMBNAIL_DIMENSION',
        `Invalid value for property 'height' in 'cf:thumbnail'`,
        'cf:thumbnail.height'
      )
    );
    thumbnail.height = undefined;
  }
  if (thumbnail.fileSize !== undefined && isNaN(thumbnail.fileSize)) {
    warnings.push(
      warningIssue(
        'INVALID_THUMBNAIL_DIMENSION',
        `Invalid value for property 'fileSize' in 'cf:thumbnail'`,
        'cf:thumbnail.fileSize'
      )
    );
    thumbnail.fileSize = undefined;
  }
  return thumbnail;
}

function buildCanvasflowFlags(
  item: ParsedItem,
  errors: FeedIssue[],
  warnings: FeedIssue[]
): {
  'cf:hasAffiliateLinks': boolean;
  'cf:isSponsored': boolean;
  'cf:isPaid': boolean;
  'cf:liveCoverageState': string | null | undefined;
} {
  const flags: CanvasflowBooleanTarget & {
    'cf:liveCoverageState': string | null | undefined;
  } = {
    'cf:hasAffiliateLinks': false,
    'cf:isSponsored': false,
    'cf:isPaid': false,
    'cf:liveCoverageState': undefined,
    errors,
    warnings,
  };

  processCanvasflowBooleanTag(item, flags, 'cf:hasAffiliateLinks');
  processCanvasflowBooleanTag(item, flags, 'cf:isSponsored');
  processCanvasflowBooleanTag(item, flags, 'cf:isPaid');

  if (item['cf:liveCoverageState']) {
    const liveCoverageState = item['cf:liveCoverageState'] as {
      '@_state'?: string;
    };
    flags['cf:liveCoverageState'] =
      liveCoverageState['@_state'] === 'live' ||
      liveCoverageState['@_state'] === 'completed'
        ? liveCoverageState['@_state']
        : null;
  }

  return flags;
}

function processCanvasflowBooleanTag(
  item: Record<string, unknown>,
  response: CanvasflowBooleanTarget,
  tagName: CanvasflowBooleanTag
): void {
  if (!item[tagName]) {
    return;
  }
  if (typeof item[tagName] === 'boolean') {
    response[tagName] = item[tagName] as boolean;
    return;
  }

  if (typeof item[tagName] !== 'object') {
    response.errors.push(
      errorIssue(
        'INVALID_BOOLEAN_TAG',
        `Invalid value for '${tagName}': "${item[tagName]}". Expected a boolean, "true", or "false".`,
        tagName
      )
    );
    return;
  }

  if (
    item[tagName] !== null &&
    typeof (item[tagName] as { [key: string]: unknown })['#text'] === 'string'
  ) {
    response.warnings.push(
      warningIssue(
        'INVALID_BOOLEAN_TAG',
        `Attributes are not allowed for the '${tagName}' property.`,
        tagName
      )
    );
    const text = (item[tagName] as { [key: string]: unknown })[
      '#text'
    ] as string;
    /* v8 ignore next 4 -- the parser coerces "true"/"false" text to booleans */
    if (text === 'true' || text === 'false') {
      response[tagName] = text === 'true';
      return;
    }
    response.errors.push(
      errorIssue(
        'INVALID_BOOLEAN_TAG',
        `Invalid value for '${tagName}': "${text}". Expected "true" or "false".`,
        tagName
      )
    );
  }
}

function getEnclosure(item: Record<string, unknown>): Array<Enclosure> {
  if (!item.enclosure) {
    return [];
  }

  const enclosure: Array<Attributes.Enclosure> = Array.isArray(item.enclosure)
    ? item.enclosure
    : [item.enclosure as Attributes.Enclosure];

  return enclosure.map(mapEnclosure);
}

function getMediaGroup(
  item: Record<string, unknown>,
  origin: string | undefined
): Array<MediaGroup> {
  if (!item['media:group']) {
    return [];
  }

  const mediaGroup: Array<Attributes.MediaGroup> = Array.isArray(
    item['media:group']
  )
    ? item['media:group']
    : [item['media:group'] as Attributes.MediaGroup];

  return mediaGroup.map(mapMediaGroup(origin));
}

function getMediaContent(
  item: Record<string, unknown>,
  origin: string | undefined
): Array<MediaContent> {
  if (!item['media:content']) {
    return [];
  }

  const mediaContent: Array<Attributes.MediaContent> = Array.isArray(
    item['media:content']
  )
    ? item['media:content']
    : [item['media:content']];

  return mediaContent.map(mapMediaContent(origin));
}

// ---------------------------------------------------------------------------
// XML attribute mappers (unchanged)
// ---------------------------------------------------------------------------

/**
 * Map a raw `<enclosure>` attribute object to a typed `Enclosure`, recording
 * errors/warnings for missing url/type/length.
 *
 * @param {Attributes.Enclosure} e
 * @returns {Enclosure}
 */
function mapEnclosure(e: Attributes.Enclosure): Enclosure {
  const errors: FeedIssue[] = [];
  const warnings: FeedIssue[] = [];
  if (!e['@_url']) {
    errors.push(
      errorIssue('MISSING_URL', `Required property "url" is missing`, 'url')
    );
  }
  if (!e['@_type']) {
    warnings.push(
      warningIssue('SUGGESTED_PROPERTY', `Property "type" is suggested`, 'type')
    );
  }
  if (!e['@_length']) {
    warnings.push(
      warningIssue(
        'SUGGESTED_PROPERTY',
        `Property "length" is suggested`,
        'length'
      )
    );
  }
  return {
    length: e['@_length'] ? parseInt(`${e['@_length']}`, 10) : 0,
    type: e['@_type'] ?? '',
    url: e['@_url'] ?? '',
    errors,
    warnings,
  };
}

/**
 * Build a mapper from raw `<media:group>` objects to typed `MediaGroup`s,
 * resolving contained media content against `origin`.
 *
 * @param {string | undefined} origin
 * @returns {(mediaGroup: Attributes.MediaGroup) => MediaGroup}
 */
function mapMediaGroup(
  origin: string | undefined
): (mediaGroup: Attributes.MediaGroup) => MediaGroup {
  return (mediaGroup: Attributes.MediaGroup): MediaGroup => {
    const errors: FeedIssue[] = [];
    const warnings: FeedIssue[] = [];
    const mediaContent = mediaGroup['media:content'];
    if (!mediaContent) {
      errors.push(
        errorIssue(
          'MISSING_MEDIA_CONTENT',
          `Required property "media:content" is missing`,
          'media:content'
        )
      );
    }
    return {
      title: mediaGroup['media:title'],
      mediaContent: mediaContent
        ? mediaContent.map(mapMediaContent(origin))
        : [],
      errors,
      warnings,
    };
  };
}

/**
 * Build a mapper from raw `<media:content>` objects to typed `MediaContent`,
 * normalising credit/thumbnail/title/description and resolving relative URLs
 * against `origin`.
 *
 * @param {string | undefined} origin
 * @returns {(mediaContent: Attributes.MediaContent) => MediaContent}
 */
function mapMediaContent(
  origin: string | undefined
): (mediaContent: Attributes.MediaContent) => MediaContent {
  return (mediaContent: Attributes.MediaContent): MediaContent => {
    const errors: FeedIssue[] = [];
    const warnings: FeedIssue[] = [];
    let url = mediaContent['@_url'] ?? '';
    const type = mediaContent['@_type'];
    const medium = mediaContent['@_medium'];
    let credit: string | undefined;
    let thumbnail: string | undefined;
    let title: string | undefined;
    let description: string | undefined;
    const isDefault: undefined | boolean = mediaContent['@_isDefault']
      ? mediaContent['@_isDefault'] === 'true'
      : undefined;

    if (!url) {
      errors.push(
        errorIssue('MISSING_URL', `Required property "url" is missing`, 'url')
      );
    }
    if (!type) {
      warnings.push(
        warningIssue(
          'SUGGESTED_PROPERTY',
          `Property "type" is suggested`,
          'type'
        )
      );
    }
    if (!medium && !type) {
      warnings.push(
        warningIssue(
          'SUGGESTED_PROPERTY',
          `Property "medium" is suggested`,
          'medium'
        )
      );
    }

    let tmpCredit = mediaContent['media:credit'];
    if (tmpCredit) {
      if (Array.isArray(tmpCredit)) {
        warnings.push(
          warningIssue(
            'DUPLICATE_MEDIA_FIELD',
            'Only one "media:credit" element is allowed',
            'media:credit'
          )
        );
        tmpCredit = tmpCredit[0];
      }

      if (typeof tmpCredit === 'string') {
        credit = tmpCredit;
      }

      if (tmpCredit && tmpCredit['#text']) {
        credit = tmpCredit['#text'];
      }
    }

    let tmpThumbnail = mediaContent['media:thumbnail'];
    if (tmpThumbnail) {
      if (Array.isArray(tmpThumbnail)) {
        warnings.push(
          warningIssue(
            'DUPLICATE_MEDIA_FIELD',
            'Only one "media:thumbnail" element is allowed',
            'media:thumbnail'
          )
        );
        tmpThumbnail = tmpThumbnail[0];
      }

      thumbnail = tmpThumbnail?.['@_url'];
    }

    const tmpTitle = mediaContent['media:title'];
    if (tmpTitle) {
      if (typeof tmpTitle === 'string') {
        title = tmpTitle;
      } else {
        title = tmpTitle['#text'];
      }
    }

    const tmpDescription = mediaContent['media:description'];
    if (tmpDescription) {
      if (typeof tmpDescription === 'string') {
        description = tmpDescription;
      } else {
        description = tmpDescription?.['#text'];
      }
    }

    if (url && !url.startsWith('http') && !url.startsWith('https')) {
      warnings.push(
        warningIssue(
          'RELATIVE_MEDIA_URL',
          `Property "url" is not an absolute URL`,
          'url'
        )
      );
      if (origin && URL.canParse(url, origin)) {
        url = new URL(url, origin).href;
      }
    }

    return {
      url,
      type,
      medium,
      isDefault,
      errors,
      warnings,
      credit: credit ? credit.trim() : credit,
      thumbnail,
      title: title ? title.trim() : title,
      description: description ? description.trim() : description,
    };
  };
}

/**
 * Summarize a Zod validation failure into a single `FeedIssue`, joining every
 * underlying issue's path/message so callers get one structured entry per
 * invalid schema instead of raw `ZodIssue[]` output.
 *
 * @param {FeedIssueCode} code
 * @param {Array<{ path: PropertyKey[]; message: string }>} issues
 * @returns {FeedIssue}
 */
function toFeedIssue(
  code: FeedIssueCode,
  issues: Array<{ path: PropertyKey[]; message: string }>
): FeedIssue {
  const message = issues
    .map((issue) => {
      const path = issue.path.map(String).join('.');
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join('; ');

  return { code, severity: 'error', message };
}

/**
 * Determine whether the given `input` is iterable.
 *
 * @returns {Boolean}
 */
function isIterable(input: unknown): boolean {
  /* v8 ignore next 3 -- only invoked with concrete arrays today */
  if (input === null || input === undefined) {
    return false;
  }

  return (
    typeof (input as { [Symbol.iterator]: unknown })[Symbol.iterator] ===
    'function'
  );
}

/**
 * Remove the HTML content from the string
 *
 * @returns {string}
 */
function removeHTMLTags(content: string): string {
  return `${sanitizeHtml(decodeEntities(content), {
    allowedTags: [], // Strips all HTML tags
    allowedAttributes: {}, // Strips all attributes
  })}`.trim();
}
