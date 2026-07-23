# 06 — Testing Strategy

## Completion checklist

- [ ] **Safety net (prerequisite for 01/02):** differential snapshot tests cover `build()` output for **every** feed in `src/support/feeds/` and `toComponents` for every HTML fixture — not just the current handful in `RSSFeed.snapshot.test.ts`.
- [ ] Property-based tests (fast-check) exist for: the no-throw contract (arbitrary strings → `RSSFeed`/`toComponents`), HTML round-trip invariants, and filter-matching laws (`match: 'all'` ⊆ `match: 'any'`).
- [ ] The `integration` and `recipe` tagged tests run **offline** in CI via HTTP mocking (undici `MockAgent` or msw) — the `skip: true` flags are removed (a small live-network suite may remain opt-in).
- [ ] Tests tagged `broken` are either fixed or converted to `.fails`/tracked issues — the tag is empty.
- [ ] Coverage thresholds are maintained (99/95/99/99) after all refactors, and `/* v8 ignore */` comments are re-audited (several mark "can't happen" branches that the type-safety work should delete outright).
- [ ] A fixture-intake script exists: given a feed URL or file, it adds a sanitized fixture + generated snapshot in one command.
- [ ] Testing conventions (tags, fixtures, snapshots, property tests) are documented in `docs/wiki/Testing.md`.

## Overview

The suite is already strong (99 % thresholds, fuzz file, snapshot file,
tagged tests). This section has two jobs:

1. **Enable the refactors.** Sections 01/02 rewrite the engine's plumbing while
   promising unchanged output. The only way to keep that promise cheaply is a
   *complete* characterization-test layer: snapshot every fixture's full
   output **before** touching anything, so every diff during the refactor is a
   conscious decision. Today `RSSFeed.snapshot.test.ts` is only 24 lines —
   coverage of the fixture corpus is partial.
2. **Raise the ceiling.** Example-based tests can't prove the no-throw
   contract (03) or pipeline invariants; property-based testing can. And the
   most valuable tests in the repo — the `integration`/`recipe` ones hitting
   real publisher behavior — are permanently skipped because they need the
   network; mocking the HTTP layer brings them into CI where they can catch
   regressions.

## Files to review

- `src/rss/RSSFeed.snapshot.test.ts` + `__snapshots__/` — the pattern to extend
- `src/component/html/HTMLMapper.fuzz.test.ts` — existing fuzz approach (seed corpus, mutations) to upgrade to fast-check
- `vite.config.ts` — tags (`integration`, `recipe` skipped; `todo`, `broken`), coverage thresholds, `setup-tests.ts` env paths
- `src/setup-tests.ts` — `SUPPORT_PATH`/`FEEDS_PATH` convention
- All `*.coverage.test.ts` files — tests written to satisfy thresholds; candidates to convert into meaningful cases
- `src/rss/RSSFeed.test.ts` (2 222 lines) — structure/duplication review; find which fixtures it exercises vs which exist
- Grep `tags:.*integration|recipe|broken|todo` to inventory skipped/broken tests
- `src/support/feeds/`, `src/support/html/` — the corpus

## Resources

**Articles / blog posts**

- "Characterization tests" (Michael Feathers' term — search *Working Effectively with Legacy Code characterization test*); also Approval Tests intro by Llewellyn Falco: <https://approvaltests.com>
- fast-check docs, esp. *Arbitraries* and the "detect bugs, then shrink" workflow: <https://fast-check.dev>
- "Property-based testing for JavaScript developers" (fast-check's own tutorial series)
- undici `MockAgent` docs: <https://undici.nodejs.org/#/docs/api/MockAgent> (Node's native-fetch mocking — no extra dep if you use undici's, which ships in Node)
- msw docs (<https://mswjs.io>) — alternative if you want request-handler ergonomics
- Vitest snapshot docs (file snapshots, `toMatchFileSnapshot`): <https://vitest.dev/guide/snapshot>
- "Coverage is not a goal" (Martin Fowler on test coverage) — context for keeping 99 % honest rather than gamed

**Videos**

- John Hughes — *"Testing the Hard Stuff and Staying Sane"* (the QuickCheck talk; the single best property-testing intro)
- "Property-based testing in JavaScript with fast-check" (various conference recordings)

**Books**

- *Working Effectively with Legacy Code* (Feathers) — characterization testing
- *Property-Based Testing with PropEr, Erlang, and Elixir* (Hebert) — language-agnostic PBT strategy chapters are excellent

## Study guide

1. **Characterization testing (½ day).** Read the Feathers/Approval Tests
   material; understand snapshot review discipline (a snapshot diff is a
   question, not a failure) and how to keep snapshots reviewable (stable
   ordering, formatted JSON).
2. **fast-check (1 day).** Do the official tutorial; then design arbitraries
   for *this* domain: mutated-XML strings (tag swaps, truncation, entity
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

1. **Build the safety net first** (blocks 01/02): a generated snapshot test
   that iterates every `*.rss` in `FEEDS_PATH` → `new RSSFeed(content)` →
   `build()` → `toMatchFileSnapshot` (one file per feed, pretty-printed via
   `RSSFeed.toString`), and every `*.html` fixture → `toComponents` →
   snapshot. Commit the snapshots as the behavioral baseline.
2. **No-throw properties** (pairs with 03): fast-check props asserting
   `new RSSFeed(anyString).build()` never rejects, `toComponents(anyString)`
   never throws and returns an array, and (post-03) every emitted issue has a
   known `code`.
3. **Engine invariant properties** (pairs with 02): e.g. output components
   never contain disallowed tags in `html` fields (parse the output and check
   against `mapping.constants.ts` allow-lists); `toComponents` is idempotent
   on its own serialized output where meaningful; filter laws (`all` implies
   `any` for the same filters).
4. **Un-skip integration tests.** After 03 extracts/injects fetch: convert
   `integration`/`recipe` tests to use recorded responses (store real HTML
   payloads under `src/support/http/`), keep a tiny `@live` opt-in suite for
   true end-to-end runs. Remove `skip: true` from `vite.config.ts` tags.
5. **Triage `broken`/`todo`.** Fix or delete `broken`-tagged tests (use
   Vitest `test.fails` for known-bug documentation instead of a skipped tag);
   convert `todo` tags to `test.todo`.
6. **Consolidate `*.coverage.test.ts`.** As 03/04 delete "can't happen"
   branches, fold the remaining meaningful cases into the main test files and
   remove tests that exist only to touch lines.
7. **Fixture intake script** (`scripts/add-fixture.mjs`): fetch or read a
   feed, strip anything sensitive, write to `src/support/feeds/`, run the
   snapshot generator. Documented in the wiki so adding a publisher
   regression case is a 1-minute task.
8. **Update `docs/wiki/Testing.md`** with the new layers (unit / property /
   snapshot / integration-mocked / live) and when to use each.
