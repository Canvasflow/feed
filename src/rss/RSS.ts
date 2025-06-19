import type { Component } from '../component/Component';

export interface RSS {
  modules?: string[];
  channel: Channel;
  errors: Error[];
  warnings: string[];
}

export interface Channel {
  title?: string;
  link?: string;
  description?: string;
  language?: string;
  generator?: string;
  lastBuildDate?: string;
  docs?: string;
  image?: ChannelImage;
  pubDate?: string;
  category?: string[];
  items: Item[];
  ttl?: number;
  errors: Error[];
  warnings: string[];
  'atom:link'?: {
    href?: string;
    rel?: string;
    type?: string;
  };
  'sy:updateFrequency'?: string;
  'sy:updatePeriod'?: string;
}

interface ChannelImage {
  height?: number;
  width?: number;
  link?: string;
  title?: string;
  url?: string;
}

export interface Item {
  title?: string;
  'content:encoded'?: string;
  category?: string[];
  guid?: string;
  link?: string;
  description?: string;
  enclosure: Enclosure[];
  mediaGroup: MediaGroup[];
  mediaContent: MediaContent[];
  pubDate?: string;
  errors: Error[];
  warnings: string[];
  components: Component[];
}

export interface Enclosure {
  length: number;
  type: string;
  url: string;
  errors: Error[];
  warnings: string[];
}

export interface MediaGroup {
  title?: string;
  mediaContent?: MediaContent[];
  /**
   * Array of errors from the media content
   */
  errors: Error[];
  /**
   * Array of warnings from the media content
   */
  warnings: string[];
}

export interface MediaContent {
  /**
   * Direct URL to the media object. (Required)
   */
  url: string;
  /**
   * Number of bytes of the media object. (Optional)
   */
  fileSize?: number;
  /**
   * Is the standard MIME type of the object. (Optional)
   */
  type?: string;
  /**
   * Is the type of object. (Optional)
   */
  medium?: 'image' | 'audio' | 'video' | 'document' | 'executable';
  /**
   * Determines if this is the default object that should be
   * used for the <media:group>. (Optional)
   */
  isDefault?: boolean;
  /**
   * The title of the particular media object. (Optional)
   */
  title?: string;
  /**
   * Allows particular images to be used as representative images
   * for the media object. (Optional)
   */
  thumbnail?: string;
  /**
   * Notable entity and the contribution to the creation of the
   * media object. (Optional)
   */
  credit?: string;
  /**
   * Array of errors from the media content
   */
  errors: Error[];
  /**
   * Array of warnings from the media content
   */
  warnings: string[];
}
