# ADR-0002: Replace himalaya and sanitize-html with a linkedom-based parser and inline sanitization

**Status:** Accepted
**Date:** 2026-07-24

## Context

The HTML pipeline relied on two npm packages for its two main concerns:

**`himalaya` (pinned `1.1.1`)** — HTML string → `Node[]` AST. It was last
released in 2019, is unmaintained, and ships no TypeScript types. The project
kept a hand-written `src/himalaya.d.ts` shim with an explicit comment warning
that any version bump would silently break the types. The exact-version pin was
the only thing keeping the shim from becoming wrong without warning. It was the
highest-risk dependency in the tree.

**`sanitize-html` (`^2.x`)** — stripped disallowed tags and attributes to
produce the `html` field on text components and sanitized node subtrees during
the mapping pass. The package itself was reasonable, but its transitive
dependency tree pulled in `postcss`, `deepmerge`, `parse-srcset`, `launder`,
and `dayjs` — a second date library appearing nowhere in any `import` the team
wrote, adding ≈2 MB of install weight for something that amounted to "walk an
AST and drop unknown tags/attributes".

The library already depended on **`linkedom`** for DOM pre-processing
(`preprocessHTML`, `sanitizeInvalidAnchorHrefs`, `getRootElement`) and for
JSON-LD extraction. Running two HTML parsers on the same document (himalaya for
the mapping pass, linkedom for pre-processing) doubled parse cost and introduced
a subtle class of bugs: himalaya's `stringify()` emitted single-quoted
attributes when a value contained a literal `"`, and the subsequent
single-to-double-quote regex conversion in `getRootElement` corrupted those
attribute values — any merchant logo `alt` text of the form `'Product 43" TV'`
would become `alt="Product 43" TV"`, breaking HTML parsing downstream.

## Decision

**1. Replace himalaya with a purpose-built `src/component/html/parser.ts`**
that wraps linkedom and emits the identical `Node[]` AST shape himalaya
produced. This lets all mapping-layer code (`mapping.ts` and its `mapping.*.ts`
siblings) remain untouched — they consume `Node[]`, not himalaya directly.

The adapter's key design choice is `parseOpeningTagAttributes`: rather than
reading decoded values from `element.attributes` (where `&quot;` and a literal
`"` are indistinguishable), it parses the attribute list directly from
`element.outerHTML`. linkedom's serializer always emits well-formed HTML:
double-quoted attributes with any embedded `"` escaped back to `&quot;`. This
property eliminates the quote-corruption class of bug at source — no regex
rewriting is needed.

`src/himalaya.d.ts` is deleted. The exact-version pin is gone.

**2. Replace the `sanitize-html` npm package with `src/component/html/sanitize-html.ts`**
— an inline implementation of the same API surface the library was actually
using. Sanitizing a tree of typed `Node` objects — keeping allowed tags,
stripping disallowed ones or unwrapping them to their children, filtering
attributes against an allow-list — is straightforward once the pipeline owns
the AST; it does not require a separate package with its own parser,
CSS normalizer, and URL rewriter.

The inline implementation mirrors `sanitize-html`'s `defaults.allowedTags`,
`defaults.allowedAttributes`, `allowedEmptyAttributes`, and
`allowedSchemes`/`allowedSchemesAppliedToAttributes` exactly, so all callers
receive the same output as before.

`sanitize-html` and `@types/sanitize-html` are removed from `package.json`.

## Consequences

**Positive**

- ✅ `himalaya` and its maintenance risk are gone. The hand-written type shim
  (`src/himalaya.d.ts`) is deleted; the exact-version pin is gone.
- ✅ `sanitize-html`, `postcss`, `deepmerge`, `parse-srcset`, `launder`, and
  `dayjs` are all removed — the last three were transitive dependencies the
  project never asked for. The `dayjs` removal is particularly notable: the
  project is separately removing `luxon` (see improvements/01-dependency-diet.md);
  having two date libraries sitting in `node_modules` as incidental transitive
  deps was undesirable.
- ✅ `linkedom` is now the **single HTML parser** end-to-end. Pre-processing,
  root-element scoping, and the mapping pass all operate on the same DOM
  surface, eliminating the himalaya/linkedom dual-parse path.
- ✅ The quote-corruption bug in `getRootElement` (single-quoted attributes
  with embedded `"` corrupted by the regex rewrite) is structurally impossible
  in the new parser: `element.outerHTML` is always well-formed, so the
  attribute-rewrite step is never needed.
- ✅ All 645 tests pass and 6 intentionally skipped `integration`/`recipe`
  tests are unchanged.

**Negative / Trade-offs**

- ⚠️ The inline `sanitize-html.ts` owns the maintenance of its allow-lists and
  URL-scheme checks. If future publisher HTML requires an additional allowed
  attribute or scheme, the change goes here rather than being absorbed by an
  upstream update.
- ⚠️ `parseOpeningTagAttributes` in `parser.ts` parses the serialized opening
  tag with a character-by-character scan + regex. The approach is correct for
  well-formed HTML (which linkedom guarantees when re-serializing), but it is
  not a general-purpose HTML attribute parser — callers must not use it on
  arbitrary untrusted source text outside `fromDomNode`.
- ⚠️ The new `stringify()` in `parser.ts` stores decoded text in `TextNode.content`
  (unlike himalaya, which stored raw HTML source). Callers that previously
  relied on himalaya `TextNode` values being raw source text (entities
  un-decoded) may observe different values; the `escapeText()` helper is
  provided for the reverse direction. All existing callers were audited and
  updated.
