# ADR-0001: Kebab-case file naming and colocated `__tests__` conventions

**Status:** Accepted
**Date:** 2026-07-23

## Context

`src/` mixed PascalCase source files (`Component.ts`, `HTMLMapper.ts`,
`RSSFeed.ts`, `Mapping.ts` and its `Mapping.*.ts` siblings, `Node.ts`,
`Schema.ts`, `RSS.ts`, `Tag.ts`, `Attributes.ts`, `ParsedXml.ts`) with
already-kebab-case files (`index.ts`, `himalaya.d.ts`) and a camelCase
outlier (`setupTests.ts`). Tests lived as flat siblings of the code they
covered (`src/rss/RSSFeed.test.ts` next to `src/rss/RSSFeed.ts`,
`src/component/html/HTMLMapper.container.test.ts` next to
`HTMLMapper.ts`), so every source directory interleaved implementation
and test files with no visual separation between them.

This wasn't breaking anything — TypeScript/Node module resolution is
case-insensitive-safe here — but it made two things harder:

- **Scanning a directory.** `ls src/component/html` mixed one
  implementation file with eight test files that all shared the same
  prefix, so finding "the actual code" required reading filenames closely.
- **Predictability.** New files had no naming rule to follow, so casing was
  whatever the last author chose.

Sister project `canvasflow-app-graphql` went through the identical exercise
(see its `docs/adr/0009-kebab-case-naming-and-test-organization-conventions.md`)
and settled on kebab-case + colocated `__tests__/` folders, enforced by
`unicorn/filename-case` in its `vite.config.ts`. This ADR adopts the same
convention here for consistency across the two codebases and documents the
project-specific collisions it produced.

## Decision

**1. Tests move into a `__tests__/` folder colocated with the module they
cover**, instead of sitting as flat siblings.
`src/rss/RSSFeed.test.ts` → `src/rss/__tests__/rss-feed.test.ts`,
`src/component/html/HTMLMapper.container.test.ts` →
`src/component/html/__tests__/html-mapper.container.test.ts`, and so on for
all 17 test files. The one snapshot fixture (`__snapshots__/*.snap`) moves
alongside its test into `__tests__/__snapshots__/`, matching Vitest's
default snapshot-directory resolution (relative to the test file, not the
package root).

**2. All `.ts` file names become kebab-case**, except `.d.ts` declaration
files and files whose name is fixed by external tooling (`package.json`,
`tsconfig.json`). `Component.ts` → `component.ts`, `HTMLMapper.ts` →
`html-mapper.ts`, `RSSFeed.ts` → `rss-feed.ts`, `Mapping.ts` and its
`Mapping.constants.ts` / `.container.ts` / `.custom.ts` / `.embeds.ts` /
`.media.ts` / `.schema.ts` / `.table.ts` / `.text.ts` / `.utils.ts` siblings
→ their lowercase equivalents, `Tag.ts` → `tag.ts`, `Attributes.ts` →
`attributes.ts`, `ParsedXml.ts` → `parsed-xml.ts`, `setupTests.ts` →
`setup-tests.ts`.

This is enforced by `unicorn/filename-case` (`kebabCase`) added to the
`lint.rules` block in `vite.config.ts` via `vite-plus/oxlint-plugin`, so
`npm run lint` fails on a new non-conforming filename instead of relying on
review to catch it.

**3. Three files are renamed to something other than the mechanical
lowercase of their old name, to avoid a directory/file basename collision**
— the same case-insensitive-filesystem hazard called out in the
`canvasflow-app-graphql` ADR:

| Old path | Mechanical kebab-case | Actual rename | Why |
| --- | --- | --- | --- |
| `src/component/node/Node.ts` | `src/component/node/node.ts` | `src/component/node/node-helpers.ts` | Directory is already named `node/`; a file also named `node.ts` inside it is a same-name collision on macOS/Windows. |
| `src/component/schema/Schema.ts` | `src/component/schema/schema.ts` | `src/component/schema/recipe-schema.ts` | Same collision against the `schema/` directory; the new name also documents what the file actually contains — Zod schemas for JSON-LD `Recipe` extraction — vs. `src/component/mapping/Mapping.schema.ts` (the RSS `Params`/`Mapping` validation schemas), which is a different file entirely. |
| `src/rss/RSS.ts` | `src/rss/rss.ts` | `src/rss/rss-types.ts` | Same collision against the `rss/` directory; `RSS.ts` held the `RSS`/`Channel`/`Item` type definitions, which `rss-types.ts` names accurately. |

Their corresponding test files (`Node.test.ts`, `Schema.test.ts`) follow the
renamed source: `node-helpers.test.ts`, `recipe-schema.test.ts`.

## Consequences

**Positive**

- ✅ Every source directory now separates implementation from tests at a
  glance: `ls src/rss` shows five source files and a `__tests__/` folder,
  not nine files with overlapping prefixes.
- ✅ File casing is now predictable and machine-enforced — `npm run lint`
  fails immediately on a new PascalCase or camelCase `.ts` file, with a
  suggested kebab-case fix.
- ✅ The full test suite (18 files / 644 tests, 6 intentionally skipped
  `integration`/`recipe`-tagged tests) passes unchanged after the move, and
  coverage thresholds (99% statements/lines, 95% branches, 99% functions)
  still hold — this was a pure file-organization change, no behavior moved.
- ✅ `npm run build` still produces the same public surface
  (`dist/index.mjs` + `dist/index.d.mts`) — only internal file paths
  changed; `src/index.ts`'s re-exports were updated to the new paths but
  the exported symbol names (`RSSFeed`, `HTMLMapper`, component types,
  etc.) are untouched.

**Negative / Trade-offs**

- ⚠️ This was a large mechanical diff — 38 files renamed via `git mv`, plus
  every relative import across `src/` updated to match — landed as a single
  commit rather than incrementally, so `git blame` on any renamed file
  shows the rename commit rather than original authorship without
  `git log --follow`.
- ⚠️ `unicorn/filename-case` only lints files oxlint processes (`.ts`/`.js`);
  it does not cover the RSS/HTML fixtures under `src/support/` — those
  were already lowercase-with-hyphens in practice and are left as-is.
- ⚠️ The three collision-driven renames (`node-helpers.ts`,
  `recipe-schema.ts`, `rss-types.ts`) are not what a purely mechanical
  lowercase transform would produce, so a future contributor renaming a
  file that would collide with its own directory needs to apply the same
  judgment call rather than a rule oxlint can check for them.
