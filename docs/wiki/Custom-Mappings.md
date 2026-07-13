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

### `container`

Groups matched child elements into a single container component. All children are converted normally and nested inside the resulting component.

| Field      | Required | Description                         |
| ---------- | -------- | ----------------------------------- |
| `component`| Yes      | Must be `"container"`.              |
| `match`    | Yes      | `"any"` or `"all"`.                 |
| `filters`  | Yes      | Filters identifying the container element. |
| `name`     | No       | Optional label for identification.  |
| `properties` | No     | Arbitrary object copied onto the component. |

```json
{
  "component": "container",
  "match": "all",
  "filters": [{ "type": "tag", "items": ["section"] }]
}
```

```html
<section>
  <h2>Section heading</h2>
  <p>Body text inside the container.</p>
</section>
```

### `recipe`

Marks the matched element as a recipe container. The page at the item's `url` is expected to expose LD+JSON recipe structured data. Children are converted the same way as `container`.

| Field      | Required | Description                         |
| ---------- | -------- | ----------------------------------- |
| `component`| Yes      | Must be `"recipe"`.                 |
| `match`    | Yes      | `"any"` or `"all"`.                 |
| `filters`  | Yes      | Filters identifying the recipe element. |
| `name`     | No       | Optional label for identification.  |
| `properties` | No     | Arbitrary object copied onto the component. |

```json
{
  "component": "recipe",
  "match": "all",
  "filters": [{ "type": "class", "match": "any", "items": ["recipe-block"] }]
}
```

```html
<div class="recipe-block">
  <p>Step one: preheat the oven.</p>
</div>
```

### `columns`

Splits a matched wrapper element into a multi-column layout. The required `column` sub-mapping identifies which direct children become individual columns.

| Field      | Required | Description                                                 |
| ---------- | -------- | ----------------------------------------------------------- |
| `component`| Yes      | Must be `"columns"`.                                        |
| `match`    | Yes      | `"any"` or `"all"` — applied to the outer wrapper.         |
| `filters`  | Yes      | Filters identifying the wrapper element.                    |
| `column`   | Yes      | Sub-mapping (`match` + `filters`) that selects each column child. |
| `name`     | No       | Optional label for identification.                          |
| `properties` | No     | Arbitrary object copied onto the component.                 |

`column` sub-mapping fields:

| Field     | Required | Description                                          |
| --------- | -------- | ---------------------------------------------------- |
| `match`   | Yes      | `"any"` or `"all"` — applied to each candidate child. |
| `filters` | Yes      | Filters identifying a column child.                  |

```json
{
  "component": "columns",
  "match": "all",
  "filters": [{ "type": "class", "match": "any", "items": ["columns-wrapper"] }],
  "column": {
    "match": "any",
    "filters": [{ "type": "class", "match": "any", "items": ["column"] }]
  }
}
```

```html
<div class="columns-wrapper">
  <div class="column"><p>Left column content.</p></div>
  <div class="column"><p>Right column content.</p></div>
</div>
```

### `live_container`

Identifies a live-blog wrapper and its individual posts. The required `post` sub-mapping selects which children become `live_post` components inside the container.

| Field      | Required | Description                                                    |
| ---------- | -------- | -------------------------------------------------------------- |
| `component`| Yes      | Must be `"live_container"`.                                    |
| `match`    | Yes      | `"any"` or `"all"` — applied to the outer wrapper.            |
| `filters`  | Yes      | Filters identifying the wrapper element.                       |
| `post`     | Yes      | Sub-mapping (`match` + `filters`) that selects each post child. |
| `name`     | No       | Optional label for identification.                             |
| `properties` | No     | Arbitrary object copied onto the component.                    |

`post` sub-mapping fields:

| Field     | Required | Description                                           |
| --------- | -------- | ----------------------------------------------------- |
| `match`   | Yes      | `"any"` or `"all"` — applied to each candidate child. |
| `filters` | Yes      | Filters identifying a post child.                     |

