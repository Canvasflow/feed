export { default as RSSFeed } from './rss/RSSFeed';

export type {
  RSS,
  Channel,
  Item,
  ChannelImage,
  Enclosure,
  MediaGroup,
  MediaContent,
  Thumbnail,
} from './rss/RSS';

export {
  type Component,
  type AudioComponent,
  type TextComponent,
  type GalleryComponent,
  type GalleryImage,
  type ImageComponent,
  type VideoComponent,
  type TwitterComponent,
  type InstagramComponent,
  type InfogramComponent,
  type YoutubeComponent,
  type RecipeComponent,
  type DailymotionComponent,
  type VimeoComponent,
  type TikTokComponent,
  type SpacerComponent,
  type ButtonComponent,
  type HTMLTableComponent,
  type ContainerComponent,
  type CustomComponent,
  type ComponentType,
  type TextType,
  isAudioComponent,
  isHTMLTableComponent,
  isImageComponent,
  isTextComponent,
  isValidTextRole,
  isVideoComponent,
  isYoutubeComponent,
} from './component/Component';

export type {
  Recipe,
  Person,
  Organization,
  QuantitativeValue,
  NutritionInformation,
  ListItem,
} from './component/Schema';

export { HTMLMapper } from './component/HTMLMapper';
export {
  type Params as HTMLParams,
  type ComponentMapping,
  type Mapping,
  type Filter as HTMLFilter,
  isValidParams,
  isValidMapping,
  isEmpty,
  processTextLinks,
  filterEmptyTextNode,
  getRootElement,
  reduceEmptyTextNode,
  reduceComponents,
} from './component/Mapping';
