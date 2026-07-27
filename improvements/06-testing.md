# 06 — Testing Strategy

> **Status: In progress** _(2026-07-27)_. 2 of 7 items done. The safety net's RSS half
> and the no-throw fuzz tests landed as byproducts of earlier sections. HTML fixture
> snapshots, engine invariant properties, integration mocking, coverage consolidation,
> and the fixture intake script are still open.

## Completion checklist

- [ ] **Safety net (prerequisite for 01/02):** differential snapshot tests cover `build()` output for **every** feed in `src/support/feeds/` and `toComponents` for every HTML fixture. _(Partial — 2026-07-27: `rss-feed.snapshot.test.ts` now iterates all `*.rss` files dynamically and snapshots each via `validate()` + `build()` (413 K-line `.snap` file committed). Still missing: a parallel snapshot test for every `*.html` in `src/support/feeds/` and `src/support/html/` through `toComponents`.)_
- [ ] Property-based tests exist for: the no-throw contract, HTML round-trip invariants, and filter-matching laws (`match: 'all'` ⊆ `match: 'any'`). _(Partial — 2026-07-27: No-throw contract is covered without fast-check: `rss-feed.fuzz.test.ts` (17 edge cases + 150 random XML strings + 100 random params, seeded PRNG) and `html-mapper.fuzz.test.ts` (42 edge cases + 200 random strings) both verify the no-throw contract for feeds, HTML, and params. HTML round-trip invariants and filter-law properties are not written yet.)_
- [ ] The `integration` and `recipe` tagged tests run **offline** in CI via HTTP mocking (undici `MockAgent` or msw) — the `skip: true` flags are removed (a small live-network suite may remain opt-in). _(Not done — `skip: true` is still set for both tags in `vite.config.ts` lines 31 and 52. The Section 3 network I/O refactor (injected fetch in `src/rss/recipe.ts`) makes stubbing straightforward: pass a mock `fetch` directly without a global dispatcher.)_
- [x] Tests tagged `broken` are either fixed or converted to `.fails`/tracked issues — the tag is empty; `todo`-tagged tests converted to `test.todo`. _(2026-07-27: No tests in the codebase are tagged `broken` or `todo`. Both tags are defined in `vite.config.ts` but unused. The `describe.skip('The English Home')` block at `rss-feed.test.ts:1506` is a plain skip unrelated to these tags — it can be converted or removed separately.)_
- [ ] Coverage thresholds are maintained (95/95/95/95 as of 2026-07-25 — lowered from 99/95/99/99, see `vite.config.ts`) after all refactors, and `/* v8 ignore */` comments are re-audited. _(Thresholds are set correctly in `vite.config.ts`. 38 `/* v8 ignore */` comments remain in `src/`; re-audit not done — several may guard branches deleted by the Section 4 type-safety work.)_
- [ ] A fixture-intake script exists: given a feed URL or file, it adds a sanitized fixture + generated snapshot in one command. _(`scripts/add-fixture.mjs` does not exist.)_
- [ ] Testing conventions (tags, fixtures, snapshots, property tests) are documented in `docs/wiki/Testing.md`. _(Partial — 2026-07-27: `docs/wiki/Testing.md` exists and documents tags, running tests, coverage thresholds, and the CI gate. The planned test-layer taxonomy (unit / property / snapshot / integration-mocked / live) and conventions for fixture curation and snapshot review discipline are not yet written.)_

## Overview

> **Current state (2026-07-27):** 1 004+ tests pass (6 skipped — `integration`/`recipe`);
> coverage gated at 95/95/95/95. The suite has grown substantially through Sections 1–5:
> fuzz tests (`rss-feed.fuzz.test.ts`, `html-mapper.fuzz.test.ts`), referential-transparency
> tests, depth-guard and pattern-cache tests, API surface type tests, and the full-corpus
> RSS snapshot test have all been added. The snapshot test now iterates every `*.rss`
> dynamically instead of a hardcoded handful.

The suite is strong, but two structural gaps remain:

1. **Complete the safety net.** The HTML fixture corpus (`*.html` in `src/support/feeds/`
   and `src/support/html/`) has no snapshot coverage through `toComponents`. Any tree-pass
   change in Section 2's pipeline can silently alter HTML-to-component output without a
   failing test.
2. **Raise the ceiling.** The fuzz tests verify the no-throw contract but use a seeded PRNG
   rather than fast-check (no shrinking). Engine invariant properties (allow-list compliance,
   filter laws) are not written. The `integration`/`recipe` tests remain permanently skipped
   because network I/O was still inside `RSSFeed` when this section was written; Section 03's
   injected-fetch refactor makes stubbing them straightforward now.

## Files to review

- `src/rss/__tests__/rss-feed.snapshot.test.ts` + `__snapshots__/` — RSS snapshot pattern; extend with a parallel HTML fixture snapshot test
- `src/component/html/__tests__/html-mapper.fuzz.test.ts` — no-throw fuzz (seeded PRNG, 42 edge cases + 200 random); upgrade to fast-check for shrinkable properties
- `src/rss/__tests__/rss-feed.fuzz.test.ts` — no-throw fuzz for full RSS lifecycle (17 edge cases + 150 random XML + 100 random params); upgrade to fast-check
- `vite.config.ts` — tags (`integration`, `recipe` still `skip: true`; `todo`, `broken` defined but unused), coverage thresholds, `setup-tests.ts` env paths
- `src/setup-tests.ts` — `SUPPORT_PATH`/`FEEDS_PATH` convention
- `src/rss/__tests__/rss-feed.coverage.test.ts`, `src/component/html/__tests__/html-mapper.coverage.test.ts`, `src/component/mapping/__tests__/mapping.coverage.test.ts` — coverage-only tests; audit against Section 4 branch deletions and consolidate
- `src/rss/__tests__/rss-feed.test.ts` (~2 200 lines) — structure/duplication review; `describe.skip('The English Home')` at line 1506 to resolve
- `src/support/feeds/` (23 `*.rss` + 3 `*.html` fixtures), `src/support/html/` (2 `*.html` fixtures) — full corpus
- **New since this section was written:** `src/__tests__/api-surface.test.ts`, `src/rss/__tests__/recipe.test.ts`, `src/rss/__tests__/narrow.test.ts`, `src/rss/__tests__/build-item.test.ts`, `src/component/mapping/__tests__/mapping.referential.test.ts`, `src/component/mapping/__tests__/depth-guard.test.ts`, `src/component/mapping/__tests__/pattern-cache.test.ts`

