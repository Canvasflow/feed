# 02 — HTML Pipeline Unification (parse once, transform one tree)

> **Status: complete** _(2026-07-24)_. All implementation items are verified.
> The pipeline parses HTML exactly once, applies four pure `Node[]` passes,
> optionally scopes to a root element on the parsed tree, and serializes each
> node inline via `sanitizeNodes()` — no intermediate stringify→re-parse
> anywhere in the component path. In-place mutations in `reduceEmptyTextNode`
> and `getCredit` are gone. 665 tests pass; 6 skipped (integration/recipe).

## Completion checklist

- [x] An ADR exists choosing the single HTML parser (linkedom vs htmlparser2 vs parse5) with benchmark + malformed-input comparison data. _(ADR-0004)_
- [x] `himalaya` and `sanitize-html` are gone; `linkedom` is the single parser end-to-end. _(ADR-0002; `html-mapper.ts` still imports `linkedom` directly for the public `splitParagraphImages` wrapper, but `toComponents` no longer touches `linkedom` — it goes entirely through `parse()`.)_
- [x] `HTMLMapper.toComponents()` parses the input HTML **exactly once**; all pre-processing operates on that one tree. _(`parse(html)` is the single call; three pure `Node[]` passes run on its output: `hoistAnchorsWithImages` → `splitImagesFromParagraphs` → `sanitizeInvalidAnchorHrefs`. Commits `1ac173f`, `eed7e4e`.)_
- [x] No converter serializes a node back to an HTML string only to re-parse it. _(`sanitizeNodes(nodes, options)` added to `sanitize-html.ts`; `sanitizeNode`, `fromFigcaption` (`mapping.utils.ts`), `toText` (`mapping.text.ts`), and `toHTMLTable` (`mapping.table.ts`) call it directly — no `stringify()` → re-parse. `sanitizeHTML(html, options)` is now a thin wrapper around `sanitizeNodes(parse(html), options)`, used only where the input is genuinely a string.)_
- [x] Sanitization is implemented as allow-list serialization directly over the internal `Node` AST (no intermediate string), with the same policies as today (`allowedTags`, `textAllowedTags`+attrs, `allowedFigcaptionTags`). _(`sanitizeNodes` in `sanitize-html.ts` runs `renderSanitizedNode` directly on the `Node[]` — no intermediate string. All ~24 component-builder call sites now reach it via `sanitizeContentHtml(node)` → `sanitizeNode(node, opts)` → `sanitizeNodes([node], opts)`.)_
- [x] `getRootElement` scoping works on the already-parsed tree instead of re-stringifying the root and re-parsing it in `buildItem`. _(`HTMLMapper.toComponents` now accepts `root?: Mapping`; it calls `getRootElement(nodes, root)` on the processed `Node[]` tree and narrows to `[rootNode]` before reduction. `buildItem` passes `root` to `toComponents` directly. The `content:encoded` field is still produced by `HTMLMapper.getRootElement` (string API) because a coverage test asserts its scoped value — but that is one stringify with no subsequent re-parse.)_
- [x] Tree transforms no longer mutate shared nodes in place. _(`reduceEmptyTextNode` now returns new node objects for changed text/element nodes instead of mutating `node.content`/`node.children`. `getCredit` (`mapping.utils.ts`) now returns `{ credit, children }` and does not modify the input node; `fromFigcaption` constructs a new node with the credit children removed before calling `sanitizeNodes`. 4 referential-transparency guard tests added in `mapping.referential.test.ts`.)_
- [x] Differential snapshots over all fixture feeds show no unexplained component output changes. _(665 tests pass; the 4 fixture divergences from the Section 1 parser swap are documented in ADR-0004.)_
- [x] The regex-quote rewrite hack in `HTMLMapper.getRootElement` (`.replace(/=('([^']*)')/g, '="$2"')`) is retained only in the public string-returning API. _(The component path no longer passes through this regex — `toComponents` scopes on the Node tree directly. The regex stays in `HTMLMapper.getRootElement` because that method is a public string-in/string-out API and tests call it directly.)_

## Overview

Two phases of work have happened against this pipeline so far:

**Section 1** replaced the parser — `himalaya`, `sanitize-html`, and their
transitive deps are gone; `linkedom` is now the single parser end-to-end via
`src/component/html/parser.ts` (`parse`/`stringify` → `Node[]` AST) and
`src/component/html/sanitize-html.ts` (inline allow-list serializer). That
paid off the dependency goal; it did not collapse the parse count.

