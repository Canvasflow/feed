
# HTML
In Canvasflow we process HTML elements, _tags_, and we try to match them to Canvasflow representation of components.

To achieve this we rely on the proper use of semantic HTML to try to provide meaning to the content that is being ingested.

## Flow

Canvasflow process different part of the document depending on the origin that it was used to process this.

1) If the content was processed inside an RSS feed, Canvasflow uses the `content:encoded` attributed to process the content.

2) If the content comes from processing an HTML page, canvasflow is going to try to search for an `<article>` element and is going to start processing from there.

Canvasflow is going to start processing each element from parent to child until it finds a match for a valid Canvasflow component.

> If a text or an invalid element is inside a component canvasflow is going to ignore the content. (E.g. `<img>` inside `<p>`, `<p>` inside `<h1>`, `<h1>` inside `<figure>`, etc.)

## Text Elements

Canvasflow has a list of text components available to provide semantic meaning to the content that is being used which are:

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

Canvasflow matches certain HTML elements to specific components, which are the following.

| HTML Element | Canvasflow Component |
|:--|:--|
| `h1` | `headline` |
| `h2` | `title` |
| `h3` | `subtitle` |
| `h4` | `intro` |
| `p` | `body` |
| `‌blockquote` | `blockquote` |
| `footer` | `footer` |

This values can be overwritten by specifying the `role` attribute to match the name of a canvasflow component.

**Example**
Let say we want to match a typical `<p>` element to a `crosshead` component.

The element would start like this:

```html
<p>
  This is a crosshead component in Canvasflow
</p>
```

For Canvasflow to interpret this as a `crosshead` component we need to specify the HTML attribute `role=“crosshead”`, like this:

```html
<p role="crosshead">
  This is a crosshead component in Canvasflow
</p>
```

This is an example on how to match one of the `text` components with HTML. Let say we want to assign a `<p>` element with the role `text12` in Canvasflow, we just need to specify the role as in the following example.

```html
<p role="text12">
  This is a text12 component in canvasflow
</p>
```

> Canvasflow only relies on the content of the page but ignores the behavior and styling, meaning that all attributes are ignored in text components (`style`, `class`) except for the attributes that are related to the `<a>` element (`href`, `target`, `rel`)

### Text Element Validation

