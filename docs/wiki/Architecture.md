# Architecture

`@canvasflow/feed` is a **pure, side-effect-free library** (no server, no I/O except an optional recipe fetch). It exposes two cooperating pipelines built around two public classes: **`RSSFeed`** and **`HTMLMapper`**.

← Back to [Home](Home.md) · Related: [Project Structure](Project-Structure.md) · [API Reference](API-Reference.md)

## The two pipelines

```
RSS/Atom XML ──► RSSFeed ──► validate() / build() ──► RSS object
                               │
                               │ per item: content:encoded (HTML)
                               ▼
                         HTMLMapper.toComponents(html, params)
                               │
                               ▼
                         Component[]  (attached to each item)
```

1. **Feed pipeline** (`src/rss/`) — `RSSFeed` wraps `fast-xml-parser`, validates required tags, and builds a typed `RSS` object.
2. **HTML pipeline** (`src/component/`) — `HTMLMapper` turns an HTML string into a typed `Component[]`.

The feed pipeline **drives** the HTML pipeline: `build()` runs each item's `content:encoded` HTML through `HTMLMapper.toComponents()` and stores the result on `item.components`.

## Feed pipeline (`src/rss/`)

| File                                           | Responsibility                                                           |
| ---------------------------------------------- | ------------------------------------------------------------------------ |
| [`RSSFeed.ts`](../../src/rss/RSSFeed.ts)       | Parses XML with `fast-xml-parser`; exposes `validate()` and `build()`.   |
| [`RSS.ts`](../../src/rss/RSS.ts)               | The typed `RSS` / `Channel` / `Item` interfaces.                         |
| [`ParsedXml.ts`](../../src/rss/ParsedXml.ts)   | Typed view of the raw `fast-xml-parser` output read by `build()`.        |
| [`Tag.ts`](../../src/rss/Tag.ts)               | Required-tag and valid-tag allow-lists per level (rss / channel / item). |
| [`Attributes.ts`](../../src/rss/Attributes.ts) | Helpers for the parser's attribute conventions.                          |

- **`validate()`** checks required tags against the `Tag.ts` allow-lists and populates `errors`/`warnings` arrays on the RSS, channel, and item objects.
- **`build()`** constructs the typed `RSS` object and converts each item's `content:encoded` into a `components` array.

XML attributes from the parser use the `@_` prefix convention (e.g. `@_url`, `@_type`). Canvasflow extensions use the `cf:` namespace. The raw parser output is kept **private** (`RSSFeed.data`, typed via [`ParsedXml`](../../src/rss/ParsedXml.ts)); consumers read the typed `rss` property. See [RSS Feeds](RSS-Feeds.md).

## HTML pipeline (`src/component/`)

`HTMLMapper.toComponents(html, params?)` is the core HTML → component pipeline:

1. **Pre-process** the HTML string — remove breaklines, sanitize invalid `href`s, lift `<a>` wrappers around images, and split `<p>`/heading tags that contain `<img>` elements.
2. **Parse** with `himalaya` into a `Node[]` AST.
3. **Reduce** the node tree via `reduceComponents(params)` into `Component[]`.

| File / folder                                                                      | Responsibility                                                                        |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| [`html/HTMLMapper.ts`](../../src/component/html/HTMLMapper.ts)                     | Public entry: `toComponents()` and `getRootElement()`; HTML pre-processing.           |
| [`mapping/Mapping.ts`](../../src/component/mapping/Mapping.ts)                     | The `reduceComponents` reducer and the recursive element-detection engine.            |
| [`mapping/Mapping.media.ts`](../../src/component/mapping/Mapping.media.ts)         | image / picture / figure / video / audio / gallery / iframe / twitter converters.     |
| [`mapping/Mapping.embeds.ts`](../../src/component/mapping/Mapping.embeds.ts)       | Self-contained social-embed converters/detectors.                                     |
| [`mapping/Mapping.container.ts`](../../src/component/mapping/Mapping.container.ts) | container / columns / live container / link & figure containers / buttons.            |
| [`mapping/Mapping.table.ts`](../../src/component/mapping/Mapping.table.ts)         | `toHTMLTable` (`<table>` → `htmltable`).                                              |
| [`mapping/Mapping.custom.ts`](../../src/component/mapping/Mapping.custom.ts)       | `toCustom` (custom component).                                                        |
| [`mapping/Mapping.text.ts`](../../src/component/mapping/Mapping.text.ts)           | `toText` (text components).                                                           |
| [`mapping/Mapping.schema.ts`](../../src/component/mapping/Mapping.schema.ts)       | Zod schemas for `Params`, `Mapping`, and filters.                                     |
| [`mapping/Mapping.constants.ts`](../../src/component/mapping/Mapping.constants.ts) | Tag / attribute allow-lists used during conversion.                                   |
| [`mapping/Mapping.utils.ts`](../../src/component/mapping/Mapping.utils.ts)         | Shared helpers: `sanitizeNode`, `sanitizeContentHtml`, `matchesPattern`, `fromFigcaption`, `filterClassNameDescendants`, `processTextLinks`, `isEmpty`, and filter/exclude utilities. |
| [`Component.ts`](../../src/component/Component.ts)                                 | `ComponentType` / `TextType` unions, component interfaces, and `is*` guards.          |
| [`node/Node.ts`](../../src/component/node/Node.ts)                                 | himalaya AST node types and helpers (`getAttributes`, `findDescendants`, `removeDescendants`, `SetUtils`); exports `DescendantsReducer`, `FindFn`, `NodeFilterFn`. |
| [`schema/Schema.ts`](../../src/component/schema/Schema.ts)                         | Zod schemas for recipe (JSON-LD) extraction.                                          |

### The detection engine

`reduceComponents` walks the node tree and, for each element, evaluates (in order):

1. **Exclusion** — `excludes` mappings or the `data-cf-ignore` attribute.
2. **Built-in detection** — social embeds, `<table>`, `<video>`, `<audio>`, `<iframe>`, buttons, images (`<img>`, `<picture>`), galleries, and `<figure>` (always routed to `toFigureContainer` → `FigureContainerComponent`).
3. **Custom mappings** — each `mappings` entry in order; first match wins.
4. **Default text rules** — the `h1→headline … p→body` table.
5. **Descend** — otherwise ignore the element and evaluate its children.

The recursive core (`reduceComponents`/`fromNode`) lives in `Mapping.ts`. The per-family converters are split into sibling modules — `Mapping.media.ts`, `Mapping.embeds.ts`, `Mapping.container.ts`, `Mapping.table.ts`, `Mapping.custom.ts`, `Mapping.text.ts` — alongside the leaf concerns (`Mapping.constants.ts`, `Mapping.utils.ts`, `Mapping.schema.ts`). `Mapping.ts` imports them and re-exports their public helpers so the API surface is unchanged. See [HTML Mapping](HTML-Mapping.md) and [Custom Mappings](Custom-Mappings.md).

## Error model

The library does not throw for malformed feeds. Instead, `validate()`/`build()` accumulate problems into `errors` and `warnings` arrays on the `RSS`, `Channel`, `Item`, and individual component objects, so a single bad element never aborts the whole conversion. Invalid attribute-filter patterns are likewise treated as a non-match rather than throwing.

## Public surface

Everything consumers use is re-exported from [`src/index.ts`](../../src/index.ts):

```ts
export * from './rss/RSSFeed';
export * from './rss/RSS';
export * from './component/Component';
export * from './component/schema/Schema';
export * from './component/html/HTMLMapper';
export * from './component/mapping/Mapping';
```

See the [API Reference](API-Reference.md) for the full list.
