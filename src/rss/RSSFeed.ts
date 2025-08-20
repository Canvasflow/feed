import { DateTime } from 'luxon';
import { XMLParser } from 'fast-xml-parser';

import type { RSS, Item, Enclosure, MediaContent, MediaGroup } from './RSS';
import { Tag } from './Tag';

import * as Attributes from './Attributes';
import {
  HTMLMapper,
  type Params,
  isValidParams,
} from '../component/HTMLMapper';

export default class RSSFeed {
  public content: string;
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  public data: any;
  public rss: RSS;
  public errors: Error[] = [];
  private params: Params | undefined;

  constructor(content: string, params?: Params) {
    this.content = content;
    const parser = new XMLParser({
      ignoreAttributes: false,
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

  async validate(): Promise<void> {
    const { data } = this;
    this.errors = [];
    if (!data.rss) {
      const error = new Error('rss missing at root level');
      this.errors.push(error);
      this.rss.errors.push(error);
      return;
    }

    this.validateRSS();

    this.validateChannel();
    if (this.rss.channel.errors.length) {
      return;
    }

    this.validateItems(data.rss.channel.item);
  }

  async build(): Promise<RSS> {
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

    this.rss.channel.title = title;
    this.rss.channel.link = link;
    this.rss.channel.description = description;
    this.rss.channel.language = language;
    this.rss.channel.lastBuildDate = lastBuildDate;
    this.rss.channel.docs = docs;
    this.rss.channel.category = category;
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
    if (channel.item) {
      for (const item of channel.item) {
        this.rss.channel.items.push(this.buildItem(item));
      }
    } else {
      this.rss.channel.errors.push(
        new Error('channel do not have item elements')
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
    const requiredTags = new Set([...Tag.rss.requiredTags]);
    for (const key in rss) {
      if (requiredTags.has(key)) {
        requiredTags.delete(key);
      }
    }

    if (requiredTags.size) {
      for (const key of [...requiredTags]) {
        const error = new Error(`Required property "${key}" is missing`);
        this.errors.push(error);
        this.rss.errors.push(error);
      }
      return;
    }

    // Add warning for tags that are invalid at the rss level
    for (const key in rss) {
      if (!Tag.rss.validTags.has(key)) {
        this.rss.warnings.push(`Invalid property '${key}'`);
        delete rss[key];
      }
    }
  }

  private validateChannel() {
    const { channel } = this.data.rss;
    // Validate first required tags
    const requiredTags = new Set([...Tag.rss.channel.requiredTags]);
    for (const key in channel) {
      if (requiredTags.has(key)) {
        requiredTags.delete(key);
      }
    }

    if (requiredTags.size) {
      for (const key of [...requiredTags]) {
        this.errors.push(new Error(`Required property "${key}" is missing`));
        this.rss.channel.errors.push(
          new Error(`Required property "${key}" is missing`)
        );
      }
      return;
    }

    // Add warning for tags that are invalid at the rss level
    for (const key in channel) {
      if (!Tag.rss.channel.validTags.has(key)) {
        this.rss.channel.warnings.push(`Invalid property '${key}'`);
        delete channel[`${key}`];
      }
    }
  }

  private validateItems(items: Array<Record<string, unknown>>) {
    for (const item of items) {
      this.validateItem(item);
    }
  }

  private validateItem(item: Record<string, unknown>) {
    // Validate first required tags
    const requiredTags = new Set([...Tag.rss.channel.item.requiredTags]);
    for (const key in item) {
      if (requiredTags.has(key)) {
        requiredTags.delete(key);
      }
    }

    const errors: Error[] = [];
    if (requiredTags.size) {
      for (const key of [...requiredTags]) {
        const error = new Error(`Required property "${key}" is missing`);
        errors.push(error);
        this.errors.push(error);
      }
      return;
    }

    const warnings: string[] = [];
    for (const key in item) {
      if (!Tag.rss.channel.item.validTags.has(key)) {
        warnings.push(`Invalid property '${key}'`);
        delete item[`${key}`];
      }
    }

    item.errors = errors;
    item.warnings = warnings;
  }

  private buildItem(item: Record<string, unknown>): Item {
    let guid: string | undefined = undefined;
    if (typeof item.guid === 'string') {
      guid = item.guid;
    } else if (typeof item.guid === 'object' && item?.guid) {
      // eslint-disable-next-line  @typescript-eslint/no-explicit-any
      const g = item?.guid as any;
      guid = `${g['#text']}`;
    }
    const title =
      typeof item.title === 'string' ? item.title.trim() : undefined;
    const description =
      typeof item.description === 'string'
        ? item.description.trim()
        : undefined;
    const link = typeof item.link === 'string' ? item.link.trim() : undefined;
    const contentEncoded =
      typeof item['content:encoded'] === 'string'
        ? item['content:encoded'].trim()
        : '';
    let errors: Error[] = [];
    let warnings: string[] = [];
    if (item.errors && Array.isArray(item.errors)) {
      errors = item.errors;
    }
    if (item.warnings && Array.isArray(item.warnings)) {
      warnings = item.warnings;
    }
    const category: Array<string | { '#text': string }> = item.category
      ? Array.isArray(item.category)
        ? item.category.map((c) => (typeof c === 'string' ? c.trim() : c))
        : [
            typeof item.category === 'string'
              ? item.category.trim()
              : item.category,
          ]
      : [];

    let pubDate: undefined | string;
    if (item.pubDate) {
      const pubDateTime = DateTime.fromJSDate(new Date(`${item.pubDate}`));
      if (pubDateTime.isValid) {
        pubDate = pubDateTime.toISO();
      }
    }

    if (item['dc:creator'] && Array.isArray(item['dc:creator'])) {
      item['dc:creator'] = item['dc:creator']
        .map((c: string) => c.trim())
        .join(', ');
    }

    const response: Item = {
      guid,
      title: title ? title.trim() : '',
      category: category.map((c) => {
        if (typeof c === 'string') return c;
        return c['#text'];
      }),
      description,
      link,
      pubDate,
      enclosure: this.getEnclosure(item),
      mediaGroup: this.getMediaGroup(item),
      mediaContent: this.getMediaContent(item),
      components: [],
      warnings,
      errors,
      'content:encoded': contentEncoded,
      'cf:hasAffiliateLinks': false,
      'cf:isSponsored': false,
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
      'atom:updated': item['atom:updated']
        ? `${item['atom:updated']}`
        : undefined,
    };

    if (item['cf:hasAffiliateLinks']) {
      if (typeof item['cf:hasAffiliateLinks'] === 'boolean') {
        response['cf:hasAffiliateLinks'] = item['cf:hasAffiliateLinks'];
      } else {
        warnings.push(
          `the value for 'cf:hasAffiliateLinks' is invalid: "${item['cf:hasAffiliateLinks']}"`
        );
      }
    }

    if (item['cf:isSponsored']) {
      if (typeof item['cf:isSponsored'] === 'boolean') {
        response['cf:isSponsored'] = item['cf:isSponsored'];
      } else {
        warnings.push(
          `the value for 'cf:isSponsored' is invalid: "${item['cf:isSponsored']}"`
        );
      }
    }

    if (item['cf:isPaid']) {
      if (typeof item['cf:isPaid'] === 'boolean') {
        response['cf:isPaid'] = item['cf:isPaid'];
      } else {
        warnings.push(
          `the value for 'cf:isPaid' is invalid: "${item['cf:isPaid']}"`
        );
      }
    }

    response.components = HTMLMapper.toComponents(contentEncoded, this.params);
    return response;
  }

  private getEnclosure(item: Record<string, unknown>): Array<Enclosure> {
    if (!item.enclosure) {
      return [];
    }

    if (!Array.isArray(item.enclosure)) {
      item.enclosure = [item.enclosure];
    }

    return (item.enclosure as Array<Attributes.Enclosure>).map(mapEnclosure);
  }

  private getMediaGroup(item: Record<string, unknown>): Array<MediaGroup> {
    if (!item['media:group']) {
      return [];
    }

    if (!Array.isArray(item['media:group'])) {
      item['media:group'] = [item['media:group']];
    }
    return (item['media:group'] as Array<Attributes.MediaGroup>).map(
      mapMediaGroup
    );
  }

  private getMediaContent(item: Record<string, unknown>): Array<MediaContent> {
    if (!item['media:content']) {
      return [];
    }

    if (!Array.isArray(item['media:content'])) {
      item['media:content'] = [item['media:content']];
    }

    return (item['media:content'] as Array<Attributes.MediaContent>).map(
      mapMediaContent
    );
  }
}

function mapEnclosure(e: Attributes.Enclosure): Enclosure {
  const errors: Error[] = [];
  const warnings: string[] = [];
  if (!e['@_url']) {
    errors.push(new Error(`property 'url' is required`));
  }
  if (!e['@_type']) {
    warnings.push(`property 'type' is suggested`);
  }
  if (!e['@_length']) {
    warnings.push(`property 'length' is suggested`);
  }
  return {
    length: e['@_length'] ? parseInt(`${e['@_length']}`, 10) : 0,
    type: e['@_type'] || '',
    url: e['@_url'] || '',
    errors,
    warnings,
  };
}

function mapMediaGroup(mediaGroup: Attributes.MediaGroup): MediaGroup {
  const errors: Error[] = [];
  const warnings: string[] = [];
  const mediaContent = mediaGroup['media:content'];
  if (!mediaContent) {
    errors.push(new Error('at least one media:content is required'));
  }
  return {
    title: mediaGroup['media:title'],
    mediaContent: mediaContent ? mediaContent.map(mapMediaContent) : [],
    errors,
    warnings,
  };
}

function mapMediaContent(mediaContent: Attributes.MediaContent): MediaContent {
  const errors: Error[] = [];
  const warnings: string[] = [];
  const url = mediaContent['@_url'] || '';
  const type = mediaContent['@_type'];
  const medium = mediaContent['@_medium'];
  let credit: string | undefined;
  let thumbnail: string | undefined;
  let title: string | undefined;
  const isDefault: undefined | boolean = mediaContent['@_isDefault']
    ? mediaContent['@_isDefault'] === 'true'
    : undefined;

  if (!url) {
    errors.push(new Error(`property 'url' is required`));
  }
  if (!type) {
    warnings.push(`property 'type' is suggested`);
  }
  if (!medium && !type) {
    warnings.push(`property 'medium' is suggested`);
  }

  let tmpCredit = mediaContent['media:credit'];
  if (tmpCredit) {
    if (Array.isArray(tmpCredit)) {
      warnings.push('can only exist one "media:credit"');
      tmpCredit = tmpCredit[0];
    }

    credit = tmpCredit['#text'];
  }

  let tmpThumbnail = mediaContent['media:thumbnail'];
  if (tmpThumbnail) {
    if (Array.isArray(tmpThumbnail)) {
      warnings.push('can only exist one "media:thumbnail"');
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

  return {
    url,
    type,
    medium,
    isDefault,
    errors,
    warnings,
    credit,
    thumbnail,
    title,
  };
}

export function replaceErrors(_: string, value: unknown) {
  if (value instanceof Error) {
    const error: Record<string, unknown> = {};

    Object.getOwnPropertyNames(value).forEach(function (propName) {
      // eslint-disable-next-line  @typescript-eslint/no-explicit-any
      error[propName] = (value as any)[propName];
    });

    return error.message;
  }

  return value;
}
