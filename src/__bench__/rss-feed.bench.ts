import path from 'path';
import { readFileSync } from 'fs';

import { test, describe } from 'vite-plus/test';

import { RSSFeed } from '../rss/rss-feed';

const feedsDir = path.join(__dirname, '../support/feeds');
const forbesLarge = readFileSync(
  path.join(feedsDir, 'forbes-large.rss'),
  'utf-8'
);
const forbes = readFileSync(path.join(feedsDir, 'forbes.rss'), 'utf-8');

describe('RSSFeed — forbes-large.rss (~1.1 MB, ~50 items)', () => {
  test('construct + validate()', async ({ bench }) => {
    await bench('construct + validate()', () => {
      const feed = new RSSFeed(forbesLarge);
      feed.validate();
    }).run();
  });

  test('construct + build()', async ({ bench }) => {
    await bench('construct + build()', () => {
      const feed = new RSSFeed(forbesLarge);
      feed.build();
    }).run();
  });

  test('construct + validate() + build()', async ({ bench }) => {
    await bench('construct + validate() + build()', () => {
      const feed = new RSSFeed(forbesLarge);
      feed.validate();
      feed.build();
    }).run();
  });
});

describe('RSSFeed — forbes.rss (small, ~5 items)', () => {
  test('construct + build()', async ({ bench }) => {
    await bench('construct + build()', () => {
      const feed = new RSSFeed(forbes);
      feed.build();
    }).run();
  });
});
