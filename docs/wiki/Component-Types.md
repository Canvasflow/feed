# Component Types

Every conversion produces `Component[]`. This page lists the component union, the shared shape, and the type guards used to narrow them. All of these are defined in [`Component.ts`](../../src/component/Component.ts) and re-exported from the package root.

← Back to [Home](Home.md) · Related: [HTML Mapping](HTML-Mapping.md) · [API Reference](API-Reference.md)

## The base shape

Every component extends a common base:

```ts
type Component = {
  id?: string;
  component: ComponentType;
  properties?: Record<string, unknown>;
  html?: string;
  errors: string[];
  warnings: string[];
  element?: { tag: string; attributes?: Record<string, string> };
};
```

## `ComponentType` and `TextType`

`ComponentType` is the union of every component kind. It includes `TextType` plus the structural/media kinds:

- **Text** (`TextType`): `headline`, `title`, `subtitle`, `intro`, `body`, `crosshead`, `byline`, `blockquote`, `footer`, `imagecaption`, and `text1`–`text60`.
- **Media / embed**: `image`, `gallery`, `video`, `audio`, `twitter`, `instagram`, `tiktok`, `infogram`.
- **Structural**: `container`, `columns`, `live_container`, `live_post`, `htmltable`, `recipe`, `custom`, `button`, `anchor`, `advert`, `spacer`, `divider`, `map`, `table`.

`MAX_TEXT` is `60`. The `text1`–`text60` range is generated at the type level, and a matching runtime `Set` backs the validators.

## Component interfaces

Each kind has a typed interface extending `Component`, e.g.:

| Interface                                                                                                                                                                                  | `component` value                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| `TextComponent`                                                                                                                                                                            | any `TextType`                       |
| `ImageComponent`                                                                                                                                                                           | `image`                              |
| `GalleryComponent`                                                                                                                                                                         | `gallery`                            |
| `VideoComponent` / `YoutubeComponent` / `VimeoComponent` / `DailymotionComponent` / `TikTokComponent`                                                                                      | `video` (with a `vidtype`)           |
| `AudioComponent`                                                                                                                                                                           | `audio`                              |
| `TwitterComponent` / `InstagramComponent` / `InfogramComponent`                                                                                                                            | `twitter` / `instagram` / `infogram` |
| `HTMLTableComponent`                                                                                                                                                                       | `htmltable`                          |
| `ButtonComponent`                                                                                                                                                                          | `button`                             |
| `ContainerComponent` / `ColumnsComponent` / `LiveContainerComponent` / `LivePostComponent` / `RecipeComponent` / `CustomComponent` / `FigureContainerComponent` / `LinkContainerComponent` | structural kinds                     |
| `SpacerComponent`                                                                                                                                                                          | `spacer`                             |

## Type guards

Narrow a `Component` with the exported `is*` guards rather than checking `.component` by hand:

```ts
import { isImageComponent, isVideoComponent } from '@canvasflow/feed';

for (const c of components) {
  if (isImageComponent(c)) {
    console.log(c.imageurl, c.caption);
  } else if (isVideoComponent(c)) {
    console.log(c.vidtype);
  }
}
```

Available guards:

```
isAudioComponent        isButtonComponent       isContainerComponent
isCustomComponent       isDailymotionComponent  isFigureContainerComponent
isGalleryComponent      isGalleryImage          isHTMLTableComponent
isImageComponent        isInfogramComponent     isInstagramComponent
isLinkContainerComponent isRecipeComponent      isSpacerComponent
isTextComponent         isTikTokComponent       isTwitterComponent
isVideoComponent        isVimeoComponent        isYoutubeComponent
isValidTextRole
```

## Runtime schemas

For validation, `Component.ts` also exports Zod schemas (`ComponentSchema`, `ComponentTypeSchema`, `TextTypeSchema`, and per-kind schemas such as `ImageComponentSchema`). Recipe extraction has its own schemas in [`schema/Schema.ts`](../../src/component/schema/Schema.ts).