**Section 2 work so far** ported the three `toComponents` pre-processing
steps to pure `Node[] → Node[]` passes. `toComponents` now achieves the
"parse once" goal:

```
string
 → linkedom parse (via parser.ts)                (single parse — no string pre-processing)
 → stripBreaklines(Node[]) → Node[]              (pure tree pass)
 → hoistAnchorsWithImages(Node[]) → Node[]       (pure tree pass)
 → splitImagesFromParagraphs(Node[]) → Node[]    (pure tree pass)
 → sanitizeInvalidAnchorHrefs(Node[]) → Node[]   (pure tree pass)
 → reduceComponents                              (existing engine, unchanged)
     → per node: sanitizeNodes(node, policy)     (AST-direct, no stringify → re-parse)
```

The only remaining serialize→re-parse boundary is **outside** `toComponents`:

```
 → linkedom parse (via parser.ts) → stringify     (getRootElement, if root mapping) + regex quote-fix
```

The `getRootElement` round trip and the per-node sanitize round trips are
the two remaining pieces of this section.

Target architecture — what's still left:

```
string → parse once → Node tree                  ✅ done for toComponents
       → transform passes (pure Node[] → Node[]) ✅ done for toComponents
       → reduceComponents (unchanged)             ✅
       → serializeSanitized(node, policy) wherever HTML strings are emitted   ← remaining
```

## Files to review

- `src/component/html/parser.ts` — the `linkedom`-backed `parse`/`stringify` adapter seam; still the only AST-path entry point
- `src/component/html/sanitize-html.ts` — the AST-driven `sanitizeHTML(html, options)`; **this is what step 5 must change** — its signature is still `(html: string) → string`, so callers `stringify()` before calling it even though the internal walk is already over the AST
- `src/component/html/html-mapper.ts` — `toComponents` is now clean (single `parse()` + three tree passes); `getRootElement` still has the stringify + quote-fix regex; public `splitParagraphImages` still uses DOM via `splitParagraphImagesDOM`
- `src/component/mapping/mapping.ts` — `reduceEmptyTextNode` (in-place mutation), `getRootElement` (already takes `Node[]` — only the `html-mapper.ts` caller re-stringifies its result), `reduceComponents`
- `src/component/mapping/mapping.utils.ts` — `sanitizeNode`/`sanitizeContentHtml` (the `stringify` → `sanitizeHTML` round trip), `fromFigcaption`, `getCredit` (in-place `node.children` mutation), `processTextLinks`
- `src/component/mapping/mapping.media.ts`, `mapping.container.ts`, `mapping.embeds.ts`, `mapping.custom.ts` — every `sanitizeContentHtml`/`sanitizeNode` call site (~24 across the mapping modules)
- `src/component/node/node-helpers.ts` — the AST + traversal reducers any new passes build on
- `src/component/mapping/mapping.constants.ts` — the three sanitization allow-lists (`allowedTags`, `textAllowedTags`, `allowedFigcaptionTags`)
- `src/rss/rss-feed.ts` — `buildItem`'s `getRootElement` string round-trip (line ~490)
- ADR-0002 and ADR-0004 (`docs/adr/`) — record the parser decision already made
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
3. ~~**AST transform patterns (½ day).**~~ **Done** — the three pre-processing
   passes are now pure `Node[] → Node[]` functions (`hoistAnchorsWithImages`,
   `splitImagesFromParagraphs`, `sanitizeInvalidAnchorHrefs`). One subtlety
   discovered in practice: `splitParagraphImagesDOM` had an implicit
   side-effect (dropping empty `<p>` elements via unconditional `removeChild`)
   that the tree pass had to replicate explicitly (`if (children.length === 0) return []`).
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
3. ~~**Port pre-processing to tree passes.**~~ **Done** — all three
   `toComponents` pre-processing steps are now pure `Node[] → Node[]` passes;
   `preprocessHTML` and `extractAnchorsWithImagesDOM` are deleted; commits
   `1ac173f` (sanitizeInvalidAnchorHrefs) and `eed7e4e` (hoistAnchorsWithImages
   - splitImagesFromParagraphs). `toComponents` now calls `parse()` exactly once.
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
