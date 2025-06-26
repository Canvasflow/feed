export { default as RSSFeed } from './rss/RSSFeed';
export type {
  RSS,
  Channel,
  Item,
  ChannelImage,
  Enclosure,
  MediaGroup,
  MediaContent,
} from './rss/RSS';
export type {
  Component,
  GalleryComponent,
  GalleryImage,
  ImageComponent,
  VideoComponent,
  TwitterComponent,
  InstagramComponent,
  InfogramComponent,
  YoutubeComponent,
  SpacerComponent,
  ComponentType,
  TextType,
} from './component/Component';
export { isValidTextRole } from './component/Component';
export { isValidParams } from './component/HTMLMapper';
