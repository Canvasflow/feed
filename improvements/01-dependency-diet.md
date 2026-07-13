# 01 — Dependency Diet

## Completion checklist

- [ ] A written decision record exists for **each** runtime dependency: keep / replace / remove, with rationale.
- [ ] `himalaya` (pinned 1.1.1, unmaintained) is removed and `src/himalaya.d.ts` is deleted.
- [ ] The library uses **one** HTML parser end-to-end (no document is ever handled by more than one parser).
- [ ] `he` is removed (entity decoding handled by the surviving parser or a scoped utility).
- [ ] `luxon` is removed and replaced by a small internal RFC 2822 / ISO 8601 date parser with its own tests.
- [ ] `zod` usage is either migrated to `zod/mini` (or a hand-rolled validator) or a decision record justifies keeping full zod.
- [ ] Install size and bundle size are measured before/after and recorded (target: ≥50 % reduction in `node_modules` weight for consumers).
- [ ] All existing tests pass and the differential snapshots (see 06) show no unexplained output change.

## Overview

The package declares 7 runtime dependencies. For a library consumed by other
products (including a customer self-service flow), every dependency is
attack-surface, install weight, and a future upgrade obligation. The goal is
to keep only dependencies that genuinely absorb edge-case maintenance you do
not want to own (XML parsing, HTML parsing, HTML sanitization) and drop the
rest.

Current assessment:

| Dependency | Used for | Verdict to validate |
|---|---|---|
| `fast-xml-parser` | RSS XML → JS object (`RSSFeed` constructor) | **Keep.** Actively maintained, zero-dep, exactly the edge-case absorber you want. |
| `himalaya` `1.1.1` (exact pin) | HTML → JSON AST for the mapping engine | **Remove.** Last released ~2019, unmaintained, ships no types (hand-written shim in `src/himalaya.d.ts` with a warning that upgrades silently break). Highest-risk dependency in the tree. |
| `linkedom` | DOM pre-processing in `HTMLMapper`, JSON-LD scraping in `getRecipeFromUrl` | **Candidate to become the single parser** — or be replaced together with himalaya by `htmlparser2`/`parse5` (see 02 for the trade-off analysis). |
| `sanitize-html` | Stripping tags/attrs to produce component `html` fields | **Re-evaluate.** It drags in `htmlparser2`, `postcss`, `deepmerge`, `parse-srcset` — a third parser in the tree. Once the pipeline owns a single AST, "sanitizing" becomes *serializing an allow-listed subtree*, which you can do yourself in ~100 lines against your own `Node` type (see 02). |
| `he` | Entity decoding (`he.decode`) in `RSSFeed` | **Remove.** Any surviving HTML parser already decodes entities; for the few non-HTML fields (titles), a tiny decode table or the parser's `decodeEntities` option covers it. |
| `luxon` | `parseDate()` in `RSSFeed.ts` — RFC 2822 → ISO → `new Date` fallback, zone-preserving | **Remove.** This is the only usage. RFC 2822 date grammar is small and frozen; a ~60-line parser + tests removes a ~4 MB install. |
| `zod` (v4) | Validating `Params`/`Mapping` config in `Mapping.schema.ts` | **Slim down.** Validation of *customer-supplied config* is worth keeping declarative, but `zod/mini` (tree-shakable, much smaller) covers this use. |

Also in scope: add a CI guard so dependencies cannot creep back in silently.

## Files to review

- `package.json` — dependencies, overrides, exact pin on himalaya
- `src/himalaya.d.ts` — the shim and its warning comment
- `src/rss/RSSFeed.ts` — `he.decode` call sites, `parseDate()` (luxon), `sanitizeHtml` in `removeHTMLTags`, `linkedom` in `getRecipeFromUrl`
- `src/component/html/HTMLMapper.ts` — himalaya `parse`/`stringify` + linkedom side by side
- `src/component/mapping/Mapping.utils.ts` — `sanitizeNode`, `processTextLinks` (sanitize-html usage)
- `src/component/mapping/Mapping.schema.ts` — zod schema definitions
- `src/component/node/Node.ts` — the AST type the replacement parser must map onto
- `package-lock.json` — full transitive tree (run `npm ls --all`)

## Resources

**Articles / blog posts**

