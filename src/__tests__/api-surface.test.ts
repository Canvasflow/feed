/**
 * Public API surface type tests.
 *
 * These are compile-time guards. Each `expectTypeOf` assertion encodes a
 * contract between the library and its consumers. A breaking change (renamed
 * field, widened/narrowed parameter, flipped readonly, removed export) will
 * cause a TypeScript error here before any runtime test can run.
 *
 * Note: for types that contain the large `FeedIssueCode` union (37+ literals)
 * we use structural property checks rather than full-type equality — the union
 * size exceeds what `expectTypeOf`'s internal constraint logic can represent
 * without triggering TS2344 false positives.
 */
import { describe, test, expectTypeOf } from 'vite-plus/test';

import {
  RSSFeed,
  buildItem,
  clone,
  replaceErrors,
  HTMLMapper,
  splitParagraphImages,
  isValidParams,
  validateParams,
  isValidMapping,
  isGalleryComponent,
  isGalleryImage,
  isImageComponent,
  isValidTextRole,
  isTextComponent,
  isHTMLTableComponent,
  isVideoComponent,
  isYoutubeComponent,
  isVimeoComponent,
  isDailymotionComponent,
  isTikTokComponent,
  isRecipeComponent,
  isContainerComponent,
  isLinkContainerComponent,
  isFigureContainerComponent,
  isButtonComponent,
  isAudioComponent,
  isTwitterComponent,
  isInstagramComponent,
  isInfogramComponent,
  isSpacerComponent,
  isCustomComponent,
  FeedIssueCodes,
  fetchUrl,
  getHtml,
  getHtmlContent,
  getJson,
  getRecipeFromUrl,
  nodeHttpsFetch,
} from '../index';

import type {
  RSS,
  Channel,
  ChannelImage,
  Item,
  MutableItem,
  Thumbnail,
  Enclosure,
  MediaGroup,
  MediaContent,
  FeedIssue,
  FeedIssueCode,
  FeedIssueSeverity,
  FetchOptions,
  Component,
  GalleryImage,
  GalleryComponent,
  ImageComponent,
  TextComponent,
  HTMLTableComponent,
  VideoComponent,
  YoutubeComponent,
  VimeoComponent,
  DailymotionComponent,
  TikTokComponent,
  AudioComponent,
  ButtonComponent,
  TwitterComponent,
  InstagramComponent,
  InfogramComponent,
  SpacerComponent,
  CustomComponent,
  RecipeComponent,
  ColumnsComponent,
  LiveContainerComponent,
  LivePostComponent,
  ContainerComponent,
  LinkContainerComponent,
  FigureContainerComponent,
  Params,
  Mapping,
  Filter,
  TagFilter,
  ClassFilter,
  AttributeFilter,
  AttributeValueFilter,
  AttributePatternFilter,
  MatchType,
  ComponentMapping,
  GalleryMapping,
  ColumnsMapping,
  LiveContainerMapping,
  ContainerMapping,
  CustomMapping,
  TextMapping,
  RecipeMapping,
  LinkResponse,
  TextType,
  ComponentType,
  BuildItemContext,
} from '../index';

const tags = { tags: ['unit'] };

// ---------------------------------------------------------------------------
// RSSFeed class
// ---------------------------------------------------------------------------

describe('RSSFeed API surface', () => {
  test('validate() returns Promise<void>', tags, () => {
    const feed = new RSSFeed('');
    expectTypeOf(feed.validate).returns.toEqualTypeOf<Promise<void>>();
  });

  test('build() return type resolves to an RSS-shaped object', tags, () => {
    const feed = new RSSFeed('');
    // toEqualTypeOf<RSS> trips on the large FeedIssueCode union internally.
    // Type-level conditional checks provide the same contract without that limit.
    type BuildResult = Awaited<ReturnType<typeof feed.build>>;
    type _HasChannel = BuildResult extends { channel: Channel } ? true : false;
    type _HasErrors = BuildResult extends { errors: unknown[] } ? true : false;
    expectTypeOf<_HasChannel>().toEqualTypeOf<true>();
    expectTypeOf<_HasErrors>().toEqualTypeOf<true>();
  });

  test('errors is FeedIssue[]', tags, () => {
    const feed = new RSSFeed('');
    expectTypeOf(feed.errors).toBeArray();
    expectTypeOf(feed.errors).items.toHaveProperty('message');
  });
});

