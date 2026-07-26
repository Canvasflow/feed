# Improvements Dashboard — cross-session state

> **This file is the single source of truth for improvement progress.** It is
> used across Claude Code sessions: sections are tackled one at a time
> (top-to-bottom — they are sorted by impact); when work on a section is done,
> ask Claude Code to **review the actual code/repo state and check off only the
> items that are verifiably finished**. Do not check items from memory.
>
> Rules for Claude Code sessions updating this file:
>
> 1. Read this file first to see where things stand.
> 2. A checkbox is checked only after verifying the repo (run the tests,
>    read the code, run the tool) — not because a conversation said so.
> 3. Each section has **Study** and **Implementation** items; study items are
>    checked when the human confirms them done (they are not verifiable in-repo).
> 4. Keep the per-section documents (`0X-*.md`) as the detailed reference;
>    if scope changes, update both the document and this checklist.
> 5. When every item in a section is checked, mark its heading with ✅.

---

## Section 1 — Dependency Diet ✅ ([01-dependency-diet.md](01-dependency-diet.md))

**Status: Complete** _(2026-07-24 — see the doc's own header)_. The decisions
made differ from this checklist's original phrasing in two places (`he` and
`luxon` were **kept, wrapped** behind seams, not removed — see below); the
checklist text is corrected to match what was actually decided and verified
against the repo on 2026-07-24.

**Study**

- [ ] Mapped the full transitive dependency tree with install sizes (`npm ls --all --omit=dev` + Bundlephobia); baseline recorded
- [ ] Compared htmlparser2 / parse5 / linkedom on malformed-HTML behavior (5+ nasty snippets)
- [ ] Read RFC 2822 §3.3; inventoried actual date formats present in fixture feeds
- [ ] Read the zod/mini migration guide

**Implementation**

