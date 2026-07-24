# ADR 001 — HTML parser: linkedom over htmlparser2/parse5, himalaya removed

Status: Accepted and implemented (2026-07-23)

## Context

The HTML→component pipeline used three parsers side by side: `himalaya`
(pinned `1.1.1`, unmaintained since 2019, no real types — see
`src/himalaya.d.ts`'s own warning comment) for the "real" AST the mapping
engine consumes, `linkedom` for DOM-based pre-processing passes
(`sanitizeInvalidAnchorHrefs`, `preprocessHTML`), and `sanitize-html`
(wrapping `htmlparser2`) for allow-list sanitization. `himalaya` is the
highest-risk dependency in the tree: last released in 2019, hand-typed via an
ambient shim that explicitly warns upgrades can silently break it.

Section 01/02 of the improvement plan call for unifying on a single parser.
This ADR covers the parser choice; full pipeline unification (one parse,
multi-pass transforms, `sanitize-html` removal) is tracked separately in
`02-html-pipeline.md` — this change only removes `himalaya`'s two remaining
call sites (`parse`/`stringify`) and replaces them with a linkedom-backed
adapter, `src/component/html/parser.ts`, that preserves the existing
himalaya-shaped `Node` AST contract so every downstream consumer
(`mapping.ts` and friends) is unchanged.

## Decision

**linkedom**, not `htmlparser2` or `parse5`.

### Maintenance (verified against the npm registry, not memory)

| Package | Latest version | Last release | Deprecated? |
|---|---|---|---|
| linkedom | 0.18.13 | 2026-07-07 | No |
| htmlparser2 | 12.0.0 | 2026-03-20 | No |
| himalaya | 1.1.1 | 2019 | No (just abandoned) |

linkedom ships regular releases (6+ in the last 12 months) with no
deprecation flag. It is a single-maintainer project (Andrea Giammarchi /
WebReflection) — a real bus-factor risk relative to `htmlparser2`'s broader
`fb55`/cheerio-adjacent contributor base — but "actively maintained" is not
in question.

### Malformed-HTML behavior (12 synthetic nasty-HTML cases + real fixtures)

linkedom and htmlparser2 agreed on tree-repair structure in every synthetic
case tried (unclosed tags, mismatched tags, bad attribute quoting, entities,
nested `<a>`). Two systematic differences from himalaya, in linkedom/
htmlparser2's favor:

- Attribute quoting: himalaya emits single-quoted attributes; linkedom and
  htmlparser2 both normalize to double quotes.
- Entity decoding: himalaya passes entities through raw (never decodes).
  linkedom/htmlparser2 decode during parsing, per spec.

### Performance (2.7 MB real fixture, 5-iteration average)

| Parser | ms/iter |
|---|---|
| htmlparser2 | 11.8 |
| linkedom | 25.6 |
| himalaya | 36.7 |

htmlparser2 is ~2.2x faster than linkedom. This is real but not decisive:
parsing a 2.7 MB article in 25 ms is not a bottleneck for a feed-ingestion
library (not a hot request path).

### Why linkedom wins anyway

1. **Already in the tree, already doing DOM work.** `html-mapper.ts`'s
   pre-processing passes (`sanitizeInvalidAnchorHrefs`,
   `extractAnchorsWithImagesDOM`, `splitParagraphImagesDOM`) already use
   linkedom's real DOM API (`querySelectorAll`, `cloneNode`,
   `insertBefore`). htmlparser2 only offers a DOM-*like* tree via
   `domhandler`; adopting it as the primary parser would mean maintaining
   two different tree APIs mid-migration instead of one.
2. **One parser, one adapter.** linkedom's `Document`/`Element`/`Node` map
   cleanly onto the existing himalaya-shaped `Node` AST via a single
   adapter module (`src/component/html/parser.ts`), so every mapping
   converter (`mapping.ts`, `mapping.utils.ts`, `mapping.text.ts`,
   `mapping.table.ts`, `mapping.custom.ts`) is unchanged.
3. **htmlparser2 is only in the tree transitively today** (via
   `sanitize-html`), and Section 02's plan removes `sanitize-html` in favor
   of an allow-list `serializeSanitized` pass over the linkedom-backed AST.
   Picking htmlparser2 as the primary parser would mean keeping a dependency
   the plan is otherwise trying to drop.
4. parse5 was not benchmarked directly (not installed, and not a plausible
   winner given the goal of reusing the DOM API already in use) — its
   well-known trade-off (most spec-correct, slower, heavier, jsdom-oriented)
   didn't justify installing it just to confirm it loses on ergonomics too.

