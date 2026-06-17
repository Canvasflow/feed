# HTML

In Canvasflow, we process HTML elements, specifically tags, and attempt to match them with Canvasflow’s representation of components.

To achieve this, we rely on the proper use of semantic HTML to provide meaning to the content being ingested.

## Flow

Canvasflow processes different sections of a document depending on its origin.

1. If the content was processed inside an RSS feed, Canvasflow uses the `content:encoded` attribute to process the content.

2. If the content comes from processing an HTML page, canvasflow is going to try to search for an `<article>` element and is going to start processing from there.

Canvasflow will start processing each element from its parent to its child until it finds a valid HTML tag that can be matched to a Canvasflow component.

> If a text or an invalid element is inside a component, Canvasflow is going to ignore the content. (E.g. `<img>` inside `<p>`, `<p>` inside `<h1>`, `<h1>` inside `<figure>`, etc.)

## Text Elements

Canvasflow offers a list of text components that can be used to add semantic meaning to the content.

- `headline`
- `title`
- `subtitle`
- `intro`
- `byline`
- `crosshead`
- `body`
- `blockquote`
- `footer`
- `text1-text50`

> Canvasflow provides a set of components called `text` which enables users to group different type of components that can later by styled together.

Canvasflow pairs specific HTML elements with certain components like the following:

| HTML Element  | Canvasflow Component |
| :------------ | :------------------- |
| `h1`          | `headline`           |
| `h2`          | `title`              |
| `h3`          | `subtitle`           |
| `h4`          | `intro`              |
| `p`           | `body`               |
| `‌blockquote` | `blockquote`         |
| `footer`      | `footer`             |

The values can be overridden by specifying the `role` attribute to match the name of a Canvasflow component.

**Example**
Let's say we want to match a typical `<p>` element to a `crosshead` component.

The element would start like this:

```html
<p>This is a crosshead component in Canvasflow</p>
```

For Canvasflow to interpret this as a `crosshead` component we need to specify the HTML attribute `role=“crosshead”`, like this:

```html
<p role="crosshead">This is a crosshead component in Canvasflow</p>
```

This is an example of how to match one of the `text` components with HTML. Let's say we want to assign a `<p>` element with the role `text12` in Canvasflow, we just need to specify the role as in the following example.

```html
<p role="text12">This is a text12 component in canvasflow</p>
```

> Canvasflow only relies on the content of the page but ignores the behavior and styling, meaning that all attributes are ignored in text components (`style`, `class`) except for the attributes that are related to the `<a>` element (`href`, `target`, `rel`)

### Text Element Validation