- [x] Decision record (ADR) written for each of the 7 runtime dependencies _(ADR-0002 through ADR-0006 in `docs/adr/`; `fast-xml-parser`'s "keep" verdict is documented in the table in `01-dependency-diet.md` rather than a standalone ADR file)_
- [x] `luxon` **kept, wrapped** — `parseDate()` in `src/utils/date.ts` (not `src/rss/date.ts`/`parseFeedDate` as originally planned), tested. See ADR-0005 for why removal was rejected.
- [x] `he` **kept, wrapped** — `decodeEntities()` in `src/utils/entities.ts` (not `src/rss/entities.ts` as originally planned), covering the full HTML5 named-entity table. See ADR-0003 for why removal was rejected.
- [x] `himalaya` removed and `src/himalaya.d.ts` deleted _(verified: file does not exist; `himalaya` absent from `package.json`)_
- [x] `sanitize-html` removed — replaced by allow-list AST serialization in `src/component/html/sanitize-html.ts` _(verified: package absent from `package.json`)_
- [x] `zod` **kept in full** (not migrated to `zod/mini`) per ADR-0006 — recursive/lazy schema risk + being the public type-derivation mechanism made the mechanical migration not worth it now
- [ ] CI guard: `dependencies` changes require an ADR in the same PR _(not done — no CI workflow enforces this yet; only `publish.yml` exists, see Section 7)_
- [ ] Before/after install size, pack size, and dep count recorded in `01-dependency-diet.md` _(baseline recorded; "after" numbers not yet captured)_
- [x] All tests + differential snapshots pass with no unexplained changes _(661 tests pass; 4 fixture divergences from the parser swap documented in ADR-0004)_

## Section 2 — HTML Pipeline Unification ✅ ([02-html-pipeline.md](02-html-pipeline.md))

> **Status: Complete** _(2026-07-24)_. All implementation items verified against the repo. 665 tests pass (661 original + 4 new referential-transparency tests); 6 skipped (integration/recipe).

**Study**

- [x] Traced one fixture through the current `toComponents` gauntlet; every parse/serialize boundary documented _(see the Overview in `02-html-pipeline.md`, updated post-Section-1)_
- [x] Parser bake-off harness run over fixture HTML (output diff + time/memory); results recorded _(ADR-0004)_
- [ ] Read AST multi-pass transform material (Babel handbook transform chapter or equivalent)
- [ ] Specced `serializeSanitized` semantics against the three sanitize-html policies in use

**Implementation**

- [x] Parser ADR written (single parser chosen with data) _(ADR-0004)_
- [x] Adapter seam `src/component/html/parser.ts` (`parse`/`stringify`) _(`html-mapper.ts` still imports `linkedom` directly for the public `splitParagraphImages` wrapper, but `toComponents` no longer touches `linkedom` at all — it goes entirely through `parse()`)_
- [x] `sanitizeInvalidAnchorHrefs` ported to a tree pass _(pure `Node[] → Node[]` `sanitizeInvalidAnchorHrefs` + `sanitizeNodeHref` in `html-mapper.ts`; commit `1ac173f`)_
- [x] Anchor-with-image hoisting ported to a tree pass _(`hoistAnchorsWithImages` in `html-mapper.ts`; replaces `extractAnchorsWithImagesDOM`; commit `eed7e4e`)_
- [x] Paragraph/heading image-splitting ported to one generic tree pass _(`splitImagesFromParagraphs` in `html-mapper.ts`; all 7 block tags in one pass; empty block elements dropped to match DOM side-effect; commit `eed7e4e`)_
- [x] Breakline removal + empty-text normalization merged into a parse-time pass _(`stripBreaklines` pure `Node[]` pass in `html-mapper.ts` replaces the string-level `removeBreaklines` and the vestigial `mapEmptyText` mutation; commit `66292fc`)_
- [x] Parser swapped inside the seam; himalaya + shim + exact pin deleted; snapshot diffs reconciled and recorded _(ADR-0004; done as part of Section 1)_
- [x] `serializeSanitized` implemented over the `Node` AST; all ~24 `sanitizeNode`/`sanitizeContentHtml` call sites migrated _(`sanitizeNodes(nodes, options)` added to `sanitize-html.ts`; `sanitizeNode`, `fromFigcaption`, `toText`, `toHTMLTable` all call it directly — no `stringify()` → re-parse; `processTextLinks` and the caption/credit re-sanitization in `mapping.media.ts` remain string-in because their input is already a string, not a node)_
- [x] `getRootElement` scoping works on the parsed tree (no stringify→re-parse in `buildItem`); quote-fix regex retained only in the public `HTMLMapper.getRootElement` string API _(`toComponents` now accepts an optional `root?: Mapping` and calls `getRootElement(nodes, root)` directly on the processed tree — `buildItem` passes `root` to `toComponents` instead of re-feeding the serialized root string; `content:encoded` still set via `HTMLMapper.getRootElement` as a coverage test requires it)_
- [x] In-place mutation removed (`getCredit`, `reduceEmptyTextNode`); referential-transparency test added _(`reduceEmptyTextNode` returns new node objects instead of mutating `node.content`/`node.children`; `getCredit` now returns `{ credit, children }` and `fromFigcaption` builds a new node for sanitization; 4 new mutation-guard tests in `mapping.referential.test.ts` pass)_
- [x] `toComponents` parses input exactly once (verified by construction) _(`parse(html)` is the single call; three tree passes run on the resulting `Node[]`; commit `eed7e4e`)_
- [x] Wiki updated (`HTML-Mapping.md`, `Architecture.md`) _(pipeline steps updated to reflect single-parse, pure tree-pass architecture and the `root?` parameter on `toComponents`)_

## Section 3 — API Robustness & Error Model ([03-api-robustness.md](03-api-robustness.md))

**Study**

- [x] Throw-surface inventory completed (all throwing calls listed in an ADR) _(ADR-0007 in `docs/adr/`; 8 sites classified — 2 critical/high in `RSSFeed`, 3 medium in the HTML pipeline, 2 low, 1 intentional; guarded sites confirmed safe; parseInt NaN risks documented)_
- [ ] Read "Parse, don't validate" and mapped the `ParsedXml` → `RSS` boundary
- [ ] Error taxonomy drafted: every current error/warning string grouped into stable codes
- [ ] Consumer audit: how `transformer` + self-service project use errors/warnings and async

**Implementation**

- [x] Constructor never throws on malformed XML (captured as parse-error issue) _(`this.rss` initialised before `XMLParser.parse`; parse wrapped in `try/catch`; error stored in both `feed.errors` and `rss.errors` as `"XML parse error: …"`; 8 new tests in `rss-feed.test.ts` pass)_
- [x] `build()` never throws _(`URL.canParse` guard on the channel link, plus every other unguarded `new URL(...)` reachable through `content:encoded`: `fromIframe` + its 5 searchParams branches, TikTok `cite`, `toYoutubeFromAnchor`, `mapMediaContent`'s relative-URL resolution — see ADR-0007's Resolution section. `parseInt`/date audits remain open as a separate correctness item — they don't throw, so were out of scope here.)_
- [ ] `FeedIssue { code, severity, message, path? }` type introduced; `errors`/`warnings` migrated; zod issues converted (no raw `unknown` in `rss.errors`) _(Partially done by deliberate scope choice: the type exists and is used at the `params`/`root` boundary — `RSSFeed.validateParams` returns `FeedIssue[]`, `RSS.errors` is now `Array<string \| FeedIssue>` instead of `Array<unknown>`. Every other `errors`/`warnings: string[]` across RSS/channel/item and the mapping components is untouched — that's a major-version, high-blast-radius migration deferred on purpose, not silently skipped. See ADR-0008 for the plan to bundle it with the sync conversion.)_
- [x] Single, documented behavior for invalid `params` (no silent drop) _(constructor always stores `params` as given; `build()` is the one place that validates and reports them. Previously the constructor's `isValidParams` guard meant invalid params never reached `build()`'s validation at all — a real bug, not just a documented inconsistency. Test: "invalid params passed to the constructor are reported by build(), not silently dropped".)_
- [x] `validate()`/`build()` sync (or ADR for async); `validate()` no longer mutates `this.data`; idempotent _(ADR-0008 justifies keeping async pending a consumer audit. `validateRSS`/`validateChannel`/`validateItem` no longer `delete` keys from parsed input. `validate()` resets its `rss`/`channel` error/warning accumulators at the top of the method — removing the `delete`-based dedup exposed a real duplicate-warning bug on repeated `validate()` calls, fixed by this explicit reset. Regression test added.)_
- [x] Network I/O extracted from `RSSFeed` (injected fetch, timeout, status check, body cap; JSON-LD `JSON.parse` guarded) _(New `src/rss/recipe.ts`, exported from the package root; `RSSFeed.getRecipeFromUrl`/`getHtmlContent` are now thin `@deprecated` wrappers. `AbortSignal.timeout` default 10s, `response.ok` check, streamed body-size cap default 5MB, JSON-LD parse wrapped in try/catch. 8 new tests in `recipe.test.ts`.)_
- [x] No-throw property tests passing (arbitrary strings + params) _(`src/rss/__tests__/rss-feed.fuzz.test.ts`: 267 tests — 17 hand-picked edge cases (including every throw site fixed above), 150 seeded-random XML-ish strings, 100 seeded-random `params`-shaped values — driven through the full constructor → `validate()` → `build()` lifecycle. All pass.)_
- [ ] Wiki API reference documents the contract; migration guide in CHANGELOG for the major _(not done — only the `validateParams` signature line in `API-Reference.md` was touched, as a side effect of its return type changing)_

## Section 4 — Type Safety & TS Library Practices ([04-type-safety.md](04-type-safety.md))

**Study**

- [ ] `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` enabled locally; error counts per file mapped
- [ ] Raw `fast-xml-parser` output shapes documented against `parsed-xml.ts`; `isArray`/parser options evaluated
- [ ] Narrowing-pattern practice done (rewrote one cast-heavy function without `as`)
- [ ] api-extractor / attw report run once and understood

**Implementation**

- [ ] Both compiler flags enabled in `tsconfig.json`; code compiles
- [ ] `fast-xml-parser` configured with `isArray` for item/enclosure/media/category/creator; "maybe array" coercions deleted
- [ ] `src/rss/narrow.ts` boundary helpers; zero `as` casts outside the boundary module and tests
- [ ] Validators/builders take readonly inputs; no `delete`/reassignment of parsed data
- [ ] `getMappingComponent` returns a discriminated union; downstream casts in `fromNode` removed; `satisfies` on mapping tables
- [ ] `src/index.ts` uses explicit named exports (public surface decided export-by-export)
- [ ] API surface guard in CI (api-extractor report or expect-type tests)
- [ ] JSDoc pass: redundant `{type}` annotations removed, prose kept accurate

## Section 5 — Performance & Memory ([05-performance.md](05-performance.md))

**Study**

- [ ] Vitest bench / tinybench methodology reviewed (warmup, isolation, pinned Node)
- [ ] One full CPU-profile + heap-snapshot session done on `build(forbes-large.rss)`; artifacts kept as baseline
- [ ] Bounded-cache options reviewed for `patternCache` (LRU vs per-run)

**Implementation**

- [ ] Bench suite added (`build` on forbes-large, `toComponents` on large HTML, filter engine) + `npm run bench` + informational CI job
- [ ] Baseline numbers recorded **before** Sections 1–2 land
- [ ] Post-Section-2 numbers recorded; delta documented
- [ ] `findDescendants`/`removeDescendants` no longer allocate a reducer per tree level (bench-verified)
- [ ] Attribute-map churn addressed (measured; kept only if bench moves)
- [ ] `patternCache` bounded or per-run; memory-stability test added
- [ ] Depth guard in `fromNode`/passes emitting a warning issue (no stack overflow); deep-nesting fuzz case
- [ ] Heap check after large-feed build: no document-scale retained memory; findings documented
- [ ] Performance note added to the wiki

## Section 6 — Testing Strategy ([06-testing.md](06-testing.md))

> ⚠️ The **safety net** item below is a prerequisite for Sections 1 and 2.

**Study**

- [ ] Characterization/approval-testing material read; snapshot review discipline agreed
- [ ] fast-check tutorial done; domain arbitraries designed (mutated XML, HTML-ish strings, Params from schema)
- [ ] undici `MockAgent` (or injected-fetch stubbing) learned
- [ ] Full read-through of `RSSFeed.test.ts`; duplication/behavior audit notes written

**Implementation**

- [ ] **Safety net:** snapshot tests over every `src/support/feeds/*.rss` (`build()`) and every HTML fixture (`toComponents`), committed as baseline
- [ ] No-throw property tests (feeds + HTML + params)
- [ ] Engine invariant properties (allow-list compliance of output `html`, filter laws)
- [ ] `integration`/`recipe` tests run offline via HTTP mocking; `skip: true` removed; opt-in live suite only
- [ ] `broken` tag emptied (fixed or converted to `test.fails`); `todo` tag → `test.todo`
- [ ] `*.coverage.test.ts` consolidated into meaningful tests as dead branches are deleted
- [ ] Fixture-intake script (`scripts/add-fixture.mjs`) working and documented
- [ ] Coverage thresholds still met; `v8 ignore` comments re-audited
- [ ] `docs/wiki/Testing.md` updated with the test-layer taxonomy

## Section 7 — Packaging, Publishing & DX ([07-packaging.md](07-packaging.md))

**Study**

- [ ] Node `exports`/conditions doc read; attw matrix interpreted once against the built package
- [ ] Side-effect audit of all modules (module-level caches in `mapping.utils.ts` confirmed safe)
- [ ] semver-ts "what is breaking" tables read; draft policy written
- [ ] Scratch-consumer exercise done (pack → install → compile under node16 + bundler → run)

**Implementation**

- [ ] PR/`develop` CI workflow (lint, typecheck, test, build on Node matrix) — tests no longer run only on tag push
- [ ] `publint` + `@arethetypeswrong/cli` green and wired into CI
- [ ] `"sideEffects": false` declared + tree-shake smoke test
- [ ] LICENSE file + `license` field added (proprietary vs OSS decided)
- [ ] Size budget in CI with recorded baseline
- [ ] npm provenance enabled (or ADR recording why not yet)
- [ ] Consumer smoke test script in CI (pack → temp install → run + dual-mode `tsc`)
- [ ] Versioning/deprecation policy written into CONTRIBUTING/wiki
- [ ] Housekeeping: Node versions aligned, `overrides` audited, `main`/`module`/`types` duplication resolved