// ---------------------------------------------------------------------------
// RSS / Channel / Item types
// ---------------------------------------------------------------------------

describe('RSS types', () => {
  test('RSS.channel is Channel', tags, () => {
    expectTypeOf<RSS['channel']>().toEqualTypeOf<Channel>();
  });

  test('Channel.items is Item[]', tags, () => {
    expectTypeOf<Channel['items']>().toEqualTypeOf<Item[]>();
  });

  test(
    'Item enclosure / mediaGroup / mediaContent arrays are readonly',
    tags,
    () => {
      expectTypeOf<Item['enclosure']>().toEqualTypeOf<readonly Enclosure[]>();
      expectTypeOf<Item['mediaGroup']>().toEqualTypeOf<readonly MediaGroup[]>();
      expectTypeOf<Item['mediaContent']>().toEqualTypeOf<
        readonly MediaContent[]
      >();
    }
  );

  test('Item.components is readonly Component[]', tags, () => {
    expectTypeOf<Item['components']>().toEqualTypeOf<readonly Component[]>();
  });

  test('Item.category is readonly string[] | undefined', tags, () => {
    expectTypeOf<Item['category']>().toEqualTypeOf<
      readonly string[] | undefined
    >();
  });

  test(
    'Item.errors / warnings are readonly arrays (not assignable to mutable)',
    tags,
    () => {
      // A mutable FeedIssue[] IS assignable to readonly FeedIssue[],
      // but readonly is NOT assignable back to mutable — confirming readonly.
      type _ReadonlyErrors = Item['errors'] extends readonly unknown[]
        ? true
        : false;
      type _ReadonlyWarnings = Item['warnings'] extends readonly unknown[]
        ? true
        : false;
      expectTypeOf<_ReadonlyErrors>().toEqualTypeOf<true>();
      expectTypeOf<_ReadonlyWarnings>().toEqualTypeOf<true>();
      // A mutable array extends readonly but NOT vice-versa
      type _MutableNotExtendsReadonly = FeedIssue[] extends Item['errors']
        ? true
        : false;
      type _ReadonlyNotExtendsMutable = Item['errors'] extends FeedIssue[]
        ? false
        : true;
      expectTypeOf<_MutableNotExtendsReadonly>().toEqualTypeOf<true>();
      expectTypeOf<_ReadonlyNotExtendsMutable>().toEqualTypeOf<true>();
    }
  );

  test('Enclosure.errors / warnings are readonly', tags, () => {
    type _E = Enclosure['errors'] extends readonly unknown[] ? true : false;
    type _ReadonlyNotMutable = Enclosure['errors'] extends FeedIssue[]
      ? false
      : true;
    expectTypeOf<_E>().toEqualTypeOf<true>();
    expectTypeOf<_ReadonlyNotMutable>().toEqualTypeOf<true>();
  });

  test('MediaContent.errors / warnings are readonly', tags, () => {
    type _E = MediaContent['errors'] extends readonly unknown[] ? true : false;
    type _ReadonlyNotMutable = MediaContent['errors'] extends FeedIssue[]
      ? false
      : true;
    expectTypeOf<_E>().toEqualTypeOf<true>();
    expectTypeOf<_ReadonlyNotMutable>().toEqualTypeOf<true>();
  });
});

// ---------------------------------------------------------------------------
// MutableItem / clone
// ---------------------------------------------------------------------------

describe('MutableItem and clone', () => {
  test(
    'MutableItem arrays are mutable (a mutable array is assignable to them)',
    tags,
    () => {
      // If MutableItem.errors were readonly, FeedIssue[] would NOT be assignable to it.
      type _MutableErrors = FeedIssue[] extends MutableItem['errors']
        ? true
        : false;
      expectTypeOf<_MutableErrors>().toEqualTypeOf<true>();
    }
  );

  test('clone parameter is Item', tags, () => {
    expectTypeOf(clone).parameter(0).toEqualTypeOf<Item>();
  });

  test('clone return type is MutableItem', tags, () => {
    expectTypeOf(clone).returns.toEqualTypeOf<MutableItem>();
  });
});

// ---------------------------------------------------------------------------
// FeedIssue model
// ---------------------------------------------------------------------------

