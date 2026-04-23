import path from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { test, expect, describe, beforeEach } from 'vitest';

import RSSFeed, { replaceErrors } from './RSSFeed';
import type { ImageComponent, TextComponent } from '../component/Component';
import type { Recipe } from '../component/Schema';
import { HTMLMapper } from '../component/HTMLMapper';
import type { ComponentMapping, Mapping } from '../component/Mapping';
describe('Invalid RSS', () => {
  test(
    `It should throw error because the rss is invalid`,
    { tags: ['unit', 'rss'] },
    async () => {
      const filePath = path.join(`${process.env.FEEDS_PATH}`, `invalid.rss`);
      const content = readFileSync(filePath, 'utf-8');
      const feed = new RSSFeed(content);
      await feed.validate();

      expect(feed.errors.length).toBeGreaterThan(0);
    }
  );

  test(
    `It should throw error because channel is missing in rss`,
    { tags: ['unit', 'rss'] },
    async () => {
      const filePath = path.join(
        `${process.env.FEEDS_PATH}`,
        `invalid-channel.rss`
      );
      const content = readFileSync(filePath, 'utf-8');
      const feed = new RSSFeed(content);
      await feed.validate();

      expect(feed.errors.length).toBeGreaterThan(0);
    }
  );
});

describe('Toms Guide', () => {
  let filePath: string = '';
  let outFilePath: string = '';
  let htmlFilePath: string = '';

  beforeEach(() => {
    filePath = path.join(`${process.env.FEEDS_PATH}`, `toms.rss`);
    htmlFilePath = path.join(`${process.env.FEEDS_PATH}`, `toms.html`);
    if (process.env.FEEDS_OUT_PATH && existsSync(process.env.FEEDS_OUT_PATH)) {
      outFilePath = path.join(`${process.env.FEEDS_OUT_PATH}`, `toms.json`);
    }
  });

  test(
    `It should build the content with space`,
    { tags: ['unit', 'rss'] },
    async () => {
      const expectedText =
        '<a id="birkenstock" href="https://www.anrdoezrs.net/click-8900245-8417500?sid=tomsguide-us-8281606209856383572&amp;url=https://www.zappos.com/p/womens-birkenstock-papillio-by-birkenstock-florida-platform-nubuck-pure-sage/product/9985783/color/1097063" class="hawk-affiliate-link-container" rel="sponsored noopener" target="_blank" role="link"><span> <span>now $98</span> <span>at Zappos</span></span></a>';
      const content = readFileSync(filePath, 'utf-8');
      const feed = new RSSFeed(content);
      await feed.validate();
      expect(feed.errors.length).toBe(0);
      const rss = await feed.build();
      expect(rss.channel?.title).toBe(`Latest from Tom's Guide`);
      const root: Mapping = {
        match: 'any',
        filters: [
          {
            type: 'tag',
            items: ['article'],
          },
        ],
      };
      for (const item of rss.channel.items) {
        if (item.guid !== 'j5SyyGGVH3SdnjMbrKiGfQ') continue;
        if (!item.link) continue;
        let itemContent = readFileSync(htmlFilePath, 'utf-8');
        itemContent = `${HTMLMapper.getRootElement(itemContent, root)}`;
        const components = HTMLMapper.toComponents(itemContent);
        for (const component of components) {
          if (component.id === 'birkenstock') {
            const comp = component as TextComponent;
            expect(comp.text).toBe(expectedText);
          }
        }
      }

      if (outFilePath) {
        writeFileSync(
          outFilePath,
          JSON.stringify(rss, replaceErrors, 2),
          'utf-8'
        );
      }
    }
  );

  test(
    `It should build the content with quotes`,
    { tags: ['unit', 'rss'] },
    async () => {
      const htmlFilePath = path.join(
        `${process.env.FEEDS_PATH}`,
        `toms-2.html`
      );
      const expectedText = "<span>More from Tom's Guide</span>";
      const content = readFileSync(filePath, 'utf-8');
      const feed = new RSSFeed(content);
      await feed.validate();
      expect(feed.errors.length).toBe(0);
      const rss = await feed.build();
      expect(rss.channel?.title).toBe(`Latest from Tom's Guide`);
      const root: Mapping = {
        match: 'any',
        filters: [
          {
            type: 'tag',
            items: ['article'],
          },
        ],
      };
      for (const item of rss.channel.items) {
        if (item.guid !== 'y7SnCDu95opznVMzRst9BJ') continue;
        if (!item.link) continue;
        let itemContent = readFileSync(htmlFilePath, 'utf-8');
        itemContent = `${HTMLMapper.getRootElement(itemContent, root)}`;
        const components = HTMLMapper.toComponents(itemContent);
        for (const component of components) {
          if (component.id === 'section-more-from-tom-s-guide') {
            const comp = component as TextComponent;
            expect(comp.text).toBe(expectedText);
          }
        }
      }

      if (outFilePath) {
        writeFileSync(
          outFilePath,
          JSON.stringify(rss, replaceErrors, 2),
          'utf-8'
        );
      }
    }
  );
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
  test(`It should validate the item`, { tags: ['unit', 'rss'] }, async () => {
    const content = readFileSync(filePath, 'utf-8');
    const feed = new RSSFeed(content);
    await feed.validate();

    expect(feed.errors.length).toBe(0);
  });
  test(`It should build the content`, { tags: ['unit', 'rss'] }, async () => {
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
  test(
    `It should test affiliate links`,
    { tags: ['unit', 'rss'] },
    async () => {
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
    }
  );
  test(
    `It should test dc:language in item`,
    { tags: ['unit', 'rss'] },
    async () => {
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
    }
  );
  test(
    `It should test isSponsored item`,
    { tags: ['unit', 'rss'] },
    async () => {
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
    }
  );

  test(
    `It should validate multiple dc:creator`,
    { tags: ['unit', 'rss'] },
    async () => {
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
    }
  );

  test(`It should test cf:thumbnail`, { tags: ['unit', 'rss'] }, async () => {
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

  test(
    `It should fail invalid mime-type cf:thumbnail`,
    { tags: ['unit', 'rss'] },
    async () => {
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
    }
  );
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
  test(
    `It should validate the content`,
    { tags: ['unit', 'rss'] },
    async () => {
      const content = readFileSync(filePath, 'utf-8');
      const feed = new RSSFeed(content);
      await feed.validate();

      expect(feed.errors.length, 'This errors should be empty').toBe(0);
    }
  );
  test(`It should build the content`, { tags: ['unit', 'rss'] }, async () => {
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
  test(`It should build the content`, { tags: ['unit', 'rss'] }, async () => {
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
  test(`It should build the content`, { tags: ['unit', 'rss'] }, async () => {
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
  test(`It should build the content`, { tags: ['unit', 'rss'] }, async () => {
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

  test(`It should build the content`, { tags: ['unit', 'rss'] }, async () => {
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

  test(
    `It should build content with single item`,
    { tags: ['unit', 'rss'] },
    async () => {
      filePath = path.join(
        `${process.env.FEEDS_PATH}`,
        `single-item-forbes.rss`
      );
      if (
        process.env.FEEDS_OUT_PATH &&
        existsSync(process.env.FEEDS_OUT_PATH)
      ) {
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
    }
  );

  test(`It should build large feed`, { tags: ['unit', 'rss'] }, async () => {
    filePath = path.join(`${process.env.FEEDS_PATH}`, `forbes-large.rss`);
    if (process.env.FEEDS_OUT_PATH && existsSync(process.env.FEEDS_OUT_PATH)) {
      outFilePath = path.join(
        `${process.env.FEEDS_OUT_PATH}`,
        `forbes-large.json`
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
  test(`It should build the content`, { tags: ['unit', 'rss'] }, async () => {
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

    expect(rss.channel?.title).toBe("Women's Running");
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
  test(`It should build the content`, { tags: ['unit', 'rss'] }, async () => {
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
  test(
    `It should throw error when item is missing`,
    { tags: ['unit', 'rss'] },
    async () => {
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
    }
  );
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
  test(`It should build the content`, { tags: ['unit', 'rss'] }, async () => {
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

describe('Wccftech', () => {
  let filePath: string = '';
  let outFilePath: string = '';
  beforeEach(() => {
    filePath = path.join(`${process.env.FEEDS_PATH}`, `wccftech.rss`);
    if (process.env.FEEDS_OUT_PATH && existsSync(process.env.FEEDS_OUT_PATH)) {
      outFilePath = path.join(`${process.env.FEEDS_OUT_PATH}`, `wccftech.json`);
    }
  });
  test(`It should build the content`, { tags: ['unit', 'rss'] }, async () => {
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
  test(`It should build the content`, { tags: ['unit', 'rss'] }, async () => {
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

describe('Cultured Magazine', () => {
  let filePath: string = '';
  let outFilePath: string = '';
  beforeEach(() => {
    filePath = path.join(`${process.env.FEEDS_PATH}`, `culturedmag.rss`);
    if (process.env.FEEDS_OUT_PATH && existsSync(process.env.FEEDS_OUT_PATH)) {
      outFilePath = path.join(
        `${process.env.FEEDS_OUT_PATH}`,
        `culturedmag.json`
      );
    }
  });
  test(`It should build the content`, { tags: ['unit', 'rss'] }, async () => {
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
    expect(language).toBe('en-US');
    expect(title).toBe('Cultured Mag');
    expect(items.length).toBeGreaterThan(0);
    if (!items.length) return;
    const item = items[9];
    expect(item).toBeDefined();
    if (!item) return;
    const imageComponent = item.components[15] as ImageComponent | undefined;
    expect(imageComponent).toBeDefined();
    if (imageComponent?.component !== 'image') return;
    expect(imageComponent.imageurl).toEqual(
      'https://culturedmag.nyc3.digitaloceanspaces.com/uploads/2025/11/14105632/Kenya-Hara_DRAW.jpg'
    );
    expect(imageComponent.caption).toEqual(
      'Spread from <em>Draw</em>. Image courtesy of Lars Müller Publishers.'
    );
  });
});

describe('The New World', () => {
  let filePath: string = '';
  let outFilePath: string = '';
  beforeEach(() => {
    filePath = path.join(`${process.env.FEEDS_PATH}`, `thenewworld.rss`);
    if (process.env.FEEDS_OUT_PATH && existsSync(process.env.FEEDS_OUT_PATH)) {
      outFilePath = path.join(
        `${process.env.FEEDS_OUT_PATH}`,
        `thenewworld.json`
      );
    }
  });
  test(`It should build the content`, { tags: ['unit', 'rss'] }, async () => {
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

    const { items, title } = rss.channel;
    expect(title).toBe('The New World');
    expect(items.length).toBeGreaterThan(0);
    if (!items.length) return;
    const item = items[0];
    expect(item).toBeDefined();
    if (!item) return;
    const { mediaContent } = item;
    expect(mediaContent.length).toBe(1);
    const lastMediaContent = mediaContent.pop();
    expect(lastMediaContent).toBeDefined();
    if (!lastMediaContent) return;
    expect(lastMediaContent.url).toBe(
      'https://www.thenewworld.co.uk/wp-content/uploads/sites/2/2026/02/472_READE_BIRTHRATES2.jpg'
    );
    expect(lastMediaContent.description).toBe(
      'The falling birth rate is not the fault of women. Image: TNW/Getty'
    );
  });
});

describe('The English Home', () => {
  let filePath: string = '';
  let outFilePath: string = '';
  beforeEach(() => {
    filePath = path.join(`${process.env.FEEDS_PATH}`, `theenglishhome.rss`);
    if (process.env.FEEDS_OUT_PATH && existsSync(process.env.FEEDS_OUT_PATH)) {
      outFilePath = path.join(
        `${process.env.FEEDS_OUT_PATH}`,
        `theenglishhome.json`
      );
    }
  });
  test(`It should validate the item`, { tags: ['unit', 'rss'] }, async () => {
    const content = readFileSync(filePath, 'utf-8');
    const feed = new RSSFeed(content);
    await feed.validate();

    expect(feed.errors.length).toBe(0);
  });
  test(`It should build the content`, { tags: ['unit', 'rss'] }, async () => {
    const content = readFileSync(filePath, 'utf-8');
    const feed = new RSSFeed(content);
    await feed.validate();
    expect(feed.errors.length).toBe(0);
    const rss = await feed.build();
    const articleFilePath = path.join(
      `${process.env.FEEDS_PATH}`,
      `theenglishhome.html`
    );

    const root: Mapping = {
      match: 'any',
      filters: [
        {
          type: 'tag',
          items: ['main'],
        },
      ],
    };

    const mappings: ComponentMapping[] = [];
    const excludes: Mapping[] = [
      {
        match: 'all',
        filters: [
          {
            type: 'tag',
            items: ['script'],
          },
        ],
      },
      {
        match: 'any',
        filters: [
          {
            type: 'attribute',
            key: 'id',
            value: 'utility-bar',
          },
        ],
      },
      {
        match: 'any',
        filters: [
          {
            type: 'class',
            match: 'any',
            items: ['newsletter-inbodyContent-slice'],
          },
        ],
      },
      {
        match: 'any',
        filters: [
          {
            type: 'class',
            match: 'any',
            items: ['article-continues-below'],
          },
        ],
      },
      {
        match: 'any',
        filters: [
          {
            type: 'class',
            match: 'any',
            items: ['comment-widget-loaded'],
          },
        ],
      },
      {
        match: 'any',
        filters: [
          {
            type: 'class',
            match: 'any',
            items: ['comment-widget-loaded'],
          },
        ],
      },
    ];

    for (const item of rss.channel.items) {
      if (item.guid !== 'ef225b9a-8166-5453-8fe3-a7ccc6b2d1bf') continue;
      if (!item.link) {
        continue;
      }
      try {
        let itemContent = readFileSync(articleFilePath, 'utf-8');
        itemContent = `${HTMLMapper.getRootElement(itemContent, root)}`;

        if (itemContent) {
          item.components = HTMLMapper.toComponents(itemContent, {
            mappings,
            excludes,
          });
        }
      } catch (e: unknown) {
        const error = e as Error;
        item.components = [];
        item.errors.push(error.message);
      }
    }

    if (outFilePath) {
      writeFileSync(
        outFilePath,
        JSON.stringify(rss, replaceErrors, 2),
        'utf-8'
      );
    }

    expect(rss.channel?.title).toBe('https://www.theenglishhome.co.uk content');
  });
  test(
    `It should test affiliate links`,
    { tags: ['unit', 'rss'] },
    async () => {
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

      expect(rss.channel?.title).toBe(
        'https://www.theenglishhome.co.uk content'
      );
      const item = rss.channel.items[0];
      expect(item).toBeDefined();
      expect(item['cf:hasAffiliateLinks']).toBe(false);
    }
  );
});

describe('Motor', () => {
  let filePath: string = '';
  beforeEach(() => {
    filePath = path.join(`${process.env.FEEDS_PATH}`, `motor.rss`);
  });
  test(`It should validate the item`, { tags: ['unit', 'rss'] }, async () => {
    const content = readFileSync(filePath, 'utf-8');
    const feed = new RSSFeed(content);
    await feed.validate();

    expect(feed.errors.length).toBe(0);
  });
  test(`It should build the content`, { tags: ['unit', 'rss'] }, async () => {
    const content = readFileSync(filePath, 'utf-8');
    const feed = new RSSFeed(content);
    await feed.validate();
    expect(feed.errors.length).toBe(0);
    const rss = await feed.build();
    expect(rss).toBeDefined();
    const { items } = rss.channel;
    const item = items[0];
    const { title } = item;
    expect(title).toBe(
      'F1 2026 car launch dates: schedule for team and livery reveals'
    );
    expect(item['dc:creator']).toBe('Pablo Elizalde');
    expect(item['category']?.[0]).toBe('F1');
    const mediaContentItem = item['mediaContent'][0];
    expect(mediaContentItem.credit).toBe('Audi');
    expect(mediaContentItem.description).toBe(
      'Audi was first to reveal its 2026 F1 livery'
    );
  });
});

describe('Recipe', () => {
  test(
    `It return a recipe object, from multiple types`,
    { tags: ['integration', 'recipe'] },
    async () => {
      const url = 'https://www.saga.co.uk/magazine/recipes/easter-simnel-cake';
      const recipe = await RSSFeed.getRecipeFromUrl(url);
      expect(recipe).toBeDefined();
    }
  );
  test(
    `It return a recipe object, whenever a valid recipe is found`,
    { tags: ['integration', 'recipe'] },
    async () => {
      const url =
        'https://www.veganfoodandliving.com/vegan-recipes/vegan-steamed-jam-suet-sponge-pudding';
      const result: Recipe = {
        '@type': 'Recipe',
        name: 'Vegan Steamed Jam Suet Sponge Pudding',
        author: {
          '@id':
            'https://www.veganfoodandliving.com/#/schema/person/62be92366f201f8fd50f286ece9fc0df',
        },
        description:
          'This vegan steamed jam suet sponge pudding is a nostalgic trip down memory lane, offering a taste of a classic British dessert with a compassionate twist.',
        datePublished: '2022-09-20T15:47:48+00:00',
        image: [
          'https://www.veganfoodandliving.com/wp-content/uploads/2022/09/Vegan-Steamed-Jam-Suet-Sponge-Pudding-close-up.jpg',
          'https://www.veganfoodandliving.com/wp-content/uploads/2022/09/Vegan-Steamed-Jam-Suet-Sponge-Pudding-close-up-500x500.jpg',
          'https://www.veganfoodandliving.com/wp-content/uploads/2022/09/Vegan-Steamed-Jam-Suet-Sponge-Pudding-close-up-500x375.jpg',
          'https://www.veganfoodandliving.com/wp-content/uploads/2022/09/Vegan-Steamed-Jam-Suet-Sponge-Pudding-close-up-480x270.jpg',
        ],
        recipeYield: ['6'],
        prepTime: 'PT10M',
        cookTime: 'PT60M',
        totalTime: 'PT70M',
        recipeIngredient: [
          '300 g self-raising flour',
          '75 g caster sugar',
          '1  lemon (zest only)',
          '6 Tbsp jam',
          '150 g vegetable suet',
          'A pinch of cinnamon',
          '240 ml soya milk',
        ],
        recipeInstructions: [
          {
            '@type': 'HowToStep',
            text: 'Add the flour, suet, sugar, cinnamon, lemon zest and milk to a bowl and mix together to form a soft sticky dough.',
            name: 'Add the flour, suet, sugar, cinnamon, lemon zest and milk to a bowl and mix together to form a soft sticky dough.',
            url: 'https://www.veganfoodandliving.com/vegan-recipes/vegan-steamed-jam-suet-sponge-pudding/#wprm-recipe-118147-step-0-0',
          },
          {
            '@type': 'HowToStep',
            text: 'Put a tablespoon of jam into the bottom of each mould and spoon in a sixth of the pudding mixture, cover with tin foil. Steam for 50-60 minutes or until the pudding is cooked through. Serve warm.',
            name: 'Put a tablespoon of jam into the bottom of each mould and spoon in a sixth of the pudding mixture, cover with tin foil. Steam for 50-60 minutes or until the pudding is cooked through. Serve warm.',
            url: 'https://www.veganfoodandliving.com/vegan-recipes/vegan-steamed-jam-suet-sponge-pudding/#wprm-recipe-118147-step-0-1',
          },
        ],
        recipeCategory: ['Dessert'],
        recipeCuisine: ['British'],
        keywords:
          'dairy free dessert, egg free dessert, plant based dessert, vegan dessert',
        nutrition: {
          '@type': 'NutritionInformation',
          servingSize: '152 g',
          calories: '486 kcal',
          carbohydrateContent: '68 g',
          proteinContent: '7 g',
          fatContent: '27 g',
          saturatedFatContent: '6 g',
          transFatContent: '3 g',
          sodiumContent: '29 mg',
          fiberContent: '2 g',
          sugarContent: '23 g',
          unsaturatedFatContent: '19 g',
        },
        '@id':
          'https://www.veganfoodandliving.com/vegan-recipes/vegan-steamed-jam-suet-sponge-pudding/#recipe',
        isPartOf: {
          '@id':
            'https://www.veganfoodandliving.com/vegan-recipes/vegan-steamed-jam-suet-sponge-pudding/#article',
        },
        mainEntityOfPage:
          'https://www.veganfoodandliving.com/vegan-recipes/vegan-steamed-jam-suet-sponge-pudding/',
      };
      const recipe = await RSSFeed.getRecipeFromUrl(url);
      expect(recipe).toEqual(result);
    }
  );

  test(
    `It should return null, because the recipe is not found`,
    { tags: ['integration', 'recipe'] },
    async () => {
      const url =
        'https://www.veganfoodandliving.com/news/wagamama-vegatsu-vegan-options-menu-cuts/';
      const recipe = await RSSFeed.getRecipeFromUrl(url);
      expect(recipe).toBe(null);
    }
  );
});
