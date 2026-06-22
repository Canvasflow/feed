# Getting Started

This page takes a consumer from zero to parsing a feed, and a contributor from a fresh clone to a passing test run.

← Back to [Home](Home.md)

## Requirements

- **Node.js** `>=20.19.2` (enforced via the `engines` field in [`package.json`](../../package.json)).
- **npm** (the project uses the committed `package-lock.json`).
- For installation: access to the `@canvasflow` scope on **GitHub Packages**.

> The contributor toolchain is [`vite-plus`](https://www.npmjs.com/package/vite-plus) (`vp`) — a unified runner for building, testing, linting, and formatting. `vite` and `vitest` are aliased to `@voidzero-dev/vite-plus-*` packages through the `overrides` block in `package.json`.

## Installing the package (consumers)

The package lives on GitHub Packages, so point the `@canvasflow` scope at the GitHub registry. Add an `.npmrc` to your project:

```ini
@canvasflow:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Then install:

```bash
npm install @canvasflow/feed
```

The package is **ESM-only** and ships TypeScript declarations (`dist/index.d.mts`).

## Quick usage

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

See [RSS Feeds](RSS-Feeds.md) and [HTML Mapping](HTML-Mapping.md) for the full behaviour, and [Custom Mappings](Custom-Mappings.md) to configure the HTML conversion.

## Working on the library (contributors)

```bash
git clone https://github.com/Canvasflow/feed.git
cd feed
npm install
```

> **Keep the lockfile.** Add dependencies incrementally (`npm install <pkg>`) so the lockfile is mutated rather than rebuilt from scratch.

### Everyday commands

| Command | What it does |
| --- | --- |
| `npm run build` | Compile and bundle the library into `dist/` (ESM + `.d.mts`) via `vp pack`. |
| `npm test` | Run the full test suite once (`vp test`). |
| `npm run test:debug` | Run tests with no timeout and no file parallelism (debugging). |
| `npm run test:ui` | Run tests in watch mode with the interactive Vitest UI. |
| `npm run lint` / `npm run lint:fix` | Lint (and auto-fix) the source. |
| `npm run format` | Format the whole project (`vp fmt .`). |
| `npm run coverage` | Run the suite and print a v8 coverage report. |
| `npm run commit` | Create a Conventional Commit interactively (commitizen). |
| `npm run changelog` | Refresh `CHANGELOG.md` from recent commits. |

A fuller table — including the tag-filtered test scripts — is in the [README](../../README.md#scripts) and on the [Testing](Testing.md) page.

### Run a single test file

```bash
npx vitest run src/rss/RSSFeed.test.ts
```

### The pre-merge gate

Before opening a PR, run the same checks CI runs:

```bash
npm run lint && npm run coverage
```

Commits follow [Conventional Commits](https://www.conventionalcommits.org/) and are linted by commitlint. See [Contributing](Contributing.md).

## Where to go next

- Understand the design → [Architecture](Architecture.md)
- See the public surface → [API Reference](API-Reference.md)
- Configure HTML conversion → [Custom Mappings](Custom-Mappings.md)
