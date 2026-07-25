# Improvement Master Plan — `@canvasflow/feed`

> **Entry point** for the improvement effort. Each section below links to a
> dedicated document with a completion checklist, an overview, the files to
> review, study resources, a study guide, and an actionable plan.
>
> **Sections are sorted by impact** — tackle them top to bottom.
> Progress is tracked in [`DASHBOARD.md`](DASHBOARD.md) (the cross-session
> state file used by Claude Code).

## Context

`@canvasflow/feed` parses RSS/Atom feeds and converts `content:encoded` HTML
into Canvasflow components. It is consumed by `transformer` and by a
self-service customer-facing project, so the two guiding goals are:

1. **Lightweight** — the smallest possible dependency tree, without taking on
   the maintenance burden of edge cases those dependencies already solve.
2. **Stable & robust** — publisher feeds are hostile input; the library should
   never throw unexpectedly, never behave differently across environments, and
   keep a stable public API for its two consumers.

## Current state (original baseline, before Section 1)

- 7 runtime dependencies: `fast-xml-parser`, `he`, `himalaya` (pinned `1.1.1`,
  unmaintained, hand-written type shim), `linkedom`, `luxon`, `sanitize-html`,
  `zod`.
- The HTML pipeline parses/serializes the same document with **three different
  HTML parsers** (linkedom → himalaya → htmlparser2-via-sanitize-html), several
  times per item.
- Strong foundations already in place: 99/95 coverage thresholds, fuzz +
  snapshot tests, CI matrix (Node 20/22/24), conventional commits, wiki docs.

**Since this baseline, Section 1 has completed** ([01-dependency-diet.md](01-dependency-diet.md)):
`himalaya` and `sanitize-html` are removed; `linkedom` is now the single HTML
parser end-to-end via the `src/component/html/parser.ts` adapter and the
inline `src/component/html/sanitize-html.ts` serializer (ADR-0002, ADR-0004);
`he` and `luxon` are kept but wrapped behind seams (ADR-0003, ADR-0005); `zod`
is kept in full (ADR-0006). The pipeline is now **one parser, several parses**
— collapsing it to **one parse** is the remaining work, tracked in
[02-html-pipeline.md](02-html-pipeline.md).

## Sections (highest impact first)

| #   | Section                                | Why it matters                                                                                                                                                                                                                                                                                     | Document                                       |
| --- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 1   | **Dependency diet**                    | Directly serves the "lightweight + least deps" goal. Removes the unmaintained pinned `himalaya`, and evaluates dropping `he` and `luxon` outright. Every other section gets easier once the parser story is unified.                                                                               | [01-dependency-diet.md](01-dependency-diet.md) |
| 2   | **HTML pipeline unification**          | The core value of the library. Today one item's HTML is parsed and re-serialized 5+ times across 3 parsers — the biggest source of subtle bugs, perf cost, and edge-case drift. Parse once, transform a single tree, serialize once.                                                               | [02-html-pipeline.md](02-html-pipeline.md)     |
| 3   | **API robustness & error model**       | Consumers are external customers (self-service). The library must have a documented no-throw contract, a consistent error/warning model, and no hidden network I/O. Today the constructor and `build()` can throw, invalid params are silently dropped, and `fetch` lives inside the parser class. | [03-api-robustness.md](03-api-robustness.md)   |
| 4   | **Type safety & TS library practices** | Eliminates `as` casts and mutation of raw parser output, tightens `tsconfig`, and locks the public type surface so consumers never see accidental breaking changes.                                                                                                                                | [04-type-safety.md](04-type-safety.md)         |
| 5   | **Performance & memory**               | Establish benchmarks (fixtures like `forbes-large.rss` already exist), then fix the known hot spots: per-node sanitize round-trips, per-recursion closure allocation, unbounded caches.                                                                                                            | [05-performance.md](05-performance.md)         |
| 6   | **Testing strategy**                   | Protects every refactor above. Add property-based tests, make the skipped integration/recipe tests runnable offline via HTTP mocking, and add differential snapshots over all fixture feeds before touching the pipeline.                                                                          | [06-testing.md](06-testing.md)                 |
| 7   | **Packaging, publishing & DX**         | Correct ESM packaging metadata (`sideEffects`, exports hygiene), automated package linting (`publint`, `arethetypeswrong`), size budgets in CI, and npm provenance. Low effort, permanent payoff.                                                                                                  | [07-packaging.md](07-packaging.md)             |

## Recommended order of execution

1. **Section 6 first in spirit** — before refactoring, freeze current behavior
   with differential snapshots over every `src/support/feeds/*.rss` fixture
   (the plan in 06 has a "safety net" subset marked as a prerequisite).
2. Then **1 → 2** together (they are two halves of the same refactor: pick the
   single parser, then rebuild the pipeline on it).
3. Then **3 → 4** (API + types, which may include deliberate breaking changes
   released as a major version).
4. Then **5** (measure after the pipeline is unified, not before).
5. **7** can be done at any time; it is independent.

## How progress is tracked

- [`DASHBOARD.md`](DASHBOARD.md) contains one checklist per section (study +
  implementation steps). It is the **single source of truth across Claude Code
  sessions**: when a work session finishes part of a section, ask Claude Code
  to review the work and check off the finished items.
- A section is _done_ when every item in its checklist in `DASHBOARD.md` is
  checked, and the checklist at the top of its own document is satisfied.
