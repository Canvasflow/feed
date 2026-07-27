# 04 — Type Safety & TypeScript Library Practices

## Completion checklist

- [x] Zero `as X` type assertions in `src/` outside of `*.test.ts` and a single documented boundary module (casts at the untrusted-XML boundary are replaced by narrowing functions or schema parsing). _(`src/rss/narrow.ts` created with `textOf` (extracts strings from plain values or `{ '#text': ... }` wrappers) and `recordOf` (narrows `unknown` to `Record<string, unknown>`). All XML-boundary `as` casts in `rss-feed.ts` replaced by `textOf`/`recordOf` or type predicates. Mapping module casts eliminated: `isValidTextRole` changed to a proper type predicate (`role is TextType`), inline `as TextComponent`/`as TikTokComponent` replaced by typed locals, `as ElementNode` casts replaced with `.find((n): n is ElementNode => ...)` type-predicate filters, `.pop() as string` replaced by `.pop()!`, `.map((n) => toImage(n as ElementNode))` replaced by type-predicate filter, `fromFigure(node) as ImageComponent` replaced by `isImageComponent(component)` guard with fallback, and the video/audio filter in `fromFigure` rewritten as a type-predicate filter eliminating `components.pop() as VideoComponent | AudioComponent`. Remaining `as` in `src/` are: (a) `narrow.ts` itself (the documented boundary), (b) two structural/initialization casts in `rss-feed.ts` (`{} as unknown as ParsedXml` initialization fallback, iterator-check cast), (c) DOM-boundary casts in `parser.ts`/`html-mapper.ts` (different layer, not XML), (d) standard type-guard pattern (`object as Record<string, unknown>`) in `component.ts` is* guards, (e) error-catch cast in `mapping.embeds.ts`, (f) 3 `mapping as XxxMapping` casts in `mapping.ts` — deferred to checklist item 5 (discriminated-union refactor). Full test suite (965 passed, 6 skipped) green.)_
- [x] `tsconfig.json` enables `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` (and the code compiles). _(Both flags enabled. Fallout (202 compile errors) fixed across the whole codebase: every optional field in `rss-types.ts`, `component.ts` (base `Component` type + the hand-written intersection types used for the recursive/lazy container schemas), `recipe-schema.ts`'s hand-written `Thing`/`Person`/... types, and several local interfaces (`BuildItemContext`, `MappingComponentResponse`, `FigcaptionResponse`, `FetchOptions`, `ElementNode.attributes`) widened from `field?: T` to `field?: T | undefined` — a mechanical, non-breaking change forced by `exactOptionalPropertyTypes` (these fields are genuinely assigned explicit `undefined` at runtime). `noUncheckedIndexedAccess` fallout: real array-index guards added in `rss-feed.ts` (media:credit/thumbnail array collapsing), `mapping.embeds.ts`, `mapping.container.ts` (switched a manual loop to `.entries()`), `parser.ts`/`sanitize-html.ts` (non-null assertions on mandatory regex capture groups, commented as to why they're safe), and non-null assertions across test files where an `expect(x).toBeDefined()` already establishes the precondition the compiler now also wants proof of. `tsc --noEmit`, `vp lint`, and the full test suite (965 passed, 6 skipped) all green with both flags on.)_
- [x] Raw parser output (`ParsedXml`, the linkedom-backed `Node` trees from `src/component/html/parser.ts` — see [02-html-pipeline.md](02-html-pipeline.md)) is never mutated; functions that used to mutate (`getEnclosure`, `getMediaGroup`, `getCredit`, `dc:creator` rewrite in `buildItem`) take readonly inputs and return new values. _(`getCredit`/`fromFigcaption` in `mapping.utils.ts` were already fixed in Section 2 — the doc's note claiming otherwise was stale; verified via the existing `mapping.referential.test.ts` mutation-guard test. `getEnclosure`/`getMediaGroup` in `rss-feed.ts` no longer reassign `item.enclosure`/`item['media:group']` to coerce a single value into an array — they compute a local array instead. The `dc:creator` array-join no longer reassigns `item['dc:creator']` — computed into a local `dcCreator` variable. 3 new mutation-guard tests in `build-item.test.ts`. **Not fixed:** `validateItem` still writes `item.errors`/`item.warnings` onto the shared `ParsedItem` as the (intentional) hand-off channel to `buildItem` — a real mutation, left as a deliberate, understood tradeoff rather than restructured, since removing it means threading validation results through a new side channel between `validate()` and `build()`.)_
- [ ] Public API types are explicit exports (no leaking of internal helper types); `Readonly`/`readonly` modifiers applied to public-facing arrays/objects that consumers must not mutate. _(Not started — `src/index.ts` is still five `export *` statements.)_
- [ ] The public type surface is snapshotted (api-extractor report or `expect-type` tests) so accidental breaking changes fail CI. _(Not started.)_
- [ ] `Component` narrowing relies on the `is*` guards everywhere (no `as SomethingComponent` in mapping modules). _(Not started — overlaps with the zero-`as` item above.)_
- [ ] JSDoc on public API is accurate and `@param` types are removed where redundant with TS (keep descriptions). _(Not started.)_

## Overview

The codebase is already `strict: true` with good discipline, but the
XML-boundary code works against `Record<string, unknown>` with scattered
inline casts (`item.guid as { '#text'?: unknown }`,
`item['cf:thumbnail'] as {...}`, `mapping as ColumnsMapping`), and several
helpers _mutate their inputs_ to coerce shapes (`item.enclosure =
[item.enclosure]`, `delete channel[key]`, `item['dc:creator'] = ...join()`).
Mutation of half-typed data is where "works on this feed, breaks on that one"
bugs come from.

For a published library there is a second dimension: the **type surface is
API**. Consumers compile against `dist/index.d.mts`; a renamed field or a
widened union is a breaking change even if runtime behavior is identical. That
surface should be reviewed and diffed in CI like code.

Goals:

1. Push all shape uncertainty to one boundary (pairs with 03's
   "parse, don't validate") and keep everything past it fully typed and
   immutable.
2. Tighten compiler settings to the library-grade set.
3. Make the public type surface explicit, minimal, and diff-guarded.

## Files to review

- `src/rss/rss-feed.ts` — every `as` cast, `Record<string, unknown>` params, input mutation in `getEnclosure`/`getMediaGroup`/`getMediaContent`/`buildItem`/`validateItem`
- `src/rss/parsed-xml.ts` — how faithfully it models `fast-xml-parser` output (single-vs-array, `#text` objects, string-vs-number coercion)
- `src/rss/rss-types.ts`, `src/rss/attributes.ts` — public types, optionality choices
- `src/component/component.ts` — the union + `is*` guards; check exhaustiveness
- `src/component/mapping/mapping.ts` — `mapping as ColumnsMapping` style casts after `getMappingComponent`; `MappingComponentResponse` design (returning the mapping unnarrowed forces casts downstream)
- `src/component/mapping/mapping.schema.ts` — schemas as the source of types (good pattern; keep)
- `src/index.ts` — `export *` re-exports (surface control)
- `tsconfig.json`, `vite.config.ts` (`pack.dts`)

## Resources

**Articles / blog posts**

- Matt Pocock — _TSConfig cheat sheet_: <https://www.totaltypescript.com/tsconfig-cheat-sheet> (library section: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax` — you already have the last)
- "Parse, don't validate" (again — the typing half): <https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/>
- TypeScript handbook — _Narrowing_ and _Discriminated Unions_ chapters
- "The `satisfies` operator" (TS 4.9 release notes) — for the mapping tables like `TEXT_TAG_MAPPING`
- api-extractor docs: <https://api-extractor.com> (API report workflow); alternative: `@arethetypeswrong/cli` + a checked-in `.d.mts` diff
- Effect/ts-reset discussions on `JSON.parse`/index-access unsoundness (context for `noUncheckedIndexedAccess`)

**Videos**

- Total TypeScript workshops (Matt Pocock) — _Type Transformations_ and _Advanced TypeScript Patterns_ (branded types, builder for narrowing)
- "TypeScript Berlin" talks on publishing typed libraries (search: _publishing TypeScript libraries dts_)

**Books**

- _Effective TypeScript_, 2nd ed. (Vanderkam) — the single best fit; items on `unknown`, structural typing at boundaries, and publishing types
- _Programming TypeScript_ (Cherny) — ch. 6–7 for advanced narrowing

## Study guide

1. **Compiler flags (½ day).** Read the docs for `noUncheckedIndexedAccess`
   and `exactOptionalPropertyTypes`; turn them on locally and _count_ the
   errors per file — that's your work map. Understand the difference between
   `field?: string` and `field: string | undefined` under
   `exactOptionalPropertyTypes` before deciding public type shapes.
2. **fast-xml-parser output model (½ day).** Write a scratch script that
   parses 5 fixture feeds and `console.dir`s the raw output. Document the real
   shapes (when does it produce arrays? numbers? `#text` wrappers?) and
   compare with `parsed-xml.ts`. Consider parser options
   (`isArray` callback, `parseTagValue`) that eliminate whole categories of
   "single or array?" code.
3. **Narrowing patterns (1 day).** Effective TypeScript items on type guards;
   practice rewriting one cast-heavy function (`buildThumbnail`) with a
   narrowing helper (`asRecord`, `asString`) instead of `as`.
4. **API surface tooling (½ day).** Run api-extractor (or
   `npx @arethetypeswrong/cli`) against the built package once; read the
   report format and decide which tool becomes the CI gate.

## Actionable plan

1. **Turn on the flags** (`noUncheckedIndexedAccess`,
   `exactOptionalPropertyTypes`) and fix fallout file by file — mapping
   modules first (they index into arrays/maps constantly), then RSS.
2. **Fix `ParsedXml` at the source.** Configure `fast-xml-parser` with an
   `isArray` predicate for `item`, `enclosure`, `media:content`,
   `media:group`, `category`, `dc:creator` so the "maybe array" unions and
   their coercing mutations disappear from `buildItem`/`getEnclosure`/etc.
   This deletes code _and_ casts.
3. **Boundary narrowing module.** Create `src/rss/narrow.ts` with tiny helpers
   (`textOf(x): string | undefined` for `#text` wrappers, `recordOf`,
   `stringOf`) and replace every inline `as` in `rss-feed.ts`. Rule of thumb to
   enforce via review: `as` only appears in this file (and `as const`
   anywhere).
4. **Immutability.** Change validator/builder signatures to take
   `Readonly<...>`/`ReadonlyArray<...>`; stop `delete`-ing keys (3 call
   sites) and stop reassigning `item.*` fields; return new objects. Add the
   referential-transparency test from 02.
5. **Kill downstream casts in Mapping.** Make `getMappingComponent` return a
   discriminated union (`{ kind: 'columns'; mapping: ColumnsMapping } | ...`)
   so `fromNode` switches exhaustively instead of `mapping as ColumnsMapping`.
   Apply `satisfies Record<string, TextType>` to `TEXT_TAG_MAPPING`.
6. **Curate the public surface.** Replace blanket `export *` in `src/index.ts`
   with explicit named exports (decide deliberately whether `buildItem`,
   `splitParagraphImages`, `replaceErrors`, internal reducers are public);
   mark true internals with `@internal` JSDoc if you adopt api-extractor.
7. **Guard the surface in CI.** Add api-extractor's API report (checked-in
   `feed.api.md`, fails CI on unreviewed diff) or `expect-type` tests over the
   key exported types; add `@arethetypeswrong/cli` too (overlaps with 07).
8. **JSDoc pass.** Drop `{type}` annotations that duplicate TS, keep prose;
   ensure examples in `docs/wiki/API-Reference.md` still typecheck (consider
   `typescript` twoslash snippets or a compiled examples folder).
