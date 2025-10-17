import path from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { test, expect, describe, beforeEach } from 'vitest';

import RSSFeed, { replaceErrors } from './RSSFeed';

describe('Invalid RSS', () => {
  test(`It should throw error because the rss is invalid`, async () => {
    const filePath = path.join(`${process.env.FEEDS_PATH}`, `invalid.rss`);
    const content = readFileSync(filePath, 'utf-8');
    const feed = new RSSFeed(content);
    await feed.validate();

    expect(feed.errors.length).toBeGreaterThan(0);
  });

  test(`It should throw error because channel is missing in rss`, async () => {
    const filePath = path.join(
      `${process.env.FEEDS_PATH}`,
      `invalid-channel.rss`
    );
    const content = readFileSync(filePath, 'utf-8');
    const feed = new RSSFeed(content);
    await feed.validate();

    expect(feed.errors.length).toBeGreaterThan(0);
  });
});

describe('Newsweek', () => {
  let filePath: string = '';
  let outFilePath: string = '';
  beforeEach(() => {
    filePath = path.join(`${process.env.FEEDS_PATH}`, `newsweek.rss`);
    if (process.env.FEEDS_OUT_PATH && existsSync(process.env.FEEDS_OUT_PATH)) {
      outFilePath = path.join(`${process.env.FEEDS_OUT_PATH}`, `newsweek.json`);
    }
  });
  test(`It should validate the item`, async () => {
    const content = readFileSync(filePath, 'utf-8');
    const feed = new RSSFeed(content);
    await feed.validate();

    expect(feed.errors.length).toBe(0);
  });
  test(`It should build the content`, async () => {
    const content = readFileSync(filePath, 'utf-8');
    const feed = new RSSFeed(content);
    await feed.validate();
    expect(feed.errors.length).toBe(0);
    const rss = await feed.build();
    if (outFilePath) {
      writeFileSync(
        outFilePath,
        JSON.stringify(rss, replaceErrors, 2),
        'utf-8'
      );
    }

    expect(rss.channel?.title).toBe('Newsweek feed for VMG');
  });
  test(`It should test affiliate links`, async () => {
    const content = readFileSync(filePath, 'utf-8');
    const feed = new RSSFeed(content);
    await feed.validate();
    expect(feed.errors.length).toBe(0);
    const rss = await feed.build();
    if (outFilePath) {
      writeFileSync(
        outFilePath,
        JSON.stringify(rss, replaceErrors, 2),
        'utf-8'
      );
    }

    expect(rss.channel?.title).toBe('Newsweek feed for VMG');
    const item = rss.channel.items[0];
    expect(item).toBeDefined();
    expect(item['cf:hasAffiliateLinks']).toBe(true);
  });
  test(`It should test dc:language in item`, async () => {
    const content = readFileSync(filePath, 'utf-8');
    const feed = new RSSFeed(content);
    await feed.validate();
    expect(feed.errors.length).toBe(0);
    const rss = await feed.build();
    if (outFilePath) {
      writeFileSync(
        outFilePath,
        JSON.stringify(rss, replaceErrors, 2),
        'utf-8'
      );
    }

    const item = rss.channel.items[0];
    expect(item).toBeDefined();
    expect(item['dc:language']).toBe('en-GB');
  });
  test(`It should test isSponsored item`, async () => {
    const content = readFileSync(filePath, 'utf-8');
    const feed = new RSSFeed(content);
    await feed.validate();
    expect(feed.errors.length).toBe(0);
    const rss = await feed.build();
    if (outFilePath) {
      writeFileSync(
        outFilePath,
        JSON.stringify(rss, replaceErrors, 2),
        'utf-8'
      );
    }

    expect(rss.channel?.title).toBe('Newsweek feed for VMG');
    const item = rss.channel.items[0];
    expect(item).toBeDefined();
    expect(item['cf:isSponsored']).toBe(true);
    expect(item['cf:isPaid']).toBe(true);
  });

  test(`It should validate multiple dc:creator`, async () => {
    const content = readFileSync(filePath, 'utf-8');
    const feed = new RSSFeed(content);
    await feed.validate();
    expect(feed.errors.length).toBe(0);
    const rss = await feed.build();
    if (outFilePath) {
      writeFileSync(
        outFilePath,
        JSON.stringify(rss, replaceErrors, 2),
        'utf-8'
      );
    }

    expect(rss.channel?.title).toBe('Newsweek feed for VMG');
    let item = rss.channel.items[0];
    expect(item).toBeDefined();
    if (!item) return;
    expect(item['dc:creator']).toBe('Drew VonScio');
    item = rss.channel.items[1];
    expect(item).toBeDefined();
    if (!item) return;
    expect(item['dc:creator']).toBe('Sonam Sheth, John Doe');
  });

  test(`It should test cf:thumbnail`, async () => {
    const content = readFileSync(filePath, 'utf-8');
    const feed = new RSSFeed(content);
    await feed.validate();
    expect(feed.errors.length).toBe(0);
    const rss = await feed.build();
    if (outFilePath) {
      writeFileSync(
        outFilePath,
        JSON.stringify(rss, replaceErrors, 2),
        'utf-8'
      );
    }

    expect(rss.channel?.title).toBe('Newsweek feed for VMG');
    let item = rss.channel.items[0];
    expect(item).toBeDefined();
    if (!item) return;
    expect(item['cf:thumbnail']).toEqual({
      url: 'https://d.newsweek.com/en/full/2617265/baseball-mlb-2025-opening.jpg',
      width: 2500,
      height: 1712,
      type: 'image/jpeg',
      fileSize: 1459000,
    });
    expect(item['dc:creator']).toBe('Drew VonScio');
    item = rss.channel.items[1];
    expect(item).toBeDefined();
    if (!item) return;
    expect(item['dc:creator']).toBe('Sonam Sheth, John Doe');
  });

  test(`It should fail invalid mime-type cf:thumbnail`, async () => {
    const content = readFileSync(filePath, 'utf-8');
    const feed = new RSSFeed(content);
    await feed.validate();
    expect(feed.errors.length).toBe(0);
    const rss = await feed.build();
    if (outFilePath) {
      writeFileSync(
        outFilePath,
        JSON.stringify(rss, replaceErrors, 2),
        'utf-8'
      );
    }

    expect(rss.channel?.title).toBe('Newsweek feed for VMG');
    const item = rss.channel.items[1];
    expect(item).toBeDefined();
    if (!item) return;
    expect(item['cf:thumbnail']).toEqual({
      url: 'https://d.newsweek.com/en/full/2617265/baseball-mlb-2025-opening.jpg',
      width: 300,
      height: 400,
      type: undefined,
      fileSize: 45900,
    });
    expect(item.warnings).toBeDefined();
    expect(item.warnings.length).toBeGreaterThan(0);
  });
});

