# Improvements Dashboard — cross-session state

> **This file is the single source of truth for improvement progress.** It is
> used across Claude Code sessions: sections are tackled one at a time
> (top-to-bottom — they are sorted by impact); when work on a section is done,
> ask Claude Code to **review the actual code/repo state and check off only the
> items that are verifiably finished**. Do not check items from memory.
>
> Rules for Claude Code sessions updating this file:
> 1. Read this file first to see where things stand.
> 2. A checkbox is checked only after verifying the repo (run the tests,
>    read the code, run the tool) — not because a conversation said so.
> 3. Each section has **Study** and **Implementation** items; study items are
>    checked when the human confirms them done (they are not verifiable in-repo).
> 4. Keep the per-section documents (`0X-*.md`) as the detailed reference;
>    if scope changes, update both the document and this checklist.
> 5. When every item in a section is checked, mark its heading with ✅.

---

## Section 1 — Dependency Diet ([01-dependency-diet.md](01-dependency-diet.md))

**Study**
- [ ] Mapped the full transitive dependency tree with install sizes (`npm ls --all --omit=dev` + Bundlephobia); baseline recorded
- [ ] Compared htmlparser2 / parse5 / linkedom on malformed-HTML behavior (5+ nasty snippets)
- [ ] Read RFC 2822 §3.3; inventoried actual date formats present in fixture feeds
- [ ] Read the zod/mini migration guide

**Implementation**
- [ ] Decision record (ADR) written for each of the 7 runtime dependencies
- [ ] `luxon` removed — internal `parseFeedDate` in `src/rss/date.ts` with tests over fixture date formats + edge cases
- [ ] `he` removed — entity decoding via the surviving parser + small util for plain-text fields; double-decode behavior decided deliberately
- [ ] `himalaya` removed and `src/himalaya.d.ts` deleted (executed via Section 2)
- [ ] `sanitize-html` removed — replaced by allow-list AST serialization (executed via Section 2)
- [ ] `zod` migrated to `zod/mini` (or ADR justifying full zod); published `.d.mts` verified
- [ ] CI guard: `dependencies` changes require an ADR in the same PR
- [ ] Before/after install size, pack size, and dep count recorded in `01-dependency-diet.md`
- [ ] All tests + differential snapshots pass with no unexplained changes

## Section 2 — HTML Pipeline Unification ([02-html-pipeline.md](02-html-pipeline.md))

**Study**
- [ ] Traced one fixture through the current `toComponents` gauntlet; every parse/serialize boundary documented
- [ ] Parser bake-off harness run over fixture HTML (output diff + time/memory); results recorded
- [ ] Read AST multi-pass transform material (Babel handbook transform chapter or equivalent)
- [ ] Specced `serializeSanitized` semantics against the three sanitize-html policies in use

**Implementation**
- [ ] Parser ADR written (single parser chosen with data)
- [ ] Adapter seam `src/component/html/parser.ts` (`parseHtml`/`serialize`); parser imports restricted to that module (lint rule)
- [ ] `sanitizeInvalidAnchorHrefs` ported to a tree pass
- [ ] Anchor-with-image hoisting ported to a tree pass
- [ ] Paragraph/heading image-splitting ported to one generic tree pass
- [ ] Breakline removal + empty-text normalization merged into a parse-time pass
- [ ] Parser swapped inside the seam; himalaya + shim + exact pin deleted; snapshot diffs reconciled and recorded
- [ ] `serializeSanitized` implemented over the `Node` AST; all ~22 `sanitizeNode`/`sanitizeContentHtml`/`processTextLinks` call sites migrated; `sanitize-html` dropped
- [ ] `getRootElement` scoping works on the parsed tree (no stringify→re-parse in `buildItem`); quote-fix regex deleted
- [ ] In-place mutation removed (`getCredit`, `reduceEmptyTextNode`, `mapEmptyText`); referential-transparency test added
- [ ] `toComponents` parses input exactly once (verified by construction/tests)
- [ ] Wiki updated (`HTML-Mapping.md`, `Architecture.md`)

## Section 3 — API Robustness & Error Model ([03-api-robustness.md](03-api-robustness.md))

**Study**
- [ ] Throw-surface inventory completed (all throwing calls listed in an ADR)
- [ ] Read "Parse, don't validate" and mapped the `ParsedXml` → `RSS` boundary
- [ ] Error taxonomy drafted: every current error/warning string grouped into stable codes
- [ ] Consumer audit: how `transformer` + self-service project use errors/warnings and async

**Implementation**
- [ ] Constructor never throws on malformed XML (captured as parse-error issue)
- [ ] `build()` never throws (`URL.canParse` guard on channel link; date + `parseInt` audits)
- [ ] `FeedIssue { code, severity, message, path? }` type introduced; `errors`/`warnings` migrated; zod issues converted (no raw `unknown` in `rss.errors`)
- [ ] Single, documented behavior for invalid `params` (no silent drop)
- [ ] `validate()`/`build()` sync (or ADR for async); `validate()` no longer mutates `this.data`; idempotent
- [ ] Network I/O extracted from `RSSFeed` (injected fetch, timeout, status check, body cap; JSON-LD `JSON.parse` guarded)
- [ ] No-throw property tests passing (arbitrary strings + params)
- [ ] Wiki API reference documents the contract; migration guide in CHANGELOG for the major

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
