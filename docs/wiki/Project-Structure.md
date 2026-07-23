# Project Structure

A map of `src/` and where to find things. The design rationale is on the [Architecture](Architecture.md) page.

← Back to [Home](Home.md)

## Top level

```
src/
├── index.ts            # Public entry point — re-exports the whole API
├── setup-tests.ts      # Vitest global setup (exposes SUPPORT_PATH / FEEDS_PATH)
├── himalaya.d.ts       # Ambient types for himalaya (ships no types)
├── rss/                # Feed parsing pipeline
└── component/          # HTML → component pipeline
```

## rss/ — feed pipeline

```
rss/
├── rss-feed.ts          # The RSSFeed class: validate() and build()
├── rss-types.ts         # Typed RSS / Channel / Item / media interfaces
├── parsed-xml.ts        # Typed view of the raw fast-xml-parser output
├── tag.ts                # Required-tag & valid-tag allow-lists (rss / channel / item)
├── attributes.ts         # Attribute helpers for fast-xml-parser output
└── __tests__/
    ├── rss-feed.test.ts
    ├── rss-feed.coverage.test.ts
    ├── rss-feed.snapshot.test.ts
    ├── build-item.test.ts
    └── __snapshots__/
```

## component/ — HTML pipeline

```
component/
├── component.ts             # ComponentType/TextType unions, interfaces, is* guards
├── __tests__/
│   └── component.test.ts
├── html/
│   ├── html-mapper.ts        # Public entry: toComponents(), getRootElement(), pre-processing
│   └── __tests__/
│       └── html-mapper.*.test.ts # Tests split by component family (text/embeds/media/table/container/mapping)
├── mapping/
│   ├── mapping.ts             # reduceComponents reducer + the recursive detection engine
│   ├── mapping.media.ts       # image / picture / figure / video / audio / gallery / iframe / twitter
│   ├── mapping.embeds.ts      # Social-embed converters/detectors (Instagram, TikTok, YouTube, Vimeo…)
│   ├── mapping.container.ts   # container / columns / live_container / link & figure containers / buttons
│   ├── mapping.table.ts       # toHTMLTable (<table> → htmltable)
│   ├── mapping.custom.ts      # toCustom (custom component)
│   ├── mapping.text.ts        # toText (text components)
│   ├── mapping.utils.ts       # Leaf helpers (sanitizeNode, sanitizeContentHtml, matchesPattern…)
│   ├── mapping.constants.ts   # Tag/attribute allow-lists
│   ├── mapping.schema.ts      # Zod schemas: Params, Mapping, filters, component mappings
│   └── __tests__/
│       ├── mapping.test.ts
│       └── mapping.coverage.test.ts
├── node/
│   ├── node-helpers.ts        # himalaya AST node types + helpers (getAttributes, findDescendants, removeDescendants, SetUtils; DescendantsReducer type)
│   └── __tests__/
│       └── node-helpers.test.ts
└── schema/
    ├── recipe-schema.ts       # Zod schemas for recipe (JSON-LD) extraction
    └── __tests__/
        └── recipe-schema.test.ts
```

> The `component/` sources are grouped into per-concern folders (`html/`, `mapping/`, `node/`, `schema/`) with their tests colocated in a sibling `__tests__/` folder. `mapping.ts` holds the recursive detection engine (`reduceComponents`/`fromNode`); the per-family converters are extracted into the sibling `mapping.*.ts` modules and re-exported so the public API is unchanged. `node/node-helpers.ts` and `schema/recipe-schema.ts` are named to avoid colliding with their own directory name (`node/node.ts`, `schema/schema.ts`) — see [ADR-0001](https://github.com/canvasflow/feed/blob/main/docs/adr/0001-kebab-case-naming-and-colocated-test-conventions.md).

## Test fixtures

Real RSS feeds and HTML snippets live under `src/support/` (`feeds/` and `html/`). [`setup-tests.ts`](https://github.com/canvasflow/feed/blob/main/src/setup-tests.ts) exposes `process.env.SUPPORT_PATH` and `process.env.FEEDS_PATH` so tests read fixtures without hardcoded paths. See [Testing](Testing.md).

## Build output

`npm run build` (`vp pack`) compiles `src/index.ts` into `dist/` as **unbundled ESM** modules plus `.d.mts` declarations (configured under the `pack` key in [`vite.config.ts`](https://github.com/canvasflow/feed/blob/main/vite.config.ts)). Only `dist/` is published.

## Naming conventions

- **Public classes** are `RSSFeed` and `HTMLMapper` (exported symbol names — the files themselves are `rss-feed.ts` and `html-mapper.ts`).
- **Mapping internals** are grouped under `component/mapping/` with a `mapping.<concern>.ts` name.
- **Type guards** are `is<Type>Component` (e.g. `isImageComponent`), defined in `component.ts`.
- **File names** are kebab-case, enforced by `unicorn/filename-case` in `vite.config.ts`'s lint rules. See [ADR-0001](https://github.com/canvasflow/feed/blob/main/docs/adr/0001-kebab-case-naming-and-colocated-test-conventions.md).
- **Tests** are colocated as `*.test.ts` inside a sibling `__tests__/` folder next to the module they cover.
