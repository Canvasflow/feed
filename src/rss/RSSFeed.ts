import { DateTime } from 'luxon';
import { XMLParser } from 'fast-xml-parser';

import type { RSS, Item } from './RSS';
import { Tag } from './Tag';

import { HTMLMapper } from '../component/HTMLMapper';

export default class RSSFeed {
  public content: string;
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  public data: any;
  public rss: RSS;
  public errors: Error[] = [];

  constructor(content: string) {
    this.content = content;
    const parser = new XMLParser();
    this.data = parser.parse(content);

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
    if (this.rss.errors.length) {
      return;
    }

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
    this.rss.channel.title = channel.title;
    for (const item of channel.item) {
      this.rss.channel.items.push(this.buildItem(item));
    }
    return this.rss;
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
    const guid = typeof item.guid === 'string' ? item.guid : undefined;
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
    const category: Array<string> = item.category
      ? Array.isArray(item.category)
        ? item.category
        : [item.category]
      : [];

    let pubDate: undefined | string;
    if (item.pubDate) {
      const pubDateTime = DateTime.fromJSDate(new Date(`${item.pubDate}`));
      if (pubDateTime.isValid) {
        pubDate = pubDateTime.toISO();
      }
    }
    const response: Item = {
      guid,
      title,
      category,
      description,
      link,
      pubDate,
      errors,
      'content:encoded': contentEncoded,
      warnings,
      components: [],
    };

    response.components = HTMLMapper.toComponents(contentEncoded);

    return response;
  }
}
