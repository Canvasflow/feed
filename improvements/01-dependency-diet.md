# 01 — Dependency Diet

## Completion checklist

- [x] A written decision record exists for **each** runtime dependency: keep / replace / remove, with rationale. _(ADR-0002 covers himalaya + sanitize-html; remaining deps assessed in the table below)_
- [x] `himalaya` (pinned 1.1.1, unmaintained) is removed and `src/himalaya.d.ts` is deleted. _(replaced by `src/component/html/parser.ts`, a linkedom-backed adapter — see ADR-0002)_
- [x] The library uses **one** HTML parser end-to-end (no document is ever handled by more than one parser). _(`linkedom` is now the single parser for pre-processing, root scoping, and the mapping pass)_
- [x] `he` is wrapped behind `decodeEntities()` in `src/rss/entities.ts` with its own test suite. See [ADR-0003](https://github.com/canvasflow/feed/blob/main/docs/adr/0003-keep-he-wrapped-behind-decodeEntities.md).
- [x] `luxon` is wrapped behind `parseDate()` in `src/rss/date.ts` with its own test suite. See [ADR-0005](https://github.com/canvasflow/feed/blob/main/docs/adr/0005-keep-luxon-wrapped-behind-parseDate.md).
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

| Dependency                     | Used for                                                                               | Verdict to validate                                                                                                                                                                                                                                                                              |
| ------------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `fast-xml-parser`              | RSS XML → JS object (`RSSFeed` constructor)                                            | **Keep.** Actively maintained, zero-dep, exactly the edge-case absorber you want.                                                                                                                                                                                                                |
| ~~`himalaya` `1.1.1` (exact pin)~~ | ~~HTML → JSON AST for the mapping engine~~ | **Removed ✅.** Replaced by `src/component/html/parser.ts` — a `linkedom`-backed adapter that emits the same `Node[]` AST shape. `src/himalaya.d.ts` deleted. See ADR-0002. |
| `linkedom`                     | DOM pre-processing in `HTMLMapper`, JSON-LD scraping in `getRecipeFromUrl`             | **Single parser ✅.** Now covers the full pipeline (pre-processing, root scoping, and the mapping pass via `parser.ts`). No dual-parser path remains.                                                                                                                                             |
| ~~`sanitize-html`~~            | ~~Stripping tags/attrs to produce component `html` fields~~                            | **Removed ✅.** Replaced by `src/component/html/sanitize-html.ts` — an inline allow-list sanitizer over the `Node[]` AST. Removed `postcss`, `deepmerge`, `parse-srcset`, `launder`, and `dayjs` as transitive deps. See ADR-0002.                                                              |
| `he`                           | Entity decoding (`he.decode`) in `RSSFeed`                                             | **Keep, wrapped ✅.** At 132 KB it is the smallest dep in the tree and covers the full HTML5 named-character-reference table. Call sites now go through `decodeEntities()` in `src/rss/entities.ts` — a single seam for future removal if needed.                                               |
| `luxon`                        | `parseDate()` in `rss-feed.ts` — RFC 2822 → ISO → `new Date` fallback, zone-preserving | **Keep, wrapped ✅.** Abstracted behind `parseDate()` in `src/rss/date.ts`. See ADR-0005.                                                                                                                                                                                                       |
| `zod` (v4)                     | Validating `Params`/`Mapping` config in `mapping.schema.ts`                            | **Slim down.** Validation of _customer-supplied config_ is worth keeping declarative, but `zod/mini` (tree-shakable, much smaller) covers this use.                                                                                                                                              |

Also in scope: add a CI guard so dependencies cannot creep back in silently.

### Verified against the repo (2026-07-23)

Re-checked the table above against the actual code and live npm registry data
(not from memory — see the CLAUDE.md rule on verifying before recommending).
Two corrections and one new finding:

- **`zod` is more deeply embedded than "config validation."** It is also the
  type-derivation mechanism for the _entire public component type system_ —
  every `ComponentType` interface in `component.ts` (`ImageComponent`,
  `GalleryComponent`, `ContainerComponent`, …) is `z.infer<typeof
XSchema>`, and every one of those `*Schema` objects is re-exported through
  `src/index.ts` (`export * from './component/component'`). **Full removal
  is off the table** — it would delete public exports consumers may call
  `.safeParse()` on directly, which is a breaking API change, not an
  internal refactor. The `zod/mini` migration is still viable _if_ the
  rewritten schemas remain real `ZodType` instances with the same
  `.safeParse()`/`.parse()` surface (zod v4's functional API — `z.optional(z.string())`
  instead of `z.string().optional()` — preserves this), so it stays the
  right target. One caveat: `zod/mini` is a subpath of the same `zod`
  package, so it does **not** shrink `npm install` weight for this repo —
  it only helps _consumers who bundle_ (tree-shaking drops the unused
  method-chaining API). Since `transformer` presumably bundles this
  library, that's still a real win, just not an install-size one.
- **`sanitize-html` transitively pulls in a second date library.** Its
  `launder` dependency depends on `dayjs` (≈1.9 MB unpacked) — a date
  library nobody in this codebase asked for, sitting right next to the
  `luxon` (≈4.6 MB) we're trying to remove. This wasn't called out in the
  original table and is an extra argument for dropping `sanitize-html` once
  the single-AST serializer lands (see 02): it removes `sanitize-html`
  itself (~70 KB) _and_ `postcss` (~336 KB) _and_ `deepmerge`/`parse-srcset`/`launder`/`dayjs`
  (~2 MB combined) — none of which are otherwise in the tree.
- **`himalaya` usage is wider than one file.** It's imported directly in
  `mapping.custom.ts`, `mapping.table.ts`, `mapping.text.ts`, and
  `mapping.utils.ts` in addition to `html-mapper.ts` — the AST-node shape
  it produces leaks past the parsing boundary into the mapping layer. The
  Section 2 adapter seam (`src/component/html/parser.ts`) needs to cover
  all five call sites, not just the parse entry point.

Measured baseline (`npm ls --all --omit=dev`, `du -sh`, current lockfile):

| Metric                                                              | Value                                                                                                                                                                              |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node_modules` weight of the 7 runtime deps + their transitive tree | ≈ 22 MB                                                                                                                                                                            |
| Single largest packages                                             | `zod` 6.3 MB, `luxon` 4.5 MB, `linkedom` 2.5 MB, `dayjs` 1.9 MB (transitive via `sanitize-html`)                                                                                   |
| `himalaya` last real release                                        | `1.1.1`, published 2019 (npm's `time.modified` shows a 2025-04-04 registry metadata touch, not a code release — confirmed via `npm view himalaya versions`, unchanged since 1.1.1) |
| `npm pack` size today                                               | 37.9 kB tarball / 205.9 kB unpacked (this is `dist/` only — the dependency weight shown above is what a _consumer's_ `npm install` pays, not what ships in the package itself)     |

Revised priority order by (size saved × risk × independence from Section 2):

1. **`luxon` → hand-rolled parser.** Highest confidence, fully independent
   of the parser-unification work, ~4.6 MB removed for a well-scoped,
   easily-tested function.
2. **`zod` → `zod/mini`.** Independent of Section 2, meaningful bundle win
   for `transformer`, mechanical rewrite — but budget real time for it: the
   schemas use `z.lazy` for recursive component types, and zod/mini's
   handling of recursive/lazy schemas needs to be verified against the
   current zod version in this repo (`4.4.3`) before committing to the
   migration, not assumed from the announcement post.
3. **`himalaya` + `linkedom` + `sanitize-html` → single parser.** Highest
   total payoff (~5–6 MB removed, plus removing the only unmaintained/untyped
   dependency in the tree) but it's one project, not three independent
   swaps — see 02-html-pipeline.md. Do this as a unit.
4. **`he` → re-evaluate, don't just delete.** At 132 KB unpacked it's
   already the smallest dependency in the tree, so the size win is
   negligible. It exists because it correctly decodes the _entire_ HTML5
   named-character-reference table (2000+ entities), and feed titles come
   from arbitrary publishers — a hand-rolled "~5 common entities" table (as
   originally proposed above) would silently mis-render any publisher using
   an entity outside that set. Recommend keeping `he` unless/until the
   Section 2 parser replaces its call sites naturally (a full HTML parser
   already decodes entities during parsing, making a _separate_ decode step
   redundant for HTML fields — but the plain-text fields, like titles, still
   need something that decodes entities, and `he` is the cheapest correct
   tool for that already in the tree).

None of this should start before the Section 6 safety net exists. There is
a partial safety net today — `src/rss/__tests__/rss-feed.snapshot.test.ts`
snapshots `build()` over all 30 `src/support/feeds/*.rss` fixtures, which
exercises the HTML pipeline transitively via `content:encoded` — but per
the Section 6 spec that's not sufficient on its own: there's no direct
`toComponents()` snapshot over the two fixtures in `src/support/html/`, so
a parser swap could change HTML-only edge cases the RSS fixtures don't
happen to exercise. Add that before touching `himalaya`/`linkedom`.

## Files to review

- `package.json` — dependencies, overrides, exact pin on himalaya
- `src/himalaya.d.ts` — the shim and its warning comment
- `src/rss/rss-feed.ts` — `he.decode` call sites, `parseDate()` (luxon), `sanitizeHtml` in `removeHTMLTags`, `linkedom` in `getRecipeFromUrl`
- `src/component/html/html-mapper.ts` — himalaya `parse`/`stringify` + linkedom side by side
- `src/component/mapping/mapping.utils.ts` — `sanitizeNode`, `processTextLinks` (sanitize-html usage)
- `src/component/mapping/mapping.schema.ts` — zod schema definitions
- `src/component/node/node-helpers.ts` — the AST type the replacement parser must map onto
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

- "Dependency hell and how to escape it" — any recent talk from ViteConf/JSNation on lean packages (search: _e18e ViteConf_)
- Anthony Fu — "Epoch of ESM" / talks on shipping lean ESM libraries

**Books**

- _Working Effectively with Legacy Code_ (Feathers) — ch. on seams; you need a seam around the parser before swapping it
- _The Pragmatic Programmer_ — "Orthogonality" and third-party code guidance

## Study guide

1. **Map the tree (½ day).** Run `npm ls --all --omit=dev` and record every
   transitive dependency with its install size (`du -sh node_modules/<pkg>` or
   Bundlephobia). Know exactly what consumers pay today.
2. **Learn the candidates (1 day).** Read the `htmlparser2` and `linkedom`
   READMEs and skim their source for: spec compliance (parse5 = full WHATWG,
   htmlparser2 = fast/forgiving, linkedom = DOM API on top), entity handling,
   and serialization guarantees. Understand _why_ the choice matters for
   malformed publisher HTML — write 5 nasty HTML snippets and compare outputs.
3. **RFC 2822 dates (½ day).** Read §3.3 of the RFC and the WHATWG
   `Date.parse` caveats. List the date formats present in the fixture feeds
   (`grep -h pubDate src/support/feeds/*.rss | sort -u`) — that is your real
   compatibility target, not the whole RFC.
4. **zod/mini (½ day).** Read the migration guide; the functional API
   (`z.string()` → same, but methods become standalone functions) affects
   `mapping.schema.ts` throughout.

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
   seconds). TypeScript tip: return a _result object or `null`_, never an
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
4. ~~**Remove `himalaya` + unify parser**~~ **Done ✅** — `parser.ts` wraps
   `linkedom`; `himalaya.d.ts` deleted; exact-version pin gone. See ADR-0002.
5. ~~**Re-evaluate `sanitize-html`**~~ **Done ✅** — `src/component/html/sanitize-html.ts`
   is an inline allow-list sanitizer over the `Node[]` AST. `sanitize-html`
   and `@types/sanitize-html` removed from `package.json`. See ADR-0002.
6. **Migrate zod → `zod/mini`.** Mechanical rewrite of `mapping.schema.ts`;
   the inferred types (`z.infer`) in `mapping.ts` are unchanged. Verify the
   published `.d.mts` still inlines/re-exports the types correctly (see 07).
7. **Guard the door.** Add a CI step that fails when `dependencies` in
   `package.json` changes without a matching ADR file in the same PR (a
   10-line script), and add a `size-limit` budget (see 07).
8. **Measure & record** before/after: `npm pack --dry-run` size, `du -sh
node_modules` in a fresh consumer install, dependency count. Put the
   numbers at the top of this file's checklist when done.
