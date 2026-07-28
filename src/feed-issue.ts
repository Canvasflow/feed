import { z } from 'zod';

/**
 * Stable, switchable codes for every structured error/warning this library
 * emits — across `RSSFeed` (feed/channel/item/enclosure/media validation)
 * and every `Component` produced by `HTMLMapper` (image, video, embeds,
 * containers, buttons, text, tables, ...).
 *
 * Defined standalone (no import from `component.ts` or `rss/rss-types.ts`)
 * so both can import it without a circular dependency — `component.ts`
 * needs it inside `ComponentSchema` (`z.array(FeedIssueSchema)`), and
 * `rss/rss-types.ts` needs it for `RSS`/`Channel`/`Item`/etc.
 */
export const FeedIssueCodes = [
  // RSS / feed / channel / item
  'XML_PARSE_ERROR',
  'MISSING_ROOT_RSS',
  'MISSING_REQUIRED_TAG',
  'INVALID_TAG',
  'UNPARSEABLE_DATE',
  'INVALID_BOOLEAN_TAG',
  'INVALID_LINK',
  'INVALID_PARAMS',
  'INVALID_ROOT_MAPPING',
  // Thumbnail / enclosure / media
  'MISSING_URL',
  'SUGGESTED_PROPERTY',
  'INVALID_THUMBNAIL_TYPE',
  'INVALID_THUMBNAIL_DIMENSION',
  'MISSING_MEDIA_CONTENT',
  'DUPLICATE_MEDIA_FIELD',
  'RELATIVE_MEDIA_URL',
  // Images / media components
  'MISSING_IMAGE_SRC',
  'EMPTY_IMAGE_URL',
  'DUPLICATE_IMG_TAG',
  'EMPTY_IMAGE_LINK',
  'MISSING_VIDEO_SOURCE',
  'MISSING_AUDIO_SOURCE',
  'MISSING_SRC',
  'MISSING_GALLERY_SLIDES',
  // Containers / buttons / columns
  'MISSING_COMPONENTS',
  'MISSING_CHILDREN',
  'EMPTY_COLUMN',
  'MISSING_BUTTON_TEXT',
  'MISSING_BUTTON_LINK',
  'INVALID_BUTTON_IMPLEMENTATION',
  // Social embeds
  'MISSING_INSTAGRAM_URL',
  'INVALID_INSTAGRAM_URL',
  'INVALID_TIKTOK_URL',
  'INVALID_DAILYMOTION_URL',
  'INVALID_YOUTUBE_URL',
  'INVALID_YOUTUBE_ID',
  'INVALID_VIMEO_URL',
  // Text
  'INVALID_TEXT_ROLE',
] as const;

export const FeedIssueCodeSchema = z.enum(FeedIssueCodes);
export type FeedIssueCode = z.infer<typeof FeedIssueCodeSchema>;

export const FeedIssueSeveritySchema = z.enum(['error', 'warning']);
export type FeedIssueSeverity = z.infer<typeof FeedIssueSeveritySchema>;

export const FeedIssueSchema = z.object({
  code: FeedIssueCodeSchema,
  severity: FeedIssueSeveritySchema,
  message: z.string(),
  path: z.string().optional(),
});
export type FeedIssue = z.infer<typeof FeedIssueSchema>;

/**
 * Build a `FeedIssue`. Small convenience wrapper so call sites read as
 * `feedIssue('MISSING_IMAGE_SRC', 'error', '...')` instead of repeating the
 * object shape everywhere.
 *
 * @param {FeedIssueCode} code
 * @param {FeedIssueSeverity} severity
 * @param {string} message
 * @param {string} [path]
 * @returns {FeedIssue}
 */
export function feedIssue(
  code: FeedIssueCode,
  severity: FeedIssueSeverity,
  message: string,
  path?: string
): FeedIssue {
  return path ? { code, severity, message, path } : { code, severity, message };
}

/**
 * Convenience wrappers for the common case of a single error/warning.
 */
export function errorIssue(
  code: FeedIssueCode,
  message: string,
  path?: string
): FeedIssue {
  return feedIssue(code, 'error', message, path);
}

export function warningIssue(
  code: FeedIssueCode,
  message: string,
  path?: string
): FeedIssue {
  return feedIssue(code, 'warning', message, path);
}
