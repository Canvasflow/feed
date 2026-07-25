# 03 — API Robustness & Error Model

## Completion checklist

> **Throw-surface inventory:** ADR-0007 (`docs/adr/0007-throw-surface-inventory.md`) lists every call site that can throw, classified by risk, with guarded sites confirmed safe. Use it as the reference for the fixes below.

- [ ] A documented **no-throw contract**: for any string input, `new RSSFeed(...)`, `validate()`, and `build()` never throw — they report through the error model. Verified by fuzz tests.
- [ ] The `RSSFeed` constructor no longer throws on malformed XML (`XMLParser.parse` failure is captured as an error).
- [ ] `build()` no longer throws on an invalid channel `<link>` (`new URL(link)` guarded).
- [ ] Invalid `params` are never **silently dropped** (today the constructor discards them when `isValidParams` fails; `build()` reports them — one consistent behavior, documented).
- [ ] Network I/O (`getRecipeFromUrl`, `getHtmlContent`) is removed from `RSSFeed` or clearly separated (injected fetch / separate entry point), with timeouts and response-status handling.
- [ ] The error model is typed: consumers get structured errors (code + message + path), not only interpolated strings; `rss.errors` is no longer a mixed `string`/`unknown` array.
- [ ] `validate()`/`build()` are synchronous (or an ADR justifies keeping `async`); the `validate()`-mutates-input coupling is removed.
- [ ] `docs/wiki/API-Reference.md` documents the contract: what throws (nothing), what errors/warnings mean, and the validate/build lifecycle.

## Overview

This library ingests **hostile input** (arbitrary publisher feeds, customer
mapping configs) and is consumed by self-service customers. The single most
valuable stability guarantee it can offer is: _give me any string and any
config, and I will always give you back an `RSS` object with structured
errors — I will never throw, hang, or make a network call you didn't ask
for._ Today that guarantee has holes:

- `new RSSFeed(garbage)` → `fast-xml-parser` can throw on malformed XML,
  before any error model exists.
- `build()` → `new URL(channel.link)` throws on an invalid link (common in
  real feeds).
- Constructor silently ignores invalid `params` (`isValidParams` check), but
  `build()` _reports_ invalid params into `rss.errors` — two different
  behaviors for the same mistake, one of them invisible.
- `rss.errors` receives both `string`s and raw zod issue objects
  (`paramsErrors` is `Array<unknown>` spread into it) — consumers cannot
  reliably render or branch on errors.
- `validate()` **mutates the parsed data** (deletes invalid keys from
  `this.data`), so validation and building are secretly order-coupled, and
  calling `validate()` twice is not idempotent-by-construction.
- `validate()`/`build()` are `async` yet contain no `await` — an API lie that
  forces consumers into needless promise handling and makes errors land as
  rejections instead of the error model.
- `RSSFeed.getRecipeFromUrl` / `getHtmlContent` perform raw `fetch` with no
  timeout, no status check, no size cap — hidden I/O inside a parsing library,
  and untestable offline (these are exactly the tests skipped in CI).

Error-model design decision to make deliberately: keep the current
_accumulate-on-the-object_ style (errors/warnings arrays on rss/channel/item —
good for feed QA UIs) but make every entry a typed
`FeedIssue { code, severity, message, path? }`. String-compatibility can be
kept for one major version via `toString()`.

## Files to review

- `src/rss/rss-feed.ts` — constructor, `validate()`, `build()`, `validateRSS/Channel/Item` (mutation via `delete`), `getRecipeFromUrl`, `getHtmlContent`, `validateParams`
- `src/rss/rss-types.ts` — `errors`/`warnings` field types, `replaceErrors`
- `src/rss/parsed-xml.ts` — what shapes the parser can actually produce
- `src/component/mapping/mapping.ts` — `isValidParams`, `validateParams` (throwing variant)
- `src/component/html/html-mapper.ts` — confirm `toComponents` is total (never throws) for arbitrary strings
- `src/component/html/HTMLMapper.fuzz.test.ts` — extend into the no-throw proof
- `docs/wiki/API-Reference.md`, `docs/wiki/RSS-Feeds.md` — contract documentation
- Consumers: how `transformer` calls this library (check error handling expectations before changing shapes)

## Resources

**Articles / blog posts**

