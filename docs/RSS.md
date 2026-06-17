# RSS

[RSS](https://www.rssboard.org/rss-specification), which stands for _Really Simple Syndication_, is a file format used by websites to automatically distribute updates about their published content.

Canvasflow retrieves RSS feeds and processes the `item` elements, converting them into articles.

The core functionalities of the RSS syndication format can be categorized into four main areas: [^1]

| Category                   | Description                                                 |
| :------------------------- | :---------------------------------------------------------- |
| Architecture               | Structure of information                                    |
| Content                    | Description and reproduction of information                 |
| Identification and linking | Relocating to other information on the Web                  |
| Metadata                   | Description of important characteristics of the information |

## Structure

RSS comprises three primary structural elements: `rss`, `channel`, and `item`. The entire content of an RSS document is distributed either across the channel element as a whole or within individual item elements.

The term `channel` implies that the content of an RSS document functions similarly to that of a news or broadcast channel. An `item` represents a discrete information object included within the channel. The `rss` element serves as the root of the document hierarchy, encompassing the `channel` element and including a version attribute that specifies the RSS version in use.

> According to the RSS specification, only one `channel` element is permitted per `rss` feed, and Canvasflow adheres strictly to this requirement.

Typically, feed documents reference an external web resource, identified by the `link` element. This is because the feed not only represents content but also provides a description of the associated web resource. As such, the inclusion of the `link` element is mandatory.

The following is an example of an RSS feed:

```xml
<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:content="http://schemas.ingestion.microsoft.com/common/">
  <channel>
    <title>Title</title>
    <description>...</description>
    <link>...</link>
    <language>en-UK</language>
    <ttl>60</ttl>
    <pubDate>Thu, 22 May 2025 08:50:00 +0100</pubDate>
    <lastBuildDate>Thu, 22 May 2025 08:50:00 +0100</lastBuildDate>
    <item>
      <title>
        Lotus could replace the Emira&#039;s supercharged V6 with a booming V8
      </title>
      <guid isPermaLink="false">174796</guid>
      <content:encoded>
	      <![CDATA[
	        <h1>Headline example</h1>
	      ]]>
      </content:encoded>
    </item>
  </channel>
</rss>
```

### RSS

This element serves as the root of the RSS document. Within it, the `rss` element must be used, and the RSS version being implemented must be specified using the `version` attribute.

Additionally, any XML namespaces required by the feed should be declared within the `rss` element to ensure their availability throughout the document.

Example:

```xml
<rss
    version="2.0"
    xmlns:content="http://purl.org/rss/1.0/modules/content/"
    xmlns:atom="http://www.w3.org/2005/Atom"
    xmlns:dc="dc"
    xmlns:media="media">
</rss>
```

### Channel

| Ancestor |
| :------- |
| `rss`    |

Although XML is an extensible specification, Canvasflow does not support all elements and attributes that may be present in an RSS feed. At the `channel` level, Canvasflow supports only the following elements: [^2]

| Element         | Requirement | Description                                                                                                                                                  |
| :-------------- | :---------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`         | `required`  | The title of the RSS feed.                                                                                                                                   |
| `item`          | `required`  | Each [item](#item) element defines an article or "story" in the feed. At least one is required.                                                              |
| `link`          | `optional`  | The URL of the website associated with the feed.                                                                                                             |
| `description`   | `optional`  | A short description of the feed.                                                                                                                             |
| `language`      | `optional`  | The language of the channel (e.g. `en-GB`).                                                                                                                  |
| `generator`     | `optional`  | A string indicating the program used to generate the channel.                                                                                                |
| `docs`          | `optional`  | A URL pointing to the documentation for the format used in the RSS file.                                                                                     |
| `pubDate`       | `optional`  | The publication date for the content in the channel.                                                                                                         |
| `lastBuildDate` | `optional`  | The last time the content of the channel changed.                                                                                                            |
| `category`      | `optional`  | One or more categories that the channel belongs to.                                                                                                          |
| `image`         | `optional`  | A GIF, JPEG, or PNG image that can be displayed with the channel. More info [here](https://cyber.harvard.edu/rss/rss.html#ltimagegtSubelementOfLtchannelgt). |
| `ttl`           | `optional`  | Time to live — the number of minutes a channel can be cached before refreshing from the source.                                                              |

> Only `title` and `item` are mandatory; a feed missing either reports an error during validation.

### Item

| Ancestor  |
| :-------- |
| `channel` |

A `channel` element may contain any number of `<item>` elements. Each `item` can represent a “story,” similar to an article in a newspaper or magazine. In such cases, the description element provides a synopsis of the story, and the link element directs users to the full version.

Alternatively, an `item` may be self-contained. In this case, the `description` element includes the complete content (entity-encoded HTML is permitted). [^3]

| Element           | Requirement | Description                                                                                  |
| :---------------- | :---------- | :------------------------------------------------------------------------------------------- |
| `title`           | `required`  | The title of the item.                                                                       |
| `guid`            | `required`  | A unique identifier for the item.                                                            |
| `pubDate`         | `required`  | The publication date for the item.                                                           |
| `link`            | `optional`  | The hyperlink to the item.                                                                   |
| `description`     | `optional`  | A description or synopsis of the item.                                                       |
| `category`        | `optional`  | One or more categories the item belongs to.                                                  |
| `author`          | `optional`  | The author of the item.                                                                      |
| `enclosure`       | `optional`  | Attaches a media file to the item.                                                           |
| `content:encoded` | `optional`  | The full HTML body of the item. See [Content](#content). This is the source of `components`. |

> Only `title`, `guid`, and `pubDate` are mandatory; an item missing any of them reports an error during validation. Items also accept the [Media RSS](#media-rss), [Dublin Core](#dublin-core), [Atom](#atom), and [Canvasflow](#canvasflow) namespaced elements described below.

## Namespaces

Canvasflow supports the following namespaces:

- [Atom](#atom)
- [Dublin Core](#dublin-core)
- [Syndication](#syndication)
- [Content](#content)
- [Media RSS](#media-rss)
- [Canvasflow](#canvasflow)

> Canvasflow does not support every element a namespace defines. Any element not listed below is unsupported and will be ignored.

### Atom

| Prefix | URI                           | Namespace Declaration                                          |
| :----- | :---------------------------- | :------------------------------------------------------------- |
| `atom` | `http://www.w3.org/2005/Atom` | `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">` |

The [Atom](https://datatracker.ietf.org/doc/html/rfc4287) namespace (`http://www.w3.org/2005/Atom`) is commonly used to incorporate Atom elements into other XML-based formats, such as RSS 2.0. This integration enhances metadata support and promotes greater interoperability with modern feed consumers.[^4]

By enabling the inclusion of Atom-specific elements within an RSS document, the Atom namespace improves semantic clarity and facilitates the standardization of feed metadata.

| Element        | Ancestor  | Requirement | Description                                                                                                                                            |
| :------------- | :-------- | :---------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `atom:link`    | `channel` | `optional`  | Specifies the URL of the feed itself — a self-reference — so that feed readers, aggregators, and crawlers can correctly identify the canonical source. |
| `atom:author`  | `item`    | `optional`  | The author of the item. Canvasflow reads the nested `atom:name`, `atom:uri`, and `atom:email` elements.                                                |
| `atom:updated` | `item`    | `optional`  | An [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) datetime indicating when the item was last updated.                                              |

### Dublin Core

| Prefix | URI                                | Namespace Declaration                                             |
| :----- | :--------------------------------- | :---------------------------------------------------------------- |
| `dc`   | `http://purl.org/dc/elements/1.1/` | `<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">` |

The [Dublin Core](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/) namespace (`http://purl.org/dc/elements/1.1/`), is used within RSS feeds to incorporate standardized metadata elements into both the feed and its individual items, such as creator, date, subject, and language. [^5]

RSS 2.0 provides a relatively limited set of built-in metadata fields. By leveraging the Dublin Core namespace, publishers can enhance RSS feeds with a broader range of standardized tags, improving:

- Author information
- Publication date
- Language and coverage
- Content categorization

| Element            | Ancestor | Requirement | Description                                                                                                                               |
| :----------------- | :------- | :---------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| `dc:creator`       | `item`   | `optional`  | Specifies the author of the item.                                                                                                         |
| `dc:date`          | `item`   | `optional`  | An [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601)-formatted publication date (`YYYY-MM-DDThh:mm:ssZ`).                                |
| `dc:language`      | `item`   | `optional`  | Language of the feed or item (e.g. `en`, `fr`, `de`).                                                                                     |
| `dcterms:modified` | `item`   | `optional`  | An [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) datetime from the DCMI Terms vocabulary indicating when the item was last modified. |

### Syndication

| Prefix | URI                                            | Namespace Declaration                                                         |
| :----- | :--------------------------------------------- | :---------------------------------------------------------------------------- |
| `sy`   | `http://purl.org/rss/1.0/modules/syndication/` | `<rss version="2.0" xmlns:sy="http://purl.org/rss/1.0/modules/syndication/">` |

The [Syndication](https://web.resource.org/rss/1.0/modules/syndication/) namespace (`http://purl.org/rss/1.0/modules/syndication/`), provides metadata that informs aggregators and other consumers of an RSS feed about its expected update frequency. [^6]

For instance, if a feed is updated twice per hour, the `updatePeriod` element would be set to `hourly`, and the `updateFrequency` element would be set to 2. The syndication module is derived from Ian Davis’s [Open Content Syndication (OCS)](http://internetalchemy.org/ocs/) directory format.

This module supersedes the `skipDay` and `skipHour` elements previously used in RSS 0.91 to indicate scheduling constraints.

| Element              | Ancestor  | Requirement | Description                                                                                                                                                          |
| :------------------- | :-------- | :---------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sy:updatePeriod`    | `channel` | `optional`  | Specifies the basic unit of time used for updates. <br/><br/> Values:<ul><li>`hourly`</li><li>`daily`</li><li>`weekly`</li> <li>`monthly`</li><li>`yearly`</li></ul> |
| `sy:updateFrequency` | `channel` | `optional`  | Multiplier for the period.                                                                                                                                           |
| `sy:updateBase`      | `channel` | `optional`  | An [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) datetime that acts as the baseline from which update intervals are measured.                                   |

### Content

| Prefix    | URI                                        | Namespace Declaration                                                          |
| :-------- | :----------------------------------------- | :----------------------------------------------------------------------------- |
| `content` | `http://purl.org/rss/1.0/modules/content/` | `<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">` |

The [Content](https://web.resource.org/rss/1.0/modules/content/) namespace (`http://purl.org/rss/1.0/modules/content/`), is used to include rich, encoded content within RSS feed items—typically full-text HTML, multimedia, or other formatted data that exceeds the limitations of the standard `<description>` element. [^7]

While RSS 2.0 includes the `<description>` element—primarily intended for brief summaries or plain text—the Content namespace allows publishers to embed full HTML or richly formatted content using the following element:

```xml
<content:encoded>
	<![CDATA[ ...full HTML content... ]]>
</content:encoded>
```

| Element           | Ancestor | Requirement | Description                                                                                                             |
| :---------------- | :------- | :---------- | :---------------------------------------------------------------------------------------------------------------------- |
| `content:encoded` | `item`   | `optional`  | Holds the full content of the RSS item, usually in HTML. Must be enclosed in `<![CDATA[ ... ]]>` to preserve HTML tags. |

### Media RSS

| Prefix  | URI                             | Namespace Declaration                                             |
| :------ | :------------------------------ | :---------------------------------------------------------------- |
| `media` | `http://search.yahoo.com/mrss/` | `<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">` |

The [Media RSS](https://www.rssboard.org/media-rss) namespace (`http://search.yahoo.com/mrss/`), is an RSS module that supplements the `<enclosure>` capabilities of RSS 2.0. [^8]

It enhances RSS by providing structured support for multimedia content such as images, audio, and video. Media RSS is widely utilized in applications including podcasts, video feeds, photo galleries, and any other feeds requiring detailed description and distribution of rich media assets.

Media RSS enhances the capabilities of RSS 2.0 by allowing you to:

- Include multiple media files per item
- Attach thumbnails, categories, credits, and metadata
- Specify different formats, resolutions, and durations

| Element             | Ancestor                | Requirement | Description                                                                                                                                                                                                                                                                            |
| :------------------ | :---------------------- | :---------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `media:group`       | `item`                  | `optional`  | It allows grouping of `<media:content>` elements that are effectively the same content, yet different representations. <br/><br/> For instance: the same song recorded in both the WAV and MP3 format. </br></br>**It's an optional element that must only be used for this purpose.** |
| `media:content`     | `item` or `media:group` | `optional`  | The main element describing a media file. Canvasflow reads the `url` (required), `type`, `fileSize`, `medium` (`image`, `audio`, `video`, `document`, or `executable`), and `isDefault` attributes.                                                                                    |
| `media:title`       | `media:content`         | `optional`  | Title of the media object.                                                                                                                                                                                                                                                             |
| `media:description` | `media:content`         | `optional`  | Full description of the media content.                                                                                                                                                                                                                                                 |
| `media:thumbnail`   | `media:content`         | `optional`  | One or more preview images.                                                                                                                                                                                                                                                            |
| `media:credit`      | `media:content`         | `optional`  | Credits or creators of the media (e.g., photographer, author).                                                                                                                                                                                                                         |

### Canvasflow

| Prefix | URI                            | Namespace Declaration                                         |
| :----- | :----------------------------- | :------------------------------------------------------------ |
| `cf`   | `https://www.canvasflow.io/cf` | `<rss version="2.0" xmlns:cf="https://www.canvasflow.io/cf">` |

The Canvasflow (`cf`) namespace provides extension elements specific to Canvasflow, used to flag editorial attributes of an item and to supply a thumbnail. These elements have no equivalent in standard RSS and are ignored by other feed consumers.

| Element                | Ancestor | Requirement | Description                                                                                                   |
| :--------------------- | :------- | :---------- | :------------------------------------------------------------------------------------------------------------ |
| `cf:hasAffiliateLinks` | `item`   | `optional`  | A boolean indicating whether the item contains affiliate links.                                               |
| `cf:isSponsored`       | `item`   | `optional`  | A boolean indicating whether the item is sponsored content.                                                   |
| `cf:isPaid`            | `item`   | `optional`  | A boolean indicating whether the item is paid (premium) content.                                              |
| `cf:liveCoverageState` | `item`   | `optional`  | The live-coverage state of the item. One of `live`, `completed`, or empty.                                    |
| `cf:thumbnail`         | `item`   | `optional`  | A thumbnail image for the item, with a required `url` and optional `width`, `height`, `type`, and `fileSize`. |

[^1]: Wittenbrink, H. (2005). Semantics: The RSS Model. _RSS and Atom_ (pp. 14-15).

[^2]: Tutorialspoint. 'RSS - Version 2.0 Tags and Syntax', June 02, 2025. https://www.tutorialspoint.com/rss/rss2.0-tag-syntax.htm

[^3]: Berkman Center. 'RSS 2.0 at Harvard Law', July 15, 2003. https://cyber.harvard.edu/rss/rss.html#hrelementsOfLtitemgt

[^4]: M. Nottingham, R. Sayre. 'The Atom Syndication Format', December, 2005. https://datatracker.ietf.org/doc/html/rfc4287

[^5]: DCMI Usage Board. 'DCMI Metadata Terms', January 01, 2020. https://www.dublincore.org/specifications/dublin-core/dcmi-terms/

[^6]: RSS-DEV Working Group. 'RDF Site Summary 1.0 Modules: Syndication', December 20, 2000. https://web.resource.org/rss/1.0/modules/syndication/

[^7]: Gabe Beged-Dov, Aaron Swartz, Eric van der Vlist. 'RDF Site Summary 1.0 Modules: Content', October 10, 2002. https://web.resource.org/rss/1.0/modules/content/

[^8]: RSS ADVISORY BOARD. 'Media RSS Specification (Current)', December 11, 2009. https://www.rssboard.org/media-rss
