# ADR-0007: Throw-surface inventory

**Status:** Accepted  
**Date:** 2026-07-25

## Context

Section 3 of the improvement plan commits the library to a no-throw contract:
_give me any string and any config, and I will always give you back an `RSS`
object with structured errors — I will never throw, hang, or make a network
call you didn't ask for._

Before fixing anything, every call site that can throw must be listed,
classified by risk, and agreed upon as the authoritative starting point. This
ADR is that list. Each subsequent fix in Section 3 will reference it.

The inventory was produced by grepping `src/` for `throw`, `new URL(`,
`JSON.parse`, `parseInt`, and dependency entry points
(`XMLParser.parse`, `parse()` from the HTML parser seam), then reading each
call site to classify it.

---

## Throw sites

### 1 — `XMLParser.parse()` in the `RSSFeed` constructor

**File:** `src/rss/rss-feed.ts:95`  
**Risk:** Critical — reachable on the very first API call with any input

```ts
this.data = parser.parse(content);
```

`fast-xml-parser`'s `parse()` throws a `ParseError` when the XML is so
malformed that its tokenizer cannot recover. The call happens in the
constructor before the `rss` object is fully initialised, so the caller has no
`RSS` value to inspect — they just get an unhandled exception.

**Fix target (Section 3, item 1):** wrap in `try/catch`; store a
`parse-error` `FeedIssue` and leave `this.data` as an empty object.

---

### 2 — `new URL(link)` in `build()`

**File:** `src/rss/rss-feed.ts:265`  
**Risk:** High — common in real feeds; any link without a protocol throws

```ts
const url = new URL(link);
this.origin = url.origin;
```

`new URL('google.com')` throws `TypeError: Invalid URL`. Publisher feeds
frequently omit the protocol or use relative links in the channel `<link>`.

**Fix target (Section 3, item 2):** replace with `URL.canParse(link)` guard;
skip `origin` extraction and record a warning if the link is invalid.

---

### 3 — `JSON.parse(content)` in `getRecipeFromUrl()`

**File:** `src/rss/rss-feed.ts:127`  
**Risk:** Medium — reachable only via the network I/O path, but JSON-LD
scripts in the wild frequently contain invalid JSON

```ts
const parseContent = JSON.parse(content);
```

Any invalid JSON in a `<script type="application/ld+json">` block throws
`SyntaxError`.

**Fix target (Section 3, item 6 — network I/O extraction):** when the network
I/O is extracted to its own module, this `JSON.parse` must be wrapped in
`try/catch`; malformed JSON-LD should be silently skipped (the document may
have multiple LD+JSON blocks and only one needs to be a `Recipe`).

---

### 4 — `new URL(src)` in `fromIframe()`

**File:** `src/component/mapping/mapping.media.ts:883`  
**Risk:** Medium — any `<iframe src="…">` where `src` is not a valid absolute
URL throws

```ts
const url = new URL(src);
```

The preceding code normalises a `//`-prefixed src to `https:…`, but many
other malformed values (e.g. bare paths, whitespace, CMS tokens) still reach
this call unguarded.

**Fix target (Section 3, item 2 scope — `build()` never throws):** wrap in
`URL.canParse` guard and return `null` for un-parseable src values, consistent
with the existing `!src` early-return above it.

---

### 5 — `new URL(url, origin)` in `mapMediaContent()`

**File:** `src/rss/rss-feed.ts:921`  
**Risk:** Low — only reached when `url` does not start with `http`/`https` and
`origin` is set; most real feeds use absolute media URLs

```ts
url = new URL(url, origin).href;
```

A truly malformed relative path (e.g. `%gh`) throws on some runtimes even
when a base origin is supplied.

**Fix target (Section 3, item 2):** wrap in `URL.canParse(url, origin)` guard;
leave `url` unchanged and push a warning if it fails.

---

### 6 — `new URL(attributes.get('cite') || '')` in `mapping.ts`

**File:** `src/component/mapping/mapping.ts:345`  
**Risk:** Low-medium — reached whenever a `<blockquote cite="">` (empty cite)
or `<blockquote cite>` (bare attribute) appears in content; `new URL('')`
always throws

```ts
const tiktokComponent = toTikTok(new URL(attributes.get('cite') || ''));
```

The `|| ''` fallback was added to satisfy TypeScript but makes the throw
_certain_ when `cite` is absent or empty rather than preventing it.

**Fix target (Section 3, item 4 — HTML-pipeline no-throw):** add a
`URL.canParse` guard before constructing the URL; return a stub `TikTokComponent`
with an error entry when the cite is unparseable, consistent with what the
surrounding `!attributes.get('cite')` guard already does.

---

### 7 — `new URL(url)` in `toYoutubeFromAnchor()`

**File:** `src/component/mapping/mapping.embeds.ts:221`  
**Risk:** Low — only invoked for anchor nodes the pattern-matcher has already
identified as YouTube links; but the `|| ''` fallback produces a guaranteed
throw when `href` is absent

```ts
const url = attributes.get('href') || '';
const component = toYoutube(new URL(url));
```

**Fix target:** same pattern as site 6 — `URL.canParse` guard before
construction; return an error-annotated stub if parsing fails.

---

### 8 — `validateParams()` public API

**File:** `src/component/mapping/mapping.ts:520`  
**Risk:** Intentional — this function is documented as the throwing variant

```ts
export function validateParams(params: unknown): Params {
  const result = ParamsSchema.safeParse(params);
  if (!result.success) {
    throw new Error(result.error.message);
  }
  return result.data;
}
```