- "The cost of JavaScript dependencies" — Bundlephobia's methodology, <https://bundlephobia.com> (check each dep here first)
- npmgraph — visualize the transitive tree: <https://npmgraph.js.org/?q=@canvasflow/feed>
- "A little bit of plain Javascript can do a lot" (Julia Evans) — mindset piece on dependency minimalism
- htmlparser2 vs parse5 vs linkedom comparison: the `htmlparser2` README benchmark table, <https://github.com/fb55/htmlparser2>
- zod v4 / `zod/mini` announcement: <https://zod.dev/packages/mini>
- RFC 2822 §3.3 (date/time grammar): <https://datatracker.ietf.org/doc/html/rfc2822#section-3.3>
- e18e (ecosystem cleanup initiative) — patterns for replacing heavy deps: <https://e18e.dev>

**Videos**

- "Dependency hell and how to escape it" — any recent talk from ViteConf/JSNation on lean packages (search: *e18e ViteConf*)
- Anthony Fu — "Epoch of ESM" / talks on shipping lean ESM libraries

**Books**

- *Working Effectively with Legacy Code* (Feathers) — ch. on seams; you need a seam around the parser before swapping it
- *The Pragmatic Programmer* — "Orthogonality" and third-party code guidance

## Study guide

1. **Map the tree (½ day).** Run `npm ls --all --omit=dev` and record every
   transitive dependency with its install size (`du -sh node_modules/<pkg>` or
   Bundlephobia). Know exactly what consumers pay today.
2. **Learn the candidates (1 day).** Read the `htmlparser2` and `linkedom`
   READMEs and skim their source for: spec compliance (parse5 = full WHATWG,
   htmlparser2 = fast/forgiving, linkedom = DOM API on top), entity handling,
   and serialization guarantees. Understand *why* the choice matters for
   malformed publisher HTML — write 5 nasty HTML snippets and compare outputs.
3. **RFC 2822 dates (½ day).** Read §3.3 of the RFC and the WHATWG
   `Date.parse` caveats. List the date formats present in the fixture feeds
   (`grep -h pubDate src/support/feeds/*.rss | sort -u`) — that is your real
   compatibility target, not the whole RFC.
4. **zod/mini (½ day).** Read the migration guide; the functional API
   (`z.string()` → same, but methods become standalone functions) affects
   `Mapping.schema.ts` throughout.

## Actionable plan

> Prerequisite: the differential-snapshot safety net from
> [06-testing.md](06-testing.md) must exist first.

1. **Decision records.** Create `improvements/decisions/` (or `docs/adr/`) and
   write one short ADR per dependency using the table above as the starting
   hypothesis. The parser ADR is shared with section 02 — do that analysis
   there and reference it.
2. **Drop `luxon`.** Implement `src/rss/date.ts` with `parseFeedDate(str):
   { iso: string } | null` — RFC 2822 first, then ISO 8601 (both
   zone-preserving), then `new Date` as a last resort exactly like today.
   Port the behavior of `parseDate()` including invalid-date warnings. Test
   against every `pubDate`/`lastBuildDate` string found in the fixtures plus
   edge cases (2-digit years, obsolete zone names `EST`/`GMT`, missing
   seconds). TypeScript tip: return a *result object or `null`*, never an
   invalid sentinel like luxon's `isValid` — make invalid states
   unrepresentable.
3. **Drop `he`.** Replace `he.decode` call sites: for `content:encoded`, the
   HTML parser chosen in 02 decodes entities during parse; for plain-text
   fields (titles, descriptions), add a small `decodeEntities` util (numeric
   refs + the ~5 named entities that actually appear in feeds; measure with a
   grep over fixtures before deciding the table size). Watch for the current
   **double-decode** behavior in `buildItem` (`he.decode` on already-decoded
   description) — decide deliberately whether to preserve it (snapshot will
   tell you).
4. **Remove `himalaya` + unify parser** — executed via section 02's plan;
   afterwards delete `src/himalaya.d.ts` and the exact-version pin.
5. **Re-evaluate `sanitize-html`** — after 02, sanitization is an
   allow-list-filtered serialization of your own AST; implement
   `serializeSanitized(node, policy)` in the mapping layer and remove
   `sanitize-html` + `@types/sanitize-html`.
6. **Migrate zod → `zod/mini`.** Mechanical rewrite of `Mapping.schema.ts`;
   the inferred types (`z.infer`) in `Mapping.ts` are unchanged. Verify the
   published `.d.mts` still inlines/re-exports the types correctly (see 07).
7. **Guard the door.** Add a CI step that fails when `dependencies` in
   `package.json` changes without a matching ADR file in the same PR (a
   10-line script), and add a `size-limit` budget (see 07).
8. **Measure & record** before/after: `npm pack --dry-run` size, `du -sh
   node_modules` in a fresh consumer install, dependency count. Put the
   numbers at the top of this file's checklist when done.
