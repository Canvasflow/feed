# 05 — Performance & Memory

## Completion checklist

- [ ] A benchmark suite exists (`vitest bench` or tinybench) covering: full `build()` on `forbes-large.rss`, `toComponents` on the largest HTML fixtures, and the filter/matching engine in isolation.
- [ ] Benchmarks run in CI (informational job, not a gate) and results are recorded for the baseline **before** the 01/02 refactors, and after.
- [ ] The parse-once pipeline (02) is measured: ≥2× throughput on `build()` for `forbes-large.rss` vs baseline (adjust target after baseline is known).
- [ ] Per-recursion closure allocation in `findDescendants`/`removeDescendants` is eliminated (reducer created once, not per tree level).
- [ ] `getAttributes` maps are not rebuilt repeatedly for the same node within one pipeline run (memoized or computed once per node).
- [ ] The unbounded module-level `patternCache` in `Mapping.utils.ts` is bounded or scoped per-conversion (long-lived process safety in `transformer`).
- [ ] Memory profile of a large-feed `build()` captured once (heap snapshot); no retained document-sized strings/trees after build resolves.
- [ ] A performance note exists in the wiki (what's O(what), expected throughput, how to run benches).

## Overview

This library runs inside `transformer` — presumably a long-lived service
processing many feeds — so both *throughput per item* and *behavior over
thousands of runs* (cache growth, allocation churn) matter.

Do this section **after** 02: the dominant cost today is the parse/serialize
gauntlet (5+ full parses per item, plus a stringify→sanitize→re-parse per
component), and optimizing around it would be wasted work. What remains
afterwards are the known micro-issues:

- `findDescendants`/`removeDescendants` call themselves via
  `node.children.reduce(findDescendants(findFn), acc)` — constructing a new
  reducer closure (and re-deriving the tag `Set`) at **every tree level**.
- `filterAnyMapping`/`filterAllMapping` call `getAttributes(node.attributes)`
  (allocating a `Map`) for every node × every mapping/exclude check;
  `fromNode` builds the same map again.
- `patternCache` (compiled regexes) and `filterItemsCache` (WeakMap — fine)
  in `Mapping.utils.ts`: the pattern cache is keyed by pattern string and
  never evicted — customer-supplied mappings in a self-service context can
  grow it without bound in a long-lived process.
- `reduceComponents` / `fromNode` recursion is fine for article-sized HTML but
  has no depth guard — deeply nested (malicious or broken) HTML can blow the
  stack; a depth limit is a robustness *and* perf topic (coordinate with 03's
  no-throw contract).

Principle: **measure first**. The existing fixtures (`forbes-large.rss`,
`toms.html`, `theenglishhome.html`) are realistic workloads; build the harness
on them before touching code.

## Files to review

- `src/component/node/Node.ts` — the recursive reducers
- `src/component/mapping/Mapping.utils.ts` — `patternCache`, `filterItemsCache`, `getAttributes` call frequency, `matchesFilter`
- `src/component/mapping/Mapping.ts` — `fromNode` recursion, `getMappingComponent` (linear scan per node — fine, but measure with many mappings)
- `src/component/html/HTMLMapper.ts` — the pre-processing passes (post-02 versions)
- `src/rss/RSSFeed.ts` — `build()` loop over items; `removeHTMLTags` (sanitize-html call per description)
- `src/support/feeds/forbes-large.rss` and the larger HTML fixtures — benchmark corpus
- `vite.config.ts` — where a `bench` config would live

## Resources

**Articles / blog posts**

- Vitest benchmark docs: <https://vitest.dev/guide/features.html#benchmarking> (tinybench under the hood)
- "Journey to performance" posts from the htmlparser2/fb55 ecosystem — how HTML parsing perf is usually measured
- Node.js docs: `--inspect` heap snapshots, `process.memoryUsage()`, and the *Diagnostics* guide: <https://nodejs.org/en/learn/diagnostics/memory>
- V8 blog — "The cost of JavaScript closures" style posts; *"Elements kinds in V8"* for array churn intuition
- "An LRU in 30 lines" — any post on bounded caches (`lru-cache` README's design notes are excellent even if you hand-roll)
- Deopt Explorer (VS Code extension) write-up by the TS team — finding megamorphic call sites

**Videos**

- "Node.js performance profiling" (Matteo Collina — various conference talks; also his *Adventures in Node.js performance* talks)
- V8 team talks on hidden classes & inline caches (e.g. *"Understanding V8's bytecode"* / Franziska Hinkelmann)

**Books**

- *Node.js Design Patterns*, 3rd ed. (Casciaro & Mammino) — streams/perf chapters, long-lived process patterns
- *Systems Performance* (Gregg) — ch. 5 methodology (USE, measure-first discipline); overkill but the methodology chapter alone is worth it

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