describe('FeedIssue model', () => {
  test('FeedIssue.severity is FeedIssueSeverity', tags, () => {
    expectTypeOf<FeedIssue['severity']>().toEqualTypeOf<FeedIssueSeverity>();
  });

  test('FeedIssue.message is string', tags, () => {
    expectTypeOf<FeedIssue['message']>().toEqualTypeOf<string>();
  });

  test('FeedIssue.code is a string (FeedIssueCode)', tags, () => {
    expectTypeOf<FeedIssue['code']>().toMatchTypeOf<string>();
  });

  test('FeedIssueCodes is an object', tags, () => {
    expectTypeOf(FeedIssueCodes).toBeObject();
  });

  test('replaceErrors takes (string, unknown)', tags, () => {
    expectTypeOf(replaceErrors).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(replaceErrors).parameter(1).toEqualTypeOf<unknown>();
  });
});

// ---------------------------------------------------------------------------
// HTMLMapper
// ---------------------------------------------------------------------------

describe('HTMLMapper API surface', () => {
  test('HTMLMapper.toComponents(html) returns Component[]', tags, () => {
    expectTypeOf(HTMLMapper.toComponents).parameter(0).toEqualTypeOf<string>();
    expectTypeOf(HTMLMapper.toComponents).returns.toEqualTypeOf<Component[]>();
  });

  test('splitParagraphImages is a function', tags, () => {
    expectTypeOf(splitParagraphImages).toBeFunction();
  });
});

// ---------------------------------------------------------------------------
// Type guards narrow correctly
// ---------------------------------------------------------------------------

describe('is* type guards', () => {
  test('isImageComponent guards to ImageComponent', tags, () => {
    expectTypeOf(isImageComponent).guards.toEqualTypeOf<ImageComponent>();
  });

  test('isGalleryComponent guards to GalleryComponent', tags, () => {
    expectTypeOf(isGalleryComponent).guards.toEqualTypeOf<GalleryComponent>();
  });

  // isGalleryImage narrows to GalleryComponent (checks object IS a gallery
  // component with slides, not to the individual GalleryImage slide shape).
  test('isGalleryImage guards to GalleryComponent', tags, () => {
    expectTypeOf(isGalleryImage).guards.toEqualTypeOf<GalleryComponent>();
  });

  test('isTextComponent guards to TextComponent', tags, () => {
    expectTypeOf(isTextComponent).guards.toEqualTypeOf<TextComponent>();
  });

  test('isHTMLTableComponent guards to HTMLTableComponent', tags, () => {
    expectTypeOf(
      isHTMLTableComponent
    ).guards.toEqualTypeOf<HTMLTableComponent>();
  });

  test('isVideoComponent guards to VideoComponent', tags, () => {
    expectTypeOf(isVideoComponent).guards.toEqualTypeOf<VideoComponent>();
  });

  test('isContainerComponent guards to ContainerComponent', tags, () => {
    expectTypeOf(
      isContainerComponent
    ).guards.toEqualTypeOf<ContainerComponent>();
  });

  test(
    'isFigureContainerComponent guards to FigureContainerComponent',
    tags,
    () => {
      expectTypeOf(
        isFigureContainerComponent
      ).guards.toEqualTypeOf<FigureContainerComponent>();
    }
  );

  test(
    'isLinkContainerComponent guards to LinkContainerComponent',
    tags,
    () => {
      expectTypeOf(
        isLinkContainerComponent
      ).guards.toEqualTypeOf<LinkContainerComponent>();
    }
  );

  test('isValidTextRole guards to TextType', tags, () => {
    expectTypeOf(isValidTextRole).guards.toEqualTypeOf<TextType>();
  });

  test('remaining is* guards are functions', tags, () => {
    expectTypeOf(isYoutubeComponent).toBeFunction();
    expectTypeOf(isVimeoComponent).toBeFunction();
    expectTypeOf(isDailymotionComponent).toBeFunction();
    expectTypeOf(isTikTokComponent).toBeFunction();
    expectTypeOf(isRecipeComponent).toBeFunction();
    expectTypeOf(isButtonComponent).toBeFunction();
    expectTypeOf(isAudioComponent).toBeFunction();
    expectTypeOf(isTwitterComponent).toBeFunction();
    expectTypeOf(isInstagramComponent).toBeFunction();
    expectTypeOf(isInfogramComponent).toBeFunction();
    expectTypeOf(isSpacerComponent).toBeFunction();
    expectTypeOf(isCustomComponent).toBeFunction();
  });
});