This is not a bug: `validateParams` is the public API surface that consumers
call when they want a hard failure. It is not on the `RSSFeed` code path.
`RSSFeed` uses `isValidParams` (non-throwing) and `RSSFeed.validateParams`
(the static method that returns an array of errors).

**Fix target:** none for the throw itself; Section 3 may rename or deprecate
this function if the `FeedIssue` model makes it redundant.

---

## Guarded sites (confirmed safe — no action needed)

| File                | Line                    | Call                             | Guard                                                              |
| ------------------- | ----------------------- | -------------------------------- | ------------------------------------------------------------------ |
| `html-mapper.ts`    | 293                     | `new URL(value)`                 | `try/catch` returning `false`                                      |
| `mapping.embeds.ts` | 51                      | `new URL(url)`                   | `try/catch` with error accumulation                                |
| `mapping.utils.ts`  | 136                     | `new URL('https:' + href)`       | `try/catch` returning original href                                |
| `rss-feed.ts`       | 341                     | `JSON.parse(this.toString(rss))` | structurally safe: input is the output of `JSON.stringify`         |
| `html-mapper.ts`    | 225                     | `throw new Error(...)`           | defensive guard; `parseHTML` never returns `null` in practice      |

> **Correction (2026-07-25):** this table originally also listed
> `mapping.media.ts` lines 924/939/954/966/981 (`new URL(searchParams.*)`) as
> "guarded" because each call sits behind a `.startsWith('https://…')` check.
> That assessment was wrong — `.startsWith` does not imply the string is a
> parseable URL: `new URL('https://www.youtube.com%')` throws even though it
> starts with `https://www.youtube.com`. Confirmed by direct reproduction.
> Removed from this table; see Resolution below — these five sites now carry
> an explicit `URL.canParse` guard alongside the `.startsWith` check.

---

## `parseInt` — silent NaN production (not throws, but correctness risk)

`parseInt` does not throw, but it returns `NaN` for non-numeric input. Several
call sites do not radix-10 or check for `NaN`:

| File               | Line                                 | Call                                             | Has radix? | Checks NaN? |
| ------------------ | ------------------------------------ | ------------------------------------------------ | ---------- | ----------- |
| `rss-feed.ts`      | 308                                  | `parseInt(\`${channel['sy:updateFrequency']}\`)` | No         | No          |
| `rss-feed.ts`      | 803                                  | `parseInt(\`${e['@_length']}\`, 10)`             | Yes        | No          |
| `rss-feed.ts`      | 608, 611, 615                        | thumbnail dimension parsing                      | Yes        | Yes ✓       |
| `mapping.media.ts` | 69, 75, 141, 142, 283, 289, 385, 390 | image dimension parsing                          | Yes        | Some        |

The missing radix on line 308 and the unchecked `NaN` on line 803 are minor
correctness issues to address as part of the `build()` never-throws work.

---

## Resolution (2026-07-25)

All eight numbered sites and the corrected `mapping.media.ts` entries above
are now fixed:

| Site                                                     | Fix                                                                                                          |
| ---------------------------------------------------------| -------------------------------------------------------------------------------------------------------------|
| 1 — constructor `XMLParser.parse()`                       | `try/catch`, `parse-error` string issue (fixed earlier; see `rss-feed.test.ts`)                              |
| 2 — `build()` channel `<link>`                            | `URL.canParse(link)` guard; warning on failure, `origin` extraction skipped                                  |
| 3 — `getRecipeFromUrl()` JSON-LD `JSON.parse`             | moved to `src/rss/recipe.ts`; wrapped in `try/catch`, malformed blocks skipped                                |
| 4 — `fromIframe()` src URL                                | `URL.canParse(src)` guard; falls back to `toCustom(node)`                                                    |
| 4b — `fromIframe()` searchParams (media.ts 924/939/954/966/981) | `URL.canParse` added to each `.startsWith(...)` condition; falls through to the next check / `toCustom` |
| 5 — `mapMediaContent()` relative URL                      | `URL.canParse(url, origin)` guard; `url` left unchanged and a warning is pushed on failure                    |
| 6 — `blockquote[cite]` TikTok                             | `URL.canParse(cite)` guard; returns an error-annotated `TikTokComponent` stub instead of throwing              |
| 7 — `toYoutubeFromAnchor()`                                | `URL.canParse(url)` guard; returns an error-annotated `YoutubeComponent` stub (verified by a direct unit test — the full pipeline neutralizes bad anchor hrefs to `"#"` before this function is ever reached, per `sanitizeInvalidAnchorHrefs`) |
| 8 — `validateParams()` public API                          | intentional throw, left as-is (documented, not on the `RSSFeed` path)                                          |

End-to-end verification: `src/rss/__tests__/rss-feed.fuzz.test.ts` builds
every one of these edge cases (plus 150 random XML-ish strings and 100
random `params`-shaped values) through the full `RSSFeed` lifecycle
(`constructor` → `validate()` → `build()`) and asserts none of them throw.
`parseInt` NaN correctness issues (lines 308, 803) remain open — they don't
throw, so they were out of scope for the no-throw contract, but are still
worth a follow-up pass.

---

## Decision

The throw surface is now fully inventoried. The priority order for Section 3
implementation follows risk level:

1. Constructor (`XMLParser.parse`) — Critical
2. `build()` channel link (`new URL`) — High
3. `fromIframe()` src URL — Medium
4. `getRecipeFromUrl()` JSON-LD (`JSON.parse`) — Medium (deferred to the
   network I/O extraction item)
5. `mapMediaContent()` relative URL — Low
6. `blockquote[cite]` + `toYoutubeFromAnchor` empty-href — Low

The `parseInt` NaN issues (lines 308, 803) will be fixed alongside item 2.
