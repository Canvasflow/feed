# 02 — HTML Pipeline Unification (parse once, transform one tree)

## Completion checklist

- [x] An ADR exists choosing the single HTML parser (linkedom vs htmlparser2 vs parse5) with benchmark + malformed-input comparison data. _(ADR-0004: benchmark table ms/iter for all three parsers; 12 synthetic malformed-HTML cases + real fixture verification)_
- [ ] `HTMLMapper.toComponents()` parses the input HTML **exactly once**; all pre-processing (anchor extraction, paragraph splitting, href sanitization, breakline removal) operates on that one tree.
- [ ] No converter serializes a node back to an HTML string only to re-parse it (today: `sanitizeNode` = himalaya `stringify` → sanitize-html re-parse, ×22 call sites).
- [ ] Sanitization is implemented as allow-list serialization over the internal `Node` AST (`serializeSanitized`), with the same policies as today (`allowedTags`, `textAllowedTags`+attrs, `allowedFigcaptionTags`).
- [ ] `getRootElement` scoping works on the already-parsed tree instead of re-stringifying the root and re-parsing it in `buildItem`.
- [ ] Tree transforms no longer mutate shared nodes in place (or an ADR documents why controlled mutation is safe) — e.g. `getCredit` and `reduceEmptyTextNode` mutate `node.children` today.
- [ ] Differential snapshots over all fixture feeds show no unexplained component output changes.
- [ ] The regex-quote rewrite hack in `HTMLMapper.getRootElement` (`.replace(/=('([^']*)')/g, '="$2"')`) is gone.

## Overview

Today one item's `content:encoded` travels through this gauntlet:

```
string
 → he.decode                                  (RSSFeed.buildItem)
 → himalaya parse + stringify                 (getRootElement, if root mapping)  + regex quote-fix
 → regex removeBreaklines                     (HTMLMapper.toComponents)
 → linkedom parse → mutate → serialize        (sanitizeInvalidAnchorHrefs)
 → linkedom parse → mutate → serialize        (preprocessHTML: anchors + p-splitting)
 → himalaya parse                             (the "real" parse)
 → per node: himalaya stringify → sanitize-html (htmlparser2 parse) → string
```

Three parsers, five+ full parses, and two serialize→re-parse boundaries where
each parser's error-recovery quirks can rewrite the markup differently
(the quote-style regex fix is a symptom of exactly this). This is the single
biggest source of edge cases the team currently maintains by hand, and the
main performance cost per item.

Target architecture:

```
string → parse once → Node tree
       → transform passes on the tree (pure functions Node[] → Node[]):
           1. drop comments / normalize whitespace text nodes
           2. sanitize invalid anchor hrefs (attribute rewrite)
           3. hoist <a><img> out of p/h1–h6
           4. split p/h* around <img> children
       → reduceComponents (existing engine, unchanged contract)
       → serializeSanitized(node, policy) wherever HTML strings are emitted
```

The mapping engine (`fromNode`, filters, converters) already works on the
internal `Node` AST — it survives intact. What changes is everything before
and after it.

## Files to review

- `src/component/html/html-mapper.ts` — the whole pre-processing gauntlet
- `src/component/mapping/mapping.ts` — `reduceEmptyTextNode`, `getRootElement`, `reduceComponents`
- `src/component/mapping/mapping.utils.ts` — `sanitizeNode`, `sanitizeContentHtml`, `fromFigcaption`, `getCredit` (in-place mutation), `processTextLinks`
- `src/component/mapping/mapping.media.ts`, `mapping.container.ts`, `mapping.text.ts`, `mapping.table.ts` — every `sanitizeNode`/`stringify` call site (~22 across the mapping modules)
- `src/component/node/node-helpers.ts` — the AST + traversal reducers the new passes build on
- `src/component/mapping/mapping.constants.ts` — the three sanitization allow-lists
- `src/rss/rss-feed.ts` — `buildItem`'s `getRootElement` string round-trip
- Fixtures: `src/support/html/*.html`, `src/support/feeds/toms.html`, `theenglishhome.html`

## Resources

**Articles / blog posts**

- WHATWG HTML parsing spec, §13.2 (tokenizer + tree construction, error recovery): <https://html.spec.whatwg.org/multipage/parsing.html> — skim to understand _why_ different parsers disagree on malformed input
- `htmlparser2` docs + `domhandler`/`domutils`/`dom-serializer` ecosystem: <https://github.com/fb55/htmlparser2> (this trio is how you parse→transform→serialize with one parser)
- linkedom design write-up (Andrea Giammarchi): "linkedom: A JSDOM Alternative" <https://webreflection.medium.com/linkedom-a-jsdom-alternative-53dd8f699311>
- parse5 docs (the reference-quality WHATWG parser used by jsdom): <https://parse5.js.org>
- "Compilers are (AST) transformations" — any intro to multi-pass AST design; the Babel plugin handbook's transform section is an excellent free primer: <https://github.com/jamiebuilds/babel-handbook>
- sanitize-html's own policy docs (to replicate semantics): <https://github.com/apostrophecms/sanitize-html>