describe('Autocar', () => {
  let filePath: string = '';
  let outFilePath: string = '';
  beforeEach(() => {
    filePath = path.join(`${process.env.FEEDS_PATH}`, `autocar.rss`);
    if (process.env.FEEDS_OUT_PATH && existsSync(process.env.FEEDS_OUT_PATH)) {
      outFilePath = path.join(`${process.env.FEEDS_OUT_PATH}`, `autocar.json`);
    }
  });
  test(`It should validate the content`, async () => {
    const content = readFileSync(filePath, 'utf-8');
    const feed = new RSSFeed(content);
    await feed.validate();

    expect(feed.errors.length, 'This errors should be empty').toBe(0);
  });
  test(`It should build the content`, async () => {
    const content = readFileSync(filePath, 'utf-8');
    const feed = new RSSFeed(content);
    const rss = await feed.build();
    if (outFilePath) {
      writeFileSync(
        outFilePath,
        JSON.stringify(rss, replaceErrors, 2),
        'utf-8'
      );
    }

    expect(rss.channel?.title).toBe('Autocar.co.uk');
  });
});

describe('Motorsport', () => {
  let filePath: string = '';
  let outFilePath: string = '';
  beforeEach(() => {
    filePath = path.join(`${process.env.FEEDS_PATH}`, `motorsport.rss`);
    if (process.env.FEEDS_OUT_PATH && existsSync(process.env.FEEDS_OUT_PATH)) {
      outFilePath = path.join(
        `${process.env.FEEDS_OUT_PATH}`,
        `motorsport.json`
      );
    }
  });
  test(`It should build the content`, async () => {
    const content = readFileSync(filePath, 'utf-8');
    const feed = new RSSFeed(content);
    const rss = await feed.build();

    if (outFilePath) {
      writeFileSync(
        outFilePath,
        JSON.stringify(rss, replaceErrors, 2),
        'utf-8'
      );
    }

    expect(rss.channel?.title).toBe('Motorsport.com - All - Stories');
    expect(rss.channel?.items.length).toBe(50);
    expect(rss.channel.items[0].title).toBe(
      'Aprilia stands firm over Jorge Martin contract saga'
    );
    expect(rss.channel.items[0].components[0].component).toBe('subtitle');
  });
});

