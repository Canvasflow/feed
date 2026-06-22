# @canvasflow/feed Wiki

> **@canvasflow/feed** is a TypeScript library that parses **RSS/Atom** feeds and transforms their HTML content into structured **Canvasflow components**.

It validates feeds against Canvasflow's required-tag rules, builds a strongly-typed `RSS` object from raw feed XML, and converts each item's `content:encoded` HTML into a typed `Component[]` ready to be consumed by Canvasflow. The package is published as an **ESM** module (with TypeScript declarations) to **GitHub Packages**.

This wiki is the onboarding entry point. If you are new, read the pages top-to-bottom; if you are looking for one thing, jump straight to it.

---

## 🚀 New here? Start with these

1. **[Getting Started](Getting-Started.md)** — install from GitHub Packages, the requirements, and the day-to-day commands.
2. **[Architecture](Architecture.md)** — the two pipelines (feed parsing and HTML → components) and how they connect.
3. **[Project Structure](Project-Structure.md)** — what lives where in `src/`.
4. **[API Reference](API-Reference.md)** — the public surface: `RSSFeed`, `HTMLMapper`, and the exported helpers and types.

## 📚 Reference

| Page                                  | What it covers                                                                                  |
| ------------------------------------- | ----------------------------------------------------------------------------------------------- |
| [API Reference](API-Reference.md)     | The public exports: `RSSFeed` / `HTMLMapper` methods, helper functions, and the exported types. |
| [RSS Feeds](RSS-Feeds.md)             | `RSSFeed.validate()` / `build()`, plus the supported RSS structure and namespaces.              |
| [HTML Mapping](HTML-Mapping.md)       | The `HTMLMapper.toComponents()` pipeline and the default HTML → component table.                |
| [Custom Mappings](Custom-Mappings.md) | The `Params`/`Mapping` model: filters, match modes, excludes, and component mappings.           |
| [Component Types](Component-Types.md) | The `ComponentType`/`TextType` unions, component interfaces, and the `is*` type guards.         |

## 🛠 Operations

| Page                                          | What it covers                                                    |
| --------------------------------------------- | ----------------------------------------------------------------- |
| [Testing](Testing.md)                         | Vitest via Vite+, test tags, and the coverage thresholds.         |
| [Build & Publishing](Build-and-Publishing.md) | The `vp pack` build, the Publish workflow, and the wiki sync job. |
| [Contributing](Contributing.md)               | Coding conventions, the commit format, and the pre-merge gate.    |
| [Glossary](Glossary.md)                       | Domain and project terms in one place.                            |

---

## At a glance

| Concern           | Tool               | Version     |
| ----------------- | ------------------ | ----------- |
| Language          | TypeScript         | ~6.0        |
| Runtime (min)     | Node.js            | `>=20.19.2` |
| Build / tasks     | Vite+ (`vp`)       | 0.1.x       |
| Test runner       | Vitest (via Vite+) | 4.x         |
| XML parsing       | fast-xml-parser    | 5.x         |
| HTML AST          | himalaya           | 1.x         |
| HTML sanitizing   | sanitize-html      | 2.x         |
| Schema validation | zod                | 4.x         |

```bash
npm install @canvasflow/feed   # from GitHub Packages — see Getting Started
```

```ts
import { RSSFeed, HTMLMapper } from '@canvasflow/feed';

const feed = new RSSFeed(xml);
await feed.validate();
const rss = await feed.build(); // items carry a typed `components` array

const components = HTMLMapper.toComponents('<h1>Title</h1><p>Body</p>');
```

> **Source of truth:** this wiki describes behaviour as implemented in `src/`. When code and wiki disagree, the code wins — please update the wiki in the same PR.
