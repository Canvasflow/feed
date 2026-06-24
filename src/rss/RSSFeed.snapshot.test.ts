import fs from 'fs';
import path from 'path';
import { test, expect, describe } from 'vite-plus/test';

import { RSSFeed } from './RSSFeed';

const feedsPath = path.join(__dirname, '..', 'support', 'feeds');

const feeds = fs
  .readdirSync(feedsPath)
  .filter((f) => f.endsWith('.rss'))
  .sort();

describe('RSSFeed full-pipeline snapshots', () => {
  for (const filename of feeds) {
    test(filename, { tags: ['rss'] }, async () => {
      const content = fs.readFileSync(path.join(feedsPath, filename), 'utf-8');
      const feed = new RSSFeed(content);
      await feed.validate();
      const rss = await feed.build();
      expect(rss).toMatchSnapshot();
    });
  }
});