describe('Codrops', () => {
  let filePath: string = '';
  let outFilePath: string = '';
  beforeEach(() => {
    filePath = path.join(`${process.env.FEEDS_PATH}`, `codrops.rss`);
    if (process.env.FEEDS_OUT_PATH && existsSync(process.env.FEEDS_OUT_PATH)) {
      outFilePath = path.join(`${process.env.FEEDS_OUT_PATH}`, `codrops.json`);
    }
  });
  test(`It should build the content`, async () => {
    const content = readFileSync(filePath, 'utf-8');
    const feed = new RSSFeed(content);
    const rss = await feed.build();

    if (outFilePath) {
      writeFileSync(
        outFilePath,
        JSON.stringify(rss, replaceErrors, 2),
        'utf-8'
      );
    }

    const { channel } = rss;
    expect(channel).toBeDefined();
    if (!channel) return;

    expect(channel.title).toBe('Codrops');
    expect(channel.link).toBe('https://tympanus.net/codrops');
    expect(channel.description).toBe('Fueling web creativity since 2009');
    expect(channel.language).toBe('en-US');
    expect(channel.ttl).toBe(60);
    expect(channel.generator).toBe('https://wordpress.org/?v=6.7.2');
    // expect(channel.lastBuildDate).toBe('2025-06-20T08:21:04.000-05:00');
    // expect(channel.pubDate).toBe('2025-06-20T08:21:04.000-05:00');
    expect(channel.docs).toBe('https://tympanus.net/codrops/docs');
    if (channel.category) {
      expect(new Set([...channel.category])).toEqual(new Set(['CSS', 'HTML']));
    }

    expect(channel['atom:link']).toEqual({
      href: 'https://tympanus.net/codrops/feed/',
      rel: 'self',
      type: 'application/rss+xml',
    });
    expect(channel['sy:updatePeriod']).toBe('hourly');
    // expect(channel['sy:updateBase']).toBe('2025-06-19T18:51:09÷00:00');
    expect(channel['sy:updateFrequency']).toBe(1);

    const { items } = channel;
    expect(items.length).toBe(10);

    expect(items[0].enclosure.length).toBe(12);
    expect(items[0]['dc:creator']).toBe('Malvah Studio');
    expect(items[0]['dc:language']).toBe('en');
    // expect(items[0]['dc:date']).toBe('2025-06-19T18:51:09÷00:00');
    expect(items[1].enclosure.length).toBe(4);
    expect(items[2].enclosure.length).toBe(1);
  });
});

describe('Motor1', () => {
  let filePath: string = '';
  let outFilePath: string = '';
  beforeEach(() => {
    filePath = path.join(`${process.env.FEEDS_PATH}`, `motor1.rss`);
    if (process.env.FEEDS_OUT_PATH && existsSync(process.env.FEEDS_OUT_PATH)) {
      outFilePath = path.join(`${process.env.FEEDS_OUT_PATH}`, `motor1.json`);
    }
  });
  test(`It should build the content`, async () => {
    const content = readFileSync(filePath, 'utf-8');
    const feed = new RSSFeed(content);
    const rss = await feed.build();

    if (outFilePath) {
      writeFileSync(
        outFilePath,
        JSON.stringify(RSSFeed.toJSON(rss), replaceErrors, 2),
        'utf-8'
      );
    }

    expect(rss.channel?.title).toBe('Motor1.com');
  });
});

