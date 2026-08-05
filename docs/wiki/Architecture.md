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

| File                                                                                  | Responsibility                                                           |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [`rss-feed.ts`](https://github.com/canvasflow/feed/blob/main/src/rss/rss-feed.ts)     | Parses XML with `fast-xml-parser`; exposes `validate()` and `build()`.   |
| [`rss-types.ts`](https://github.com/canvasflow/feed/blob/main/src/rss/rss-types.ts)   | The typed `RSS` / `Channel` / `Item` interfaces.                         |
| [`parsed-xml.ts`](https://github.com/canvasflow/feed/blob/main/src/rss/parsed-xml.ts) | Typed view of the raw `fast-xml-parser` output read by `build()`.        |
| [`tag.ts`](https://github.com/canvasflow/feed/blob/main/src/rss/tag.ts)               | Required-tag and valid-tag allow-lists per level (rss / channel / item). |
| [`attributes.ts`](https://github.com/canvasflow/feed/blob/main/src/rss/attributes.ts) | Helpers for the parser's attribute conventions.                          |

- **`validate()`** checks required tags against the `tag.ts` allow-lists and populates `errors`/`warnings` arrays on the RSS, channel, and item objects.
- **`build()`** constructs the typed `RSS` object and converts each item's `content:encoded` into a `components` array.

XML attributes from the parser use the `@_` prefix convention (e.g. `@_url`, `@_type`). Canvasflow extensions use the `cf:` namespace. The raw parser output is kept **private** (`RSSFeed.data`, typed via [`ParsedXml`](https://github.com/canvasflow/feed/blob/main/src/rss/parsed-xml.ts)); consumers read the typed `rss` property. See [RSS Feeds](RSS-Feeds.md).

## HTML pipeline (`src/component/`)

`HTMLMapper.toComponents(html, params?, root?)` is the core HTML → component pipeline. It parses the input **exactly once** and applies all transformations as pure `Node[] → Node[]` passes on that single tree:

1. **Parse** with `parser.ts` (a `linkedom`-backed adapter) into a `Node[]` AST.
2. **`stripBreaklines`** — strips newlines from text content and attribute values; drops zero-length text nodes.
3. **`hoistAnchorsWithImages`** — lifts `<a>` elements wrapping images out of `<p>`/heading blocks.
4. **`splitImagesFromParagraphs`** — splits block elements that contain `<img>` direct children.
5. **`sanitizeInvalidAnchorHrefs`** — rewrites invalid `href` values to `"#"`.
6. **Root scoping** (optional) — if a `root` mapping is passed, locates the matching subtree and reduces to `[rootNode]`.
7. **`reduceComponents(params)`** — walks the node tree and emits `Component[]`; sanitization of each node's HTML is done inline via `sanitizeNodes()` with no intermediate string re-parse.

`linkedom` is the **single HTML parser** used end-to-end. There is no dual-parser path and no stringify→re-parse round-trip inside the component pipeline.

| File / folder                                                                                                             | Responsibility                                                                                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`html/html-mapper.ts`](https://github.com/canvasflow/feed/blob/main/src/component/html/html-mapper.ts)                   | Public entry: `toComponents()` and `getRootElement()`; HTML pre-processing.                                                                                                                                                                                         |
| [`html/parser.ts`](https://github.com/canvasflow/feed/blob/main/src/component/html/parser.ts)                             | `parse(html)` / `stringify(nodes)` — wraps `linkedom` and emits the same `Node[]` AST shape the mapping layer consumes. Reads attribute values from `element.outerHTML` so embedded `"` characters are always `&quot;`-escaped.                                     |
| [`html/sanitize-html.ts`](https://github.com/canvasflow/feed/blob/main/src/component/html/sanitize-html.ts)               | Inline implementation of the `sanitize-html` API subset used by this library — walks the `Node[]` AST, keeps allowed tags/attributes, strips or unwraps the rest. Replaces the npm package and its transitive dependencies (`postcss`, `deepmerge`, `dayjs`, etc.). |
| [`mapping/mapping.ts`](https://github.com/canvasflow/feed/blob/main/src/component/mapping/mapping.ts)                     | The `reduceComponents` reducer and the recursive element-detection engine.                                                                                                                                                                                          |
| [`mapping/mapping.media.ts`](https://github.com/canvasflow/feed/blob/main/src/component/mapping/mapping.media.ts)         | image / picture / figure / video / audio / gallery / iframe / twitter converters.                                                                                                                                                                                   |
| [`mapping/mapping.embeds.ts`](https://github.com/canvasflow/feed/blob/main/src/component/mapping/mapping.embeds.ts)       | Self-contained social-embed converters/detectors.                                                                                                                                                                                                                   |
| [`mapping/mapping.container.ts`](https://github.com/canvasflow/feed/blob/main/src/component/mapping/mapping.container.ts) | container / columns / live container / link & figure containers / buttons.                                                                                                                                                                                          |
| [`mapping/mapping.table.ts`](https://github.com/canvasflow/feed/blob/main/src/component/mapping/mapping.table.ts)         | `toHTMLTable` (`<table>` → `htmltable`).                                                                                                                                                                                                                            |
| [`mapping/mapping.custom.ts`](https://github.com/canvasflow/feed/blob/main/src/component/mapping/mapping.custom.ts)       | `toCustom` (custom component).                                                                                                                                                                                                                                      |
| [`mapping/mapping.text.ts`](https://github.com/canvasflow/feed/blob/main/src/component/mapping/mapping.text.ts)           | `toText` (text components).                                                                                                                                                                                                                                         |
| [`mapping/mapping.schema.ts`](https://github.com/canvasflow/feed/blob/main/src/component/mapping/mapping.schema.ts)       | Zod schemas for `Params`, `Mapping`, and filters.                                                                                                                                                                                                                   |
| [`mapping/mapping.constants.ts`](https://github.com/canvasflow/feed/blob/main/src/component/mapping/mapping.constants.ts) | Tag / attribute allow-lists used during conversion.                                                                                                                                                                                                                 |
| [`mapping/mapping.utils.ts`](https://github.com/canvasflow/feed/blob/main/src/component/mapping/mapping.utils.ts)         | Shared helpers: `sanitizeNode`, `sanitizeContentHtml`, `matchesPattern`, `fromFigcaption`, `filterClassNameDescendants`, `processTextLinks`, `isEmpty`, and filter/exclude utilities.                                                                               |
| [`component.ts`](https://github.com/canvasflow/feed/blob/main/src/component/component.ts)                                 | `ComponentType` / `TextType` unions, component interfaces, and `is*` guards.                                                                                                                                                                                        |
| [`node/node-helpers.ts`](https://github.com/canvasflow/feed/blob/main/src/component/node/node-helpers.ts)                 | AST node types (`Node`, `ElementNode`, `TextNode`, `CommentNode`, `Attribute`) and helpers (`getAttributes`, `findDescendants`, `removeDescendants`, `SetUtils`); exports `DescendantsReducer`, `FindFn`, `NodeFilterFn`.                                           |
| [`schema/recipe-schema.ts`](https://github.com/canvasflow/feed/blob/main/src/component/schema/recipe-schema.ts)           | Zod schemas for recipe (JSON-LD) extraction.                                                                                                                                                                                                                        |

### The detection engine

`reduceComponents` walks the node tree and, for each element, evaluates (in order):

1. **Exclusion** — `excludes` mappings or the `data-cf-ignore` attribute.
2. **Unwrap** — `unwrap` mappings; the element is dropped but its children are kept and evaluated in its place.
3. **Built-in detection** — social embeds, `<table>`, `<video>`, `<audio>`, `<iframe>`, buttons, images (`<img>`, `<picture>`), galleries, and `<figure>` (always routed to `toFigureContainer` → `FigureContainerComponent`).
4. **Custom mappings** — each `mappings` entry in order; first match wins.
5. **Default text rules** — the `h1→headline … p→body` table.
6. **Descend** — otherwise ignore the element and evaluate its children.

The recursive core (`reduceComponents`/`fromNode`) lives in `mapping.ts`. The per-family converters are split into sibling modules — `mapping.media.ts`, `mapping.embeds.ts`, `mapping.container.ts`, `mapping.table.ts`, `mapping.custom.ts`, `mapping.text.ts` — alongside the leaf concerns (`mapping.constants.ts`, `mapping.utils.ts`, `mapping.schema.ts`). `mapping.ts` imports them and re-exports their public helpers so the API surface is unchanged. See [HTML Mapping](HTML-Mapping.md) and [Custom Mappings](Custom-Mappings.md).

## Error model

The library does not throw for malformed feeds. Instead, `validate()`/`build()` accumulate problems into `errors` and `warnings` arrays on the `RSS`, `Channel`, `Item`, and individual component objects, so a single bad element never aborts the whole conversion. Invalid attribute-filter patterns are likewise treated as a non-match rather than throwing.

## Public surface

Everything consumers use is re-exported from [`src/index.ts`](https://github.com/canvasflow/feed/blob/main/src/index.ts):

```ts
export * from './rss/RSSFeed';
export * from './rss/RSS';
export * from './component/Component';
export * from './component/schema/Schema';
export * from './component/html/HTMLMapper';
export * from './component/mapping/Mapping';
```

See the [API Reference](API-Reference.md) for the full list.
