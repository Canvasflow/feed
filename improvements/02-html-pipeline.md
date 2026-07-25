# 02 — HTML Pipeline Unification (parse once, transform one tree)

> **Status: partially done, carried over from Section 1.** The parser swap
> (himalaya + sanitize-html → linkedom) landed as part of the
> [01-dependency-diet.md](01-dependency-diet.md) work (ADR-0002, ADR-0004;
> commits through `9a0388f`) because the two efforts shared the same seam.
> The dependency removal is complete; the actual "parse once, one tree"
> outcome this document is named for is **not** — see the checklist below.

## Completion checklist

- [x] An ADR exists choosing the single HTML parser (linkedom vs htmlparser2 vs parse5) with benchmark + malformed-input comparison data. _(ADR-0004: benchmark table ms/iter for all three parsers; 12 synthetic malformed-HTML cases + real fixture verification)_
- [x] `himalaya` and `sanitize-html` are gone; every parse in the codebase goes through `linkedom`, either via the `src/component/html/parser.ts` adapter (`parse`/`stringify`, the `Node[]` AST) or `linkedom`'s own `parseHTML` (DOM pre-processing in `html-mapper.ts`). _(ADR-0002)_
- [ ] `HTMLMapper.toComponents()` parses the input HTML **exactly once**; all pre-processing (anchor extraction, paragraph splitting, href sanitization, breakline removal) operates on that one tree. _(Not done — still 3 separate `linkedom` parses per call: `sanitizeInvalidAnchorHrefs`, `preprocessHTML`, then the "real" `parse()`. Single-parser now, but not single-parse.)_
- [ ] No converter serializes a node back to an HTML string only to re-parse it. _(Not done — `sanitizeNode` in `mapping.utils.ts` still does `stringify([node])` → `sanitizeHTML()`, and `sanitizeHTML` re-parses that string via `parse()`. Same round trip as before, just one parser doing both ends instead of two.)_
- [ ] Sanitization is implemented as allow-list serialization directly over the internal `Node` AST (no intermediate string), with the same policies as today (`allowedTags`, `textAllowedTags`+attrs, `allowedFigcaptionTags`). _(`src/component/html/sanitize-html.ts` exists and is AST-driven internally, but its public signature is still `(html: string) => string` — call sites hand it a string produced by `stringify()`, so the round trip above persists at every one of the ~24 remaining call sites across `mapping.utils.ts` and the mapping modules.)_
- [ ] `getRootElement` scoping works on the already-parsed tree instead of re-stringifying the root and re-parsing it in `buildItem`. _(Not done — `HTMLMapper.getRootElement` in `html-mapper.ts` still returns a `string`; `rss-feed.ts`'s `buildItem` substitutes that string back into `contentEncoded`, which `toComponents` then re-parses from scratch.)_
- [ ] Tree transforms no longer mutate shared nodes in place (or an ADR documents why controlled mutation is safe). _(Not done — `getCredit` (`mapping.utils.ts:363`) still does `node.children = node.children.reduce(...)` in place, and `mapEmptyText`/`reduceEmptyTextNode` (`html-mapper.ts`, `mapping.ts`) still mutate `node.content`/`node.children` on the nodes they're passed rather than returning new ones.)_
- [x] Differential snapshots over all fixture feeds show no unexplained component output changes. _(661 tests pass; the 4 fixture divergences from the Section 1 parser swap are documented and explained in ADR-0004 — see `01-dependency-diet.md`.)_
- [ ] The regex-quote rewrite hack in `HTMLMapper.getRootElement` (`.replace(/=('([^']*)')/g, '="$2"')`) is gone. _(Still present at `html-mapper.ts:33-37` — it survived the parser swap because `getRootElement` still stringifies its result.)_

## Overview

Section 1 already replaced the parser underneath this pipeline — every parse
in the codebase now goes through `linkedom`, via one of two seams:
`src/component/html/parser.ts` (`parse`/`stringify`, producing the same
flat `Node[]` AST the mapping engine consumes — himalaya's replacement) and
`src/component/html/sanitize-html.ts` (an inline allow-list serializer —
`sanitize-html`'s replacement). `himalaya`, `sanitize-html`, and their
transitive deps (`postcss`, `deepmerge`, `parse-srcset`, `launder`, `dayjs`)
are gone from `package.json`. That work is done and paid off the dependency
goal in full.

What it did **not** do is collapse the pipeline down to one parse pass or
remove the serialize→re-parse boundaries — those were explicitly out of
scope for the dependency swap and are what's left of this section's actual
goal. One item's `content:encoded` today travels through:

```
string
 → decodeEntities (he)                        (RSSFeed.buildItem)
 → linkedom parse (via parser.ts) → stringify  (getRootElement, if root mapping)  + regex quote-fix
 → regex removeBreaklines                     (HTMLMapper.toComponents)
 → linkedom parseHTML → mutate → serialize     (sanitizeInvalidAnchorHrefs)
 → linkedom parseHTML → mutate → serialize     (preprocessHTML: anchors + p-splitting)
 → linkedom parse (via parser.ts)              (the "real" parse)
 → per node: stringify (via parser.ts) → sanitizeHTML (parse again via parser.ts) → string
```

It's one parser now instead of three, so there's no more cross-parser
error-recovery disagreement (the original motivation for the quote-fix
regex) — but the regex is still there because nothing removed the
stringify→re-parse boundary itself, only changed what sits on both sides of
it. Five-plus full parses and two serialize→re-parse round trips remain per
item; this is still the main performance cost per item and the place where
a pre-processing step's serialization can silently reshape markup the next
pass reads back in.

Target architecture (unchanged from before Section 1 — this is what's left):

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
internal `Node` AST — it survives intact and is untouched by any of this.
What changes is everything before and after it: today's pre-processing
(`sanitizeInvalidAnchorHrefs`, `preprocessHTML`) uses `linkedom`'s own DOM
API directly (`querySelectorAll`, `replaceWith`, `cloneNode`) rather than the
internal `Node` AST, which is why it still needs its own parse/serialize
round trip instead of composing with the rest of the pipeline as a pure
`Node[] → Node[]` pass.

## Files to review

- `src/component/html/parser.ts` — the `linkedom`-backed `parse`/`stringify` adapter seam that replaced himalaya (Section 1); this is where a `parseHtml`-once contract would need to be enforced
- `src/component/html/sanitize-html.ts` — the AST-driven `sanitizeHTML(html, options)` that replaced `sanitize-html`; still string-in/string-out, which is why `sanitizeNode` round-trips into it
- `src/component/html/html-mapper.ts` — `toComponents`'s three-parse gauntlet (`sanitizeInvalidAnchorHrefs`, `preprocessHTML`, then `parse()`), and `getRootElement`'s stringify + quote-fix regex
- `src/component/mapping/mapping.ts` — `reduceEmptyTextNode` (in-place mutation), `getRootElement` (tree-based lookup, already takes `Node[]` — only the `html-mapper.ts` caller re-stringifies its result), `reduceComponents`
- `src/component/mapping/mapping.utils.ts` — `sanitizeNode`/`sanitizeContentHtml` (the `stringify` → `sanitizeHTML` re-parse), `fromFigcaption`, `getCredit` (in-place `node.children` mutation), `processTextLinks`
- `src/component/mapping/mapping.media.ts`, `mapping.container.ts`, `mapping.embeds.ts`, `mapping.custom.ts` — every `sanitizeContentHtml`/`sanitizeNode` call site (~24 across the mapping modules)
- `src/component/node/node-helpers.ts` — the AST + traversal reducers any new passes build on
- `src/component/mapping/mapping.constants.ts` — the three sanitization allow-lists (`allowedTags`, `textAllowedTags`, `allowedFigcaptionTags`)
- `src/rss/rss-feed.ts` — `buildItem`'s `getRootElement` string round-trip (line ~490)
- ADR-0002 and ADR-0004 (`docs/adr/`) — record the parser decision already made; read before proposing a different one
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

1. ~~**Understand the current gauntlet (1 day).**~~ **Done** — see the
   Overview above; the gauntlet is now single-parser but still
   multi-parse, and the specific boundaries that remain are enumerated in
   the completion checklist.
2. ~~**Parser bake-off (1 day).**~~ **Done** — ADR-0004 has the linkedom /
   htmlparser2 / parse5 benchmark table and the 12-case malformed-HTML
   comparison; linkedom won and is already the sole parser in the tree.
3. **AST transform patterns (½ day).** Read the Babel handbook transform
   chapter. Learn: passes as pure `Node[] → Node[]` functions, structural
   sharing vs deep copy, and why order of passes matters. _(Still relevant —
   `sanitizeInvalidAnchorHrefs`/`preprocessHTML` use `linkedom`'s DOM API
   directly, not the internal `Node` AST, which is exactly the "not a pure
   tree pass yet" gap this reading targets.)_
4. **Sanitization-as-serialization (½ day).** Read sanitize-html's policy
   semantics for the three policies used here, then spec a
   `serializeSanitized(node, {allowedTags, allowedAttributes}): string` (or
   `Node`) that takes the AST **node directly** — not a pre-stringified
   HTML string like today's `sanitizeHTML(html, options)` — including text
   escaping (`&`, `<`, `>`, quotes in attrs) and void elements.

## Actionable plan

> Prerequisite: differential snapshots from [06-testing.md](06-testing.md).
> ~~Coordinates with [01-dependency-diet.md](01-dependency-diet.md) — the
> parser ADR lives here.~~ Section 1 is complete; steps 1, 2, and 4 below
> shipped as part of that work. What's left is steps 3, 5, 6, and 7.

1. ~~**Write the parser ADR** using the bake-off data (study step 2).~~
   **Done** — ADR-0004.
2. ~~**Introduce an adapter seam.**~~ **Done** — `src/component/html/parser.ts`
   exposes `parse(html: string): Node[]` and `stringify(nodes: Node[]):
string`. It is the only module that imports `linkedom` for the AST path
   (the DOM pre-processing functions in `html-mapper.ts` import `linkedom`
   directly for `parseHTML`/`querySelectorAll`, which is a second,
   un-enforced import point worth revisiting in step 3 below — there is no
   `no-restricted-imports` lint rule for it yet).
3. **Port pre-processing to tree passes**, one at a time, each behind the
   existing tests + snapshots. This is the main remaining work:
   - `sanitizeInvalidAnchorHrefs` → walk the `Node[]` tree, rewrite `href`
     attributes (reuse `isValidHref` as-is) instead of `linkedom`'s
     `parseHTML` + `querySelectorAll('a[href]')` + `document.toString()`.
   - `extractAnchorsWithImagesDOM` → pure pass hoisting `a[img]` out of
     `p/h1–h6` parents, instead of `linkedom` DOM mutation
     (`replaceWith`/`cloneNode`).
   - `splitParagraphImagesDOM` → pure pass splitting text-tag nodes around
     `img` children (one generic pass instead of looping over
     `['p','h1',...,'h6']`, as it still does today).
   - `removeBreaklines` + `reduceEmptyTextNode` → a single whitespace
     normalization pass at parse time; also fix `reduceEmptyTextNode`'s
     in-place `node.content =` mutation while touching it (checklist item).
   - Once all four are `Node[] → Node[]` passes, `toComponents` collapses
     to exactly one `parse()` call feeding a pipeline of passes —
     satisfying the "parses exactly once" checklist item without any
     further parser change.
4. ~~**Swap the parser inside the seam** to the ADR winner; delete himalaya
   and its shim.~~ **Done** — himalaya, `sanitize-html`, and
   `src/himalaya.d.ts` are gone; the 4 snapshot divergences from the swap
   are recorded in ADR-0004.
5. **Replace sanitize round-trips.** `sanitizeHTML` in
   `src/component/html/sanitize-html.ts` already sanitizes over the AST
   internally, but its signature (`(html: string, options) => string`)
   forces every caller through `stringify([node])` first. Change the
   entry point to accept a `Node`/`Node[]` directly
   (`serializeSanitized(node, {allowedTags, allowedAttributes})`) with the
   same three policies from `mapping.constants.ts`
   (+ the `transformTags.a` link-rewriting behavior of `processTextLinks` as a
   pre-pass). Migrate the ~24 `sanitizeNode`/`sanitizeContentHtml`/
   `processTextLinks` call sites in `mapping.utils.ts`, `mapping.media.ts`,
   `mapping.container.ts`, `mapping.embeds.ts`, and `mapping.custom.ts`.
6. **Fix `getRootElement` scoping**: `HTMLMapper.getRootElement` currently
   parses, scopes, then `stringify`s the result back to a string (with the
   quote-fix regex to compensate for the round trip); `buildItem` in
   `rss-feed.ts` then hands that string to `toComponents`, which re-parses
   it. Change the seam so the parsed/scoped tree (or the scoping mapping)
   flows into `toComponents` directly; delete the quote-fix regex.
7. **Kill in-place mutation** in `getCredit` (`mapping.utils.ts:363`),
   `reduceEmptyTextNode` (`mapping.ts`), and `mapEmptyText`
   (`html-mapper.ts`), and validate with a test that a `Node[]` input is
   deep-equal before/after `toComponents` (referential transparency guard).
8. **Run the full fixture corpus + fuzz tests**; reconcile every snapshot
   change; update `docs/wiki/HTML-Mapping.md` and `Architecture.md`.
