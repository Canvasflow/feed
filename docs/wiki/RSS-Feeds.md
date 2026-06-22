# RSS Feeds

The `RSSFeed` class parses RSS/Atom XML, validates it, and builds a typed `RSS` object whose items carry a converted `components` array. This page covers the feed pipeline; for the exhaustive tag/namespace reference see [`docs/RSS.md`](../../docs/RSS.md).

← Back to [Home](Home.md) · Related: [API Reference](API-Reference.md) · [HTML Mapping](HTML-Mapping.md)

## Lifecycle

```ts
import { RSSFeed } from '@canvasflow/feed';

const feed = new RSSFeed(xml, params /* optional Params */);
await feed.validate(); // populate errors/warnings
const rss = await feed.build(); // typed RSS, items include components
```

| Method                          | Returns         | Purpose                                                                                                                  |
| ------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `new RSSFeed(content, params?)` | —               | Parse the XML (`fast-xml-parser`) and store the raw tree privately. An optional `Params` configures HTML conversion.     |
| `validate()`                    | `Promise<void>` | Check required tags against the `Tag.ts` allow-lists; fill `errors`/`warnings` on the `rss`, `channel`, and each `item`. |
| `build()`                       | `Promise<RSS>`  | Build the typed `RSS`; convert each item's `content:encoded` HTML into `components` via `HTMLMapper`.                    |
| `set root(mapping)`             | —               | Scope content extraction to a sub-element (a `Mapping`) before conversion.                                               |

Static helpers: `RSSFeed.validateParams(params?, root?)`, `RSSFeed.toJSON(rss)`, `RSSFeed.toString(rss)`, and `RSSFeed.getRecipeFromUrl(url)` / `RSSFeed.getHtmlContent(url)`. See [API Reference](API-Reference.md).

## Validation rules

Validation is driven by allow-lists in [`Tag.ts`](../../src/rss/Tag.ts). Anything **required** that is missing becomes an error; anything **not in the valid set** becomes a warning (`Invalid property "<name>"`). Nothing throws.

| Level     | Required                   | A few of the valid tags                                                                                                             |
| --------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `rss`     | `channel`                  | `channel`                                                                                                                           |
| `channel` | `title`, `item`            | `link`, `description`, `language`, `generator`, `docs`, `category`, `image`, `ttl`, `pubDate`, `lastBuildDate`, `atom:link`, `sy:*` |
| `item`    | `title`, `guid`, `pubDate` | `link`, `description`, `category`, `author`, `enclosure`, `content:encoded`, `media:*`, `atom:*`, `dc:*`, `cf:*`                    |

## Parser conventions

- XML attributes are exposed with the `@_` prefix (e.g. `@_url`, `@_type`), per `fast-xml-parser` config (`ignoreAttributes: false`).
- The raw parsed tree is held privately on the instance; consumers read the typed `rss` property instead.

## Supported namespaces

Canvasflow reads a curated subset of each namespace (anything else is ignored):

| Prefix    | Namespace   | Used for                                                                                       |
| --------- | ----------- | ---------------------------------------------------------------------------------------------- |
| `atom`    | Atom        | `atom:link` (channel self-reference), `atom:author`, `atom:updated`.                           |
| `dc`      | Dublin Core | `dc:creator`, `dc:date`, `dc:language`, `dcterms:modified`.                                    |
| `sy`      | Syndication | `sy:updatePeriod`, `sy:updateFrequency`, `sy:updateBase`.                                      |
| `content` | Content     | `content:encoded` — the full HTML body, source of `components`.                                |
| `media`   | Media RSS   | `media:content`, `media:group`, and nested `media:*` metadata.                                 |
| `cf`      | Canvasflow  | `cf:hasAffiliateLinks`, `cf:isSponsored`, `cf:isPaid`, `cf:liveCoverageState`, `cf:thumbnail`. |

Full element-by-element tables (requirements, ancestors, descriptions) are in [`docs/RSS.md`](../../docs/RSS.md).

## How items become components

During `build()`, each item's `content:encoded` HTML is run through `HTMLMapper.toComponents(html, params)`. If a `Params` was passed to the constructor, it configures that conversion; if a `root` mapping is set, extraction is scoped to the matching sub-element first. See [HTML Mapping](HTML-Mapping.md) and [Custom Mappings](Custom-Mappings.md).
