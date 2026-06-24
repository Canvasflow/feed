import { DateTime } from 'luxon';
import he from 'he';
import sanitizeHtml from 'sanitize-html';
import { XMLParser } from 'fast-xml-parser';
import { parseHTML } from 'linkedom';

import type {
  RSS,
  Item,
  Enclosure,
  MediaContent,
  MediaGroup,
  Thumbnail,
} from './RSS';
import { replaceErrors } from './RSS';
export { replaceErrors };
import { Tag } from './Tag';
import * as Attributes from './Attributes';
import { HTMLMapper } from '../component/html/HTMLMapper';
import type { Recipe } from '../component/schema/Schema';
import {
  isValidParams,
  type Mapping,
  type Params,
} from '../component/mapping/Mapping';
import {
  MappingSchema,
  ParamsSchema,
} from '../component/mapping/Mapping.schema';
import type { ParsedXml, ParsedItem } from './ParsedXml';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * Context consumed by the standalone `buildItem` function.
 * Mirrors the three private fields of `RSSFeed` that `buildItem` previously
 * accessed via `this`.
 */
export interface BuildItemContext {
  origin?: string;
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
} & { errors: string[]; warnings: string[] };

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
  public errors: string[] = [];
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
    const parser = new XMLParser({
      ignoreAttributes: false,
      processEntities: false,
    });
    this.data = parser.parse(content);
    if (params && isValidParams(params)) {
      this.params = params;
    }

    this.rss = {
      errors: [],
      warnings: [],
      channel: {
        items: [],
        errors: [],
        warnings: [],
      },
    };
  }

  set root(rootMapping: Mapping | undefined) {
    this._root = rootMapping;
  }

  static async getRecipeFromUrl(url: string): Promise<Recipe | null> {
    let recipe: Recipe | null = null;
    const html = await this.getHtmlContent(url);
    const { document } = parseHTML(html);
    const scripts = document.querySelectorAll(
      'script[type="application/ld+json"]'
    );
    for (const element of scripts) {
      const content = element.textContent;
      if (!content) {
        continue;
      }
      const parseContent = JSON.parse(content);
      if (parseContent['@type'] && parseContent['@type'] === 'Recipe') {
        recipe = parseContent as Recipe;
        break;
      }
      if (parseContent['@graph'] && parseContent['@graph'].length) {
        for (const item of parseContent['@graph']) {
          if (item['@type'] && item['@type'] === 'Recipe') {
            recipe = item as Recipe;
            break;
          }
        }
        if (recipe) {
          break;
        }
      }
    }

    return recipe;
  }

  static async getHtmlContent(url: string, headers?: HeadersInit) {
    const response = await fetch(url, { method: 'GET', headers });
    return response.text();
  }

  async validate(): Promise<void> {
    const { data } = this;
    this.errors = [];
    this._validated = true;

    if (!data.rss) {
      const error = 'Required property "rss" is missing at the root level';
      this.errors.push(error);
      this.rss.errors.push(error);
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

  static validateParams(params?: Params, root?: Mapping): Array<unknown> {
    const errors: Array<unknown> = [];
    if (params) {
      try {
        const result = ParamsSchema.safeParse(params);

        if (!result.success) {
          const paramsError = { params: result.error.issues };
          errors.push(paramsError);
        }
        /* v8 ignore next 3 -- safeParse does not throw; defensive catch */
      } catch (e) {
        errors.push(e);
      }
    }

    if (root) {
      try {
        const result = MappingSchema.safeParse(root);

        if (!result.success) {
          const rootError = {
            root: result.error.issues,
          };
          errors.push(rootError);
        }
        /* v8 ignore next 3 -- safeParse does not throw; defensive catch */
      } catch (e) {
        errors.push(e);
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
      const url = new URL(link);
      this.origin = url.origin;
    }

    let lastBuildDate: undefined | string;
    if (channel.lastBuildDate) {
      const lastBuildDateTime = DateTime.fromJSDate(
        new Date(`${channel.lastBuildDate}`)
      );
      if (lastBuildDateTime.isValid) {
        lastBuildDate = lastBuildDateTime.toISO();
      }
    }

    let pubDate: undefined | string;
    if (channel.pubDate) {
      const pubDateTime = DateTime.fromJSDate(new Date(`${channel.pubDate}`));
      if (pubDateTime.isValid) {
        pubDate = pubDateTime.toISO();
      }
    }

    this.rss.channel.title = he.decode(title);
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
      image.title = he.decode(image.title);
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
        'Required property "item" is missing in channel'
      );
    }

    return this.rss;
  }

  static toJSON(rss: RSS): unknown {
    return JSON.parse(this.toString(rss));
  }

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
        const error = `Missing required property '${key}'`;
        this.errors.push(error);
        this.rss.errors.push(error);
      }
      return;
    }

    // Add warning for tags that are invalid at the rss level
    for (const key in rss) {
      if (!Tag.rss.validTags.has(key)) {
        this.rss.warnings.push(`Invalid property "${key}"`);
        delete rss[key];
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
        this.errors.push(`Required property "${key}" is missing`);
        this.rss.channel.errors.push(`Required property "${key}" is missing`);
      }
      return;
    }

    // Add warning for tags that are invalid at the rss level
    for (const key in channel) {
      if (!Tag.rss.channel.validTags.has(key)) {
        this.rss.channel.warnings.push(`Invalid property "${key}"`);
        delete channel[`${key}`];
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

    const errors: string[] = [];
    if (requiredTags.size) {
      for (const key of requiredTags) {
        const error = `Required property "${key}" is missing`;
        errors.push(error);
        this.errors.push(error);
      }
      return;
    }

    const warnings: string[] = [];
    for (const key in item) {
      if (!Tag.rss.channel.item.validTags.has(key)) {
        warnings.push(`Invalid property "${key}"`);
        delete item[`${key}`];
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
    ? removeHTMLTags(item.description)
    : undefined;
  const link = item.link?.trim();
  let contentEncoded =
    typeof item['content:encoded'] === 'string'
      ? item['content:encoded'].trim()
      : '';

  const rawContent = `${contentEncoded}`;
  contentEncoded = he.decode(rawContent);
  if (root && contentEncoded) {
    const rootElement = HTMLMapper.getRootElement(contentEncoded, root);
    if (rootElement) {
      contentEncoded = rootElement;
    }
  }
  const errors: string[] = item.errors ?? [];
  const warnings: string[] = item.warnings ?? [];

  let pubDate: string | undefined;
  if (item.pubDate) {
    const pubDateTime = DateTime.fromJSDate(new Date(item.pubDate));
    if (pubDateTime.isValid) {
      pubDate = pubDateTime.toISO() ?? undefined;
    } else {
      pubDate = item.pubDate;
      warnings.push(`Unable to parse pubDate: "${item.pubDate}"`);
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

  if (Array.isArray(item['dc:creator'])) {
    item['dc:creator'] = item['dc:creator'].map((c) => c.trim()).join(', ');
  }
  const mediaContent = getMediaContent(item, origin);

  const response: Item = {
    guid,
    title: title ? he.decode(title.trim()) : '',
    category: category
      .filter((i) => !!i)
      .map((c) => {
        if (typeof c === 'string') return c.trim();
        return c['#text'].trim();
      }),
    description: description
      ? removeHTMLTags(he.decode(description))
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
    'dc:creator': item['dc:creator']
      ? `${item['dc:creator']}`.trim()
      : undefined,
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
    response.components = HTMLMapper.toComponents(contentEncoded, params);
  }

  return response;
}

// ---------------------------------------------------------------------------
// Module-level helpers (not exported — internal to the RSS module)
// ---------------------------------------------------------------------------

function buildThumbnail(
  item: ParsedItem,
  errors: string[],
  warnings: string[]
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
    errors.push(`Required property "url" is missing in 'cf:thumbnail'`);
  }
  if (thumbnail.type !== undefined) {
    /* v8 ignore next 5 -- @_type is parsed as a string when present */
    if (typeof thumbnail.type !== 'string') {
      warnings.push(`Invalid value for property 'type' in 'cf:thumbnail'`);
      thumbnail.type = undefined;
    } else {
      const validMimeTypes = new Set([
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
      ]);
      if (!validMimeTypes.has(thumbnail.type)) {
        warnings.push(`Invalid value for property 'type' in 'cf:thumbnail'.`);
        thumbnail.type = undefined;
      }
    }
  }
  if (thumbnail.width !== undefined && isNaN(thumbnail.width)) {
    warnings.push(`Invalid value for property 'width' in 'cf:thumbnail'`);
    thumbnail.width = undefined;
  }
  if (thumbnail.height !== undefined && isNaN(thumbnail.height)) {
    warnings.push(`Invalid value for property 'height' in 'cf:thumbnail'`);
    thumbnail.height = undefined;
  }
  if (thumbnail.fileSize !== undefined && isNaN(thumbnail.fileSize)) {
    warnings.push(`Invalid value for property 'fileSize' in 'cf:thumbnail'`);
    thumbnail.fileSize = undefined;
  }
  return thumbnail;
}

function buildCanvasflowFlags(
  item: ParsedItem,
  errors: string[],
  warnings: string[]
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
      `Invalid value for '${tagName}': "${item[tagName]}". Expected a boolean, "true", or "false".`
    );
    return;
  }

  if (
    item[tagName] !== null &&
    typeof (item[tagName] as { [key: string]: unknown })['#text'] === 'string'
  ) {
    response.warnings.push(
      `Attributes are not allowed for the '${tagName}' property.`
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
      `Invalid value for '${tagName}': "${text}". Expected "true" or "false".`
    );
  }
}

function getEnclosure(item: Record<string, unknown>): Array<Enclosure> {
  if (!item.enclosure) {
    return [];
  }

  if (!Array.isArray(item.enclosure)) {
    item.enclosure = [item.enclosure];
  }

  return (item.enclosure as Array<Attributes.Enclosure>).map(mapEnclosure);
}

function getMediaGroup(
  item: Record<string, unknown>,
  origin: string | undefined
): Array<MediaGroup> {
  if (!item['media:group']) {
    return [];
  }

  if (!Array.isArray(item['media:group'])) {
    item['media:group'] = [item['media:group']];
  }
  return (item['media:group'] as Array<Attributes.MediaGroup>).map(
    mapMediaGroup(origin)
  );
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
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!e['@_url']) {
    errors.push(`Required property "url" is missing`);
  }
  if (!e['@_type']) {
    warnings.push(`Property "type" is suggested`);
  }
  if (!e['@_length']) {
    warnings.push(`Property "length" is suggested`);
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
    const errors: string[] = [];
    const warnings: string[] = [];
    const mediaContent = mediaGroup['media:content'];
    if (!mediaContent) {
      errors.push(`Required property "media:content" is missing`);
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
    const errors: string[] = [];
    const warnings: string[] = [];
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
      errors.push(`Required property "url" is missing`);
    }
    if (!type) {
      warnings.push(`Property "type" is suggested`);
    }
    if (!medium && !type) {
      warnings.push(`Property "medium" is suggested`);
    }

    let tmpCredit = mediaContent['media:credit'];
    if (tmpCredit) {
      if (Array.isArray(tmpCredit)) {
        warnings.push('Only one "media:credit" element is allowed');
        tmpCredit = tmpCredit[0];
      }

      if (typeof tmpCredit === 'string') {
        credit = tmpCredit;
      }

      if (tmpCredit['#text']) {
        credit = tmpCredit['#text'];
      }
    }

    let tmpThumbnail = mediaContent['media:thumbnail'];
    if (tmpThumbnail) {
      if (Array.isArray(tmpThumbnail)) {
        warnings.push('Only one "media:thumbnail" element is allowed');
        tmpThumbnail = tmpThumbnail[0];
      }

      thumbnail = tmpThumbnail['@_url'];
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
      warnings.push(`Property "url" is not an absolute URL`);
      if (origin) {
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
  return `${sanitizeHtml(he.decode(content), {
    allowedTags: [], // Strips all HTML tags
    allowedAttributes: {}, // Strips all attributes
  })}`.trim();
}
