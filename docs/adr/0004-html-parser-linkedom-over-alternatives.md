# ADR-0004: HTML parser — linkedom over htmlparser2/parse5, himalaya removed

**Status:** Accepted
**Date:** 2026-07-23

## Context

The HTML→component pipeline used three parsers side by side: `himalaya`
(pinned `1.1.1`, unmaintained since 2019, no real types — see
`src/himalaya.d.ts`'s own warning comment) for the "real" AST the mapping
engine consumes, `linkedom` for DOM-based pre-processing passes
(`sanitizeInvalidAnchorHrefs`, `preprocessHTML`), and `sanitize-html`
(wrapping `htmlparser2`) for allow-list sanitization. `himalaya` is the
highest-risk dependency in the tree: last released in 2019, hand-typed via an
ambient shim that explicitly warns upgrades can silently break it.

The improvement plan calls for unifying on a single parser. This ADR covers
the parser choice; the himalaya/sanitize-html removals are recorded in
[ADR-0002](0002-replace-himalaya-and-sanitize-html-with-linkedom-parser-and-inline-sanitization.md).
This change only removes `himalaya`'s two remaining call sites
(`parse`/`stringify`) and replaces them with a linkedom-backed adapter,
`src/component/html/parser.ts`, that preserves the existing himalaya-shaped
`Node` AST contract so every downstream consumer (`mapping.ts` and friends)
is unchanged.

## Decision

**`linkedom`**, not `htmlparser2` or `parse5`.

### Maintenance (verified against the npm registry)

| Package     | Latest version | Last release | Deprecated?         |
| ----------- | -------------- | ------------ | ------------------- |
| linkedom    | 0.18.13        | 2026-07-07   | No                  |
| htmlparser2 | 12.0.0         | 2026-03-20   | No                  |
| himalaya    | 1.1.1          | 2019         | No (just abandoned) |

linkedom ships regular releases (6+ in the last 12 months) with no
deprecation flag. It is a single-maintainer project (Andrea Giammarchi /
WebReflection) — a real bus-factor risk relative to `htmlparser2`'s broader
contributor base — but "actively maintained" is not in question.

### Malformed-HTML behaviour (12 synthetic cases + real fixtures)

linkedom and htmlparser2 agreed on tree-repair structure in every synthetic
case tried (unclosed tags, mismatched tags, bad attribute quoting, entities,
nested `<a>`). Two systematic differences from himalaya, in both candidates'
favour:

- **Attribute quoting:** himalaya emits single-quoted attributes; linkedom
  and htmlparser2 both normalise to double quotes.
- **Entity decoding:** himalaya passes entities through raw (never decodes).
  linkedom/htmlparser2 decode during parsing, per spec.

### Performance (2.7 MB real fixture, 5-iteration average)

| Parser      | ms/iter |
| ----------- | ------- |
| htmlparser2 | 11.8    |
| linkedom    | 25.6    |
| himalaya    | 36.7    |

htmlparser2 is ~2.2× faster than linkedom. This is real but not decisive:
parsing a 2.7 MB article in 25 ms is not a bottleneck for a feed-ingestion
library that is not a hot request path.

### Why linkedom wins

1. **Already in the tree, already doing DOM work.** The pre-processing passes
   (`sanitizeInvalidAnchorHrefs`, `extractAnchorsWithImagesDOM`,
   `splitParagraphImagesDOM`) already use linkedom's real DOM API
   (`querySelectorAll`, `cloneNode`, `insertBefore`). htmlparser2 only offers
   a DOM-_like_ tree via `domhandler`; adopting it as the primary parser
   would mean maintaining two different tree APIs mid-migration instead of
   one.
2. **One parser, one adapter.** linkedom's `Document`/`Element`/`Node` map
   cleanly onto the existing himalaya-shaped `Node` AST via a single adapter
   module (`src/component/html/parser.ts`), so every mapping converter
   (`mapping.ts`, `mapping.utils.ts`, `mapping.text.ts`, `mapping.table.ts`,
   `mapping.custom.ts`) is unchanged.
3. **htmlparser2 is only in the tree transitively** (via `sanitize-html`),
   and ADR-0002's plan removes `sanitize-html` in favour of an inline
   allow-list sanitizer. Picking htmlparser2 as the primary parser would mean
   keeping a dependency the plan is otherwise dropping.
4. `parse5` was not benchmarked directly — its well-known trade-off (most
   spec-correct, slower, heavier, jsdom-oriented) did not justify installing
   it just to confirm it loses on ergonomics too.

## Consequences

**Positive**

- ✅ `himalaya` and `src/himalaya.d.ts` are removed; `package.json` no
  longer pins an unmaintained, untyped dependency.
- ✅ `src/component/html/parser.ts` is the only module that imports
  `linkedom` for AST construction; `parse()`/`stringify()` reproduce the
  himalaya `Node` shape (`type`, `tagName`, `attributes: {key, value}[]`,
  `children`) for every existing test and the 30-fixture differential
  snapshot suite (`rss-feed.snapshot.test.ts`), with the exceptions noted
  below.
- ✅ Attribute values are extracted as raw source text from linkedom's own
  re-serialisation (`element.outerHTML`), not via `Attr#value`. The DOM API
  decodes entities on read (`&quot;` and a literal `"` both come back as
  `"`), which himalaya's char-level tokeniser never did. Reading from
  linkedom's serialisation (always well-formed: double-quoted, embedded
  quotes re-escaped to `&quot;`) preserves entities the same way himalaya
  did, without hand-rolling a decoder — and structurally eliminates the
  single-to-double-quote attribute rewriting bug fixed in the hotfix branch.

