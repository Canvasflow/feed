# API Reference

The public surface re-exported from [`src/index.ts`](../../src/index.ts). The two classes you will use most are `RSSFeed` and `HTMLMapper`.

← Back to [Home](Home.md) · Related: [RSS Feeds](RSS-Feeds.md) · [HTML Mapping](HTML-Mapping.md) · [Component Types](Component-Types.md)

## `RSSFeed`

```ts
import { RSSFeed } from '@canvasflow/feed';
```

### Instance members

| Member          | Signature                                       | Description                                                       |
| --------------- | ----------------------------------------------- | ----------------------------------------------------------------- |
| constructor     | `new RSSFeed(content: string, params?: Params)` | Parse the feed XML; optional `Params` configures HTML conversion. |
| `content`       | `string`                                        | The original XML passed in.                                       |
| `rss`           | `RSS`                                           | The typed result, populated by `validate()` / `build()`.          |
| `errors`        | `Array<unknown>`                                | Top-level errors collected during validation.                     |
| `root` (setter) | `set root(mapping?: Mapping)`                   | Scope content extraction to a sub-element before conversion.      |
| `validate()`    | `Promise<void>`                                 | Validate required tags; fill `errors`/`warnings`.                 |
| `build()`       | `Promise<RSS>`                                  | Build the typed `RSS`; attach a `components` array to each item.  |

### Static members

| Member             | Signature                                                 | Description                                                             |
| ------------------ | --------------------------------------------------------- | ----------------------------------------------------------------------- |
| `validateParams`   | `(params?: Params, root?: Mapping) => Array<unknown>`     | Validate params/root against the Zod schemas; returns collected issues. |
| `toJSON`           | `(rss: RSS) => unknown`                                   | Serialize then re-parse an `RSS` (round-trips errors via `toString`).   |
| `toString`         | `(rss: RSS) => string`                                    | JSON string of an `RSS` (Error values are flattened).                   |
| `getRecipeFromUrl` | `(url: string) => Promise<Recipe \| null>`                | Fetch a page and extract an LD+JSON `Recipe`.                           |
| `getHtmlContent`   | `(url: string, headers?: HeadersInit) => Promise<string>` | Fetch raw HTML for a URL.                                               |

> `getRecipeFromUrl` / `getHtmlContent` perform network I/O (`fetch`); everything else is pure.

## `HTMLMapper`

```ts
import { HTMLMapper } from '@canvasflow/feed';
```

| Member           | Signature                                            | Description                                     |
| ---------------- | ---------------------------------------------------- | ----------------------------------------------- |
| `toComponents`   | `(html: string, params?: Params) => Component[]`     | Convert an HTML string into components.         |
| `getRootElement` | `(html: string, mapping: Mapping) => string \| null` | Serialize the first element matching `mapping`. |

See [HTML Mapping](HTML-Mapping.md).

## Exported helper functions

From the mapping module:

| Function                                                    | Purpose                                                            |
| ----------------------------------------------------------- | ------------------------------------------------------------------ |
| `reduceComponents(params?)`                                 | The reducer used by `toComponents`.                                |
| `getRootElement(nodes, mapping)`                            | Node-level root lookup (the string version lives on `HTMLMapper`). |
| `reduceEmptyTextNode`, `filterEmptyTextNode`, `mapLivePost` | Node-tree helpers used by the pipeline.                            |
| `processTextLinks(html, link?)`                             | Rewrite relative/protocol-relative/unsafe links in text HTML.      |
| `isEmpty(content)`                                          | Whether a string is effectively empty (whitespace only).           |
| `isValidMapping(value)`, `isValidParams(value)`             | Boolean validation against the Zod schemas.                        |
| `validateParams(value)`                                     | Parse-or-throw, returning a typed `Params`.                        |

Constants: `textTags`, `textTagsSet`, `mappingTagsSet`.

## Type guards

The `is*` component guards (e.g. `isImageComponent`, `isVideoComponent`) and `isValidTextRole` are exported from the component module — see [Component Types](Component-Types.md).

## Exported types

| Group              | Types                                                                                                                                                           |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Feed               | `RSS`, `Channel`, `Item`, `Enclosure`, `MediaContent`, `MediaGroup`, `Thumbnail`                                                                                |
| Config             | `Params`, `Mapping`, `ComponentMapping`, `MatchType`, `Filter`, `TagFilter`, `ClassFilter`, `AttributeFilter`, `AttributeValueFilter`, `AttributePatternFilter` |
| Component mappings | `ContainerMapping`, `ColumnsMapping`, `LiveContainerMapping`, `RecipeMapping`, `CustomMapping`, `TextMapping`, `GalleryMapping`                                 |
| Components         | `Component`, `ComponentType`, `TextType`, and every `*Component` interface                                                                                      |
| Schema             | `Recipe` and related schema types                                                                                                                               |

> Exact signatures are the source of truth — see [`src/index.ts`](../../src/index.ts) and the files it re-exports.