Canvasflow is going to remove HTML elements that are invalid for Canvasflow Text Components, only the following [Phrasing Content](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Content_categories#phrasing_content) is allowed, if an element is not listed below is going to be ignored:

| HTML Element | Description                                                                                                                                                                                        |
| :----------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<b>`        | Represents an inline run of text that is different stylistically from normal text, typically by being bold, but conveys no other meaning of importance. [^1]                                       |
| `‌<a>`       | This tag is used to create links to other web pages on your website, external websites, or even other sections of the same page. [^2]                                                              |
| `<abbr>`     | Identifies text as an abbreviation. [^3]                                                                                                                                                           |
| `<br>`       | Configures a line break. [^3]                                                                                                                                                                      |
| `<strong>`   | It indicates that the text it surrounds is important or needs to be highlighted for non-stylistic reasons [^2]                                                                                     |
| `<em>`       | It is commonly used to indicate that the text it surrounds is emphatic. [^2]                                                                                                                       |
| `<i>`        | Represents an inline run of text in an alternative voice or tone that is supposed to be different from standard text but that is generally presented in italic type. [^1]                          |
| `<sup>`      | This tag is used to display superscript text, which means that text marked with this tag is slightly elevated above the normal baseline. [^2]                                                      |
| `<sub>`      | This tag is used to display subscripted text, which means that text marked with this tag is slightly lowered in relation to the normal baseline. [^2]                                              |
| `<del>`      | Configures deleted text. [^3]                                                                                                                                                                      |
| `<cite>`     | The tag is used to indicate the source of a quotation or reference within HTML text. It is generally used to cite works such as books, articles, films, artistic works or similar references. [^2] |
| `<small>`    | Represents small print, as in comments or legal fine print. [^1]                                                                                                                                   |
| `<u>`        | Configures text displayed with an underline. [^3]                                                                                                                                                  |
| `<time>`     | Encloses content that represents a date and/or time . [^1]                                                                                                                                         |

> ⚠️ WARNING
> Even though we support `<ol>`, `li` and `<ul>` inside `<p>` element is discourage because it is against HTML5 specification. [^4]

## Image Element

In Canvasflow we can translate HTML elements into a Canvasflow Image Component, but to achieve this there are three properties that we need to be able to detect from HTML.

| Property  | Required | Description                                  |
| :-------- | :------- | :------------------------------------------- |
| `src`     | Yes      | The source of the image.                     |
| `caption` | No       | Describes the content of the image in words. |
| `credit`  | No       | It provides attribution for the image        |

We achieve this by matching the following HTML tags and extracting the correct data relying on proper semantic HTML.

> At the very least we need to be able to detect an image source from these html tags to be considered a valid Canvasflow Image component.

| HTML Tag                                            | Description                                                                                                                                                                                                                                           |
| :-------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`<picture>`](#picture-element)                     | [HTML element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/picture) contains zero or more `<source>` elements and one `<img>` element to offer alternative versions of an image for different display/device scenarios. [^5] |
| [`<figure>`](#figure-with-optional-caption-element) | [HTML Element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/figure) that represents a self-contained content, with an optional caption. [^6]                                                                                  |
| [`<img>`](#image-embedded-element)                  | [HTML element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img) that embeds an image into the document [^7]                                                                                                                  |

### Picture Element

The `<picture>` tag is a new HTML element that was added to HTML5, it acts as a container for image source files.

> The very last child inside this element needs to be a standard [image element](#image-embedded-element). [^8]

The purpose of this element is that you can specify a `<source>` element that provides different images depending on the screen size (by using the `media` attribute) and you set the `src` file with the `srcset` attribute.

This is an example of a `<picture>` element:

```html
<picture>
  <source media="(min-width: 1024px)" srcset="full-size.jpg" />
  <source media="(min-width: 700px)" srcset="medium-size.jpg" />
  <img src="cover.jpg" alt="My image" />
</picture>
```

> At this point Canvasflow does not support multiple image sizes, so it will rely on the fallback `<img>` tag.

When processing the `<picture>` element, Canvasflow is going to take the `src` value from the `src` attribute inside the `<img>` element and, the `caption` from the `alt` attribute.

For this case the `src` would be `cover.jpg` and the `caption` would be `My image`.

> ⚠️ WARNING
> The `<picture>` element can only specify screen sizes, so any other element that is not either a `<source>` tag or an `<img>` tag will be ignored.
> If you want to add attribution or assign a different `caption` wrap the `<picture>` element in a [`<figure>`](#figure-with-optional-caption-element)

⛔️ This is an invalid usage of the `<picture>` element with `caption` and `credit`

```html
<picture>
  <source media="(min-width: 1024px)" srcset="full-size.jpg" />
  <source media="(min-width: 700px)" srcset="medium-size.jpg" />
  <img src="cover.jpg" alt="My image" />
  <!-- ❌ Invalid HTML -->
  <figcaption>
    This will not work
    <small>This is a credit will not work</small>
  </figcaption>
</picture>
```

✅ This is a correct usage of the `<picture>` element with `caption` and `credit`

```html
<figure>
  <picture>
    <source media="(min-width: 1024px)" srcset="full-size.jpg" />
    <source media="(min-width: 700px)" srcset="medium-size.jpg" />
    <img src="cover.jpg" />
  </picture>
  <figcaption>
    My image caption
    <small>This is a credit for the image</small>
  </figcaption>
</figure>
```

### Figure with Optional Caption element

The second way to detect images is by using the `<figure>` element, this element wraps an image and its caption, \_which goes inside the `<figcaption>` element. [^9]

```html
<figure>
  <img src="example.jpg" />
  <figcaption>
    Caption content
    <small>Photo &copy; Bruce's mum</small>
  </figcaption>
</figure>
```

Canvasflow is going to treat `<small>` tags inside a `<figcaption>` as a credit. Another way to determine it is by adding the `role="credit"` to an HTML element that is inside the `<figcaption>`.

### Image Embedded Element

The final way to detect images is by using the plain `<img>` element. _The attribute `alt` is going to be used to detect the `caption` of the component_.

```html
<img src="example.jpg" alt="This is a caption" />
```

## Gallery Elements

In HTML there isn’t a semantic way to describe a `gallery`, to help Canvasflow to identify that a particular content is a gallery we rely on the `role` attribute.

You can use container elements (e.g. `<div>`, `<figure>`, `<section>`) to group images and apply a `role="gallery"` to the container element.

```html
<figure role="gallery">
  <figure>
    <img src="image1.jpg" />
    <figcaption>
      Image 1 Caption
      <small role="credit">Photographer 1</small>
    </figcaption>
  </figure>
  <figure>
    <img src="image2.jpg" />
    <figcaption>
      Image 2 Caption
      <small role="credit">Photographer 2</small>
    </figcaption>
  </figure>
  <img src="image3.jpg" />
  <picture>
    <source media="(min-width: 1024px)" srcset="full-size.jpg" />
    <source media="(min-width: 700px)" srcset="medium-size.jpg" />
    <img src="image4.jpg" alt="My image" />
  </picture>
  <figcaption>Gallery Caption</figcaption>
</figure>
```

This is an example of how to represent a gallery component. Canvasflow is going to use all the direct descendants from the container that are valid tags to represent images (`<img>`, `<figure>`, or `<picture>`) and map them into items for the gallery.

To caption a gallery Canvasflow is going to use a `<figcaption>` element that is a direct descendant from the container element that is used.

> You can also set a caption to each item on the gallery by relying on the same semantic HTML that was used to detect [Image Elements](#image-element).

## Video Elements

In Canvasflow, we can translate HTML elements into a Canvasflow Hosted Video Component. To achieve this, the following properties need to be detected from the HTML.

| Property   | Required | Description                                                                                              |
| :--------- | :------- | :------------------------------------------------------------------------------------------------------- |
| `url`      | Yes      | The source of the video.                                                                                 |
| `poster`   | No       | The poster used while the video download.                                                                |
| `controls` | No       | Browser offer controls to control video playback, including volume, seeking, and pause/resume.           |
| `autoplay` | No       | Specify this attribute to start playing the video as soon as possible, without waiting for data loading. |
| `loop`     | No       | Specify this attribute to automatically seek back to the start when the video reaches its end.           |
| `muted`    | No       | Indicates the default audio mute setting in the video if specified.                                      |

We accomplish this by matching the appropriate HTML tags and extracting the correct data based on proper semantic HTML.

> At the very least we need to be able to detect a video source from these html tags to be considered a valid Canvasflow Hosted Video component.

We detect the `url` from the `src` attribute in the `<video>` element like the example below. [^10]

```html
<video src="video.mp4" poster="poster.png" controls loop muted />
```

Canvasflow can also detect them using the `<source>` element, like the following example. [^11]

```html
<video poster="poster.png" controls loop muted>
  <source src="movie.mp4" type="video/mp4" />
  <source src="movie.ogv" type="video/ogg" />
  <source src="movie.webm" type="video/webm" /></video
>;
```

> ⚠️ WARNING
> If multiple `<source>` elements are used, Canvasflow is going to choose the first one. Using the previous example as a reference, Canvasflow would use `movie.mp4` as the `url`.
> If the `src` attribute is set and also the `<source>` element, Canvasflow is going to use the first `<source>` element.

## Audio Elements

In Canvasflow, we can translate HTML elements into a Canvasflow Audio Component. To achieve this, the following properties need to be detected from the HTML.

| Property   | Required | Description                                                                                              |
| :--------- | :------- | :------------------------------------------------------------------------------------------------------- |
| `url`      | Yes      | The source of the audio.                                                                                 |
| `controls` | No       | Browser offer controls to control audio playback, including volume, seeking, and pause/resume.           |
| `autoplay` | No       | Specify this attribute to start playing the audio as soon as possible, without waiting for data loading. |
| `loop`     | No       | Specify this attribute to automatically seek back to the start when the audio reaches its end.           |
| `muted`    | No       | Attribute that indicates whether the audio will be initially silenced if specified.                      |

We accomplish this by matching the appropriate HTML tags and extracting the correct data based on proper semantic HTML.

> At the very least we need to be able to detect an audio source from these html tags to be considered a valid Canvasflow Audio Component.

We detect the `url` from the `src` attribute in the `<audio>` element like the example below. [^12]

```html
<audio src="audio.mp3" controls loop muted />
```

Canvasflow can also detect them using the `<source>` element, like the following example. [^13]

```html
<audio loop muted>
  <source src="audio.ogg" type="audio/ogg" />
  <source src="audio.mp3" type="audio/mpeg" />
</audio>
```

> ⚠️ WARNING
> If multiple `<source>` elements are used Canvasflow is going to choose the first one. Using the previous example as a reference, Canvasflow would use `audio.ogg` as the `src`.
> If the `src` attribute is set and also the `<source>` element, Canvasflow is going to use the first `<source>` element.

## Button Elements

In Canvasflow, we can translate HTML elements into a Canvasflow Button Component. To achieve this, the following properties need to be detected from the HTML.

| Property | Required | Description                                      |
| :------- | :------- | :----------------------------------------------- |
| `text`   | Yes      | Text that is going to be displayed by the button |
| `link`   | Yes      | Url to which the user is going to navigate       |

We accomplish this by matching the appropriate HTML tags and extracting the correct data based on proper semantic HTML.

There are two ways that we can detect a button

### Anchor tags

We can detect a button using an anchor tag as long as the tag has the role `button`.

> We only detect this kind of anchor tag as long as it's not a children of any element of another type of component, for example if the anchor tag is located inside a `<p>` tag is going to be treated as a regular link inside a text component instead of a button.

```html
<a
  href="https://example.com"
  role="button"
  rel="nofollow noopener"
  aria-label="Example Button"
  target="_blank"
>
  Example Button
</a>
```

Canvasflow is going to detect the `link` from the `href` property which in this case is `https://example.com` and is going to detect the `text` property from the text children from the anchor, in this case it would be `Example Button`.

> ⚠️ WARNING
> Only text elements are valid as direct children from the anchor tag if it's being used as a `button`, any html element node is going to be deleted and all it's children.

### Button Tags

The other way that canvasflow is going to detect a button is by using the `button` component with an `a` tag as it's direct children.

> ⚠️ WARNING
> Any other html element that is a direct children in the `button` component that is not an `a` element is going to be deleted.
> In case there are multiple anchor tags canvasflow is only going to take the first one.

```html
<button>
  <a href="https://example.com" target="_blank"> Example Button </a>
</button>
```

In this example the `text` would be `Example Button` and the `link` would be `https://example.com`

## Social Embed

Canvasflow support pre-defined social embeds which are provided for each social network platform

### Instagram

To detect instagram components canvasflow is going to rely on a component using the tag `blockquote` with the attribute `data-instgrm-permalink` containing post url.

This is an example of a valid instagram component:

```html
<blockquote
  class="instagram-media"
  data-instgrm-captioned
  data-instgrm-permalink="https://www.instagram.com/p/DKZFL6pIVwo/?utm_source=ig_embed&amp;utm_campaign=loading"
  data-instgrm-version="14"
>
  <a
    href="https://www.instagram.com/p/DKZFL6pIVwo/?utm_source=ig_embed&amp;utm_campaign=loading"
    target="_blank"
  >
    View this post on Instagram
  </a>
  <p>
    <a
      href="https://www.instagram.com/p/DKZFL6pIVwo/?utm_source=ig_embed&amp;utm_campaign=loading"
      target="_blank"
    >
      A post shared by Max Verstappen (@maxverstappen1)
    </a>
  </p>
</blockquote>
```

> Any other tag that is not a `blockquote` is going to be ignored
> If the attribute `data-instgrm-permalink` is missing the component is going to be ignored since this the the url that we are going to use as reference to detect if the url is a `post`, a `reel` or a `tv` instagram component

### Twitter / X

To detect a twitter components Canvasflow is going to rely on a component using the tag `blockquote` (or the `a` tag) while also having either the `twitter-tweet` and the `twitter-timeline` inside the class of the component.

From the html elements we need to be able to get two values:

1. The `id`
2. The `account`

We are going to extract the link from the first `a` tag that we find is a direct children of the html node and use the url to get the required values using the following regular expression.

```
^https?:\/\/twitter\.com\/(?:#!\/)?(\w+)\/status(es)?\/(\d+)
```

This is an example of a valid twitter tweet:

```html
<blockquote class="twitter-tweet">
  <p lang="en" dir="ltr">
    "He did it!" Jimmie Johnson and Bobby Labonte put on a show in the 2005
    Coca-Cola 600 at Charlotte Motor Speedway.
    <a href="https://t.co/t2j2mXmL3L">pic.twitter.com/t2j2mXmL3L</a>
  </p>
  &mdash; FOX: NASCAR (@NASCARONFOX)
  <a
    href="https://twitter.com/NASCARONFOX/status/1397629106427101185?ref_src=twsrc%5Etfw"
  >
    May 26, 2021
  </a>
</blockquote>
```

We are going to extract the link from the first a tag that we find is a direct children of the html node and use the url to get the required values using the following regular expression.

### TikTok

To detect a TikTok Canvasflow is going to rely on a component using the tag `blockquote`, while also having the class `tiktok-embed` and the url that is going to be used as reference must exist in the attribute `cite`

> If any of those requirements are missing the component is going to be ignored.

We get the url from the `cite` attribute, and that url should match the follow regular expression.

```
^https:\/\/www\.tiktok\.com\/(@[\w.\-_]+)\/video\/(\d+)(?:[/?].*)?$
```

From the url we need to be able to get two values:

- The `username`
- The `id`

This is an example of a valid TikTok component:

```html
<blockquote
  class="tiktok-embed"
  cite="https://www.tiktok.com/@kingar4__/video/7388884417025985824"
></blockquote>
```

For the example the `username` is `@kingar4__` and the `id` would be `7388884417025985824`

### YouTube

Youtube videos are treated as `video` components in Canvasflow, the same logic that is used for Video Components is applied to YouTube, the only difference is that a YouTube component requires an `iframe` to be detected and the url that is in the `src` is what Canvasflow is going to use to detect the parameters.

This url must match the following regular expression:

```
/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
```

And this is going to help us to extract the `id` of the video.

This is an example of a valid YouTube video component:

```html
<iframe
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  allowfullscreen=""
  frameborder="0"
  height="315"
  src="https://www.youtube.com/embed/ZrCs3HYxflk?si=8USctaxbSBPyMsBE"
  title="YouTube video player"
  width="560"
></iframe>
```

The `id` for this example is `ZrCs3HYxflk`

## HTML Table Elements

In Canvasflow, we translate HTML `<table>` element into a Canvasflow HTML Table Component. To achieve this we take all the html content that lives inside the `<table>` element.

| Property | Required | Description                                 |
| :------- | :------- | :------------------------------------------ |
| `html`   | Yes      | Content that is contained within `<table>`. |

This content is subject to certain restrictions. Only the explicitly stated HTML tags are permitted, which are:

- `<table>`
- `<thead>`
- `<tbody>`
- `<tfoot>`
- `<tr>`
- `<td>`
- `<em>`
- `<i>`
- `<b>`
- `<strong>`
- `<sup>`
- `<sub>`
- `<span>`
- `<br>`
- `<small>`
- `<s>`
- `<a>`

> Any other tag that is not listed is going to be removed from the content

## Container Components

In Canvasflow, there are ways to group different components into a cohesive unit. This type of component is called a Container Component.

By default, Canvasflow processes HTML content and, upon encountering a [Block-Level Content](https://developer.mozilla.org/en-US/docs/Glossary/Block-level_content) element such as a `<div>` or a [Semantic Element](https://developer.mozilla.org/en-US/docs/Glossary/Semantics#semantic_elements) (such as `<article>`, `<aside>`, or `<main>`), it ignores that element and begins evaluating its children until it finds content that matches a Canvasflow component.

At this time, Canvasflow supports the following container components:

- [Live Container Component](#live-container-component)
- [Container Component](#container-component)
- [Columns Component](#columns-component)
- [Recipe Component](#recipe-component)

Each of these component types requires a way for Canvasflow to determine whether an element should be treated as a Container Component, or whether it should continue evaluating child HTML elements until a match is found. To enable this, customers must provide a `Mapping`.

### Mapping

A `Mapping` defines a set of rules established by the customer that tell Canvasflow how to identify whether an HTML element being evaluated is a Container Component, and which type it is. Each container component type has its own identification method, but all of them are based on the following foundational mapping properties:

- `filters`
- `match`

#### Filters

Filters define which properties of an HTML element Canvasflow should look for. A list of filters must be provided to help Canvasflow identify the relevant properties of a given HTML element.

There are three types of filters available:

- [Tag Filter](#tag-filter)
- [Class Filter](#class-filter)
- [Attribute Filter](#attribute-filter)

##### Tag Filter

This filter identifies HTML elements based on their tag name.

It requires a list of tags, referred to as `items`, that Canvasflow should consider when determining whether an HTML element is a valid candidate for a container component.

> In most cases, only one tag is needed.

##### Class Filter

This filter looks exclusively at the `class` attribute of an HTML element. It requires two properties:

- `match`
- `items`

`match`: Accepts one of three values. `any` means that a match is valid as long as at least one of the specified classes is present in the element's class list. `all` means that every specified class must be present, regardless of order. `equal` is a strict version of `all`, requiring all classes to appear in the exact order specified.

`items`: A list of class names to match against.

##### Attribute Filter

This filter searches for a specific attribute within an HTML element. It requires two properties:

- `key`
- `value`

`key`: The name of the attribute to look for.

`value`: The exact value that attribute must have.

#### Match

Defines how many filters must match for an element to be considered the root of a Container Component. This value can be either `any` or `all`.

`any` means only one filter needs to match for the mapping to be considered valid. `all` means every filter must match; otherwise, the HTML element will be ignored.

---

### Container Component

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

### Recipe Component

This component is nearly identical to the [Container Component](#container-component). The only difference is an additional `url` property, which specifies the website from which the recipe referenced by this component originates.

> The URL provided should point to a page that includes an `LD+JSON` block describing the recipe.

The mapping structure is the same as the container component; only the `component` value changes from `container` to `recipe`.

> The URL will be identified using the `<link>` element present in the `<item>` at the RSS level. If needed, this value can be overridden within the Canvasflow editor.

---

### Columns Component

This is a container component that arranges child elements side by side. It is essentially a group of groups of components.

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

The following mapping detects the outer columns container using the class `cf-columns`, and specifies how to detect each individual column using the class `cf-column` via the `column` property. The `column` property also takes a `match` value and a list of `filters`.

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

### Live Container Component

This is a container component that represents an ongoing story that receives constant updates and posts in real time.

> This component type can only contain `live_post` components as children.

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

Without a mapping, this HTML will be treated as a series of individual text components. To instruct Canvasflow to interpret this as a live container component, a mapping of type `live_container` must be created.

#### Live Post Component

A live post represents an individual update or entry within a `live_container` component. Each post must include a timestamp indicating when it was last updated.

> This component type can only exist as a child of a `live_container` component.

Posts must be displayed in reverse chronological order, with the most recent content appearing first.

> A `live_post` cannot contain another `live_post` or `live_container` component within it.

Each live post must also include a unique identifier.

#### Live Container Mapping

The mapping for a live container component uses the standard mapping properties (`filters` and `match`) to identify the origin and scope of the container. However, an additional property, `post`, is required to specify how individual posts within the container are detected. The `post` property also accepts a `match` value and a list of `filters`.

The following JSON example shows how this mapping would be configured for the HTML above:

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

Canvasflow processes this mapping by first locating the HTML node that matches the live container criteria. Once found, it searches the descendants of that node for elements that match the Live Post Component mapping, as defined by the `post` property. The matching nodes are then flattened to the same level, and the content within each live post is processed.

> The `component` value must be set to `live_container` so that Canvasflow knows which type of container component is being mapped.

[^1]: Thomas A. Powell, (2010). Presentational Markup Removed and Redefined. _The Complete Reference HTML & CSS (5th Edition)_ (pp. 64, 67).

[^2]: Mohammed Mastafi, (2025). Styling Your Page with Formatting Tags. _Learn HTML & CSS: From Beginner to Expert_ (pp. 41-53).

[^3]: Terry Ann Felke-Morris, (2022). _Basic of Web Design HTML5 & CSS (6th Edition)_ (pp. 36, 454).

[^4]: WHATWG. 'The p element', June 09, 2025. https://html.spec.whatwg.org/multipage/grouping-content.html#the-p-element

[^5]: MDN Web Docs. ‘`<picture>`: The Picture element - HTML: MDN’, June 10, 2025. https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/picture

[^6]: MDN Web Docs. ‘`<figure>`: The Figure with Optional Caption element - HTML: MDN’, June 10, 2025. https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/figure

[^7]: MDN Web Docs. ‘`<img>`: The Image Embed element - HTML: MDN’, June 10, 2025. https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img

[^8]: Jeremy Kaith & Rachel Andrew (2016). Rich Media. _HTML 5 for Web Designers (2nd Edition)_ (pp. 18).

[^9]: Bruce Lawson and Remy Sharp (2012). Chapter 2: Text. _Introducing HTML 5 (2nd Edition)_ (pp. 51-53).

[^10]: MDN Web Docs. ‘`<video>`: The Video Embed element’, June 23, 2025. https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video

[^11]: MDN Web Docs. ‘Usage Notes’, June 23, 2025. https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video#usage_notes

[^12]: MDN Web Docs. ‘`<audio>`: The Embed Audio element’, June 23, 2025. https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/audio

[^13]: MDN Web Docs. ‘Usage Notes’, June 23, 2025. https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/audio#usage-notes
