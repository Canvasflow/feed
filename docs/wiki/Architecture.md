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
| [`Tag.ts`](../../src/rss/Tag.ts)               | Required-tag and valid-tag allow-lists per level (rss / channel / item). |
| [`Attributes.ts`](../../src/rss/Attributes.ts) | Helpers for the parser's attribute conventions.                          |

- **`validate()`** checks required tags against the `Tag.ts` allow-lists and populates `errors`/`warnings` arrays on the RSS, channel, and item objects.
- **`build()`** constructs the typed `RSS` object and converts each item's `content:encoded` into a `components` array.

XML attributes from the parser use the `@_` prefix convention (e.g. `@_url`, `@_type`). Canvasflow extensions use the `cf:` namespace. The raw parser output is kept **private** (`RSSFeed.data`); consumers read the typed `rss` property. See [RSS Feeds](RSS-Feeds.md).

## HTML pipeline (`src/component/`)

`HTMLMapper.toComponents(html, params?)` is the core HTML → component pipeline:

1. **Pre-process** the HTML string — remove breaklines, sanitize invalid `href`s, lift `<a>` wrappers around images, and split `<p>`/heading tags that contain `<img>` elements.
2. **Parse** with `himalaya` into a `Node[]` AST.
3. **Reduce** the node tree via `reduceComponents(params)` into `Component[]`.

| File / folder                                                                      | Responsibility                                                                        |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| [`HTMLMapper.ts`](../../src/component/HTMLMapper.ts)                               | Public entry: `toComponents()` and `getRootElement()`; HTML pre-processing.           |
| [`mapping/Mapping.ts`](../../src/component/mapping/Mapping.ts)                     | The `reduceComponents` reducer and the element-detection engine.                      |
| [`mapping/Mapping.schema.ts`](../../src/component/mapping/Mapping.schema.ts)       | Zod schemas for `Params`, `Mapping`, and filters.                                     |
| [`mapping/Mapping.constants.ts`](../../src/component/mapping/Mapping.constants.ts) | Tag / attribute allow-lists used during conversion.                                   |
| [`mapping/Mapping.utils.ts`](../../src/component/mapping/Mapping.utils.ts)         | Leaf helpers (`sanitizeNode`, `matchesPattern`, `processTextLinks`, …).               |
| [`mapping/Mapping.embeds.ts`](../../src/component/mapping/Mapping.embeds.ts)       | Self-contained social-embed converters/detectors.                                     |
| [`Component.ts`](../../src/component/Component.ts)                                 | `ComponentType` / `TextType` unions, component interfaces, and `is*` guards.          |
| [`node/Node.ts`](../../src/component/node/Node.ts)                                 | himalaya AST node types and helpers (`getAttributes`, `findDescendants`, `SetUtils`). |
| [`schema/Schema.ts`](../../src/component/schema/Schema.ts)                         | Zod schemas for recipe (JSON-LD) extraction.                                          |

### The detection engine

`reduceComponents` walks the node tree and, for each element, evaluates (in order):

1. **Exclusion** — `excludes` mappings or the `data-cf-ignore` attribute.
2. **Built-in detection** — social embeds, `<table>`, `<video>`, `<audio>`, `<iframe>`, buttons, images, galleries.
3. **Custom mappings** — each `mappings` entry in order; first match wins.
4. **Default text rules** — the `h1→headline … p→body` table.
5. **Descend** — otherwise ignore the element and evaluate its children.

The engine (`reduceComponents`/`fromNode`, containers, and figure/image handling) is **mutually recursive** and lives together in `Mapping.ts`. The leaf concerns — constants, pure utilities, and social-embed converters — are split into sibling modules that the engine imports one-directionally (no cycles). See [HTML Mapping](HTML-Mapping.md) and [Custom Mappings](Custom-Mappings.md).

## Error model

The library does not throw for malformed feeds. Instead, `validate()`/`build()` accumulate problems into `errors` and `warnings` arrays on the `RSS`, `Channel`, `Item`, and individual component objects, so a single bad element never aborts the whole conversion. Invalid attribute-filter patterns are likewise treated as a non-match rather than throwing.

## Public surface

Everything consumers use is re-exported from [`src/index.ts`](../../src/index.ts):

```ts
export * from './rss/RSSFeed';
export * from './rss/RSS';
export * from './component/Component';
export * from './component/schema/Schema';
export * from './component/HTMLMapper';
export * from './component/mapping/Mapping';
```

See the [API Reference](API-Reference.md) for the full list.
