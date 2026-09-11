# Glossary

Domain and project terms used throughout `@canvasflow/feed` and this wiki.

← Back to [Home](Home.md)

| Term                             | Meaning                                                                                                                                                                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Canvasflow**                   | The platform whose component model this library targets.                                                                                                                                                                  |
| **Component**                    | A single content block in the output (`headline`, `image`, `gallery`, `video`, `custom`, …). See [Component Types](Component-Types.md).                                                                                   |
| **`ComponentType` / `TextType`** | The string-literal unions of all component kinds / all text kinds (`text1`–`text60` included).                                                                                                                            |
| **`RSSFeed`**                    | The class that parses, validates, and builds a feed. See [RSS Feeds](RSS-Feeds.md).                                                                                                                                       |
| **`HTMLMapper`**                 | The class that converts an HTML string into `Component[]`. See [HTML Mapping](HTML-Mapping.md).                                                                                                                           |
| **`validate()`**                 | Checks required tags against the `tag.ts` allow-lists and fills `errors`/`warnings`.                                                                                                                                      |
| **`build()`**                    | Produces the typed `RSS`, converting each item's `content:encoded` into components.                                                                                                                                       |
| **`content:encoded`**            | The Content-namespace element holding an item's full HTML body — the source of `components`.                                                                                                                              |
| **Mapping**                      | A rule (`match` + `filters`, plus a `component` for component mappings) telling the engine how to recognise an element. See [Custom Mappings](Custom-Mappings.md).                                                        |
| **`Params`**                     | The configuration object (`mappings`, `excludes`, `unwrap`, `ignoreParagraphWrap`) passed to `RSSFeed`/`HTMLMapper`.                                                                                                      |
| **Filter**                       | A `tag`, `class`, or `attribute` matcher inside a mapping. The attribute filter has an exact-value and a regex `pattern` form.                                                                                            |
| **`match`**                      | How many of a mapping's filters must match: `any` or `all` (class filters also allow `equal`).                                                                                                                            |
| **Excludes**                     | Base mappings whose matches (and children) are removed before conversion; also `data-cf-ignore`.                                                                                                                          |
| **Node**                         | A `Node[]` AST node (`element` / `text` / `comment`) produced by the `linkedom`-backed parser. Helpers live in [`node/node-helpers.ts`](https://github.com/canvasflow/feed/blob/main/src/component/node/node-helpers.ts). |
| **linkedom**                     | The DOM implementation used to parse HTML; `component/html/parser.ts` wraps it into the same `Node[]` AST shape the mapping engine reduces (see ADR-0002 — this replaced the project's earlier `himalaya`-based parser).  |
| **fast-xml-parser**              | The XML parser behind `RSSFeed`; exposes attributes with the `@_` prefix.                                                                                                                                                 |
| **sanitize-html**                | Sanitizes serialized nodes to an allowed tag/attribute set when building components. Despite the name, it's an inline implementation (`component/html/sanitize-html.ts`), not the `sanitize-html` npm package.            |
| **`<source>`**                   | An RSS 2.0 `<item>` sub-element (§4.1.1.20.9) naming the channel an item came from. `url` is required; the text (the channel's name) is optional. Built into `Item.source`.                                               |
| **`cf:` namespace**              | Canvasflow RSS extensions (`cf:isSponsored`, `cf:isPaid`, `cf:thumbnail`, …).                                                                                                                                             |
| **Recipe**                       | A JSON-LD recipe extracted from a page by `RSSFeed.getRecipeFromUrl`; schema in [`schema/recipe-schema.ts`](https://github.com/canvasflow/feed/blob/main/src/component/schema/recipe-schema.ts).                          |
| **Vite+ / `vp`**                 | The unified toolchain (`@voidzero-dev/vite-plus-*`) for build, test, lint, and format.                                                                                                                                    |
| **GitHub Packages**              | The registry the package is published to, under the `@canvasflow` scope.                                                                                                                                                  |

## See also

- [Architecture](Architecture.md)
- [API Reference](API-Reference.md)
- [HTML Mapping](HTML-Mapping.md) · [Custom Mappings](Custom-Mappings.md) · [RSS Feeds](RSS-Feeds.md)
