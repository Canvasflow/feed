// ─── RSS / Feed parsing ───────────────────────────────────────────────────────

export { RSSFeed, buildItem } from './rss/rss-feed';
export type { BuildItemContext } from './rss/rss-feed';

export type {
  RSS,
  Channel,
  ChannelImage,
  Item,
  MutableItem,
  Thumbnail,
  Enclosure,
  MediaGroup,
  MediaContent,
} from './rss/rss-types';
export { replaceErrors, clone } from './rss/rss-types';

// ─── Error model ─────────────────────────────────────────────────────────────

export type { FeedIssue, FeedIssueCode, FeedIssueSeverity } from './feed-issue';
export { FeedIssueCodes } from './feed-issue';

// ─── Network / recipe utilities ───────────────────────────────────────────────

export type { FetchOptions } from './rss/recipe';
export { getHtmlContent, getRecipeFromUrl } from './rss/recipe';

// ─── Component types ──────────────────────────────────────────────────────────

export type {
  TextType,
  ComponentType,
  Component,
  ComponentLink,
  GalleryImage,
  GalleryComponent,
  ImageComponent,
  ImageSource,
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
} from './component/component';

export {
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
} from './component/component';

// ─── Recipe schema types ──────────────────────────────────────────────────────

export type {
  Recipe,
  Thing,
  Person,
  Organization,
  QuantitativeValue,
  NutritionInformation,
  PropertyValue,
  ListItem,
  ItemList,
  CreativeWork,
  MediaObject,
  ImageObject,
} from './component/schema/recipe-schema';

// ─── HTML mapper ──────────────────────────────────────────────────────────────

export { HTMLMapper, splitParagraphImages } from './component/html/html-mapper';

// ─── Mapping / params ─────────────────────────────────────────────────────────

export type {
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
} from './component/mapping/mapping';

export {
  isValidParams,
  validateParams,
  isValidMapping,
  processTextLinks,
} from './component/mapping/mapping';
