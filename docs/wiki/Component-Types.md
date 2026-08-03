# Component Types

Every conversion produces `Component[]`. This page lists the component union, the shared shape, the full field reference for each type, and the type guards used to narrow them. All of these are defined in [`component.ts`](https://github.com/canvasflow/feed/blob/main/src/component/component.ts) and re-exported from the package root.

← Back to [Home](Home.md) · Related: [HTML Mapping](HTML-Mapping.md) · [API Reference](API-Reference.md)

---

## The base shape

Every component extends a common base:

```ts
type Component = {
  id?: string;
  component: ComponentType;
  properties?: Record<string, unknown>;
  html?: string;
  errors: readonly FeedIssue[];
  warnings: readonly FeedIssue[];
  element?: { tag: string; attributes?: Record<string, string> };
};
```

---

## `ComponentLink`

`ComponentLink` is a resolved link carried directly on a component rather than serialised into its content. It is set when an enclosing `<a>` ancestor is resolved during mapping.

```ts
type ComponentLink = {
  href: string;
  element?: { tag: string; attributes?: Record<string, string> };
};
```

`href` is the anchor's destination URL. `element` records the source `<a>` element (tag name and attributes) that the href was taken from, allowing consumers to inspect or re-render the original anchor.

`ComponentLink` is exported from the package root alongside the component types.

---

## `ComponentType` and `TextType`

`ComponentType` is the union of every component kind. It includes `TextType` plus the structural/media kinds:

- **Text** (`TextType`): `headline`, `title`, `subtitle`, `intro`, `body`, `crosshead`, `byline`, `blockquote`, `footer`, `imagecaption`, or `text1`–`text60`.
- **Media / embed**: `image`, `gallery`, `video`, `audio`, `twitter`, `instagram`, `tiktok`, `infogram`.
- **Structural**: `container`, `columns`, `live_container`, `live_post`, `htmltable`, `recipe`, `custom`, `button`, `anchor`, `advert`, `spacer`, `divider`, `map`, `table`.

`MAX_TEXT` is `60`. The `text1`–`text60` range is generated at the type level, backed by a runtime `Set` for validation.

---

## Component type reference

### Text components (`TextComponent`)

`component`: any `TextType` value — `headline`, `title`, `subtitle`, `intro`, `body`, `crosshead`, `byline`, `blockquote`, `footer`, `imagecaption`, or `text1`–`text60`.

| Field  | Type                         | Description                                                                                                                                                                                            |
| ------ | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `text` | `string`                     | Sanitized inner HTML of the element. Inline phrasing tags (`<a>`, `<strong>`, `<em>`, `<abbr>`, `<cite>`, `<u>`, `<time>`, etc.) are preserved; block elements and disallowed attributes are stripped. |
| `link` | `ComponentLink` _(optional)_ | Present when the element was wrapped in an `<a>` ancestor during mapping. The text content itself is **not** wrapped in an anchor tag — read the link from this field instead.                         |

Default HTML → component mappings:

- `h1` → `headline`
- `h2` → `title`
- `h3` → `subtitle`
- `h4` → `intro`
- `p` → `body`
- `blockquote` → `blockquote`
- `footer` → `footer`

The `role` attribute on any element overrides the mapping (e.g. `<p role="crosshead">` → `crosshead`).

```json
{
  "component": "body",
  "text": "The <strong>quick</strong> brown fox.",
  "errors": [],
  "warnings": [],
  "element": { "tag": "p" }
}
```

With a resolved link:

```json
{
  "component": "body",
  "text": "Read the full report.",
  "link": {
    "href": "https://example.com/report",
    "element": {
      "tag": "a",
      "attributes": { "href": "https://example.com/report", "target": "_blank" }
    }
  },
  "errors": [],
  "warnings": [],
  "element": { "tag": "p" }
}
```

---

### `ImageComponent`

`component`: `"image"`

| Field      | Type                  | Description                 |
| ---------- | --------------------- | --------------------------- |
| `imageurl` | `string`              | Source URL of the image.    |
| `link`     | `string` _(optional)_ | URL the image links to.     |
| `alt`      | `string` _(optional)_ | Alt text.                   |
| `caption`  | `string` _(optional)_ | Caption text.               |
| `credit`   | `string` _(optional)_ | Credit / attribution text.  |
| `width`    | `number` _(optional)_ | Intrinsic width in pixels.  |
| `height`   | `number` _(optional)_ | Intrinsic height in pixels. |

> **Note:** A `<figure>` wrapping an `<img>` or `<picture>` produces a `FigureContainerComponent` (see [Transient components](#transient-components)) that holds the `ImageComponent` as a child. A bare `<img>` outside a `<figure>` produces a standalone `ImageComponent`.

```json
{
  "component": "image",
  "imageurl": "https://example.com/photo.jpg",
  "alt": "A mountain at sunset",
  "caption": "The Rockies at dusk.",
  "credit": "Jane Doe / Getty Images",
  "width": 1920,
  "height": 1080,
  "link": "https://example.com/gallery",
  "errors": [],
  "warnings": [],
  "element": {
    "tag": "img",
    "attributes": { "src": "https://example.com/photo.jpg" }
  }
}
```

---

### `GalleryComponent`

`component`: `"gallery"`

| Field       | Type                                                                | Description                         |
| ----------- | ------------------------------------------------------------------- | ----------------------------------- |
| `images`    | `GalleryImage[]`                                                    | Ordered list of images (see below). |
| `role`      | `"default" \| "mosaic"` _(optional)_                                | Display variant.                    |
| `animation` | `"fade" \| "slide" \| "cube" \| "coverflow" \| "flip"` _(optional)_ | Transition style.                   |
| `caption`   | `string \| Record<string, string>` _(optional)_                     | Gallery-level caption.              |
| `direction` | `"horizontal" \| "vertical"` _(optional)_                           | Scroll axis.                        |

**`GalleryImage`**

| Field      | Type                  | Description             |
| ---------- | --------------------- | ----------------------- |
| `imageurl` | `string`              | Source URL.             |
| `caption`  | `string` _(optional)_ | Per-image caption.      |
| `link`     | `string` _(optional)_ | URL the image links to. |
| `alt`      | `string` _(optional)_ | Alt text.               |
| `credit`   | `string` _(optional)_ | Credit text.            |
| `width`    | `number` _(optional)_ | Width in pixels.        |
| `height`   | `number` _(optional)_ | Height in pixels.       |

```json
{
  "component": "gallery",
  "role": "default",
  "animation": "slide",
  "direction": "horizontal",
  "images": [
    {
      "imageurl": "https://example.com/img1.jpg",
      "alt": "First slide",
      "caption": "Opening shot",
      "credit": "AP Photo",
      "width": 1200,
      "height": 800
    },
    {
      "imageurl": "https://example.com/img2.jpg",
      "alt": "Second slide",
      "link": "https://example.com/article"
    }
  ],
  "errors": [],
  "warnings": []
}
```

---

### `VideoComponent`

`component`: `"video"`

The base shape covers hosted/direct video files. Platform-specific variants add a `vidtype` discriminator and a `params` object.

| Field       | Type                    | Description                     |
| ----------- | ----------------------- | ------------------------------- |
| `url`       | `string` _(optional)_   | Source URL (hosted video).      |
| `controls`  | `boolean` _(optional)_  | Show player controls.           |
| `autoplay`  | `boolean` _(optional)_  | Autoplay on load.               |
| `loop`      | `boolean` _(optional)_  | Loop playback.                  |
| `muted`     | `boolean` _(optional)_  | Start muted.                    |
| `movietype` | `"hosted"` _(optional)_ | Signals a directly-hosted file. |
| `poster`    | `string` _(optional)_   | Poster image URL.               |
| `caption`   | `string` _(optional)_   | Caption.                        |
| `credit`    | `string` _(optional)_   | Credit.                         |

**Platform variants** (extend the base, add `vidtype` + `params`):

| Interface              | `vidtype`       | `params`                           |
| ---------------------- | --------------- | ---------------------------------- |
| `YoutubeComponent`     | `"youtube"`     | `{ id: string }`                   |
| `VimeoComponent`       | `"vimeo"`       | `{ id: string }`                   |
| `DailymotionComponent` | `"dailymotion"` | `{ id: string }`                   |
| `TikTokComponent`      | `"tiktok"`      | `{ id: string; username: string }` |

Hosted video:

```json
{
  "component": "video",
  "movietype": "hosted",
  "url": "https://example.com/clip.mp4",
  "poster": "https://example.com/clip-poster.jpg",
  "controls": true,
  "autoplay": false,
  "loop": false,
  "muted": false,
  "caption": "Highlights from the match.",
  "errors": [],
  "warnings": []
}
```

YouTube:

```json
{
  "component": "video",
  "vidtype": "youtube",
  "params": { "id": "dQw4w9WgXcQ" },
  "controls": true,
  "autoplay": false,
  "loop": false,
  "muted": false,
  "errors": [],
  "warnings": []
}
```

TikTok:

```json
{
  "component": "video",
  "vidtype": "tiktok",
  "params": { "id": "7123456789012345678", "username": "someuser" },
  "errors": [],
  "warnings": []
}
```

---

### `AudioComponent`

`component`: `"audio"`

| Field      | Type                  | Description           |
| ---------- | --------------------- | --------------------- |
| `url`      | `string`              | Audio file URL.       |
| `controls` | `boolean`             | Show player controls. |
| `autoplay` | `boolean`             | Autoplay on load.     |
| `loop`     | `boolean`             | Loop playback.        |
| `muted`    | `boolean`             | Start muted.          |
| `caption`  | `string` _(optional)_ | Caption.              |
| `credit`   | `string` _(optional)_ | Credit.               |

```json
{
  "component": "audio",
  "url": "https://example.com/episode-42.mp3",
  "controls": true,
  "autoplay": false,
  "loop": false,
  "muted": false,
  "caption": "Episode 42 — Full interview",
  "errors": [],
  "warnings": []
}
```

---

### `TwitterComponent`

`component`: `"twitter"`

| Field    | Type                                | Description              |
| -------- | ----------------------------------- | ------------------------ |
| `height` | `string`                            | Embed height.            |
| `params` | `{ id?: string; account?: string }` | Tweet ID and/or account. |

```json
{
  "component": "twitter",
  "height": "350",
  "params": { "id": "1234567890123456789" },
  "errors": [],
  "warnings": []
}
```

---

### `InstagramComponent`

`component`: `"instagram"`

| Field  | Type                       | Description         |
| ------ | -------------------------- | ------------------- |
| `id`   | `string`                   | Instagram media ID. |
| `type` | `"post" \| "reel" \| "tv"` | Content type.       |

```json
{
  "component": "instagram",
  "id": "CxYzAbCdEfG",
  "type": "post",
  "errors": [],
  "warnings": []
}
```

---

### `InfogramComponent`

`component`: `"infogram"`

| Field    | Type                                              | Description                |
| -------- | ------------------------------------------------- | -------------------------- |
| `params` | `{ id: string; parentUrl: string; src: "embed" }` | Infogram embed parameters. |

```json
{
  "component": "infogram",
  "params": {
    "id": "my-infographic-slug",
    "parentUrl": "https://example.com/article",
    "src": "embed"
  },
  "errors": [],
  "warnings": []
}
```

---

### `HTMLTableComponent`

`component`: `"htmltable"`

| Field     | Type                  | Description                                          |
| --------- | --------------------- | ---------------------------------------------------- |
| `html`    | `string`              | Sanitized HTML string of the full `<table>` element. |
| `caption` | `string` _(optional)_ | Table caption.                                       |
| `credit`  | `string` _(optional)_ | Credit.                                              |

```json
{
  "component": "htmltable",
  "html": "<table><thead><tr><th>Name</th><th>Score</th></tr></thead><tbody><tr><td>Alice</td><td>98</td></tr></tbody></table>",
  "caption": "Q1 results",
  "errors": [],
  "warnings": []
}
```

---

### `ButtonComponent`

`component`: `"button"`

| Field  | Type                  | Description      |
| ------ | --------------------- | ---------------- |
| `text` | `string` _(optional)_ | Button label.    |
| `link` | `string` _(optional)_ | Destination URL. |

```json
{
  "component": "button",
  "text": "Subscribe now",
  "link": "https://example.com/subscribe",
  "errors": [],
  "warnings": []
}
```

---

### `SpacerComponent`

`component`: `"spacer"`

| Field    | Type                                                                      | Description            |
| -------- | ------------------------------------------------------------------------- | ---------------------- |
| `margin` | `"margin-1" \| "margin-20" \| "margin-50" \| "margin-75" \| "margin-100"` | Vertical spacing size. |

```json
{
  "component": "spacer",
  "margin": "margin-50",
  "errors": [],
  "warnings": []
}
```

---

### `CustomComponent`

`component`: `"custom"`

Used for elements that do not match any built-in mapping rule.

| Field     | Type                         | Description                                                                                                                                                |
| --------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `content` | `string`                     | Raw re-serialized HTML of the matched element. Not sanitized — use the base `html` field for a sanitized version.                                          |
| `node`    | `unknown`                    | The raw `ElementNode` AST node from the himalaya parser. Useful for consumers that need to traverse the original tree.                                     |
| `link`    | `ComponentLink` _(optional)_ | Present when the element was wrapped in an `<a>` ancestor during mapping. The `content` field is **not** modified — read the link from this field instead. |

```json
{
  "component": "custom",
  "content": "<div class=\"pullquote\"><span>The future is already here.</span></div>",
  "html": "<div class=\"pullquote\"><span>The future is already here.</span></div>",
  "errors": [],
  "warnings": [],
  "element": { "tag": "div", "attributes": { "class": "pullquote" } }
}
```

With a resolved link:

```json
{
  "component": "custom",
  "content": "<div class=\"promo\">Exclusive offer</div>",
  "html": "<div class=\"promo\">Exclusive offer</div>",
  "link": {
    "href": "https://example.com/offer",
    "element": {
      "tag": "a",
      "attributes": { "href": "https://example.com/offer" }
    }
  },
  "errors": [],
  "warnings": [],
  "element": { "tag": "div", "attributes": { "class": "promo" } }
}
```

---

### `ContainerComponent`

`component`: `"container"`

A generic container that holds nested components.

| Field        | Type                              | Description                                         |
| ------------ | --------------------------------- | --------------------------------------------------- |
| `type`       | `"link" \| "figure"` _(optional)_ | Sub-type discriminator. Absent on plain containers. |
| `components` | `Component[]`                     | Nested child components.                            |

```json
{
  "component": "container",
  "components": [
    {
      "component": "headline",
      "text": "Breaking News",
      "errors": [],
      "warnings": []
    },
    {
      "component": "body",
      "text": "Details are still emerging.",
      "errors": [],
      "warnings": []
    }
  ],
  "errors": [],
  "warnings": []
}
```

---

### `ColumnsComponent`

`component`: `"columns"`

| Field     | Type            | Description                                  |
| --------- | --------------- | -------------------------------------------- |
| `columns` | `Component[][]` | Each inner array is one column's components. |

```json
{
  "component": "columns",
  "columns": [
    [
      {
        "component": "body",
        "text": "Left column text.",
        "errors": [],
        "warnings": []
      }
    ],
    [
      {
        "component": "image",
        "imageurl": "https://example.com/side.jpg",
        "errors": [],
        "warnings": []
      }
    ]
  ],
  "errors": [],
  "warnings": []
}
```

---

### `LiveContainerComponent`

`component`: `"live_container"`

| Field   | Type                  | Description         |
| ------- | --------------------- | ------------------- |
| `posts` | `LivePostComponent[]` | Ordered live posts. |

### `LivePostComponent`

`component`: `"live_post"`

| Field        | Type          | Description                  |
| ------------ | ------------- | ---------------------------- |
| `components` | `Component[]` | Components within this post. |

```json
{
  "component": "live_container",
  "posts": [
    {
      "component": "live_post",
      "components": [
        {
          "component": "headline",
          "text": "Update 2 — 14:32",
          "errors": [],
          "warnings": []
        },
        {
          "component": "body",
          "text": "Officials confirm the situation is under control.",
          "errors": [],
          "warnings": []
        }
      ],
      "errors": [],
      "warnings": []
    },
    {
      "component": "live_post",
      "components": [
        {
          "component": "headline",
          "text": "Update 1 — 13:15",
          "errors": [],
          "warnings": []
        },
        {
          "component": "body",
          "text": "Incident reported downtown.",
          "errors": [],
          "warnings": []
        }
      ],
      "errors": [],
      "warnings": []
    }
  ],
  "errors": [],
  "warnings": []
}
```

---

### `RecipeComponent`

`component`: `"recipe"`

| Field        | Type                  | Description                                                                                                |
| ------------ | --------------------- | ---------------------------------------------------------------------------------------------------------- |
| `recipe`     | `Recipe` _(optional)_ | Structured recipe data (ingredients, steps, etc.). Defined by `RecipeSchema` in `schema/recipe-schema.ts`. |
| `url`        | `string` _(optional)_ | Canonical URL of the recipe.                                                                               |
| `components` | `Component[]`         | Fallback component representation of the recipe content.                                                   |

```json
{
  "component": "recipe",
  "url": "https://example.com/recipes/banana-bread",
  "recipe": {
    "name": "Banana Bread",
    "prepTime": "PT15M",
    "cookTime": "PT1H",
    "ingredients": ["3 ripe bananas", "1½ cups flour", "½ cup sugar"],
    "steps": [
      "Preheat oven to 175°C.",
      "Mash bananas.",
      "Mix all ingredients and bake for 60 minutes."
    ]
  },
  "components": [
    {
      "component": "headline",
      "text": "Banana Bread",
      "errors": [],
      "warnings": []
    },
    {
      "component": "body",
      "text": "3 ripe bananas, 1½ cups flour, ½ cup sugar.",
      "errors": [],
      "warnings": []
    }
  ],
  "errors": [],
  "warnings": []
}
```

---

## Transient components

`LinkContainerComponent` and `FigureContainerComponent` are **transient types** used internally during the HTML mapping pipeline. They do not appear in the final `Component[]` output delivered to consumers — by the time mapping completes, the link or figure context has been resolved and distributed into the surrounding components.

They are exported and documented here because their type guards (`isLinkContainerComponent`, `isFigureContainerComponent`) are available if you need to inspect intermediate mapping state or write custom mapping extensions.

### `LinkContainerComponent`

A `ContainerComponent` with `type: "link"`. Represents an `<a>` element wrapping mixed content (text, images, etc.) during mapping. The `link` and `attributes` are resolved onto child components via the `link` property (`ComponentLink`) and this wrapper is discarded from the final output.

| Field        | Type                               | Description                                 |
| ------------ | ---------------------------------- | ------------------------------------------- |
| `type`       | `"link"`                           | Discriminator.                              |
| `components` | `Component[]`                      | Child components inside the anchor.         |
| `link`       | `string` _(optional)_              | The anchor's `href`.                        |
| `attributes` | `Map<string, string>` _(optional)_ | All attributes of the source `<a>` element. |

```json
{
  "component": "container",
  "type": "link",
  "link": "https://example.com/story",
  "components": [
    {
      "component": "image",
      "imageurl": "https://example.com/thumb.jpg",
      "errors": [],
      "warnings": []
    },
    {
      "component": "body",
      "text": "Read the full story.",
      "errors": [],
      "warnings": []
    }
  ],
  "errors": [],
  "warnings": []
}
```

### `FigureContainerComponent`

A `ContainerComponent` with `type: "figure"`. Produced by every `<figure>` element during mapping. Caption and credit are extracted from `<figcaption>` children (credit matched by `<small>`, `role="credit"`, or `class="credit"`), then this wrapper is resolved into its final container form.

| Field        | Type                  | Description                                 |
| ------------ | --------------------- | ------------------------------------------- |
| `type`       | `"figure"`            | Discriminator.                              |
| `components` | `Component[]`         | Media and other children inside the figure. |
| `caption`    | `string` _(optional)_ | Extracted caption text.                     |
| `credit`     | `string` _(optional)_ | Extracted credit text.                      |

```json
{
  "component": "container",
  "type": "figure",
  "caption": "Crowds gather outside the courthouse.",
  "credit": "Reuters",
  "components": [
    {
      "component": "image",
      "imageurl": "https://example.com/courthouse.jpg",
      "width": 1600,
      "height": 900,
      "errors": [],
      "warnings": []
    }
  ],
  "errors": [],
  "warnings": []
}
```

---

## Type guards

Narrow a `Component` with the exported `is*` guards rather than checking `.component` by hand:

```ts
import {
  isImageComponent,
  isVideoComponent,
  isTextComponent,
} from '@canvasflow/feed';

for (const c of components) {
  if (isImageComponent(c)) {
    console.log(c.imageurl, c.caption);
  } else if (isVideoComponent(c)) {
    console.log(c.vidtype);
  } else if (isTextComponent(c)) {
    console.log(c.text, c.link?.href);
  }
}
```

Available guards:

```
isAudioComponent            isButtonComponent           isContainerComponent
isColumnsComponent          isCustomComponent           isDailymotionComponent
isFigureContainerComponent  isGalleryComponent          isGalleryImage
isHTMLTableComponent        isImageComponent            isInfogramComponent
isInstagramComponent        isLinkContainerComponent    isRecipeComponent
isSpacerComponent           isTextComponent             isTikTokComponent
isTwitterComponent          isValidTextRole             isVideoComponent
isVimeoComponent            isYoutubeComponent
```

---

## Runtime schemas

For validation, `component.ts` exports Zod schemas alongside every type: `ComponentSchema`, `ComponentTypeSchema`, `TextTypeSchema`, `ComponentLinkSchema`, and per-kind schemas such as `ImageComponentSchema`, `TextComponentSchema`, `CustomComponentSchema`. Recipe extraction has its own schemas in [`schema/recipe-schema.ts`](https://github.com/canvasflow/feed/blob/main/src/component/schema/recipe-schema.ts).
