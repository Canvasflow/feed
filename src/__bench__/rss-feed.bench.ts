import path from 'path';
import { readFileSync } from 'fs';

import { bench, describe } from 'vite-plus/test';

import { RSSFeed } from '../rss/rss-feed';

const feedsDir = path.join(__dirname, '../support/feeds');
const forbesLarge = readFileSync(
  path.join(feedsDir, 'forbes-large.rss'),
  'utf-8'
);
const forbes = readFileSync(path.join(feedsDir, 'forbes.rss'), 'utf-8');

describe('RSSFeed — forbes-large.rss (~1.1 MB, ~50 items)', () => {
  bench('construct + validate()', () => {
    const feed = new RSSFeed(forbesLarge);
    feed.validate();
  });

  bench('construct + build()', () => {
    const feed = new RSSFeed(forbesLarge);
    feed.build();
  });

  bench('construct + validate() + build()', () => {
    const feed = new RSSFeed(forbesLarge);
    feed.validate();
    feed.build();
  });
});

describe('RSSFeed — forbes.rss (small, ~5 items)', () => {
  bench('construct + build()', () => {
    const feed = new RSSFeed(forbes);
    feed.build();
  });
});