describe('Forbes', () => {
  let filePath: string = '';
  let outFilePath: string = '';
  beforeEach(() => {
    filePath = path.join(`${process.env.FEEDS_PATH}`, `forbes.rss`);
    if (process.env.FEEDS_OUT_PATH && existsSync(process.env.FEEDS_OUT_PATH)) {
      outFilePath = path.join(`${process.env.FEEDS_OUT_PATH}`, `forbes.json`);
    }
  });
  test(`It should build the content`, async () => {
    const content = readFileSync(filePath, 'utf-8');
    const feed = new RSSFeed(content);
    const rss = await feed.build();

    if (outFilePath) {
      writeFileSync(
        outFilePath,
        JSON.stringify(RSSFeed.toJSON(rss), replaceErrors, 2),
        'utf-8'
      );
    }

    const { items } = rss.channel;
    expect(items.length).toBeGreaterThan(0);
    if (!items.length) return;
    const item = items.shift();
    expect(item).toBeDefined();
    if (!item) return;
    expect(rss.channel?.title).toBe('BREAKING NEWS');
    expect(item['atom:updated']).toBe('2025-06-17T13:27:53-04:00');
    expect(item?.['atom:author']?.['atom:name']).toBe(
      'Yezen Saadah, Contributor'
    );
    expect(item?.['atom:author']?.['atom:uri']).toBe(
      'https://www.forbes.com/sites/yezensaadah/'
    );
    expect(item?.['atom:author']?.['atom:email']).toBe('yezen@forbes.com');
  });

  test(`It should build content with single item`, async () => {
    filePath = path.join(`${process.env.FEEDS_PATH}`, `single-item-forbes.rss`);
    if (process.env.FEEDS_OUT_PATH && existsSync(process.env.FEEDS_OUT_PATH)) {
      outFilePath = path.join(
        `${process.env.FEEDS_OUT_PATH}`,
        `single-item-forbes.json`
      );
    }
    const content = readFileSync(filePath, 'utf-8');
    const feed = new RSSFeed(content);
    const rss = await feed.build();

    if (outFilePath) {
      writeFileSync(
        outFilePath,
        JSON.stringify(RSSFeed.toJSON(rss), replaceErrors, 2),
        'utf-8'
      );
    }

    const { items } = rss.channel;
    expect(items.length).toBeGreaterThan(0);
    const item = items.shift();
    expect(item).toBeDefined();
  });
});

describe('Womens Running', () => {
  let filePath: string = '';
  let outFilePath: string = '';
  beforeEach(() => {
    filePath = path.join(`${process.env.FEEDS_PATH}`, `womensrunning.rss`);
    if (process.env.FEEDS_OUT_PATH && existsSync(process.env.FEEDS_OUT_PATH)) {
      outFilePath = path.join(
        `${process.env.FEEDS_OUT_PATH}`,
        `womensrunning.json`
      );
    }
  });
  test(`It should build the content`, async () => {
    const content = readFileSync(filePath, 'utf-8');
    const feed = new RSSFeed(content);
    const rss = await feed.build();

    if (outFilePath) {
      writeFileSync(
        outFilePath,
        JSON.stringify(RSSFeed.toJSON(rss), replaceErrors, 2),
        'utf-8'
      );
    }

    expect(rss.channel?.title).toBe('Women&#039;s Running');
  });
});

describe('Vegan Food and Living', () => {
  let filePath: string = '';
  let outFilePath: string = '';
  beforeEach(() => {
    filePath = path.join(`${process.env.FEEDS_PATH}`, `veganfoodandliving.rss`);
    if (process.env.FEEDS_OUT_PATH && existsSync(process.env.FEEDS_OUT_PATH)) {
      outFilePath = path.join(
        `${process.env.FEEDS_OUT_PATH}`,
        `veganfoodandliving.json`
      );
    }
  });
  test(`It should build the content`, async () => {
    const content = readFileSync(filePath, 'utf-8');
    const feed = new RSSFeed(content);
    const rss = await feed.build();

    if (outFilePath) {
      writeFileSync(
        outFilePath,
        JSON.stringify(RSSFeed.toJSON(rss), replaceErrors, 2),
        'utf-8'
      );
    }

    expect(rss.channel?.title).toBe('Vegan Food & Living');
    expect(rss.channel?.image).toEqual({
      url: 'https://www.veganfoodandliving.com/wp-content/uploads/2019/11/cropped-favicon-1-32x32.png',
      title: 'Vegan Food & Living',
      link: 'https://www.veganfoodandliving.com/',
      width: 32,
      height: 32,
    });
  });
});

