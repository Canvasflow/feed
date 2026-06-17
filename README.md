# @canvasflow/feed

> Canvasflow utility for processing feeds.

A TypeScript library that parses **RSS/Atom** feeds and transforms their HTML
content into structured **Canvasflow components**. It validates feeds against
Canvasflow's required-tag rules and converts `content:encoded` HTML into a typed
`components` array ready to be consumed by Canvasflow.

The package is published as an **ESM** module (with TypeScript declarations) to
**GitHub Packages**.

## Features

- Parse and validate RSS/Atom feeds (`fast-xml-parser` under the hood).
- Build a strongly-typed `RSS` object from raw feed XML.
- Convert HTML into Canvasflow `Component[]` (images, galleries, video, audio,
  embeds for Twitter/Instagram/YouTube/TikTok/Vimeo/Dailymotion, recipes, HTML
  tables, columns, containers, live posts, and more).
- Configurable HTML → component mapping via `Params`/`Mapping`.
- Canvasflow `cf:` namespace extensions (`cf:hasAffiliateLinks`, `cf:isSponsored`,
  `cf:isPaid`, `cf:liveCoverageState`, `cf:thumbnail`).

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

## Usage

### Parse and build a feed

```ts
import { RSSFeed } from '@canvasflow/feed';

const xml = await fetch('https://example.com/feed.xml').then((r) => r.text());

const feed = new RSSFeed(xml);

// Validate the feed — populates `errors`/`warnings` on the RSS/channel/items.
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

### Default HTML → component mapping

| HTML         | Component type |
| ------------ | -------------- |
| `h1`         | `headline`     |
| `h2`         | `title`        |
| `h3`         | `subtitle`     |
| `h4`         | `intro`        |
| `p`          | `body`         |
| `blockquote` | `blockquote`   |
| `footer`     | `footer`       |

Any text element's `role` attribute overrides the default mapping
(e.g. `<p role="crosshead">` → `crosshead`). Styles and classes are stripped;
only `href`/`target`/`rel` survive on `<a>` elements.

## Documentation

In-depth references for each part of the pipeline live in the [`docs/`](./docs)
directory:

| Document                       | Description                                                                                                                                       |
| :----------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------ |
| [HTML](./docs/HTML.md)         | How HTML elements are matched to Canvasflow components — text, images, galleries, video, audio, buttons, social embeds, tables, and containers.   |
| [Mappings](./docs/Mappings.md) | The `Params`/`Mapping` configuration model: filters, match modes, excludes, and every component mapping (container, columns, gallery, and so on). |
| [RSS](./docs/RSS.md)           | The supported RSS structure and namespaces (Atom, Dublin Core, Syndication, Content, Media RSS, and the Canvasflow `cf:` extensions).             |

## Scripts

This project uses [`vite-plus`](https://www.npmjs.com/package/vite-plus) (`vp`)
for development, building, testing, linting, and formatting.

| Script                     | Command                                          | Description                                                                             |
| -------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `npm run dev`              | `vp dev`                                         | Start the `vite-plus` dev mode.                                                         |
| `npm run build`            | `vp pack`                                        | Compile and bundle the library into `dist/` (ESM + `.d.mts` declarations).              |
| `npm run test`             | `vp test`                                        | Run the full test suite once.                                                           |
| `npm run test:debug`       | `vp test --test-timeout=0 --no-file-parallelism` | Run tests with no timeout and no file parallelism (useful for debugging/breakpoints).   |
| `npm run test:ui`          | `vp test watch --ui --open`                      | Run tests in watch mode and open the interactive Vitest UI in the browser.              |
| `npm run test:unit`        | `vp test --ui --tags-filter=unit`                | Run only `unit`-tagged tests in the UI.                                                 |
| `npm run test:integration` | `vp test --ui --tags-filter=integration`         | Run only `integration`-tagged tests in the UI (these make network requests).            |
| `npm run test:todo`        | `vp test --ui --tags-filter=todo`                | Run only `todo`-tagged tests in the UI (incomplete tests / features under development). |
| `npm run test:broken`      | `vp test --ui --tags-filter=broken`              | Run only `broken`-tagged tests in the UI (known-failing tests that need fixing).        |
| `npm run lint`             | `vp lint`                                        | Lint the source files.                                                                  |
| `npm run lint:fix`         | `vp lint --fix`                                  | Lint and automatically fix fixable problems.                                            |
| `npm run coverage`         | `vp test --coverage`                             | Run the test suite and print a coverage report (text/json/html via the v8 provider).    |
| `npm run coverage:ui`      | `vp test watch --coverage --ui --open`           | Run coverage in watch mode and view it in the Vitest UI.                                |
| `npm run commit`           | `cz`                                             | Create a Conventional Commit interactively via commitizen.                              |
| `npm run format`           | `vp fmt .`                                       | Format the entire project.                                                              |
| `npm run changelog`        | `node scripts/update-changelog.mjs`              | Update `CHANGELOG.md` from recent commits.                                              |

> The `VP_VERSION` environment variable in the UI/coverage scripts pins the
> `vite-plus` runtime version used for those interactive sessions.

### Running a single test file

```bash
npx vitest run src/rss/RSSFeed.test.ts
```

### Test tags

Tests are tagged via `{ tags: [...] }` in their Vitest options. The configured
tags are `unit`, `rss`, `html`, `integration`, `recipe`, `todo`, and `broken`.
The `integration` and `recipe` tags are **skipped by default** (they make
network requests).

## Project structure

```
src/
├── index.ts                 # Public entry point (re-exports RSSFeed & HTMLMapper)
├── rss/
│   ├── RSSFeed.ts           # Feed parsing, validate() and build()
│   ├── RSS.ts               # RSS/channel/item types
│   ├── Tag.ts               # Required-tag allow-lists
│   └── Attributes.ts        # Attribute helpers
├── component/
│   ├── HTMLMapper.ts        # HTML → Component[] pipeline
│   ├── Mapping.ts           # Node-tree reducer & element matching
│   ├── Component.ts         # Component types and type guards
│   ├── Node.ts              # himalaya AST node helpers
│   └── Schema.ts            # Zod schemas (recipes, etc.)
└── support/                 # Test fixtures (feeds & HTML snippets)
```

## Commit convention

Commits follow [Conventional Commits](https://www.conventionalcommits.org/). Use
`npm run commit` (commitizen) or write messages manually as
`type(scope): subject`. Messages are linted with commitlint.

## Publishing

Publishing is automated via the `🚀 Publish` GitHub Actions workflow
(`.github/workflows/publish.yml`), which runs the test suite, reports coverage
in the run summary, and publishes the package when a `v*` tag is pushed.

## License

Proprietary — © Canvasflow.
