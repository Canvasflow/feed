# HTML Mapping

`HTMLMapper.toComponents(html, params?)` turns an HTML string into a typed `Component[]`. This page explains the pipeline and the default rules; configuration is on [Custom Mappings](Custom-Mappings.md).

← Back to [Home](Home.md) · Related: [Custom Mappings](Custom-Mappings.md) · [Component Types](Component-Types.md)

## Entry points

```ts
import { HTMLMapper } from '@canvasflow/feed';

const components = HTMLMapper.toComponents(html, params, root /* optional */);
const scopedHtml = HTMLMapper.getRootElement(html, rootMapping); // string | null
```

| Method                               | Returns          | Purpose                                                                      |
| ------------------------------------ | ---------------- | ---------------------------------------------------------------------------- |
| `toComponents(html, params?, root?)` | `Component[]`    | The full HTML → components conversion, with optional root-element scoping.   |
| `getRootElement(html, mapping)`      | `string \| null` | Serialize the first element matching `mapping` (used to scope extraction).   |

## The pipeline

The HTML pipeline parses the input **exactly once** and applies all transformations as pure `Node[]` passes on that single tree:

1. **Parse** with `linkedom` (via `parser.ts`) into a `Node[]` AST.
2. **`stripBreaklines`** — strips `\r\n`/`\n`/`\r` from text content and attribute values; drops text nodes that become empty.
3. **`hoistAnchorsWithImages`** — lifts `<a>` elements containing `<img>` descendants out of enclosing `<p>`/heading blocks.
4. **`splitImagesFromParagraphs`** — splits `<p>`/`h1`–`h6` elements that have `<img>` direct children so each image becomes a sibling block.
5. **`sanitizeInvalidAnchorHrefs`** — rewrites `<a href>` values that fail URL validation to `href="#"`.
6. **Root scoping** (optional) — if a `root` mapping is passed, `getRootElement` locates the matching subtree in the processed tree and narrows to `[rootNode]` before reduction.
7. **`reduceComponents(params)`** — walks the node tree and emits `Component[]`; each node is serialized to HTML inline via `sanitizeNodes()` (no re-parse).

## Evaluation order

For each element the reducer tries, in order:

1. **Exclusion** — matches an `excludes` mapping, or has `data-cf-ignore` → element and children skipped.
2. **Built-in detection** — social embeds (Instagram, Twitter/X, TikTok, YouTube, Vimeo, Dailymotion, Infogram, Apple Podcasts), `<table>`, `<video>`, `<audio>`, `<iframe>`, buttons, images (`<img>`, `<picture>`), `<figure>` (always produces a `FigureContainerComponent`), and `role="gallery"`/`role="mosaic"`.
3. **Custom mappings** — each `mappings` entry, **in order**; the first match wins.
4. **Default text rules** — the tag → text-component table below.
5. **Descend** — otherwise ignore the element and evaluate its children.

## Default text mapping

| HTML         | Component type |
| ------------ | -------------- |
| `h1`         | `headline`     |
| `h2`         | `title`        |
| `h3`         | `subtitle`     |
| `h4`         | `intro`        |
| `p`          | `body`         |
| `blockquote` | `blockquote`   |
| `footer`     | `footer`       |

Any text element's `role` attribute overrides the default (e.g. `<p role="crosshead">` → `crosshead`, `<p role="text12">` → `text12`).

## Text sanitizing

Text components keep only [phrasing content](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Content_categories#phrasing_content); styles and classes are stripped. On `<a>` elements only `href`, `target`, and `rel` survive. Whitespace-only text between inline elements is preserved as a non-breaking space so spacing in markup like `<b>foo</b> <i>bar</i>` is not collapsed.

## Built-in element detection (summary)

| Content | Detected from                                                                                                                                                                                                                                                                                                                               |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Image   | `<img>`, `<picture>` (uses the fallback `<img>`).                                                                                                                                                                                                                                                                                           |
| Figure  | `<figure>` — always produces a `FigureContainerComponent` (`component: 'container'`, `type: 'figure'`). Caption and credit are extracted from a `<figcaption>`; credit nodes are identified by the `<small>` tag, `role="credit"`, or `class="credit"`. The contained media components (image, video, audio) are nested under `components`. |
| Gallery | `role="gallery"`/`role="mosaic"` container, or a custom gallery mapping.                                                                                                                                                                                                                                                                    |
| Video   | `<video>` (`src` or first `<source>`); YouTube/Vimeo/Dailymotion via `<iframe>`.                                                                                                                                                                                                                                                            |
| Audio   | `<audio>`; Apple Podcasts via `<iframe>`.                                                                                                                                                                                                                                                                                                   |
| Social  | `blockquote`/`a` markers for Instagram, Twitter/X, TikTok.                                                                                                                                                                                                                                                                                  |
| Table   | `<table>` → `htmltable` (restricted tag allow-list).                                                                                                                                                                                                                                                                                        |
| Button  | `<a role="button">` or `<button><a></button>`.                                                                                                                                                                                                                                                                                              |

To recognise content that does not follow these conventions, define a [custom mapping](Custom-Mappings.md).
