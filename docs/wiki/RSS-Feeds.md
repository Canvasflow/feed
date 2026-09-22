# RSS Feeds

The `RSSFeed` class parses RSS/Atom XML, validates it, and builds a typed `RSS` object whose items carry a converted `components` array. This page covers the feed pipeline and the supported tags and namespaces.

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
| `validate()`                    | `Promise<void>` | Check required tags against the `tag.ts` allow-lists; fill `errors`/`warnings` on the `rss`, `channel`, and each `item`. |
| `build()`                       | `Promise<RSS>`  | Build the typed `RSS`; convert each item's `content:encoded` HTML into `components` via `HTMLMapper`.                    |
| `set root(mapping)`             | —               | Scope content extraction to a sub-element (a `Mapping`) before conversion.                                               |

Static helpers: `RSSFeed.validateParams(params?, root?)`, `RSSFeed.toJSON(rss)`, `RSSFeed.toString(rss)`, and `RSSFeed.getRecipeFromUrl(url)` / `RSSFeed.getHtmlContent(url)`. See [API Reference](API-Reference.md).

## Validation rules

Validation is driven by allow-lists in [`tag.ts`](https://github.com/canvasflow/feed/blob/main/src/rss/tag.ts). Anything **required** that is missing becomes an error; anything **not in the valid set** becomes a warning (`Invalid property "<name>"`). Nothing throws.

| Level     | Required                   | A few of the valid tags                                                                                                             |
| --------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `rss`     | `channel`                  | `channel`                                                                                                                           |
| `channel` | `title`, `item`            | `link`, `description`, `language`, `generator`, `docs`, `category`, `image`, `ttl`, `pubDate`, `lastBuildDate`, `atom:link`, `sy:*` |
| `item`    | `title`, `guid`, `pubDate` | `link`, `description`, `category`, `author`, `enclosure`, `source`, `content:encoded`, `media:*`, `atom:*`, `dc:*`, `cf:*`          |

## Parser conventions

- XML attributes are exposed with the `@_` prefix (e.g. `@_url`, `@_type`), per `fast-xml-parser` config (`ignoreAttributes: false`).
- The raw parsed tree is held privately on the instance; consumers read the typed `rss` property instead.

## Supported namespaces

Canvasflow reads a curated subset of each namespace (anything else is ignored):

| Prefix    | Namespace   | Used for                                                                                                            |
| --------- | ----------- | ------------------------------------------------------------------------------------------------------------------- |
| `atom`    | Atom        | `atom:link` (channel self-reference), `atom:author`, `atom:updated`.                                                |
| `dc`      | Dublin Core | `dc:creator`, `dc:date`, `dc:language`, `dcterms:modified`.                                                         |
| `sy`      | Syndication | `sy:updatePeriod`, `sy:updateFrequency`, `sy:updateBase`.                                                           |
| `content` | Content     | `content:encoded` — the full HTML body, source of `components`.                                                     |
| `media`   | Media RSS   | `media:content`, `media:group`, and nested `media:*` metadata.                                                      |
| `cf`      | Canvasflow  | `cf:hasAffiliateLinks`, `cf:isSponsored`, `cf:isPaid`, `cf:liveCoverageState`, `cf:thumbnail`, `cf:generationType`. |

## Item fields worth knowing

Beyond the obvious `title`/`link`/`description`/`pubDate`/`category`, a built `Item` carries a few typed sub-objects — each with its own `errors`/`warnings`:

| Field          | Type                     | From                                                                                                                                                                                                                                                                                                                                  |
| -------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enclosure`    | `Enclosure[]`            | `<enclosure url="..." type="..." length="...">`. `url` is required (error if missing); `type`/`length` are suggested (warning).                                                                                                                                                                                                       |
| `source`       | `Source \| undefined`    | `<source url="...">Name</source>` (RSS 2.0 §4.1.1.20.9). `url` is required (error if missing); the text/name is only suggested (warning if absent) — a bare `<source>` with no `url` attribute parses as plain text via `fast-xml-parser`, so `url` still ends up empty and errored. Absent entirely when the item has no `<source>`. |
| `mediaGroup`   | `MediaGroup[]`           | `<media:group>`, each holding its own `mediaContent`.                                                                                                                                                                                                                                                                                 |
| `mediaContent` | `MediaContent[]`         | `<media:content>` (top-level or nested in a group); relative `url`s are resolved against the **channel** `<link>`'s origin.                                                                                                                                                                                                           |
| `cf:thumbnail` | `Thumbnail \| undefined` | `<cf:thumbnail url="..." width="..." height="..." type="..." fileSize="...">`.                                                                                                                                                                                                                                                        |
| `cf:generationType` | `GenerationType[]`   | `<cf:generationType>` — repeatable (one tag per value, or a single tag). Each value is lowercased and trimmed, then kept only if it's `ai` or `syndicated`; anything else, and duplicates, are silently dropped (no error/warning). Always an array — `[]` when the tag is absent or every value was invalid, never `undefined`. |
| `components`   | `Component[]`            | The converted `content:encoded` HTML — see below.                                                                                                                                                                                                                                                                                     |

`clone(item)` (exported from `@canvasflow/feed`) deep-copies an `Item` — including `source`'s `errors`/`warnings` — into a `MutableItem` whose `readonly` arrays become plain mutable arrays, for callers that need to `.push()`/`.splice()` post-build results.

## How items become components

During `build()`, each item's `content:encoded` HTML is run through `HTMLMapper.toComponents(html, params)`. If a `Params` was passed to the constructor, it configures that conversion; if a `root` mapping is set, extraction is scoped to the matching sub-element first. See [HTML Mapping](HTML-Mapping.md) and [Custom Mappings](Custom-Mappings.md).

Afterwards, if the item's own `<link>` is present and parseable, `build()` rewrites any relative image/gallery/video/audio URL found inside that `components` tree into an absolute one, prepended with the link's origin — e.g. an `<img src="/photo.jpg">` inside an item whose `<link>` is `https://example.org/article` becomes `https://example.org/photo.jpg`. Already-absolute (`http(s)://`) and protocol-relative (`//host/...`) URLs are left untouched, as is anything when the item has no parseable `<link>`. This is distinct from — and happens after — the channel-origin-based resolution `mediaContent` already gets (see the table above): the `components` resolution uses the **item's own** `<link>`, not the channel's.