## Consequences

- `himalaya` and `src/himalaya.d.ts` are removed; `package.json` no longer
  pins an unmaintained, untyped dependency.
- `src/component/html/parser.ts` is now the only module that imports
  `linkedom` for AST construction; `parse()`/`stringify()` there reproduce
  the himalaya `Node` shape (`type`, `tagName`, `attributes: {key, value}[]`,
  `children`) byte-for-byte for every existing test and the 30-fixture
  differential snapshot suite (`rss-feed.snapshot.test.ts`), with the
  exceptions below.
- Attribute **values** are intentionally extracted as raw source text from
  linkedom's own re-serialization (`element.outerHTML`), not via
  `Attr#value` — the DOM API decodes entities on read
  (`&quot;` and a literal `"` both come back as `"`), which himalaya's
  original char-level tokenizer never did. Reading from linkedom's
  serialization instead (which is always well-formed: double-quoted, with
  embedded quotes correctly re-escaped to `&quot;`) preserves entities the
  same way himalaya did, without hand-rolling a decoder.
- Three linkedom-specific quirks required small, targeted fixes (all in
  `src/component/html/parser.ts` and `src/component/mapping/mapping.ts`,
  covered by the existing test suite — no test was modified to land this
  change):
  - linkedom's tokenizer splits text into multiple sibling `Text` nodes at
    decoded-entity boundaries (`"a &amp; b"` → three nodes instead of one);
    fixed with `document.normalize()`.
  - A decoded `&nbsp;`/`&#160;` is real Unicode whitespace (U+00A0) to
    `String.trim()`, so naive re-decoding made it vulnerable to being
    silently stripped at text-node boundaries. Fixed by re-escaping U+00A0
    back to `&#160;` on serialization, and by trimming/collapsing
    whitespace using an ASCII-only character class in the few spots that
    interpolate node text directly instead of going through `stringify()`
    (`mapping.ts:fromNode`/`reduceEmptyTextNode`,
    `mapping.container.ts`'s button-text extraction).
  - A bare boolean attribute (`<input disabled>`) is indistinguishable from
    `disabled=""` once through the DOM (`Attr#value` normalizes both to
    `''`); recovered by detecting the explicit-`=` form directly from the
    serialized opening tag, matching himalaya's `null`-for-bare convention.

### Known, accepted divergence: pre-existing double-decode bug

4 of 30 fixture snapshots (`culturedmag.rss`, `discover-britain.rss`,
`veganfoodandliving.rss`, `wccftech.rss`) still diverge. All four share one
root cause, and it predates this change: `buildItem` in `rss-feed.ts` calls
`he.decode(rawContent)` on the **entire** `content:encoded` HTML string
before any HTML parsing happens (line ~510). When a source attribute value
is legitimately double-escaped (e.g. `alt="...&quot;9006&quot;..."`), this
premature decode turns it into `alt="...."9006"...."` — literal, unescaped
quotes sitting inside an already-quoted attribute — before either parser
ever sees it.

Both parsers produce garbage for this malformed input; they simply produce
*different* garbage:

- himalaya's char-level, quote-toggling tokenizer happens to glob the
  mess into one oddly-named attribute (undefined behavior that was never
  designed for this input, just legacy code that never crashed on it).
- linkedom's spec-compliant tokenizer terminates the attribute at the first
  unescaped `"` and starts parsing bogus new attributes from what follows.

Reproducing himalaya's specific undefined behavior byte-for-byte would mean
hand-porting its char-level tokenizer's incidental quirks — effectively
un-deleting the dependency this change removes, to preserve output that is
not correct under either parser. This is exactly the double-decode bug
already flagged in `01-dependency-diet.md`'s actionable plan (item 3, "Watch
for the current double-decode behavior in `buildItem`") as a pre-existing
issue to fix deliberately, not a regression introduced here. The real fix is
to stop decoding `content:encoded` before it's parsed as HTML (the parser
should decode entities itself, once, during parsing) — tracked as follow-up
work, out of scope for this parser swap to keep it a pure, reviewable
substitution.

## Verification

- `npm test`: 640/644 non-snapshot-affected tests pass unmodified; the
  differential snapshot suite passes for 26/30 fixtures byte-for-byte, with
  the 4 known exceptions above.
- `npm run lint`, `npm run build`: clean.
- No test file was edited to land this change.
