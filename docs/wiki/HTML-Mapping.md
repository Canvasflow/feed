# HTML Mapping

`HTMLMapper.toComponents(html, params?)` turns an HTML string into a typed `Component[]`. This page explains the pipeline and the default rules; the exhaustive element-by-element reference is in [`docs/HTML.md`](../../docs/HTML.md), and configuration is on [Custom Mappings](Custom-Mappings.md).

← Back to [Home](Home.md) · Related: [Custom Mappings](Custom-Mappings.md) · [Component Types](Component-Types.md)

## Entry points

```ts
import { HTMLMapper } from '@canvasflow/feed';

const components = HTMLMapper.toComponents(html, params /* optional */);
const root = HTMLMapper.getRootElement(html, rootMapping); // string | null
```

| Method                          | Returns          | Purpose                                                                    |
| ------------------------------- | ---------------- | -------------------------------------------------------------------------- |
| `toComponents(html, params?)`   | `Component[]`    | The full HTML → components conversion.                                     |
| `getRootElement(html, mapping)` | `string \| null` | Serialize the first element matching `mapping` (used to scope extraction). |

## The pipeline

1. **Pre-process the HTML string:**
   - remove breaklines;
   - sanitize invalid `href`s (replace with `#`);
   - lift `<a>` wrappers around images out of `<p>`/heading tags;
   - split `<p>`/`h1`–`h6` tags that contain `<img>` so the image becomes its own block.
2. **Parse** with `himalaya` into a `Node[]` AST.
3. **Reduce** the AST via `reduceComponents(params)` from `mapping/Mapping.ts` into `Component[]`.

## Evaluation order

For each element the reducer tries, in order:

1. **Exclusion** — matches an `excludes` mapping, or has `data-cf-ignore` → element and children skipped.
2. **Built-in detection** — social embeds (Instagram, Twitter/X, TikTok, YouTube, Vimeo, Dailymotion, Infogram, Apple Podcasts), `<table>`, `<video>`, `<audio>`, `<iframe>`, buttons, images (`<img>`, `<picture>`, `<figure>`), and `role="gallery"`/`role="mosaic"`.
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

| Content | Detected from                                                                                            |
| ------- | -------------------------------------------------------------------------------------------------------- |
| Image   | `<img>`, `<picture>` (uses the fallback `<img>`), `<figure>` (+ `<figcaption>`/`<small role="credit">`). |
| Gallery | `role="gallery"`/`role="mosaic"` container, or a custom gallery mapping.                                 |
| Video   | `<video>` (`src` or first `<source>`); YouTube/Vimeo/Dailymotion via `<iframe>`.                         |
| Audio   | `<audio>`; Apple Podcasts via `<iframe>`.                                                                |
| Social  | `blockquote`/`a` markers for Instagram, Twitter/X, TikTok.                                               |
| Table   | `<table>` → `htmltable` (restricted tag allow-list).                                                     |
| Button  | `<a role="button">` or `<button><a></button>`.                                                           |

Each of these has a dedicated section (required attributes, examples, edge cases) in [`docs/HTML.md`](../../docs/HTML.md). To recognise content that does not follow these conventions, define a [custom mapping](Custom-Mappings.md).