describe('VMG', () => {
  let filePath: string = '';
  let outFilePath: string = '';
  beforeEach(() => {
    filePath = path.join(`${process.env.FEEDS_PATH}`, `vmg.rss`);
    if (process.env.FEEDS_OUT_PATH && existsSync(process.env.FEEDS_OUT_PATH)) {
      outFilePath = path.join(`${process.env.FEEDS_OUT_PATH}`, `vmg.json`);
    }
  });
  test(`It should throw error when item is missing`, async () => {
    const content = readFileSync(filePath, 'utf-8');
    const feed = new RSSFeed(content);
    const rss = await feed.build();

    if (outFilePath) {
      writeFileSync(
        outFilePath,
        JSON.stringify(RSSFeed.toJSON(rss), replaceErrors, 2),
        'utf-8'
      );
    }

    expect(rss.channel?.title).toBe('VMG');
    expect(rss.channel?.errors.length).toBeGreaterThan(0);
  });
});

describe('PureNews', () => {
  let filePath: string = '';
  let outFilePath: string = '';
  beforeEach(() => {
    filePath = path.join(`${process.env.FEEDS_PATH}`, `purenews.rss`);
    if (process.env.FEEDS_OUT_PATH && existsSync(process.env.FEEDS_OUT_PATH)) {
      outFilePath = path.join(`${process.env.FEEDS_OUT_PATH}`, `purenews.json`);
    }
  });
  test(`It should build the content`, async () => {
    const content = readFileSync(filePath, 'utf-8');
    const feed = new RSSFeed(content);
    const rss = await feed.build();

    if (outFilePath) {
      writeFileSync(
        outFilePath,
        JSON.stringify(RSSFeed.toJSON(rss), replaceErrors, 2),
        'utf-8'
      );
    }

    const { items } = rss.channel;
    expect(items.length).toBeGreaterThan(0);
    if (!items.length) return;
    const item = items.shift();
    expect(item).toBeDefined();
    if (!item) return;
    expect(rss.channel?.title).toBe('Wccftech');
  });
});

describe('Saga', () => {
  let filePath: string = '';
  let outFilePath: string = '';
  beforeEach(() => {
    filePath = path.join(`${process.env.FEEDS_PATH}`, `saga.rss`);
    if (process.env.FEEDS_OUT_PATH && existsSync(process.env.FEEDS_OUT_PATH)) {
      outFilePath = path.join(`${process.env.FEEDS_OUT_PATH}`, `saga.json`);
    }
  });
  test(`It should build the content`, async () => {
    const content = readFileSync(filePath, 'utf-8');
    const feed = new RSSFeed(content);
    const rss = await feed.build();

    if (outFilePath) {
      writeFileSync(
        outFilePath,
        JSON.stringify(RSSFeed.toJSON(rss), replaceErrors, 2),
        'utf-8'
      );
    }

    const { items, language, title } = rss.channel;
    expect(language).toBe('en-gb');
    expect(title).toBe('Saga Magazine Apple News Feed');
    expect(items.length).toBeGreaterThan(0);
    if (!items.length) return;
    const item = items.shift();
    expect(item).toBeDefined();
    if (!item) return;
    expect(item.mediaContent).toBeDefined();
    if (!item.mediaContent) return;
    expect(item.mediaContent.length).toBe(1);
    const media = item.mediaContent[0];
    expect(media.url).toEqual(
      'https://www.saga.co.uk/helix-contentlibrary/saga/magazine/articles/2025/08aug/older-driver-gettyimages-523556820.jpg'
    );
    expect(media.title).toEqual('Older drivers: what are the rules now?');
    expect(media.medium).toEqual('image');
  });
});

// TODO Implement test
describe.skip('Recipe', () => {
  test(`It return a recipe object`, async () => {
    const url = '';
    const recipe = await RSSFeed.getRecipeFromUrl(url);
    expect(recipe).toBeDefined();
  });
});
