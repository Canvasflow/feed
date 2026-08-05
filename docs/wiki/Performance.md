# Performance

This page covers expected throughput, complexity characteristics, how to run
benchmarks, and known limits of `@canvasflow/feed`.

## Throughput reference numbers

Recorded **2026-07-27** on Apple M-series, Node 20. Run with `npm run bench`.

| Workload                                                          | hz    | mean (ms) |
| ----------------------------------------------------------------- | ----- | --------- |
| `RSSFeed` construct + `validate()` — forbes-large.rss (~1.1 MB)   | ~19.5 | ~51       |
| `RSSFeed` construct + `build()` — forbes-large.rss                | ~18.5 | ~54       |
| `RSSFeed` construct + `validate()` + `build()` — forbes-large.rss | ~3.8  | ~266      |
| `RSSFeed` construct + `build()` — forbes.rss (~5 items)           | ~33   | ~30       |
| `HTMLMapper.toComponents()` — large HTML (~2.8 MB), no params     | ~2.5  | ~404      |
| `HTMLMapper.toComponents()` — large HTML, 20 mappings + 10 excl.  | ~3.2  | ~308      |
| `HTMLMapper.toComponents()` — small HTML (~26 KB), no params      | ~175  | ~5.7      |

> Numbers vary by hardware. Pin Node version in CI for repeatable comparisons
> (`node-version: '22'` in the bench workflow). Re-run with `npm run bench:save` to
> capture a baseline before making changes; use `--compare bench-results.json`
> afterwards to diff.

Note: calling `validate()` _and_ `build()` together is slow because each
invokes `fast-xml-parser` independently. If you only need `build()`, skip
`validate()` or check `rss.errors` post-build (they are populated during
`build()` as a side-effect).

## Complexity

| Operation                               | Dominant cost                                     | Complexity                                             |
| --------------------------------------- | ------------------------------------------------- | ------------------------------------------------------ |
| `RSSFeed.build()`                       | `fast-xml-parser` XML parse                       | O(n) in document size                                  |
| `HTMLMapper.toComponents()`             | HTML parse + 3 tree passes + `fromNode` traversal | O(n · m) where n = nodes, m = mappings/excludes/unwrap |
| `filterAnyMapping` / `filterAllMapping` | linear scan over `filters[]` per node             | O(m) per node                                          |
| `findDescendants` / `removeDescendants` | full subtree traversal                            | O(n) in subtree size                                   |
| `patternCache` lookup                   | Map get/set                                       | O(1) amortized                                         |

The dominant cost in a full `build()` is the XML parse + `fast-xml-parser`'s
attribute extraction, not the component mapping. `toComponents` on large HTML
(~2.8 MB) takes ~400 ms; the per-item `content:encoded` fields in a real feed
are typically 10–100 KB, so per-item cost is much lower.

## Memory

A `build()` call on `forbes-large.rss` (~1.1 MB) retains ~2 MB per run after
explicit GC (`--expose-gc`). This is consistent with V8's natural heap growth
from JIT compilation and inline-cache warmup — not document-scale retention.
The parsed XML tree and component node arrays are collected after each call.

Key design points that keep memory bounded:

- **`nodeAttributesCache`** is a `WeakMap` keyed by `ElementNode` objects. When
  a `toComponents` run finishes, its nodes become unreachable and the WeakMap
  entries are collected automatically — no manual cleanup needed.
- **`patternCache`** is a module-level `Map` capped at 500 entries. The oldest
  entry is evicted when the limit is reached, bounding memory in long-lived
  processes that see many unique patterns across thousands of feed conversions.
- **`filterItemsCache`** is a `WeakMap` keyed by `Filter` objects from `Params`.
  Entries live as long as the `Params` object lives (typically the lifetime of
  the calling service), then are collected automatically.

## Running benchmarks

```bash
# Run all suites, print results to the terminal
npm run bench

# Save results to bench-results.json (gitignored)
npm run bench:save

# Run a single suite
npm run bench -- src/__bench__/rss-feed.bench.ts

# Compare before/after a change
npm run bench:save
# ... make your change ...
npm run bench -- --compare bench-results.json
```

The CI bench job (`.github/workflows/bench.yml`) runs on every push to
`develop`, `main`, and `feature/**` branches across a Node matrix (20, 22, 24).
It is informational only (`continue-on-error: true`) — a regression in bench
numbers never blocks a merge. Results are posted per-node as a GitHub Actions
step summary and uploaded as 90-day artifacts (`bench-results-node20`, etc.).

## Known limits

- **Depth guard**: `fromNode` (the recursive component mapper) stops recursing
  at `MAX_FROMNODE_DEPTH = 256` levels. Content nested beyond this depth is
  silently dropped rather than throwing. This protects against malicious or
  severely malformed HTML; real article content is never this deep. The parser
  itself (`parse()` from `src/component/html/parser.ts`) does not have an
  independent depth guard — extremely deep nesting (≥ ~1 000 levels) can still
  overflow the JS call stack at the parse stage.

- **`validate()` + `build()` double-parse**: both methods call
  `fast-xml-parser` independently. Avoid calling both in sequence on the same
  `RSSFeed` instance when throughput matters; prefer checking `rss.errors`
  after `build()`.

- **Large HTML items**: `toComponents` on a ~2.8 MB document takes ~400 ms.
  This is an extreme case; `content:encoded` in a typical RSS item is 10–100 KB
  and processes in well under 10 ms.
