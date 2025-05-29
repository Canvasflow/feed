export const Tag = {
  rss: {
    requiredTags: new Set(['channel']),
    validTags: new Set(['channel']),
    channel: {
      requiredTags: new Set(['title', 'item']),
      validTags: new Set(['title', 'item', 'link', 'description', 'language']),
      item: {
        requiredTags: new Set(['title', 'content:encoded', 'guid', 'pubDate']),
        validTags: new Set([
          'title',
          'content:encoded',
          'guid',
          'pubDate',
          'category',
          'description',
          'link',
          'author',
        ]),
      },
    },
  },
};
