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

- **Text** (`TextType`): `headline`, `title`, `subtitle`, `intro`, `body`, `crosshead`, `byline`, `blockquote`, `footer`, `imagecaption`, and `text1`–`text60`.
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

Default HTML → component mappings: `h1` → `headline`, `h2` → `title`, `h3` → `subtitle`, `h4` → `intro`, `p` → `body`, `blockquote` → `blockquote`, `footer` → `footer`. The `role` attribute on any element overrides the mapping (e.g. `<p role="crosshead">` → `crosshead`).

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

---

### `TwitterComponent`

`component`: `"twitter"`

| Field         | Type                                | Description                        |
| ------------- | ----------------------------------- | ---------------------------------- |
| `height`      | `string`                            | Embed height.                      |
| `fixedheight` | `"on" \| "off"`                     | Whether the height is fixed.       |
| `bleed`       | `"on" \| "off"`                     | Whether the embed bleeds to edges. |
| `params`      | `{ id?: string; account?: string }` | Tweet ID and/or account.           |

---

### `InstagramComponent`

`component`: `"instagram"`

| Field  | Type                       | Description         |
| ------ | -------------------------- | ------------------- |
| `id`   | `string`                   | Instagram media ID. |
| `type` | `"post" \| "reel" \| "tv"` | Content type.       |

---

### `InfogramComponent`

`component`: `"infogram"`

| Field    | Type                                              | Description                |
| -------- | ------------------------------------------------- | -------------------------- |
| `params` | `{ id: string; parentUrl: string; src: "embed" }` | Infogram embed parameters. |

---

### `HTMLTableComponent`

`component`: `"htmltable"`

| Field     | Type                  | Description                                          |
| --------- | --------------------- | ---------------------------------------------------- |
| `html`    | `string`              | Sanitized HTML string of the full `<table>` element. |
| `caption` | `string` _(optional)_ | Table caption.                                       |
| `credit`  | `string` _(optional)_ | Credit.                                              |

---

### `ButtonComponent`

`component`: `"button"`

| Field  | Type                  | Description      |
| ------ | --------------------- | ---------------- |
| `text` | `string` _(optional)_ | Button label.    |
| `link` | `string` _(optional)_ | Destination URL. |

---

### `SpacerComponent`

`component`: `"spacer"`

| Field    | Type                                                                      | Description            |
| -------- | ------------------------------------------------------------------------- | ---------------------- |
| `margin` | `"margin-1" \| "margin-20" \| "margin-50" \| "margin-75" \| "margin-100"` | Vertical spacing size. |

---

### `CustomComponent`

`component`: `"custom"`

Used for elements that do not match any built-in mapping rule.

| Field     | Type                         | Description                                                                                                                                                |
| --------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `content` | `string`                     | Raw re-serialized HTML of the matched element. Not sanitized — use the base `html` field for a sanitized version.                                          |
| `node`    | `unknown`                    | The raw `ElementNode` AST node from the himalaya parser. Useful for consumers that need to traverse the original tree.                                     |
| `link`    | `ComponentLink` _(optional)_ | Present when the element was wrapped in an `<a>` ancestor during mapping. The `content` field is **not** modified — read the link from this field instead. |

---

### `ContainerComponent`

`component`: `"container"`

A generic container that holds nested components.

| Field        | Type                              | Description                                         |
| ------------ | --------------------------------- | --------------------------------------------------- |
| `type`       | `"link" \| "figure"` _(optional)_ | Sub-type discriminator. Absent on plain containers. |
| `components` | `Component[]`                     | Nested child components.                            |

---

### `ColumnsComponent`

`component`: `"columns"`

| Field     | Type            | Description                                  |
| --------- | --------------- | -------------------------------------------- |
| `columns` | `Component[][]` | Each inner array is one column's components. |

---

### `LiveContainerComponent`

`component`: `"live_container"`

| Field   | Type                  | Description         |
| ------- | --------------------- | ------------------- |
| `posts` | `LivePostComponent[]` | Ordered live posts. |

---

### `LivePostComponent`

`component`: `"live_post"`

| Field        | Type          | Description                  |
| ------------ | ------------- | ---------------------------- |
| `components` | `Component[]` | Components within this post. |

---

### `RecipeComponent`

`component`: `"recipe"`

| Field        | Type                  | Description                                                                                                |
| ------------ | --------------------- | ---------------------------------------------------------------------------------------------------------- |
| `recipe`     | `Recipe` _(optional)_ | Structured recipe data (ingredients, steps, etc.). Defined by `RecipeSchema` in `schema/recipe-schema.ts`. |
| `url`        | `string` _(optional)_ | Canonical URL of the recipe.                                                                               |
| `components` | `Component[]`         | Fallback component representation of the recipe content.                                                   |

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

### `FigureContainerComponent`

A `ContainerComponent` with `type: "figure"`. Produced by every `<figure>` element during mapping. Caption and credit are extracted from `<figcaption>` children (credit matched by `<small>`, `role="credit"`, or `class="credit"`), then this wrapper is resolved into its final container form.

| Field        | Type                  | Description                                 |
| ------------ | --------------------- | ------------------------------------------- |
| `type`       | `"figure"`            | Discriminator.                              |
| `components` | `Component[]`         | Media and other children inside the figure. |
| `caption`    | `string` _(optional)_ | Extracted caption text.                     |
| `credit`     | `string` _(optional)_ | Extracted credit text.                      |

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