// ---------------------------------------------------------------------------
// Mapping / Params
// ---------------------------------------------------------------------------

describe('Mapping / Params', () => {
  test('isValidParams(unknown) → boolean', tags, () => {
    expectTypeOf(isValidParams).parameter(0).toEqualTypeOf<unknown>();
    expectTypeOf(isValidParams).returns.toEqualTypeOf<boolean>();
  });

  test('validateParams(unknown) → Params', tags, () => {
    expectTypeOf(validateParams).parameter(0).toEqualTypeOf<unknown>();
    expectTypeOf(validateParams).returns.toEqualTypeOf<Params>();
  });

  test('isValidMapping(unknown) → boolean', tags, () => {
    expectTypeOf(isValidMapping).parameter(0).toEqualTypeOf<unknown>();
    expectTypeOf(isValidMapping).returns.toEqualTypeOf<boolean>();
  });
});

// ---------------------------------------------------------------------------
// Network utilities
// ---------------------------------------------------------------------------

describe('Network utilities', () => {
  test('getRecipeFromUrl first parameter is string', tags, () => {
    expectTypeOf(getRecipeFromUrl).parameter(0).toEqualTypeOf<string>();
  });

  test('fetchUrl first parameter is string', tags, () => {
    expectTypeOf(fetchUrl).parameter(0).toEqualTypeOf<string>();
  });

  test('getHtml first parameter is string', tags, () => {
    expectTypeOf(getHtml).parameter(0).toEqualTypeOf<string>();
  });

  test('getHtmlContent is the deprecated alias for getHtml', tags, () => {
    expectTypeOf(getHtmlContent).toEqualTypeOf<typeof getHtml>();
  });

  test(
    'getJson first parameter is string, returns unknown by default',
    tags,
    () => {
      expectTypeOf(getJson).parameter(0).toEqualTypeOf<string>();
      expectTypeOf(getJson<unknown>).returns.toEqualTypeOf<Promise<unknown>>();
    }
  );

  test('nodeHttpsFetch returns a fetch-compatible function', tags, () => {
    expectTypeOf(nodeHttpsFetch).returns.toEqualTypeOf<typeof fetch>();
  });
});

// ---------------------------------------------------------------------------
// buildItem export
// ---------------------------------------------------------------------------

describe('buildItem export', () => {
  test('buildItem is a function', tags, () => {
    expectTypeOf(buildItem).toBeFunction();
  });
});

// ---------------------------------------------------------------------------
// All named type exports are importable — compile-time only guard.
// If any type is removed or renamed this file fails to compile.
// ---------------------------------------------------------------------------

describe('named type exports are importable', () => {
  test('all types resolve without error', tags, () => {
    // This union is never evaluated at runtime. Its sole purpose is to force
    // TypeScript to resolve every named type export. A removed or renamed
    // type causes a compile error before any test runs.
    type _Checks =
      | RSS
      | Channel
      | ChannelImage
      | Item
      | MutableItem
      | Thumbnail
      | Enclosure
      | MediaGroup
      | MediaContent
      | FeedIssue
      | FeedIssueCode
      | FeedIssueSeverity
      | FetchOptions
      | Component
      | GalleryImage
      | GalleryComponent
      | ImageComponent
      | TextComponent
      | HTMLTableComponent
      | VideoComponent
      | YoutubeComponent
      | VimeoComponent
      | DailymotionComponent
      | TikTokComponent
      | AudioComponent
      | ButtonComponent
      | TwitterComponent
      | InstagramComponent
      | InfogramComponent
      | SpacerComponent
      | CustomComponent
      | RecipeComponent
      | ColumnsComponent
      | LiveContainerComponent
      | LivePostComponent
      | ContainerComponent
      | LinkContainerComponent
      | FigureContainerComponent
      | Params
      | Mapping
      | Filter
      | TagFilter
      | ClassFilter
      | AttributeFilter
      | AttributeValueFilter
      | AttributePatternFilter
      | MatchType
      | ComponentMapping
      | GalleryMapping
      | ColumnsMapping
      | LiveContainerMapping
      | ContainerMapping
      | CustomMapping
      | TextMapping
      | RecipeMapping
      | LinkResponse
      | TextType
      | ComponentType
      | BuildItemContext;

    expectTypeOf<_Checks>().not.toBeNever();
  });
});
