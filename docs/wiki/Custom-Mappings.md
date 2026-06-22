# Custom Mappings

Mappings tell Canvasflow how to recognise an HTML element as a specific component instead of skipping it or applying the default rules. They are supplied through a `Params` object passed to `RSSFeed` or `HTMLMapper.toComponents()`. This page documents the model with worked examples.

← Back to [Home](Home.md) · Related: [HTML Mapping](HTML-Mapping.md) · [Component Types](Component-Types.md)

## Params

| Property              | Required | Description                                                                      |
| --------------------- | -------- | -------------------------------------------------------------------------------- |
| `mappings`            | No       | Component mappings — how to detect components from HTML.                         |
| `excludes`            | No       | Base mappings (`match` + `filters` only); matches are removed with all children. |
| `ignoreParagraphWrap` | No       | When `true`, extracted text is not wrapped in paragraph tags.                    |

> Elements can also be excluded directly in the HTML with the `data-cf-ignore` attribute.

## Base mapping

Every mapping shares these foundational fields:

| Property     | Required | Description                                                                      |
| ------------ | -------- | -------------------------------------------------------------------------------- |
| `match`      | Yes      | How many filters must match: `any` or `all`.                                     |
| `filters`    | Yes      | The list of [filters](#filters) identifying the element.                         |
| `properties` | No       | An arbitrary object copied verbatim onto the resulting component's `properties`. |
| `name`       | No       | An optional label (identification only; not used for matching).                  |

## Filters

Three filter types are available.

### Tag filter

```json
{ "type": "tag", "items": ["section"] }
```

### Class filter

```json
{ "type": "class", "match": "any", "items": ["cf-columns"] }
```

`match` is one of `any` (at least one class present), `all` (every class present, any order), or `equal` (exactly those classes and nothing else, order-independent).

### Attribute filter

The attribute filter has two forms, both keyed by `type: "attribute"`:

**Exact-value** — matches when the attribute equals `value` (use `null` for valueless boolean attributes):

```json
{ "type": "attribute", "key": "data-component", "value": "gallery" }
```

**Pattern** — matches when the attribute is present and its value matches a regular expression (when `pattern` is present, `value` is ignored). An invalid pattern is treated as a non-match rather than throwing:

```json
{ "type": "attribute", "key": "id", "pattern": "^article-body-\\d+$" }
```

## Match modes

`match: "any"` means a single filter matching is enough; `match: "all"` requires every filter to match.

## Component mappings

Each component mapping extends the base mapping with a `component` field. Some types need extra sub-mappings:

| `component`      | Extra property | Notes                                                                                                          |
| ---------------- | -------------- | -------------------------------------------------------------------------------------------------------------- |
| `container`      | —              | Groups child components into one unit.                                                                         |
| `recipe`         | —              | Like `container` plus a `url`; the page should expose an LD+JSON recipe.                                       |
| `columns`        | `column`       | A sub-mapping describing each column.                                                                          |
| `live_container` | `post`         | A sub-mapping describing each `live_post`.                                                                     |
| `gallery`        | `slide`        | A sub-mapping describing each slide; only valid image slides become items.                                     |
| `custom`         | —              | Preserves the matched element as raw/sanitized HTML instead of converting children.                            |
| _text type_      | —              | Any text type (`headline`, `body`, `crosshead`, `text1`–`text60`, …) — an alternative to the `role` attribute. |

Example — treat every `<section>` as a container:

```json
{
  "component": "container",
  "match": "all",
  "filters": [{ "type": "tag", "items": ["section"] }]
}
```

## Excludes

```json
{
  "excludes": [
    {
      "match": "any",
      "filters": [
        {
          "type": "class",
          "match": "any",
          "items": ["advertisement", "newsletter-signup"]
        }
      ]
    }
  ]
}
```

## Validation

`Params`/`Mapping` are validated with Zod schemas ([`mapping/Mapping.schema.ts`](../../src/component/mapping/Mapping.schema.ts)). The exported helpers `isValidParams()`, `isValidMapping()`, and `validateParams()` (and the static `RSSFeed.validateParams()`) reuse those schemas. See [API Reference](API-Reference.md).
