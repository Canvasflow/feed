# Project Structure

A map of `src/` and where to find things. The design rationale is on the [Architecture](Architecture.md) page.

← Back to [Home](Home.md)

## Top level

```
src/
├── index.ts            # Public entry point — re-exports the whole API
├── setupTests.ts       # Vitest global setup (exposes SUPPORT_PATH / FEEDS_PATH)
├── himalaya.d.ts       # Ambient types for himalaya (ships no types)
├── rss/                # Feed parsing pipeline
└── component/          # HTML → component pipeline
```

## rss/ — feed pipeline

```
rss/
├── RSSFeed.ts          # The RSSFeed class: validate() and build()
├── RSS.ts              # Typed RSS / Channel / Item / media interfaces
├── ParsedXml.ts        # Typed view of the raw fast-xml-parser output
├── Tag.ts              # Required-tag & valid-tag allow-lists (rss / channel / item)
├── Attributes.ts       # Attribute helpers for fast-xml-parser output
├── RSSFeed.test.ts     # Feed parsing/validation tests
└── RSSFeed.coverage.test.ts
```

## component/ — HTML pipeline

```
component/
├── Component.ts            # ComponentType/TextType unions, interfaces, is* guards
├── Component.test.ts
├── html/
│   ├── HTMLMapper.ts       # Public entry: toComponents(), getRootElement(), pre-processing
│   └── HTMLMapper.*.test.ts# Tests split by component family (text/embeds/media/table/container/mapping)
├── mapping/
│   ├── Mapping.ts          # reduceComponents reducer + the recursive detection engine
│   ├── Mapping.media.ts    # image / picture / figure / video / audio / gallery / iframe / twitter
│   ├── Mapping.embeds.ts   # Social-embed converters/detectors (Instagram, TikTok, YouTube, Vimeo…)
│   ├── Mapping.container.ts# container / columns / live_container / link & figure containers / buttons
│   ├── Mapping.table.ts    # toHTMLTable (<table> → htmltable)
│   ├── Mapping.custom.ts   # toCustom (custom component)
│   ├── Mapping.text.ts     # toText (text components)
│   ├── Mapping.utils.ts    # Leaf helpers (sanitizeNode, sanitizeContentHtml, matchesPattern…)
│   ├── Mapping.constants.ts# Tag/attribute allow-lists
│   ├── Mapping.schema.ts   # Zod schemas: Params, Mapping, filters, component mappings
│   └── Mapping.test.ts
├── node/
│   ├── Node.ts             # himalaya AST node types + helpers (getAttributes, findDescendants, SetUtils)
│   └── Node.test.ts
└── schema/
    ├── Schema.ts           # Zod schemas for recipe (JSON-LD) extraction
    └── Schema.test.ts
```

> The `component/` sources are grouped into per-concern folders (`html/`, `mapping/`, `node/`, `schema/`) with their tests colocated. `Mapping.ts` holds the recursive detection engine (`reduceComponents`/`fromNode`); the per-family converters are extracted into the sibling `Mapping.*` modules and re-exported so the public API is unchanged.

## Test fixtures

Real RSS feeds and HTML snippets live under `src/support/` (`feeds/` and `html/`). [`setupTests.ts`](../../src/setupTests.ts) exposes `process.env.SUPPORT_PATH` and `process.env.FEEDS_PATH` so tests read fixtures without hardcoded paths. See [Testing](Testing.md).

## Build output

`npm run build` (`vp pack`) compiles `src/index.ts` into `dist/` as **unbundled ESM** modules plus `.d.mts` declarations (configured under the `pack` key in [`vite.config.ts`](../../vite.config.ts)). Only `dist/` is published.

## Naming conventions

- **Public classes** are `RSSFeed` and `HTMLMapper`.
- **Mapping internals** are grouped under `component/mapping/` with a `Mapping.<concern>.ts` name.
- **Type guards** are `is<Type>Component` (e.g. `isImageComponent`), defined in `Component.ts`.
- **Tests** are colocated as `*.test.ts` next to the file they cover.