> If no children match the `post` sub-mapping, the resulting `live_container` component will carry a non-empty `errors` array.

```json
{
  "component": "live_container",
  "match": "all",
  "filters": [{ "type": "class", "match": "any", "items": ["live-blog"] }],
  "post": {
    "match": "any",
    "filters": [{ "type": "class", "match": "any", "items": ["live-post"] }]
  }
}
```

```html
<div class="live-blog">
  <div class="live-post"><p>First update.</p></div>
  <div class="live-post"><p>Second update.</p></div>
</div>
```

### `gallery`

Identifies an image gallery wrapper and its individual slides. The required `slide` sub-mapping selects which children become slide items. Only children that contain a valid image are kept; non-image slides are silently discarded.

| Field      | Required | Description                                                     |
| ---------- | -------- | --------------------------------------------------------------- |
| `component`| Yes      | Must be `"gallery"`.                                            |
| `match`    | Yes      | `"any"` or `"all"` — applied to the outer wrapper.             |
| `filters`  | Yes      | Filters identifying the wrapper element.                        |
| `slide`    | Yes      | Sub-mapping (`match` + `filters`) that selects each slide child. |
| `name`     | No       | Optional label for identification.                              |
| `properties` | No     | Arbitrary object copied onto the component.                     |

`slide` sub-mapping fields:

| Field     | Required | Description                                           |
| --------- | -------- | ----------------------------------------------------- |
| `match`   | Yes      | `"any"` or `"all"` — applied to each candidate child. |
| `filters` | Yes      | Filters identifying a slide child.                    |

```json
{
  "component": "gallery",
  "match": "all",
  "filters": [{ "type": "class", "match": "any", "items": ["image-gallery"] }],
  "slide": {
    "match": "any",
    "filters": [{ "type": "class", "match": "any", "items": ["gallery-slide"] }]
  }
}
```

```html
<div class="image-gallery">
  <div class="gallery-slide"><img src="https://example.com/photo1.jpg" alt="Photo 1"/></div>
  <div class="gallery-slide"><img src="https://example.com/photo2.jpg" alt="Photo 2"/></div>
</div>
```

### `custom`

Preserves the matched element as sanitized raw HTML rather than recursing into its children. Useful for embeds, ads, or any block whose internal markup should be kept verbatim.

| Field      | Required | Description                          |
| ---------- | -------- | ------------------------------------ |
| `component`| Yes      | Must be `"custom"`.                  |
| `match`    | Yes      | `"any"` or `"all"`.                  |
| `filters`  | Yes      | Filters identifying the element.     |
| `name`     | No       | Optional label for identification.   |
| `properties` | No     | Arbitrary object copied onto the component. |

```json
{
  "component": "custom",
  "match": "all",
  "filters": [{ "type": "class", "match": "any", "items": ["third-party-embed"] }]
}
```

```html
<div class="third-party-embed">
  <span data-widget="poll" data-id="42">Loading…</span>
</div>
```

### Text types

Any named text type or numbered slot can be used as the `component` value, overriding the default tag-based mapping. This is an alternative to adding a `role` attribute in the HTML source.

Named types: `headline`, `title`, `subtitle`, `intro`, `body`, `crosshead`, `byline`, `blockquote`, `footer`, `imagecaption`.

Numbered slots: `text1` through `text60`.

| Field      | Required | Description                                          |
| ---------- | -------- | ---------------------------------------------------- |
| `component`| Yes      | Any valid `TextType` (see list above).               |
| `match`    | Yes      | `"any"` or `"all"`.                                  |
| `filters`  | Yes      | Filters identifying the element.                     |
| `name`     | No       | Optional label for identification.                   |
| `properties` | No     | Arbitrary object copied onto the component.          |

```json
{
  "component": "crosshead",
  "match": "all",
  "filters": [{ "type": "class", "match": "any", "items": ["section-heading"] }]
}
```

```html
<!-- Rendered as a crosshead component instead of the default <p> → body mapping -->
<p class="section-heading">Chapter Two</p>
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