- "Parse, don't validate" (Alexis King) — <https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/> — the foundational piece for the boundary design here
- "Errors as values" — Go/Rust-style result handling in TS: search _"neverthrow"_ docs and _Matt Pocock — Result types in TypeScript_
- Postel's law and its critics ("be conservative in what you accept" debate) — relevant to how lenient `validate()` should be
- Node.js `fetch`/undici docs on `AbortSignal.timeout` and body size limits
- Semver spec <https://semver.org> — you will ship breaking changes; plan the major
- "Designing APIs for humans" sections of the Stripe engineering blog (error codes with stable identifiers)

**Videos**

- Matt Pocock — "The `Result` type in TypeScript" (Total TypeScript free videos)
- "Making Impossible States Impossible" (Richard Feldman) — Elm talk, directly applicable to the Item/error modeling

**Books**

- _Effective TypeScript_ (Vanderkam), 2nd ed. — items on designing types for APIs and on `unknown` at boundaries
- _A Philosophy of Software Design_ (Ousterhout) — ch. "Define Errors Out of Existence"

## Study guide

1. **Inventory the throw surface (½ day).** Grep for `throw`, `new URL(`,
   `JSON.parse`, `parseInt`, and every dependency call that can throw
   (`XMLParser.parse`, `parse()` from the HTML parser). Write the list into
   the ADR. Fuzz `new RSSFeed` with 1k mutated fixture strings to confirm.
2. **Read "Parse, don't validate" (½ day)** and map it onto this codebase:
   `ParsedXml` (untrusted) → `RSS` (trusted) should be the _only_ boundary;
   after `build()`, no code should ever re-check shapes.
3. **Error taxonomy (½ day).** Enumerate every error/warning string currently
   produced (grep `errors.push` / `warnings.push`), group them into stable
   codes (e.g. `missing-required-tag`, `invalid-thumbnail-type`,
   `unparseable-date`). This becomes the `FeedIssueCode` union.
4. **Consumer audit (½ day).** Read how `transformer` and the self-service
   project consume `errors`/`warnings` and whether they await
   `validate()`/`build()` — this decides how much you can change in one major.

## Actionable plan

1. **Wrap the throw points.** Constructor: try/catch around `XMLParser.parse`,
   store a `parse-error` issue and an empty data object. `build()`: guard
   `new URL(link)` (use `URL.canParse`), guard date parsing, audit every
   `parseInt` (always pass radix, check `Number.isNaN` — some already do).
2. **Introduce `FeedIssue`.** Define the discriminated
   `{ code: FeedIssueCode; severity: 'error' | 'warning'; message: string;
path?: string }` type in `rss-types.ts`; migrate `errors: string[]` →
   `FeedIssue[]` (TS practice: export the union type and a `const` array of
   codes so consumers can exhaustively switch). Convert zod issues from
   `validateParams` into `FeedIssue`s instead of pushing raw objects.
3. **One params behavior.** Constructor stops silently dropping invalid
   params; it stores them and lets `build()` report the issues (or throws a
   `TypeError` synchronously if you prefer fail-fast for programmer error —
   config from your own consumer is programmer error, config from customers is
   data; pick per-audience and write it down).
4. **De-async or justify.** Make `validate()`/`build()` sync internally and
   ship them as sync in the next major (keep `async` wrappers during
   deprecation if consumers already `await`). Remove the `_validated` implicit
   coupling by making `build()` call validation on a _copy_ — stop `delete`-ing
   keys from `this.data` (return sanitized views instead of mutating input).
5. **Extract network I/O.** Move `getRecipeFromUrl`/`getHtmlContent` to a
   separate export (`@canvasflow/feed/recipe` subpath or a standalone module)
   that accepts an injected `fetch` (`(url, init) => Promise<Response>`), uses
   `AbortSignal.timeout(...)`, checks `response.ok`, caps body size, and wraps
   `JSON.parse` of JSON-LD in try/catch (currently throws on invalid JSON-LD).
   This also makes the skipped integration tests mockable (see 06).
6. **Prove it.** Property test: for arbitrary strings and arbitrary
   params-shaped JSON, `new RSSFeed(x, p).build()` resolves without throwing
   and always returns an object matching the `RSS` type (see 06 for tooling).
7. **Document** the lifecycle and issue codes in the wiki; add a migration
   guide section in `CHANGELOG.md` for the major release.