**Negative / Trade-offs**

- ⚠️ linkedom is ~2.2× slower than htmlparser2 on a large fixture. Not a
  bottleneck at current scale; worth revisiting if the library moves into a
  high-throughput path.
- ⚠️ linkedom is a single-maintainer project. Bus-factor risk is real;
  mitigated by the fact that `parser.ts` is a thin adapter — swapping the
  underlying parser again would be a one-file change.

**Three linkedom-specific quirks required small fixes** (all in `parser.ts`
and `mapping.ts`, covered by the existing test suite — no test was modified):

- linkedom's tokeniser splits text into multiple sibling `Text` nodes at
  decoded-entity boundaries (`"a &amp; b"` → three nodes); fixed with
  `document.normalize()`.
- A decoded `&nbsp;`/`&#160;` (U+00A0) is real Unicode whitespace to
  `String.trim()`, so naive re-decoding made it vulnerable to silent
  stripping at text-node boundaries. Fixed by re-escaping U+00A0 to
  `&#160;` on serialisation, and by using an ASCII-only whitespace class in
  the few spots that interpolate node text directly instead of going through
  `stringify()`.
- A bare boolean attribute (`<input disabled>`) is indistinguishable from
  `disabled=""` once through the DOM (`Attr#value` normalises both to `''`);
  recovered by detecting the explicit-`=` form directly from the serialised
  opening tag, matching himalaya's `null`-for-bare convention.

**Known, accepted divergence: pre-existing double-decode bug**

4 of 30 fixture snapshots (`culturedmag.rss`, `discover-britain.rss`,
`veganfoodandliving.rss`, `wccftech.rss`) still diverge. Root cause: `buildItem`
in `rss-feed.ts` calls `he.decode(rawContent)` on the entire
`content:encoded` HTML string **before** any HTML parsing happens. When a
source attribute value is legitimately double-escaped (e.g.
`alt="...&quot;9006&quot;..."`), this premature decode turns it into
`alt="...."9006"...."` — literal, unescaped quotes inside an already-quoted
attribute — before either parser ever sees it.

Both parsers produce garbage for this malformed input; they simply produce
_different_ garbage. Reproducing himalaya's specific undefined behaviour
byte-for-byte would mean hand-porting its char-level tokeniser's incidental
quirks — effectively un-deleting the dependency this ADR removes. The real
fix is to stop decoding `content:encoded` before it is parsed as HTML;
tracked as a follow-up, out of scope for this parser swap.

## Verification

- `npm test`: all non-snapshot-affected tests pass unmodified; the
  differential snapshot suite passes for 26/30 fixtures byte-for-byte, with
  the 4 known exceptions above.
- `npm run lint`, `npm run build`: clean.
- No test file was edited to land this change.
