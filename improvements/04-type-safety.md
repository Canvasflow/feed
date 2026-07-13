# 04 — Type Safety & TypeScript Library Practices

## Completion checklist

- [ ] Zero `as X` type assertions in `src/` outside of `*.test.ts` and a single documented boundary module (casts at the untrusted-XML boundary are replaced by narrowing functions or schema parsing).
- [ ] `tsconfig.json` enables `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` (and the code compiles).
- [ ] Raw parser output (`ParsedXml`, himalaya/`Node` trees) is never mutated; functions that used to mutate (`validateItem`, `getEnclosure`, `getMediaGroup`, `getCredit`, `dc:creator` rewrite in `buildItem`) take readonly inputs and return new values.
- [ ] Public API types are explicit exports (no leaking of internal helper types); `Readonly`/`readonly` modifiers applied to public-facing arrays/objects that consumers must not mutate.
- [ ] The public type surface is snapshotted (api-extractor report or `expect-type` tests) so accidental breaking changes fail CI.
- [ ] `Component` narrowing relies on the `is*` guards everywhere (no `as SomethingComponent` in mapping modules).
- [ ] JSDoc on public API is accurate and `@param` types are removed where redundant with TS (keep descriptions).

## Overview

The codebase is already `strict: true` with good discipline, but the
XML-boundary code works against `Record<string, unknown>` with scattered
inline casts (`item.guid as { '#text'?: unknown }`,
`item['cf:thumbnail'] as {...}`, `mapping as ColumnsMapping`), and several
helpers *mutate their inputs* to coerce shapes (`item.enclosure =
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

- `src/rss/RSSFeed.ts` — every `as` cast, `Record<string, unknown>` params, input mutation in `getEnclosure`/`getMediaGroup`/`getMediaContent`/`buildItem`/`validateItem`
- `src/rss/ParsedXml.ts` — how faithfully it models `fast-xml-parser` output (single-vs-array, `#text` objects, string-vs-number coercion)
- `src/rss/RSS.ts`, `src/rss/Attributes.ts` — public types, optionality choices
- `src/component/Component.ts` — the union + `is*` guards; check exhaustiveness
- `src/component/mapping/Mapping.ts` — `mapping as ColumnsMapping` style casts after `getMappingComponent`; `MappingComponentResponse` design (returning the mapping unnarrowed forces casts downstream)
- `src/component/mapping/Mapping.schema.ts` — schemas as the source of types (good pattern; keep)
- `src/index.ts` — `export *` re-exports (surface control)
- `tsconfig.json`, `vite.config.ts` (`pack.dts`)

## Resources

**Articles / blog posts**

- Matt Pocock — *TSConfig cheat sheet*: <https://www.totaltypescript.com/tsconfig-cheat-sheet> (library section: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax` — you already have the last)
- "Parse, don't validate" (again — the typing half): <https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/>
- TypeScript handbook — *Narrowing* and *Discriminated Unions* chapters
- "The `satisfies` operator" (TS 4.9 release notes) — for the mapping tables like `TEXT_TAG_MAPPING`
- api-extractor docs: <https://api-extractor.com> (API report workflow); alternative: `@arethetypeswrong/cli` + a checked-in `.d.mts` diff
- Effect/ts-reset discussions on `JSON.parse`/index-access unsoundness (context for `noUncheckedIndexedAccess`)

**Videos**

- Total TypeScript workshops (Matt Pocock) — *Type Transformations* and *Advanced TypeScript Patterns* (branded types, builder for narrowing)
- "TypeScript Berlin" talks on publishing typed libraries (search: *publishing TypeScript libraries dts*)

**Books**

- *Effective TypeScript*, 2nd ed. (Vanderkam) — the single best fit; items on `unknown`, structural typing at boundaries, and publishing types
- *Programming TypeScript* (Cherny) — ch. 6–7 for advanced narrowing

## Study guide

1. **Compiler flags (½ day).** Read the docs for `noUncheckedIndexedAccess`
   and `exactOptionalPropertyTypes`; turn them on locally and *count* the
   errors per file — that's your work map. Understand the difference between
   `field?: string` and `field: string | undefined` under
   `exactOptionalPropertyTypes` before deciding public type shapes.
2. **fast-xml-parser output model (½ day).** Write a scratch script that
   parses 5 fixture feeds and `console.dir`s the raw output. Document the real
   shapes (when does it produce arrays? numbers? `#text` wrappers?) and
   compare with `ParsedXml.ts`. Consider parser options
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
   This deletes code *and* casts.
3. **Boundary narrowing module.** Create `src/rss/narrow.ts` with tiny helpers
   (`textOf(x): string | undefined` for `#text` wrappers, `recordOf`,
   `stringOf`) and replace every inline `as` in `RSSFeed.ts`. Rule of thumb to
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