## Resources

**Articles / blog posts**

- "Characterization tests" (Michael Feathers' term — search _Working Effectively with Legacy Code characterization test_); also Approval Tests intro by Llewellyn Falco: <https://approvaltests.com>
- fast-check docs, esp. _Arbitraries_ and the "detect bugs, then shrink" workflow: <https://fast-check.dev>
- "Property-based testing for JavaScript developers" (fast-check's own tutorial series)
- undici `MockAgent` docs: <https://undici.nodejs.org/#/docs/api/MockAgent> (Node's native-fetch mocking — no extra dep if you use undici's, which ships in Node)
- msw docs (<https://mswjs.io>) — alternative if you want request-handler ergonomics
- Vitest snapshot docs (file snapshots, `toMatchFileSnapshot`): <https://vitest.dev/guide/snapshot>
- "Coverage is not a goal" (Martin Fowler on test coverage) — context for keeping 99 % honest rather than gamed

**Videos**

- John Hughes — _"Testing the Hard Stuff and Staying Sane"_ (the QuickCheck talk; the single best property-testing intro)
- "Property-based testing in JavaScript with fast-check" (various conference recordings)

**Books**

- _Working Effectively with Legacy Code_ (Feathers) — characterization testing
- _Property-Based Testing with PropEr, Erlang, and Elixir_ (Hebert) — language-agnostic PBT strategy chapters are excellent

## Study guide

1. **Characterization testing (½ day).** Read the Feathers/Approval Tests
   material; understand snapshot review discipline (a snapshot diff is a
   question, not a failure) and how to keep snapshots reviewable (stable
   ordering, formatted JSON).
2. **fast-check (1 day).** Do the official tutorial; then design arbitraries
   for _this_ domain: mutated-XML strings (tag swaps, truncation, entity
   garbage), HTML-ish strings (unclosed tags, nested depth), and `Params`
   objects derived from `mapping.schema.ts` (zod schema → arbitrary; look at
   `zod-fast-check` for inspiration even if you hand-roll).
3. **HTTP mocking in Node (½ day).** Learn undici `MockAgent` +
   `setGlobalDispatcher`; note the interaction with 03's injected-fetch
   refactor (once fetch is injected, tests can pass a stub directly — even
   simpler).
4. **Audit the suite (½ day).** Read `RSSFeed.test.ts` end to end once; list
   duplicated setups and which assertions are behavior vs incidental
   (`toEqual` on giant objects that should be snapshots).

## Actionable plan

1. **Complete the safety net** _(RSS half done — 2026-07-27)_: the remaining
   piece is a generated snapshot test that iterates every `*.html` in
   `src/support/feeds/` and `src/support/html/` → `HTMLMapper.toComponents(content)` →
   `toMatchFileSnapshot`. Use `toMatchFileSnapshot` rather than inline snapshots so
   each fixture gets its own readable file. Commit the snapshots as the behavioral
   baseline for Section 2's tree passes.
2. **No-throw properties** _(no-throw contract covered — 2026-07-27)_: `rss-feed.fuzz.test.ts`
   and `html-mapper.fuzz.test.ts` already verify the no-throw contract with seeded PRNG.
   Remaining: upgrade to fast-check for shrinkable counterexamples; add a property that
   every emitted `FeedIssue` has a `code` drawn from the known `FeedIssueCode` union.
3. **Engine invariant properties** (pairs with 02): e.g. output components
   never contain disallowed tags in `html` fields (parse the output and check
   against `mapping.constants.ts` allow-lists); `toComponents` is idempotent
   on its own serialized output where meaningful; filter laws (`all` implies
   `any` for the same filters).
4. **Un-skip integration tests.** Section 03 already extracted network I/O into
   `src/rss/recipe.ts` with an injected `fetch` — tests can pass a stub `fetch`
   directly without a global dispatcher. Record real HTML payloads under
   `src/support/http/` and drive the `integration`/`recipe` tests against them.
   Remove `skip: true` from `vite.config.ts` for both tags.
5. **`broken`/`todo` tags** _(done — 2026-07-27)_: no tests use either tag. The
   `describe.skip('The English Home')` block at `rss-feed.test.ts:1506` can be
   converted to a tagged test or promoted into the snapshot suite.
6. **Consolidate `*.coverage.test.ts`.** Section 04 deleted many "can't happen"
   branches via stricter TS flags. Audit the three coverage files against the
   current code; fold remaining meaningful cases into the main test files and
   delete tests that exist only to touch now-deleted lines.
7. **Fixture intake script** (`scripts/add-fixture.mjs`): fetch or read a
   feed, strip anything sensitive, write to `src/support/feeds/`, run the
   snapshot generator. Documented in the wiki so adding a publisher
   regression case is a 1-minute task.
8. **Update `docs/wiki/Testing.md`** with the new layers (unit / property /
   snapshot / integration-mocked / live), snapshot review discipline, and
   fixture curation conventions.
