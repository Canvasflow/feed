# @canvasflow/feed

> Canvasflow utility for processing feeds.

A TypeScript library that parses **RSS/Atom** feeds and transforms their HTML
content into structured **Canvasflow components**. It validates feeds against
Canvasflow's required-tag rules and converts each item's `content:encoded` HTML
into a typed `components` array ready to be consumed by Canvasflow.

The package is published as an **ESM** module (with TypeScript declarations) to
**GitHub Packages**.

> 📖 **Full documentation lives in the [project wiki](https://github.com/Canvasflow/feed/wiki).**
> This README is a quick introduction; the wiki covers the architecture, the
> mapping model, and the complete API.

## Features

- Parse and validate RSS/Atom feeds (`fast-xml-parser` under the hood).
- Build a strongly-typed `RSS` object from raw feed XML.
- Convert HTML into Canvasflow `Component[]` — images, galleries, video, audio,
  embeds (Twitter/X, Instagram, YouTube, TikTok, Vimeo, Dailymotion, Infogram,
  Apple Podcasts), recipes, HTML tables, columns, containers, live posts, and more.
- Configurable HTML → component mapping via `Params`/`Mapping`.
- Canvasflow `cf:` namespace extensions (`cf:hasAffiliateLinks`, `cf:isSponsored`,
  `cf:isPaid`, `cf:liveCoverageState`, `cf:thumbnail`).
- Pure and side-effect-free: malformed input is reported through `errors`/`warnings`
  rather than thrown.

## Requirements

- **Node.js** `>=20.19.2`
- Access to the `@canvasflow` scope on GitHub Packages (for installation).

## Installation

This package lives on GitHub Packages, so point the `@canvasflow` scope at the
GitHub registry. Add an `.npmrc` to your project:

```ini
@canvasflow:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Then install:

```bash
npm install @canvasflow/feed
```

## Quick start

### Parse and build a feed

```ts
import { RSSFeed } from '@canvasflow/feed';

const xml = await fetch('https://example.com/feed.xml').then((r) => r.text());

const feed = new RSSFeed(xml);

// Validate the feed — populates `errors`/`warnings` on the RSS / channel / items.
await feed.validate();

// Build a typed RSS object. Each item's `content:encoded` HTML is converted
// into a `components` array automatically.
const rss = await feed.build();

for (const item of rss.channel.items) {
  console.log(item.title, item.components);
}
```

### Convert HTML directly to components

```ts
import { HTMLMapper } from '@canvasflow/feed';

const components = HTMLMapper.toComponents(
  '<h1>Title</h1><p>Hello <a href="https://canvasflow.io">world</a></p>'
);
```

By default `<h1>` → `headline`, `<h2>` → `title`, `<p>` → `body`, and so on; a
text element's `role` attribute overrides the default (e.g. `<p role="crosshead">`).
Detection of images, embeds, tables, and containers — and how to configure it —
is documented on the [HTML Mapping](https://github.com/Canvasflow/feed/wiki/HTML-Mapping)
and [Custom Mappings](https://github.com/Canvasflow/feed/wiki/Custom-Mappings) wiki pages.

## How it works

Two cooperating pipelines drive the library:

1. **Feed pipeline** (`src/rss/`) — `RSSFeed` wraps `fast-xml-parser`, validates
   required tags, and builds the typed `RSS` object.
2. **HTML pipeline** (`src/component/`) — `HTMLMapper.toComponents()` pre-processes
   the HTML, parses it with `himalaya`, and reduces the node tree into `Component[]`
   through the detection engine in `component/mapping/`.

`build()` runs each item's `content:encoded` through the HTML pipeline, so the two
connect automatically.

```
src/
├── index.ts            # Public entry point (re-exports the API)
├── rss/                # Feed pipeline: RSSFeed, RSS/ParsedXml types, Tag allow-lists, Attributes
└── component/
    ├── Component.ts    # Component types and is* type guards
    ├── html/           # HTMLMapper — HTML → Component[] entry point
    ├── mapping/        # Detection engine + per-family converters, Zod schemas, constants, utils
    ├── node/           # himalaya AST node helpers
    └── schema/         # Zod schemas for recipe (JSON-LD) extraction
```

See [Architecture](https://github.com/Canvasflow/feed/wiki/Architecture) and
[Project Structure](https://github.com/Canvasflow/feed/wiki/Project-Structure) for
the full picture.

## Documentation

The [**project wiki**](https://github.com/Canvasflow/feed/wiki) is the source of
in-depth documentation:

| Page                                                                       | What it covers                                                              |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [Getting Started](https://github.com/Canvasflow/feed/wiki/Getting-Started) | Install, quick usage, and contributor commands.                             |
| [Architecture](https://github.com/Canvasflow/feed/wiki/Architecture)       | The two pipelines and the detection engine.                                 |
| [API Reference](https://github.com/Canvasflow/feed/wiki/API-Reference)     | `RSSFeed` / `HTMLMapper` members, helpers, and exported types.              |
| [RSS Feeds](https://github.com/Canvasflow/feed/wiki/RSS-Feeds)             | `validate()`/`build()`, supported tags, and namespaces.                     |
| [HTML Mapping](https://github.com/Canvasflow/feed/wiki/HTML-Mapping)       | The conversion pipeline and default rules.                                  |
| [Custom Mappings](https://github.com/Canvasflow/feed/wiki/Custom-Mappings) | The `Params`/`Mapping` model: filters, match modes, and component mappings. |
| [Component Types](https://github.com/Canvasflow/feed/wiki/Component-Types) | The component union, interfaces, and type guards.                           |

> The wiki is generated from the Markdown in [`docs/wiki/`](./docs/wiki) and synced
> on release.

## Development

This project uses [`vite-plus`](https://www.npmjs.com/package/vite-plus) (`vp`)
for development, building, testing, linting, and formatting.

```bash
npm install        # install dependencies
npm run build      # compile + bundle into dist/ (ESM + .d.mts)
npm test           # run the full test suite once
npm run lint       # lint the source
npm run coverage   # run tests with a coverage report (v8, threshold-gated)
```

Run a single test file with `npx vitest run src/rss/RSSFeed.test.ts`. The full
script list, test tags, and coverage thresholds are documented on the
[Testing](https://github.com/Canvasflow/feed/wiki/Testing) wiki page.

Commits follow [Conventional Commits](https://www.conventionalcommits.org/)
(enforced by commitlint; `npm run commit` opens the commitizen prompt). See the
[Contributing](https://github.com/Canvasflow/feed/wiki/Contributing) page.

## Publishing

Publishing is automated by the `🚀 Publish` GitHub Actions workflow
(`.github/workflows/publish.yml`): on a `v*` tag it runs the test suite, reports
coverage, publishes the package to GitHub Packages, and syncs the wiki. Details
are on the [Build & Publishing](https://github.com/Canvasflow/feed/wiki/Build-and-Publishing)
page.

## License

Proprietary — © Canvasflow.
