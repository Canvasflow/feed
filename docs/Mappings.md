# Mappings

By default, Canvasflow processes HTML content and, upon encountering a [Block-Level Content](https://developer.mozilla.org/en-US/docs/Glossary/Block-level_content) element such as a `<div>` or a [Semantic Element](https://developer.mozilla.org/en-US/docs/Glossary/Semantics#semantic_elements) (such as `<article>`, `<aside>`, or `<main>`), it ignores that element and begins evaluating its children until it finds content that matches a Canvasflow component.

A `Mapping` defines a set of rules established by the customer that tell Canvasflow how to identify whether an HTML element being evaluated should be treated as a specific Canvasflow component instead of being skipped or matched by the default rules.

Mappings are not limited to container components. A mapping can target any of the following component types:

- [Mappings](#mappings)
  - [Params](#params)
  - [Base Mapping](#base-mapping)
    - [Filters](#filters)
      - [Tag Filter](#tag-filter)
      - [Class Filter](#class-filter)
      - [Attribute Filter](#attribute-filter)
    - [Match](#match)
  - [How Mappings Are Evaluated](#how-mappings-are-evaluated)
  - [Component Mappings](#component-mappings)
    - [Container Mapping](#container-mapping)
    - [Recipe Mapping](#recipe-mapping)
    - [Columns Mapping](#columns-mapping)
    - [Live Container Mapping](#live-container-mapping)
      - [Live Post Component](#live-post-component)
    - [Gallery Mapping](#gallery-mapping)
    - [Custom Mapping](#custom-mapping)
    - [Text Mapping](#text-mapping)
  - [Excludes](#excludes)
  - [Properties](#properties)

## Params

Mappings are provided to Canvasflow through a `Params` object, which has the following structure:

| Property              | Required | Description                                                                                                                                                                            |
| :-------------------- | :------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mappings`            | No       | A list of [Component Mappings](#component-mappings) that tells Canvasflow how to detect components from HTML elements.                                                                 |
| `excludes`            | No       | A list of base [Mappings](#base-mapping) (only `match` and `filters`). Any HTML element that matches one of these mappings is removed from processing, along with all of its children. |
| `ignoreParagraphWrap` | No       | A boolean. When enabled, text content is not wrapped in paragraph tags during text extraction.                                                                                         |

> Elements can also be excluded directly from the HTML, without a mapping, by adding the `data-cf-ignore` attribute to the element.

## Base Mapping

Every mapping is built on the same foundational properties:

| Property     | Required | Description                                                                                                                                                                             |
| :----------- | :------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `match`      | Yes      | How many filters must match: [`any` or `all`](#match).                                                                                                                                  |
| `filters`    | Yes      | The list of [Filters](#filters) used to identify the HTML element.                                                                                                                      |
| `properties` | No       | An arbitrary object of key/value pairs. When the mapping matches, this object is attached as-is to the resulting component's `properties` field.                                        |
| `name`       | No       | An optional label for the mapping. It has no effect on matching; it exists for identification purposes. Available on [Component Mappings](#component-mappings) only, not on `excludes`. |

### Filters

Filters define which properties of an HTML element Canvasflow should look for. A list of filters must be provided to help Canvasflow identify the relevant properties of a given HTML element.

There are three types of filters available:

- [Tag Filter](#tag-filter)
- [Class Filter](#class-filter)
- [Attribute Filter](#attribute-filter)

#### Tag Filter

This filter identifies HTML elements based on their tag name.

| Property | Required | Description                                                                                                        |
| :------- | :------- | :----------------------------------------------------------------------------------------------------------------- |
| `type`   | Yes      | Must be `tag`.                                                                                                     |
| `items`  | Yes      | A list of tag names that Canvasflow should consider when determining whether an HTML element is a valid candidate. |

> In most cases, only one tag is needed.

```json
{
  "type": "tag",
  "items": ["section"]
}
```

#### Class Filter

This filter looks exclusively at the `class` attribute of an HTML element.

| Property | Required | Description                             |
| :------- | :------- | :-------------------------------------- |
| `type`   | Yes      | Must be `class`.                        |
| `match`  | Yes      | One of `any`, `all`, or `equal`.        |
| `items`  | Yes      | A list of class names to match against. |

`match` accepts one of three values:

- `any`: a match is valid as long as at least one of the specified classes is present in the element's class list.
- `all`: every specified class must be present, regardless of order.
- `equal`: a strict version of `all`, requiring the element's class list to contain exactly the specified classes and nothing else.

> If the element has no `class` attribute at all, a class filter never matches.

```json
{
  "type": "class",
  "match": "any",
  "items": ["cf-columns"]
}
```

#### Attribute Filter

This filter searches for a specific attribute within an HTML element. It comes in two forms — an **exact-value** match and a **pattern** match — both identified by `type: "attribute"`.

**Exact-value form**

Matches when the attribute's value is exactly equal to `value`.

| Property | Required | Description                                                                                                                                                                    |
| :------- | :------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`   | Yes      | Must be `attribute`.                                                                                                                                                           |
| `key`    | Yes      | The name of the attribute to look for.                                                                                                                                         |
| `value`  | Yes      | The exact value that attribute must have. It can be set to `null` to match attributes that are present without a value (boolean attributes such as `controls` or `data-live`). |

```json
{
  "type": "attribute",
  "key": "data-component",
  "value": "gallery"
}
```

**Pattern form**

Matches when the attribute is present and its value matches the supplied regular expression pattern. Use this when the attribute value is not fixed — for example when it carries a generated id, a numeric suffix, or a namespaced prefix.

| Property  | Required | Description                                                                                                                  |
| :-------- | :------- | :-------------------------------------------------------------------------------------------------------------------------- |
| `type`    | Yes      | Must be `attribute`.                                                                                                        |
| `key`     | Yes      | The name of the attribute to look for.                                                                                      |
| `pattern` | Yes      | A regular expression (as a string) that the attribute's value must match. The attribute must be present for a pattern match. |

> When a `pattern` property is present, the filter matches by regular expression and the `value` property is ignored. The pattern is evaluated with JavaScript's `RegExp`; remember to escape backslashes within the JSON string (e.g. `\\d`).

For example, to match a `<div>` whose `id` follows the pattern `article-body-<number>` (such as `article-body-42`):

```json
{
  "type": "attribute",
  "key": "id",
  "pattern": "^article-body-\\d+$"
}
```

Or to match any element whose `data-component-name` starts with the `Recirculation:` prefix (such as `Recirculation:ArticleRiver`):

```json
{
  "type": "attribute",
  "key": "data-component-name",
  "pattern": "Recirculation:.*"
}
```

### Match

Defines how many filters must match for an element to be considered a match for the mapping. This value can be either `any` or `all`.

- `any`: only one filter needs to match for the mapping to be considered valid.
- `all`: every filter must match; otherwise, the HTML element will be ignored.

## How Mappings Are Evaluated

When Canvasflow evaluates an HTML element, it follows this order:

1. **Exclusion**: if the element matches any mapping in `excludes`, or has the `data-cf-ignore` attribute, the element and all of its children are skipped.
2. **Built-in detection**: elements that Canvasflow detects natively take precedence over custom mappings. This includes social embeds (Instagram, Twitter/X, TikTok, YouTube), `<table>`, `<video>`, `<audio>`, `<iframe>`, buttons, images (`<img>`, `<picture>`, `<figure>`), and elements with `role="gallery"` or `role="mosaic"`.
3. **Custom mappings**: each mapping in `mappings` is evaluated **in the order provided**; the first mapping that matches wins, and the element is converted into the mapped component type.
4. **Default text rules**: if no mapping matched, the default tag-to-text-component table applies (`h1` → `headline`, `p` → `body`, etc.).
5. **Descend**: if none of the above applied, the element is ignored and its children are evaluated.

---

## Component Mappings

Every component mapping extends the [Base Mapping](#base-mapping) with a `component` property that tells Canvasflow which type of component is being mapped. Some types require additional properties, described below.

### Container Mapping

`component: "container"`

This is a general-purpose Container Component that groups child components sequentially into a single cohesive unit. It only requires a `match` and a `filters` property so that Canvasflow can recognize an HTML element as a container component rather than skipping it and evaluating its children.

The following is an example of basic HTML content containing a text component, an image, and another text component that should be grouped together.

```html
<section>
  <h1>This is a headline</h1>
  <img src="example.jpg" />
  <p>This is a body</p>
</section>
```

To detect this structure, the following mapping must be specified for the container:

```json
{
  "component": "container",
  "match": "all",
  "filters": [
    {
      "type": "tag",
      "items": ["section"]
    }
  ]
}
```

This mapping targets the `<section>` element and instructs Canvasflow to treat every `<section>` element found in the content as a container component.

---

### Recipe Mapping

`component: "recipe"`

This component is nearly identical to the [Container Component](#container-mapping). The only difference is an additional `url` property on the resulting component, which specifies the website from which the recipe referenced by this component originates.

> The URL provided should point to a page that includes an `LD+JSON` block describing the recipe.

The mapping structure is the same as the container component; only the `component` value changes from `container` to `recipe`.

> The URL will be identified using the `<link>` element present in the `<item>` at the RSS level. If needed, this value can be overridden within the Canvasflow editor.

---

### Columns Mapping

`component: "columns"`

This is a container component that arranges child elements side by side. It is essentially a group of groups of components.

In addition to the base properties, it requires:

| Property | Required | Description                                                                                                           |
| :------- | :------- | :-------------------------------------------------------------------------------------------------------------------- |
| `column` | Yes      | A sub-mapping (`match` + `filters`) that describes how to detect each individual column inside the columns container. |

Canvasflow handles columns by first locating the HTML element that matches the scope of the component. Within that scope, it searches all descendant nodes — not just direct children — for elements matching the column mapping. Those nodes are then flattened to the same level, and their children are processed sequentially.

The following example demonstrates a columns component. Canvasflow will look for nodes with the class `cf-column` and then process the elements contained within each one.

> This is not always the case, this is only applicable to the following example.

```html
<article>
  <div class="cf-columns">
    <div>
      <div class="cf-column">
        <h1>Column 0</h1>
      </div>
    </div>
    <div class="cf-column">Column 1</div>
    <div class="cf-column">
      <h2>Column 2</h2>
    </div>
    <div class="cf-column">
      <img src="example.jpg" alt="image in column 3" />
    </div>
    <section>
      <div>
        <div class="cf-column">
          <h3>Column 4</h3>
        </div>
      </div>
    </section>
  </div>
</article>
```

The following mapping detects the outer columns container using the class `cf-columns`, and specifies how to detect each individual column using the class `cf-column` via the `column` property.

> Note that the class names differ: the outer container uses `cf-columns` (with a trailing `s`), while each individual column uses `cf-column`.

```json
{
  "component": "columns",
  "match": "all",
  "filters": [
    {
      "type": "class",
      "match": "any",
      "items": ["cf-columns"]
    },
    {
      "type": "tag",
      "items": ["div"]
    }
  ],
  "column": {
    "match": "any",
    "filters": [
      {
        "type": "tag",
        "items": ["div"]
      },
      {
        "type": "class",
        "match": "any",
        "items": ["cf-column"]
      }
    ]
  }
}
```

As shown in the HTML example, `<div>` and `<section>` elements may appear between the `columns` container and the individual `column` elements. Be mindful of this when authoring content, as intermediate elements that do not match the column mapping may cause content to be missed.

---

### Live Container Mapping

`component: "live_container"`

This is a container component that represents an ongoing story that receives constant updates and posts in real time.

> This component type can only contain `live_post` components as children.

In addition to the base properties, it requires:

| Property | Required | Description                                                                                                |
| :------- | :------- | :--------------------------------------------------------------------------------------------------------- |
| `post`   | Yes      | A sub-mapping (`match` + `filters`) that describes how individual posts within the container are detected. |

The following is an example of HTML content that can be treated as a live container component:

```html
<section class="live-container">
  <div class="live-post">
    <small>Updated at 7:23 a.m. PST</small>
    <h1>Example of latest post</h1>
  </div>
  <div class="live-post">
    <small>Updated at 7:20 a.m. PST</small>
    <h1>Example of second latest post</h1>
  </div>
  <div>
    <small>Updated at 7:03 a.m. PST</small>
    <h1>Post that will be ignored</h1>
  </div>
  <div class="live-post">
    <small>Updated at 7:00 a.m. PST</small>
    <h1>Example of first post</h1>
  </div>
</section>
```

Without a mapping, this HTML will be treated as a series of individual text components. To instruct Canvasflow to interpret this as a live container component, a mapping of type `live_container` must be created:

```json
{
  "component": "live_container",
  "match": "all",
  "filters": [
    {
      "type": "class",
      "match": "any",
      "items": ["live-container"]
    },
    {
      "type": "tag",
      "items": ["section"]
    }
  ],
  "post": {
    "match": "any",
    "filters": [
      {
        "type": "class",
        "match": "any",
        "items": ["live-post"]
      }
    ]
  }
}
```

Canvasflow processes this mapping by first locating the HTML node that matches the live container criteria. Once found, it searches the descendants of that node for elements that match the post mapping, as defined by the `post` property. The matching nodes are then flattened to the same level, and the content within each live post is processed.

#### Live Post Component

A live post represents an individual update or entry within a `live_container` component. Each post must include a timestamp indicating when it was last updated.

> This component type can only exist as a child of a `live_container` component.

Posts must be displayed in reverse chronological order, with the most recent content appearing first.

> A `live_post` cannot contain another `live_post` or `live_container` component within it.

Each live post must also include a unique identifier.

---

### Gallery Mapping

`component: "gallery"`

In HTML there isn't a semantic way to describe a gallery. Besides the built-in `role="gallery"` detection, a custom mapping can be used to detect galleries from arbitrary markup.

In addition to the base properties, it requires:

| Property | Required | Description                                                                                               |
| :------- | :------- | :-------------------------------------------------------------------------------------------------------- |
| `slide`  | Yes      | A sub-mapping (`match` + `filters`) that describes how individual slides within the gallery are detected. |

Canvasflow processes this mapping the same way it processes columns and live containers: it first locates the HTML node that matches the gallery criteria, then searches its descendants — not just direct children — for elements matching the `slide` mapping. The matching slide nodes are flattened to the same level and processed; only the slides that resolve to a valid [Image Element](HTML.md#image-element) become items in the gallery.

> If no valid image slides are found, the gallery is produced with the error `slides not found in the gallery`.

```html
<div class="carousel">
  <div class="carousel-slide">
    <figure>
      <img src="image1.jpg" />
      <figcaption>
        Image 1 Caption
        <small role="credit">Photographer 1</small>
      </figcaption>
    </figure>
  </div>
  <div class="carousel-slide">
    <img src="image2.jpg" alt="Image 2 Caption" />
  </div>
</div>
```

```json
{
  "component": "gallery",
  "match": "all",
  "filters": [
    {
      "type": "class",
      "match": "any",
      "items": ["carousel"]
    }
  ],
  "slide": {
    "match": "any",
    "filters": [
      {
        "type": "class",
        "match": "any",
        "items": ["carousel-slide"]
      }
    ]
  }
}
```

---

### Custom Mapping

`component: "custom"`

This mapping turns the matched HTML element into a Custom Component. Unlike container components, the children of the element are **not** converted into Canvasflow components; instead, the element is preserved as raw content.

The resulting component carries:

- `content`: the matched element serialized back to an HTML string, untouched.
- `html`: a sanitized version of the same HTML, restricted to the allowed tag list.
- `id`: taken from the element's `id` attribute, if present.

This is useful for embeds or widgets that Canvasflow does not understand natively and that should be passed through as-is.

```json
{
  "component": "custom",
  "match": "all",
  "filters": [
    {
      "type": "attribute",
      "key": "data-widget",
      "value": "weather"
    }
  ]
}
```

---

### Text Mapping

`component: <text type>`

A mapping can also target any of the Canvasflow text components. The `component` value can be any valid text type:

- `headline`
- `title`
- `subtitle`
- `intro`
- `body`
- `crosshead`
- `byline`
- `blockquote`
- `footer`
- `imagecaption`
- `text1`–`text60`

This works as an alternative to the `role` attribute described in [Text Elements](HTML.md#text-elements): instead of requiring the source HTML to carry a `role`, the mapping detects the element by tag, class, or attribute and assigns the text component type directly.

For example, to treat every paragraph with the class `standfirst` as an `intro` component:

```json
{
  "component": "intro",
  "match": "all",
  "filters": [
    {
      "type": "tag",
      "items": ["p"]
    },
    {
      "type": "class",
      "match": "any",
      "items": ["standfirst"]
    }
  ]
}
```

The matched element is processed with the same rules as any other text component: only the allowed phrasing content survives, and all attributes are stripped except `href`, `target`, and `rel` on `<a>` elements.

---

## Excludes

The `excludes` list uses the [Base Mapping](#base-mapping) structure (`match` + `filters`, without a `component`). Before any element is processed — including the descendants searched by `columns`, `live_container`, and `gallery` mappings — Canvasflow checks it against every exclude mapping. If any of them matches, the element and all of its children are removed from the output.

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

## Properties

Any mapping (including each entry in `mappings`) may declare a `properties` object. Canvasflow does not interpret its contents; when the mapping matches, the object is copied verbatim onto the resulting component's `properties` field. This allows downstream consumers to attach arbitrary configuration to mapped components.

```json
{
  "component": "container",
  "match": "all",
  "filters": [{ "type": "tag", "items": ["aside"] }],
  "properties": {
    "theme": "highlight",
    "collapsible": true
  }
}
```