Canvasflow is going to remove HTML elements that are invalid for Canvasflow Text Components, only the following [Phrasing Content](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Content_categories#phrasing_content) is allowed, if an element is not listed below is going to be ignored:

| HTML Element | Description |
|:--|:--|
| `<b>` | Represents an inline run of text that is different stylistically from normal text, typically by being bold, but conveys no other meaning of importance. [^1] |
| `‌<a>` | This tag is used to create links to other web pages on your website, external websites, or even other sections of the same page. [^2] |
| `<abbr>` | Identifies text as an abbreviation. [^3] |
| `<br>` | Configures a line break. [^3]|
| `<strong>` | It indicates that the text it surrounds is important or needs to be highlighted for non-stylistic reasons [^2] |
| `<em>` | It is commonly used to indicate that the text it surrounds is emphatic. [^2] |
| `<i>` | Represents an inline run of text in an alternative voice or tone that is supposed to be different from standard text but that is generally presented in italic type. [^1] |
| `<sup>` | This tag is used to display superscript text, which means that text marked with this tag is slightly elevated above the normal baseline. [^2] |
| `<sub>` | This tag is used to display subscripted text, which means that text marked with this tag is slightly lowered in relation to the normal baseline. [^2] |
| `<del>` | Configures deleted text. [^3]   |
| `<cite>` | The tag is used to indicate the source of a quotation or reference within HTML text. It is generally used to cite works such as books, articles, films, artistic works or similar references. [^2] |
| `<small>` | Represents small print, as in comments or legal fine print. [^1] |
| `<u>` | Configures text displayed with an underline. [^3] |
| `<time>` | Encloses content that represents a date and/or time . [^1] |


> ⚠️ WARNING
> Even though we support `<ol>`, `li` and `<ul>` inside `<p>` element is discourage because it is against HTML5 specification. [^4]

## Image Element

In Canvasflow we can translate HTML elements into a Canvasflow Image Component, but to achieve this there are three properties that we need to be able to detect from HTML.

| Property | Required | Description |
|:--|:--| :--|
| `src` | Yes | The source of the image. |
| `caption` | No | Describes the content of the image in words. |
| `credit` | No | It provides attribution for the image |

We achieve this by matching the following HTML tags and extract the correct data relying on proper semantic HTML.

> At the very least we need to be able to detect an image source from this html tags to be considered a valid Canvasflow Image component.

| HTML Tag | Description |
|:--|:--|
| [`<picture>`](#picture-element) | [HTML element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/picture) contains zero or more `<source>` elements and one `<img>` element to offer alternative versions of an image for different display/device scenarios. [^5]  |
| [`<figure>`](#figure-with-optional-caption-element) | [HTML Element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/figure) that represents a self-contained content, with an optional caption. [^6] |
| [`<img>`](#image-embedded-element) | [HTML element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img) that embeds an image into the document [^7] |

### Picture Element

The `<picture>` tag is a new HTML element that was added into HTML5, it acts as a container for image source files.


> The very last child inside this elements needs to be a standard [image element](#image-embedded-element). [^8]

The purpose of this element is that you can specify a `<source>` element that provides different images depending on the screen-size (by using the `media` attribute) and you set the `src` file with the `srcset` attribute.

This is an example of a `<picture>` element:

```html
<picture>
  <source media="(min-width: 1024px)" srcset="full-size.jpg">
  <source media="(min-width: 700px)" srcset="medium-size.jpg">
  <img src="cover.jpg" alt="My image">
</picture>
```

> At this point in time Canvasflow does not support multiple image size, so it will rely in the fallback `<img>` tag.

When processing the `<picture>` element, Canvasflow is going to take the `src` value from the `src` attribute inside the `<img>` element and, the `caption` from the `alt` attribute.

For this case the `src` would be `cover.jpg` and the `caption` would be `My image`.

> ⚠️ WARNING
> The `<picture>` element can only specify screen sizes, so any other element that is not either a `<source>` tag or an `<img>` tag will be ignored.
> If you want to add attribution or assign a different `caption` wrap the `<picture>` element in a [`<figure>`](#figure-with-optional-caption-element)

⛔️ This is an invalid usage of the `<picture>` element with `caption` and `credit`

```html
<picture>
  <source media="(min-width: 1024px)" srcset="full-size.jpg">
  <source media="(min-width: 700px)" srcset="medium-size.jpg">
  <img src="cover.jpg" alt="My image">
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
    <source media="(min-width: 1024px)" srcset="full-size.jpg">
    <source media="(min-width: 700px)" srcset="medium-size.jpg">
    <img src="cover.jpg">
  </picture>
  <figcaption>
    My image caption
    <small>This is a credit for the image</small>
  </figcaption>
</figure>
```


### Figure with Optional Caption element

The second way to detect images is by using the `<figure>` element, this elements wraps an image and its caption, _which goes inside the `<figcaption>` element. [^9]

```html
<figure>
  <img src="example.jpg">
  <figcaption>
		Caption content
    <small>Photo &copy; Bruce's mum</small>
  </figcaption>
</figure>
```

Canvasflow is going to treat `<small>` tags inside a `<figcaption>` as a credit. Another way to detec it is by adding the `role="credit"` to an HTML element that is inside the `<figcaption>`

### Image Embedded Element

The final way to detect images is by using the plain `<img>` element. _The attribute `alt` is going to be used to detect the `caption` of the component_.

```html
<img src="example.jpg" alt="This is a caption">
```

## Gallery Elements

## Video Elements

## Audio Elements

[^1]: Thomas A. Powell, (2010). Presentational Markup Removed and Redefined. _The Complete Reference HTML & CSS (5th Edition)_ (pp. 64, 67).
[^2]: Mohammed Mastafi, (2025). Styling Your Page with Formatting Tags. _Learn HTML & CSS: From Beginner to Expert_ (pp. 41-53).
[^3]: Terry Ann Felke-Morris, (2022). _Basic of Web Design HTML5 & CSS (6th Edition)_ (pp. 36, 454).
[^4]: WHATWG. 'The p element', June 09, 2025. https://html.spec.whatwg.org/multipage/grouping-content.html#the-p-element
[^5]: MDN Web Docs. ‘`<picture>`: The Picture element - HTML: MDN’, June 10, 2025. https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/picture
[^6]: MDN Web Docs. ‘`<figure>`: The Figure with Optional Caption element - HTML: MDN’, June 10, 2025. https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/figure
[^7]: MDN Web Docs. ‘`<img>`: The Image Embed element - HTML: MDN’, June 10, 2025. https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img
[^8]: Jeremy Kaith & Rachel Andrew (2016). Rich Media. _HTML 5 for Web Designers (2nd Edition)_ (pp. 18).
[^9]: Bruce Lawson and Remy Sharp (2012). Chapter 2: Text. _Introducing HTML 5 (2nd Edition)_ (pp. 51-53).
