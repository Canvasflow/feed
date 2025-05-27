import path from 'path';
import { readFileSync } from 'fs';
import { test, expect, describe, beforeEach } from 'vitest';

import RSSFeed from './RSSFeed';

describe('Newsweek', () => {
  let filePath: string = '';
  beforeEach(() => {
    filePath = path.join(`${process.env.FEEDS_PATH}`, `newsweek.xml`);
  });
  test(`It should validate the content`, async () => {
    const content = readFileSync(filePath, 'utf-8');
    const feed = new RSSFeed(content);
    await feed.validate();
    console.log(feed.errors);

    expect(feed.errors.length).toBe(0);
  });
  test(`It should build the content`, async () => {
    const content = readFileSync(filePath, 'utf-8');
    const feed = new RSSFeed(content);
    const rss = await feed.build();

    expect(rss.channel?.title).toBe('Newsweek feed for VMG');
  });
});

describe.skip('Autocar', () => {
  let filePath: string = '';
  beforeEach(() => {
    filePath = path.join(`${process.env.FEEDS_PATH}`, `autocar.xml`);
  });
  test(`It should validate the content`, async () => {
    const content = readFileSync(filePath, 'utf-8');
    const feed = new RSSFeed(content);
    await feed.validate();

    expect(feed.errors.length).toBe(0);
  });
  test(`It should build the content`, async () => {
    const content = readFileSync(filePath, 'utf-8');
    const feed = new RSSFeed(content);
    const rss = await feed.build();

    expect(rss.channel?.title).toBe('Autocar.co.uk');
  });
});
