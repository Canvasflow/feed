import path from 'path';
import { readFileSync } from 'fs';
import { test, expect, describe } from 'vitest';

import RSSFeed from './RSSFeed';

describe('Validation logic', () => {
  test(`It should validate the content of newsweek`, async () => {
    const filePath = path.join(`${process.env.FEEDS_PATH}`, `newsweek.xml`);
    const content = readFileSync(filePath, 'utf-8');
    const feed = new RSSFeed(content);
    await feed.validate();

    expect(feed.errors.length).toBe(0);
  });

  test(`It should validate the content of autocar`, async () => {
    const filePath = path.join(`${process.env.FEEDS_PATH}`, `autocar.xml`);
    const content = readFileSync(filePath, 'utf-8');
    const feed = new RSSFeed(content);
    await feed.validate();

    expect(feed.errors.length).toBe(0);
  });
});

describe('Building logic', () => {
  test(`It should validate the content of newsweek`, async () => {
    const filePath = path.join(`${process.env.FEEDS_PATH}`, `newsweek.xml`);
    const content = readFileSync(filePath, 'utf-8');
    const feed = new RSSFeed(content);
    const rss = await feed.build();

    expect(Object.keys(rss).length).toBe(0);
  });

  test(`It should validate the content of autocar`, async () => {
    const filePath = path.join(`${process.env.FEEDS_PATH}`, `autocar.xml`);
    const content = readFileSync(filePath, 'utf-8');
    const feed = new RSSFeed(content);
    const rss = await feed.build();

    expect(Object.keys(rss).length).toBe(0);
  });
});
