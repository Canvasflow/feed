import fs from 'fs';
import { test, expect, describe } from 'vite-plus/test';

import { RSSFeed } from './RSSFeed';
import type { Mapping } from '../component/mapping/Mapping';

const tags = { tags: ['unit', 'rss'] };

const feedWith = (itemBody: string): string =>
  `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:media="http://search.yahoo.com/mrss/"
     xmlns:cf="https://canvasflow.io/rss">
  <channel>
    <title>Coverage feed</title>
    <link>https://example.com</link>
    <description>desc</description>
    <item>
      <title>Item title</title>
      <guid>guid-1</guid>
      <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
      ${itemBody}
    </item>
  </channel>
</rss>`;

describe('RSSFeed build coverage', () => {
  test('warns on a cf boolean tag carrying attributes', tags, async () => {
    // A non-boolean text value keeps `#text` a string so the attribute warning
    // and invalid-value error paths are exercised.
    const feed = new RSSFeed(
      feedWith(`<cf:isSponsored foo="bar">maybe</cf:isSponsored>`)
    );
    await feed.validate();
    const rss = await feed.build();
    const item = rss.channel.items[0];
    expect(item.warnings).toContain(
      "Attributes are not allowed for the 'cf:isSponsored' property."
    );
  });

  test(
    'marks media:content as default when isDefault is set',
    tags,
    async () => {
      const feed = new RSSFeed(
        feedWith(
          `<media:content url="https://example.com/i.jpg" type="image/jpeg" isDefault="true" />`
        )
      );
      await feed.validate();
      const rss = await feed.build();
      const item = rss.channel.items[0];
      expect(item.mediaContent[0].isDefault).toBe(true);
    }
  );

  test(
    'handles an item missing title/pubDate and a url-only thumbnail',
    tags,
    async () => {
      const raw = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:cf="https://canvasflow.io/rss">
  <channel>
    <title>Coverage feed</title>
    <link>https://example.com</link>
    <description>desc</description>
    <item>
      <guid>guid-2</guid>
      <cf:thumbnail url="https://example.com/thumb.jpg" />
    </item>
  </channel>
</rss>`;
      const feed = new RSSFeed(raw);
      await feed.validate();
      const rss = await feed.build();
      const item = rss.channel.items[0];
      expect(item.title).toBe('');
      expect(item.pubDate).toBeUndefined();
      expect(item['cf:thumbnail']?.url).toBe('https://example.com/thumb.jpg');
      expect(item['cf:thumbnail']?.width).toBeUndefined();
      expect(item['cf:thumbnail']?.height).toBeUndefined();
      expect(item['cf:thumbnail']?.type).toBeUndefined();
    }
  );

  test(
    'scopes content extraction to the configured root element',
    tags,
    async () => {
      const feed = new RSSFeed(
        feedWith(
          `<content:encoded><![CDATA[<aside>skip</aside><main><h1>Kept</h1></main>]]></content:encoded>`
        )
      );
      const root: Mapping = {
        match: 'all',
        filters: [{ type: 'tag', items: ['main'] }],
      };
      feed.root = root;
      await feed.validate();
      const rss = await feed.build();
      const item = rss.channel.items[0];
      expect(item['content:encoded']).toContain('<h1>Kept</h1>');
      expect(item['content:encoded']).not.toContain('skip');
    }
  );
});

describe('RSSFeed ordering guard', () => {
  test(
    'auto-validates when build() is called without validate()',
    { tags: ['unit'] },
    async () => {
      const feed = new RSSFeed(feedWith(''));
      const rss = await feed.build();
      expect(rss).toBeDefined();
    }
  );

  test(
    'resolves when validate() precedes build()',
    { tags: ['unit', 'rss'] },
    async () => {
      const content = fs.readFileSync(
        `${process.env.FEEDS_PATH}/codrops.rss`,
        'utf-8'
      );
      const feed = new RSSFeed(content);
      await feed.validate();
      await expect(feed.build()).resolves.toBeDefined();
    }
  );
});
