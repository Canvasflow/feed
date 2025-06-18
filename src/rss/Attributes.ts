export interface Enclosure {
  /**
   * Defines the URL to the media file. (Required)
   */
  '@_url': string;
  /**
   * Defines the length (in bytes) of the media file. (Optional)
   */
  '@_length'?: number;
  /**
   * Defines the type of media file. (Optional)
   */
  '@_type'?: string;
}

export interface MediaGroup {
  'media:title'?: string;
  'media:content'?: MediaContent[];
}

export interface MediaContent {
  /**
   * Direct URL to the media object. (Required)
   */
  '@_url': string;

  /**
   * Number of bytes of the media object. (Optional)
   */
  '@_fileSize'?: number;

  /**
   * Is the standard MIME type of the object. (Optional)
   */
  '@_type'?: string;

  /**
   * Is the type of object. (Optional)
   */
  '@_medium'?: 'image' | 'audio' | 'video' | 'document' | 'executable';

  /**
   * Determines if this is the default object that should be
   * used for the <media:group>. (Optional)
   */
  '@_isDefault'?: 'true' | 'false';

  /**
   * Notable entity and the contribution to the creation of the
   * media object. (Optional)
   */
  'media:credit'?: MediaCredit | MediaCredit[];

  /**
   * Allows particular images to be used as representative images
   * for the media object
   */
  'media:thumbnail'?: MediaThumbnail | MediaThumbnail[];

  /**
   * The title of the particular media object
   */
  'media:title'?: string | MediaTitle;
}

export interface MediaThumbnail {
  '#text'?: string;
  '@_url'?: string;
}

export interface MediaCredit {
  '#text'?: string;
}

export interface MediaTitle {
  '#text'?: string;
}

export interface AtomLink {
  '@_href': string;
  '@_rel': string;
  '@_type': string;
}
