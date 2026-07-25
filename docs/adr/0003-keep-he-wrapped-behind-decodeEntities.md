# ADR-0003: Keep `he` wrapped behind `decodeEntities()`

**Status:** Accepted
**Date:** 2026-07-24

## Context

`he` is used in `rss-feed.ts` to decode HTML entities in plain-text RSS
fields — channel titles, item titles, and descriptions — that arrive from
arbitrary publishers and may contain any named or numeric HTML5 character
reference.

During the dependency-diet review (see `improvements/01-dependency-diet.md`),
the question was whether `he` could be removed now that `linkedom` is the
single HTML parser end-to-end. The argument for removal was: a full HTML
parser decodes entities during parsing, so a separate decode step is
redundant for HTML fields.

The counter-argument: the fields that call `he.decode` are **plain-text**
fields (titles, descriptions) that are never run through the HTML pipeline.
A hand-rolled entity table covering only the five most common named
references (`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&apos;`) would silently
mis-render any publisher using a named reference outside that set — `&copy;`,
`&mdash;`, `&laquo;`, `&#8230;`, and thousands of others all appear in real
publisher feeds. The size argument for removal is also weak: at **132 KB
unpacked**, `he` is the smallest runtime dependency in the tree, and the
dependencies removed earlier in this effort (`himalaya`, `sanitize-html` and
its transitive tree) cleared ≈ 6 MB — the marginal gain from removing `he`
is negligible.

## Decision

**Keep `he`.** Wrap every call site behind a single `decodeEntities(value)`
function in `src/rss/entities.ts`, which delegates to `he.decode`. All
callers in `rss-feed.ts` import `decodeEntities` instead of `he` directly.

This creates a clean seam: if `he` is ever replaced (e.g., by a decode
step that the surviving HTML parser can provide natively), only
`entities.ts` changes, and the existing test suite for `decodeEntities`
confirms correctness without touching any caller.

## Consequences

**Positive**

- ✅ No correctness regression — the full HTML5 named-character-reference
  table remains available for all publisher feeds.
- ✅ A single import of `he` in `entities.ts` replaces five scattered
  `he.decode` call sites in `rss-feed.ts`.
- ✅ `src/rss/__tests__/entities.test.ts` covers named refs, decimal and
  hex numeric refs, plain-text passthrough, and named refs beyond the common
  five — the last case being the key guard that proves the full table is in
  play, not a hand-rolled subset.
- ✅ Future removal is a one-file change with tests already in place.

**Negative / Trade-offs**

- ⚠️ `he` remains a runtime dependency. Its 132 KB install weight is
  unchanged.
