# 05 — Performance & Memory

## Completion checklist

- [x] A benchmark suite exists (`vitest bench` or tinybench) covering: full `build()` on `forbes-large.rss`, `toComponents` on the largest HTML fixtures, and the filter/matching engine in isolation. _(2026-07-27: `src/__bench__/rss-feed.bench.ts`, `html-mapper.bench.ts`, `mapping-filter.bench.ts`; run with `npm run bench`)_
- [ ] Benchmarks run in CI (informational job, not a gate) and results are recorded for the baseline **before** the 01/02 refactors, and after. _(bench suite exists; CI job still TODO; pre-01/02 window passed — post-Section-2 baseline recorded in DASHBOARD.md instead)_
- [ ] The parse-once pipeline (02) is measured: ≥2× throughput on `build()` for `forbes-large.rss` vs baseline (adjust target after baseline is known). _(baseline: 18.5 hz construct+build; 3.8 hz construct+validate+build — target TBD once CI numbers are stable)_
- [x] Per-recursion closure allocation in `findDescendants`/`removeDescendants` is eliminated (reducer created once, not per tree level). _(2026-07-27: hoisted `walk` inner function in `node-helpers.ts`; bench delta on depth-6 tree: string tag +24%, array tag +39%, removeDescendants +33%; 1004 tests pass)_
- [ ] `getAttributes` maps are not rebuilt repeatedly for the same node within one pipeline run (memoized or computed once per node).
- [ ] The unbounded module-level `patternCache` in `mapping.utils.ts` is bounded or scoped per-conversion (long-lived process safety in `transformer`).
- [ ] Memory profile of a large-feed `build()` captured once (heap snapshot); no retained document-sized strings/trees after build resolves.
- [ ] A performance note exists in the wiki (what's O(what), expected throughput, how to run benches).

## Baseline numbers

Recorded **2026-07-27** on Apple M-series, Node 20, post-Section-2 (Sections 1 and 2 already landed before the bench suite was added). Run with `npm run bench`.

| Workload                                                          | hz        | mean (ms) | notes                                         |
| ----------------------------------------------------------------- | --------- | --------- | --------------------------------------------- |
| `RSSFeed` construct + `validate()` — forbes-large.rss (~1.1 MB)   | 19.5      | 51.4      | XML parse + tag checks only                   |
| `RSSFeed` construct + `build()` — forbes-large.rss                | 18.5      | 54.2      | XML parse + full component conversion         |
| `RSSFeed` construct + `validate()` + `build()` — forbes-large.rss | 3.8       | 266       | combined; much slower due to double XML parse |
| `RSSFeed` construct + `build()` — forbes.rss (~5 items)           | 33.3      | 30.1      | small-feed reference                          |
| `HTMLMapper.toComponents()` — large HTML (~2.8 MB)                | 2.5       | 404       | no params                                     |
| `HTMLMapper.toComponents()` — large HTML, with mappings+excludes  | 3.2       | 308       |                                               |
| `HTMLMapper.toComponents()` — small HTML (~26 KB)                 | 175       | 5.7       | no params                                     |
| `findDescendants("div")` — depth-6 tree (5 461 nodes)             | 191 858   | 0.0052    | string tag match                              |
| `findDescendants(["div","span"])` — depth-6 tree                  | 52 778    | 0.019     | array tag match                               |
| `removeDescendants("span")` — depth-6 tree                        | 7 203 184 | 0.0001    | early-exit on top-level spans                 |

Update this table after each significant change; add a row noting what changed and the new numbers.

## Change log

### 2026-07-27 — `findDescendants`/`removeDescendants` closure fix (`node-helpers.ts`)

**What changed:** both functions previously called themselves recursively as the `reduce` callback — `node.children.reduce(findDescendants(findFn), acc)` — which allocated a new closure object (and, for array predicates, a new `Set`) at every level of the tree. The fix hoists the recursion into a named `walk` inner function that closes over the already-computed `findFn` and `tagSet`, so both are created exactly once per top-level call.

**Type of gain: speed (throughput), caused by reduced allocation pressure.** The bench measures wall-clock time; the mechanism is fewer heap allocations per traversal, which means less work for the GC and fewer CPU cycles spent in the allocator. Memory usage during traversal is also lower (fewer live closure and Set objects at peak), but this was not independently measured with a heap snapshot.

**Bench delta** (isolated run on depth-6 tree, 5 461 nodes, rme ≤ 1.5%):

| Workload                              | Before    | After     | Delta  |
| ------------------------------------- | --------- | --------- | ------ |
| `findDescendants("div")`              | 214 K hz  | 278 K hz  | **+30%** |
| `findDescendants(["div","span"])`     | 152 K hz  | 208 K hz  | **+38%** |
| `removeDescendants("span")`           | 5.9 M hz  | 6.7 M hz  | **+14%** |

The array case gains the most (+38%) because it eliminated the `new Set(findFn)` call at every tree level. The string case gains less (+30%) since no Set was involved — only the closure allocation itself was removed. `removeDescendants` gains +14%; the smaller delta reflects that its benchmark tree has many top-level `span` matches that short-circuit before deep recursion.

## Overview

This library runs inside `transformer` — presumably a long-lived service
processing many feeds — so both _throughput per item_ and _behavior over
thousands of runs_ (cache growth, allocation churn) matter.

Do this section **after** 02: the dominant cost today is the parse/serialize
gauntlet (5+ full parses per item, plus a stringify→sanitize→re-parse per
component), and optimizing around it would be wasted work. What remains
afterwards are the known micro-issues:

- ~~`findDescendants`/`removeDescendants` call themselves via
  `node.children.reduce(findDescendants(findFn), acc)` — constructing a new
  reducer closure (and re-deriving the tag `Set`) at **every tree level**.~~ ✅ Fixed 2026-07-27 — hoisted `walk` inner function; +30–38% throughput on tree traversal.
- `filterAnyMapping`/`filterAllMapping` call `getAttributes(node.attributes)`
  (allocating a `Map`) for every node × every mapping/exclude check;
  `fromNode` builds the same map again.
- `patternCache` (compiled regexes) and `filterItemsCache` (WeakMap — fine)
  in `mapping.utils.ts`: the pattern cache is keyed by pattern string and
  never evicted — customer-supplied mappings in a self-service context can
  grow it without bound in a long-lived process.
- `reduceComponents` / `fromNode` recursion is fine for article-sized HTML but
  has no depth guard — deeply nested (malicious or broken) HTML can blow the
  stack; a depth limit is a robustness _and_ perf topic (coordinate with 03's
  no-throw contract).

Principle: **measure first**. The existing fixtures (`forbes-large.rss`,
`toms.html`, `theenglishhome.html`) are realistic workloads; build the harness
on them before touching code.

## Running benchmarks

```bash
npm run bench                              # run all suites, print to terminal
npm run bench:save                         # same + write bench-results.json (gitignored)
npm run bench -- src/__bench__/rss-feed.bench.ts   # single suite
npm run bench:save && <make changes> && npm run bench -- --compare bench-results.json
```

The `--compare` workflow is the fastest way to measure a fix: save before, change code, compare after. Discard the JSON once the delta is noted in this doc.

## Files to review

- `src/__bench__/` — the benchmark suite (added 2026-07-27)
- `src/component/node/node-helpers.ts` — the recursive reducers
- `src/component/mapping/mapping.utils.ts` — `patternCache`, `filterItemsCache`, `getAttributes` call frequency, `matchesFilter`
- `src/component/mapping/mapping.ts` — `fromNode` recursion, `getMappingComponent` (linear scan per node — fine, but measure with many mappings)
- `src/component/html/html-mapper.ts` — the pre-processing passes (post-02 versions)
- `src/rss/rss-feed.ts` — `build()` loop over items; `removeHTMLTags` (calls the internal `sanitizeHTML` in `src/component/html/sanitize-html.ts` per description — the npm `sanitize-html` package itself was removed in Section 1)
- `src/support/feeds/forbes-large.rss` and the larger HTML fixtures — benchmark corpus
- `vite.config.ts` — where bench-specific config would live if needed

## Resources

**Articles / blog posts**

- Vitest benchmark docs: <https://vitest.dev/guide/features.html#benchmarking> (tinybench under the hood)
- "Journey to performance" posts from the htmlparser2/fb55 ecosystem — how HTML parsing perf is usually measured
- Node.js docs: `--inspect` heap snapshots, `process.memoryUsage()`, and the _Diagnostics_ guide: <https://nodejs.org/en/learn/diagnostics/memory>
- V8 blog — "The cost of JavaScript closures" style posts; _"Elements kinds in V8"_ for array churn intuition
- "An LRU in 30 lines" — any post on bounded caches (`lru-cache` README's design notes are excellent even if you hand-roll)
- Deopt Explorer (VS Code extension) write-up by the TS team — finding megamorphic call sites

**Videos**

- "Node.js performance profiling" (Matteo Collina — various conference talks; also his _Adventures in Node.js performance_ talks)
- V8 team talks on hidden classes & inline caches (e.g. _"Understanding V8's bytecode"_ / Franziska Hinkelmann)

**Books**

- _Node.js Design Patterns_, 3rd ed. (Casciaro & Mammino) — streams/perf chapters, long-lived process patterns
- _Systems Performance_ (Gregg) — ch. 5 methodology (USE, measure-first discipline); overkill but the methodology chapter alone is worth it

## Study guide

1. **Benchmarking hygiene (½ day).** Read the Vitest bench docs + tinybench
   README; understand warmup, iterations, and why you pin Node version and
   isolate CPU when comparing numbers.
2. **Profiling (1 day).** Practice once end-to-end: run `build()` on
   `forbes-large.rss` under `node --cpu-prof` / `0x` or Chrome DevTools,
   read the flamegraph, identify the top-3 self-time frames. Do the same with
   a heap snapshot. Keep the artifacts as the baseline record.
3. **Allocation patterns (½ day).** Read about closure allocation and
   megamorphism enough to recognize the `findDescendants` pattern; the fix
   (hoist the recursive walker into a named inner function closing over one
   `findFn`) needs no V8 wizardry, just awareness.
4. **Cache policy (½ day).** Skim `lru-cache` design notes; decide bounded-LRU
   vs per-call cache for `patternCache` given the self-service threat model.

## Actionable plan

1. **Baseline first** (before 01/02 land): add `*.bench.ts` files —
   `RSSFeed.build(forbes-large)`, `HTMLMapper.toComponents(largest html)`,
   `filterAllMapping` with a 50-mapping params object over a real tree. Add an
   npm script (`npm run bench`) and an informational CI job. Record numbers in
   this file.
2. **Re-measure after 02** and record the delta (this is the headline number
   for the whole effort).
3. **Fix the reducers.** Rewrite `findDescendants`/`removeDescendants` so the
   public API still returns a `DescendantsReducer`, but recursion happens in
   an inner function that reuses the same closure and precomputed `Set`.
   Verify with the bench, not by eyeballing.
4. **Attribute map churn.** Compute `getAttributes` once per node per
   `fromNode` invocation and thread it into `excludeNode`/filter helpers
   (signature change is internal); or cache with a `WeakMap<ElementNode,
Map>` scoped to a single `toComponents` run. Measure before choosing —
   only keep it if the bench moves.
5. **Bound `patternCache`** (e.g. 500-entry LRU or a per-`toComponents`
   cache); add a test that hammers it with unique patterns and asserts stable
   memory.
6. **Depth guard.** Add a max-depth (e.g. 256) to `fromNode` and the tree
   passes; on breach, emit a warning issue (03's model) instead of throwing.
   Add a fuzz case with 10k-deep nesting.
7. **Heap check.** After a `build()` of the large feed, take a heap snapshot
   and confirm no document-scale retained strings (watch the caches and any
   module-level state). Document findings.
8. **Write the wiki note** (how to run benches, current numbers, known
   limits).
