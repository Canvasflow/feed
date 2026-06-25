# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This project uses [`vite-plus`](https://www.npmjs.com/package/vite-plus) (`vp`)
for development, building, testing, linting, and formatting.

## Commands

```bash
npm run build          # vp pack → dist/ (ESM + .d.mts)
npm test               # vp test — run all tests once
npm run test:debug     # vp test, no timeout + no file parallelism (breakpoints)
npm run test:ui        # vp test watch + interactive Vitest UI
npm run lint           # vp lint on .ts files
npm run lint:fix       # vp lint --fix
npm run format         # vp fmt .
npm run coverage       # vp test --coverage (v8, threshold-gated)
```

Run a single test file:

```bash
npx vitest run src/rss/RSSFeed.test.ts
```

Run tests by tag (`vp test --tags-filter`), or via the prewired UI scripts:

```bash
vp test --tags-filter=unit
vp test --tags-filter=rss
vp test --tags-filter=html

npm run test:unit          # test:integration, test:todo, test:broken also exist
```

## Architecture

This is a TypeScript library (`@canvasflow/feed`) that processes RSS/Atom feeds and transforms HTML content into Canvasflow components. It is published to GitHub Packages as an ESM module with TypeScript declarations (`dist/index.mjs` + `dist/index.d.mts`).

### Entry point

`src/index.ts` re-exports the two public surfaces: `RSSFeed` and `HTMLMapper` (plus their associated types).

### RSSFeed (`src/rss/`)

`RSSFeed` wraps `fast-xml-parser` to parse XML. The two main methods are:

- `validate()` — checks required tags against `Tag.ts` allow-lists; populates `errors`/`warnings` arrays on the RSS, channel, and item objects.
- `build()` — constructs a typed `RSS` object. Items have their `content:encoded` HTML field automatically converted to a `components` array via `HTMLMapper.toComponents()`.

XML attributes from the parser use the `@_` prefix convention (e.g., `@_url`, `@_type`). Canvasflow-specific RSS extensions use the `cf:` namespace (`cf:hasAffiliateLinks`, `cf:isSponsored`, `cf:isPaid`, `cf:liveCoverageState`, `cf:thumbnail`). The raw parser output is kept private (`RSSFeed.data`) and typed via `src/rss/ParsedXml.ts`; consumers read the typed `rss` property.

An optional `Params` (from `mapping/Mapping.ts`) can be passed to `RSSFeed` to configure how HTML is converted. An optional `root` setter accepts a `Mapping` to scope content extraction to a sub-element before conversion.

### HTMLMapper (`src/component/html/`)

`HTMLMapper.toComponents(html, params?)` is the core HTML→component pipeline:

1. Pre-processes the HTML string (removes breaklines, sanitizes invalid hrefs, extracts `<a>` wrappers around images, splits `<p>` tags containing `<img>` elements).
2. Parses with `himalaya` into a `Node[]` AST.
3. Reduces the node tree via `reduceComponents(params)` from `mapping/Mapping.ts` into `Component[]`.

### Mapping (`src/component/mapping/`)

`Mapping.ts` contains the `reduceComponents` reducer and the recursive element-matching engine (`fromNode`). The per-family converters are split into sibling modules that `Mapping.ts` imports and re-exports (so the public API is unchanged):

- `Mapping.media.ts` — image / picture / figure / video / audio / gallery / iframe / twitter
- `Mapping.embeds.ts` — Instagram / TikTok / YouTube / Vimeo / Dailymotion / Infogram
- `Mapping.container.ts` — container / columns / live_container / link & figure containers / buttons
- `Mapping.table.ts` (`toHTMLTable`), `Mapping.custom.ts` (`toCustom`), `Mapping.text.ts` (`toText`)
- `Mapping.utils.ts` (shared helpers: `sanitizeNode`, `sanitizeContentHtml`, `matchesPattern`, `fromFigcaption`, `filterClassNameDescendants`, `processTextLinks`, `isEmpty`, filter/exclude utilities), `Mapping.constants.ts` (allow-lists), `Mapping.schema.ts` (Zod schemas)

The default HTML→Canvasflow component mapping is:

| HTML         | Component type |
| ------------ | -------------- |
| `h1`         | `headline`     |
| `h2`         | `title`        |
| `h3`         | `subtitle`     |
| `h4`         | `intro`        |
| `p`          | `body`         |
| `blockquote` | `blockquote`   |
| `footer`     | `footer`       |

Any text element's `role` attribute overrides the default mapping (e.g., `<p role="crosshead">` → `crosshead`). Styles and classes are stripped; only `href`/`target`/`rel` survive on `<a>` elements.

All `<figure>` elements are routed to `toFigureContainer` (in `Mapping.container.ts`) and produce a `FigureContainerComponent` (`component: 'container'`, `type: 'figure'`), never a bare `ImageComponent`. Caption and credit are extracted from `<figcaption>`; credit nodes are matched by the `<small>` tag, `role="credit"`, or `class="credit"`.

### Node helpers (`src/component/node/Node.ts`)

Provides the himalaya AST types (`Node`, `ElementNode`, `TextNode`, `CommentNode`, `Attribute`) and two tree-traversal reducers that share the `DescendantsReducer` type signature `(acc: Node[], node: Node) => Node[]`:

- `findDescendants(findFn)` — collects matching element nodes into a flat list. When the `findFn` is a function and returns `true`, the matched node is included but its children are not recursed.
- `removeDescendants(findFn)` — returns a **new array of nodes** where matching elements (and their subtrees) are removed. Non-matching elements are returned as new objects with their children recursively filtered; text/comment nodes pass through unchanged. **Does not mutate the originals.**

`findFn` is `string | string[] | NodeFilterFn` (`FindFn`). Both reducers are used as the callback to `Array.prototype.reduce` over a `Node[]`.

`getAttributes(attributes?)` converts an `Attribute[]` to a `Map<string, string>`. `SetUtils` provides `intersect`, `subset`, and `equal` for `Set<T>` operations.

### Component types (`src/component/Component.ts`)

Defines all `ComponentType` variants (image, gallery, video, audio, twitter, instagram, youtube, tiktok, dailymotion, vimeo, infogram, recipe, htmltable, columns, container, live_container, live_post, etc.) and their interfaces. Use the `is*` type-guard functions to narrow components.

### Test fixtures

Real RSS feeds and HTML snippets live in `src/support/feeds/` and `src/support/html/`. `setupTests.ts` exposes `process.env.SUPPORT_PATH` and `process.env.FEEDS_PATH` so tests can read fixtures without hardcoded paths.

### Test tags

Tests are tagged via `{ tags: [...] }` in vitest options. `integration` and `recipe` tags are **skipped by default** in `vite.config.ts` (they make network requests). Tag new tests appropriately: `unit` for isolated logic, `rss` for feed parsing, `html` for component conversion.

## Commit convention

Commits must follow Conventional Commits. Use `npm run commit` (commitizen) or write messages manually as `type(scope): subject`.