**Videos**

- "How Browsers Work: parsing" (any recent Chrome University / HTTP 203 episode on the HTML parser)
- Babel/AST transform talks — _"Master the Art of the AST"_ (Yonatan Mevorach) is a good conceptual match even though it's JS ASTs

**Books**

- _Crafting Interpreters_ (Nystrom) — ch. on scanning/parsing/visitors; the visitor/transform mindset maps directly to node passes
- _Refactoring_ (Fowler) — "Split Phase" is precisely this refactor

## Study guide

1. **Understand the current gauntlet (1 day).** Trace one fixture
   (`src/support/html/new-apple-intelligence…html`) through
   `toComponents` with a debugger; write down every parse/serialize boundary
   and what each pre-processing step actually changes in the markup.
2. **Parser bake-off (1 day).** Build a tiny harness that runs the ~30 fixture
   HTML bodies through linkedom, htmlparser2(+domhandler), and parse5;
   diff their serialized output and measure time/memory. Decision criteria:
   (a) closest to current himalaya behavior on your real fixtures,
   (b) maintained, (c) install weight, (d) ease of mapping to the existing
   `Node` type. _Note:_ htmlparser2's forgiving mode is closest in spirit to
   himalaya; parse5 is the most spec-correct; linkedom you already ship.
3. **AST transform patterns (½ day).** Read the Babel handbook transform
   chapter. Learn: passes as pure `Node[] → Node[]` functions, structural
   sharing vs deep copy, and why order of passes matters.
4. **Sanitization-as-serialization (½ day).** Read sanitize-html's policy
   semantics for the three policies used here, then spec your
   `serializeSanitized(node, {allowedTags, allowedAttributes})` to match —
   including text escaping (`&`, `<`, `>`, quotes in attrs) and void elements.

## Actionable plan

> Prerequisite: differential snapshots from [06-testing.md](06-testing.md).
> Coordinates with [01-dependency-diet.md](01-dependency-diet.md) — the parser
> ADR lives here.

1. **Write the parser ADR** using the bake-off data (study step 2).
2. **Introduce an adapter seam.** Create `src/component/html/parser.ts`
   exposing `parseHtml(html: string): Node[]` and `serialize(nodes: Node[]):
string`, implemented first with the _current_ himalaya so all call sites
   move to the seam with zero behavior change. TS practice: this is the only
   module allowed to import the parser package — enforce with an ESLint
   `no-restricted-imports` rule.
3. **Port pre-processing to tree passes**, one at a time, each behind the
   existing tests + snapshots:
   - `sanitizeInvalidAnchorHrefs` → walk the tree, rewrite `href` attributes
     (reuse `isValidHref` as-is).
   - `extractAnchorsWithImagesDOM` → pure pass hoisting `a[img]` out of
     `p/h1–h6` parents.
   - `splitParagraphImagesDOM` → pure pass splitting text-tag nodes around
     `img` children (one generic pass instead of 7 tag iterations).
   - `removeBreaklines` + `reduceEmptyTextNode` → a single whitespace
     normalization pass at parse time.
4. **Swap the parser inside the seam** to the ADR winner; delete himalaya and
   its shim; fix snapshot diffs one by one (each diff is a real behavioral
   decision — record intentional changes).
5. **Replace sanitize round-trips.** Implement `serializeSanitized` against
   the `Node` AST with the three existing policies from `mapping.constants.ts`
   (+ the `transformTags.a` link-rewriting behavior of `processTextLinks` as a
   pre-pass). Migrate the ~22 `sanitizeNode`/`sanitizeContentHtml`/
   `processTextLinks` call sites, then drop `sanitize-html` (see 01).
6. **Fix `getRootElement` scoping**: `buildItem` should pass the parsed tree
   (or the scoping mapping) into `toComponents` rather than stringify → decode
   → re-parse; delete the quote-fix regex.
7. **Kill in-place mutation** in `getCredit`, `reduceEmptyTextNode`,
   `mapEmptyText`, and validate with a test that a `Node[]` input is deep-equal
   before/after `toComponents` (referential transparency guard).
8. **Run the full fixture corpus + fuzz tests**; reconcile every snapshot
   change; update `docs/wiki/HTML-Mapping.md` and `Architecture.md`.
