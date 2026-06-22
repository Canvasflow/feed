import { z } from 'zod';

import { type Recipe, RecipeSchema } from './Schema';

export const MAX_TEXT = 60;

// ─── TextType / ComponentType ────────────────────────────────────────────────

// Mirror the source's TextRange / TextType approach exactly.
// TypeScript type machinery generates `text1`–`text60` as a proper
// union of string literals — no hardcoded list, no `as [string, ...string[]]`.
type CreateArrayWithLengthX<
  LENGTH extends number,
  ACC extends unknown[] = [],
> = ACC['length'] extends LENGTH
  ? ACC
  : CreateArrayWithLengthX<LENGTH, [...ACC, 1]>;

type NumericRange<
  START_ARR extends number[],
  END extends number,
  ACC extends number = never,
> = START_ARR['length'] extends END
  ? ACC | END
  : NumericRange<[...START_ARR, 1], END, ACC | START_ARR['length']>;

type TextRange = NumericRange<CreateArrayWithLengthX<1>, 61>;

export type TextType =
  | 'headline'
  | 'title'
  | 'subtitle'
  | 'intro'
  | 'body'
  | 'crosshead'
  | 'byline'
  | 'blockquote'
  | 'footer'
  | 'imagecaption'
  | `text${TextRange}`;

export type ComponentType =
  | TextType
  | 'image'
  | 'gallery'
  | 'map'
  | 'video'
  | 'audio'
  | 'button'
  | 'anchor'
  | 'advert'
  | 'custom'
  | 'twitter'
  | 'infogram'
  | 'instagram'
  | 'table'
  | 'tiktok'
  | 'columns'
  | 'live_container'
  | 'live_post'
  | 'container'
  | 'spacer'
  | 'divider'
  | 'htmltable'
  | 'recipe';

// Runtime validators built from a validRoleType Set — same pattern as the source.
// z.enum() can't express template literals, so z.custom() is used for the
// text1–text60 branch; the named variants stay as a proper z.enum().
const namedTextValues = [
  'headline',
  'title',
  'subtitle',
  'intro',
  'body',
  'crosshead',
  'byline',
  'blockquote',
  'footer',
  'imagecaption',
] as const;

const validTextRole = new Set<string>(namedTextValues);
for (let i = 1; i <= 60; i++) validTextRole.add(`text${i}`);

export const TextTypeSchema: z.ZodType<TextType> = z.custom<TextType>(
  (val) => typeof val === 'string' && validTextRole.has(val),
  { message: 'Invalid TextType' }
);

const validComponentType = new Set<string>([
  ...validTextRole,
  'image',
  'gallery',
  'map',
  'video',
  'audio',
  'button',
  'anchor',
  'advert',
  'custom',
  'twitter',
  'infogram',
  'instagram',
  'table',
  'tiktok',
  'columns',
  'live_container',
  'live_post',
  'container',
  'spacer',
  'divider',
  'htmltable',
  'recipe',
]);

export const ComponentTypeSchema: z.ZodType<ComponentType> =
  z.custom<ComponentType>(
    (val) => typeof val === 'string' && validComponentType.has(val),
    { message: 'Invalid ComponentType' }
  );

export type Component = {
  id?: string;
  component: ComponentType;
  properties?: Record<string, unknown>;
  html?: string;
  errors: string[];
  warnings: string[];
  element?: {
    tag: string;
    attributes?: Record<string, string>;
  };
};

// Kept as a ZodObject so .extend() works on all derived schemas below.
// The lazy/recursive schemas use baseComponentFields spread instead.
const baseComponentObject = z.object({
  id: z.string().optional(),
  component: ComponentTypeSchema,
  properties: z.record(z.string(), z.unknown()).optional(),
  html: z.string().optional(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
  element: z
    .object({
      tag: z.string(),
      attributes: z.record(z.string(), z.string()).optional(),
    })
    .optional(),
});

// Exported as ZodType<Component> — fully typed, compatible with recursive schema assignments.
export const ComponentSchema: z.ZodType<Component> = baseComponentObject;

// Plain shape spread used inside z.lazy() to avoid the ZodType<T> .extend() issue.
const baseComponentFields = baseComponentObject.shape;

// ─── GalleryImage ────────────────────────────────────────────────────────────

export const GalleryImageSchema = z.object({
  imageurl: z.string(),
  caption: z.string().optional(),
  link: z.string().optional(),
  alt: z.string().optional(),
  credit: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

// ─── GalleryComponent ────────────────────────────────────────────────────────

export const GalleryComponentSchema = baseComponentObject.extend({
  component: z.literal('gallery'),
  role: z.enum(['default', 'mosaic']).optional(),
  animation: z.enum(['fade', 'slide', 'cube', 'coverflow', 'flip']).optional(),
  images: z.array(GalleryImageSchema),
  caption: z.union([z.record(z.string(), z.string()), z.string()]).optional(),
  direction: z.enum(['horizontal', 'vertical']).optional(),
});

// ─── ImageComponent ──────────────────────────────────────────────────────────

export const ImageComponentSchema = baseComponentObject.extend({
  component: z.literal('image'),
  imageurl: z.string(),
  link: z.string().optional(),
  alt: z.string().optional(),
  caption: z.string().optional(),
  credit: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

// ─── TextComponent ───────────────────────────────────────────────────────────

export const TextComponentSchema = baseComponentObject.extend({
  component: TextTypeSchema,
  text: z.string(),
});

// ─── HTMLTableComponent ──────────────────────────────────────────────────────

export const HTMLTableComponentSchema = baseComponentObject.extend({
  component: z.literal('htmltable'),
  html: z.string(),
  caption: z.string().optional(),
  credit: z.string().optional(),
});

// ─── VideoComponent ──────────────────────────────────────────────────────────

const videoComponentObject = baseComponentObject.extend({
  component: z.literal('video'),
  url: z.string().optional(),
  controls: z.boolean().optional(),
  autoplay: z.boolean().optional(),
  loop: z.boolean().optional(),
  muted: z.boolean().optional(),
  movietype: z.literal('hosted').optional(),
  poster: z.string().optional(),
  caption: z.string().optional(),
  credit: z.string().optional(),
});

export const VideoComponentSchema = videoComponentObject;

export const YoutubeComponentSchema = videoComponentObject.extend({
  vidtype: z.literal('youtube'),
  params: z.object({ id: z.string() }),
});

export const VimeoComponentSchema = videoComponentObject.extend({
  vidtype: z.literal('vimeo'),
  params: z.object({ id: z.string() }),
});

export const DailymotionComponentSchema = videoComponentObject.extend({
  vidtype: z.literal('dailymotion'),
  params: z.object({ id: z.string() }),
});

export const TikTokComponentSchema = videoComponentObject.extend({
  vidtype: z.literal('tiktok'),
  params: z.object({ id: z.string(), username: z.string() }),
});

// ─── AudioComponent ──────────────────────────────────────────────────────────

export const AudioComponentSchema = baseComponentObject.extend({
  component: z.literal('audio'),
  url: z.string(),
  controls: z.boolean(),
  autoplay: z.boolean(),
  loop: z.boolean(),
  muted: z.boolean(),
  caption: z.string().optional(),
  credit: z.string().optional(),
});

// ─── ButtonComponent ─────────────────────────────────────────────────────────

export const ButtonComponentSchema = baseComponentObject.extend({
  component: z.literal('button'),
  text: z.string().optional(),
  link: z.string().optional(),
});

// ─── TwitterComponent ────────────────────────────────────────────────────────

export const TwitterComponentSchema = baseComponentObject.extend({
  component: z.literal('twitter'),
  height: z.string(),
  fixedheight: z.enum(['on', 'off']),
  bleed: z.enum(['on', 'off']),
  params: z.object({
    id: z.string().optional(),
    account: z.string().optional(),
  }),
});

// ─── InstagramComponent ──────────────────────────────────────────────────────

export const InstagramComponentSchema = baseComponentObject.extend({
  component: z.literal('instagram'),
  id: z.string(),
  type: z.enum(['post', 'reel', 'tv']),
});

// ─── InfogramComponent ───────────────────────────────────────────────────────

export const InfogramComponentSchema = baseComponentObject.extend({
  component: z.literal('infogram'),
  params: z.object({
    id: z.string(),
    parentUrl: z.string(),
    src: z.literal('embed'),
  }),
});

// ─── SpacerComponent ─────────────────────────────────────────────────────────

export const SpacerComponentSchema = baseComponentObject.extend({
  component: z.literal('spacer'),
  margin: z.enum([
    'margin-1',
    'margin-20',
    'margin-50',
    'margin-75',
    'margin-100',
  ]),
});

// ─── CustomComponent ─────────────────────────────────────────────────────────

export const CustomComponentSchema = baseComponentObject.extend({
  component: z.literal('custom'),
  content: z.string(),
  node: z.unknown(), // ElementNode — define further if you have its shape
});

// ─── Container / Columns / Live ──────────────────────────────────────────────

// Forward-declared as lazy due to recursive nesting.
// z.lazy() forces ZodType<T> annotation; .extend() is unavailable on ZodType,
// so we spread baseComponentFields into z.object() instead.
export const ContainerComponentSchema: z.ZodType<
  Component & { type?: 'link' | 'figure'; components: Component[] }
> = z.lazy(() =>
  z.object({
    ...baseComponentFields,
    type: z.enum(['link', 'figure']).optional(),
    component: z.literal('container'),
    components: z.array(ComponentSchema),
  })
);

export const LinkContainerComponentSchema: z.ZodType<
  Component & {
    type: 'link';
    components: Component[];
    link?: string;
    attributes?: Map<string, string>;
  }
> = z.lazy(() =>
  z.object({
    ...baseComponentFields,
    type: z.literal('link'),
    component: z.literal('container'),
    components: z.array(ComponentSchema),
    link: z.string().optional(),
    attributes: z
      .custom<Map<string, string>>((value) => value instanceof Map)
      .optional(),
  })
);

export const FigureContainerComponentSchema: z.ZodType<
  Component & {
    type: 'figure';
    components: Component[];
    caption?: string;
    credit?: string;
  }
> = z.lazy(() =>
  z.object({
    ...baseComponentFields,
    type: z.literal('figure'),
    component: z.literal('container'),
    components: z.array(ComponentSchema),
    caption: z.string().optional(),
    credit: z.string().optional(),
  })
);

export const LivePostComponentSchema: z.ZodType<
  Component & { components: Component[] }
> = z.lazy(() =>
  z.object({
    ...baseComponentFields,
    component: z.literal('live_post'),
    components: z.array(ComponentSchema),
  })
);

export const LiveContainerComponentSchema: z.ZodType<
  Component & { posts: Component[] }
> = z.lazy(() =>
  z.object({
    ...baseComponentFields,
    component: z.literal('live_container'),
    posts: z.array(LivePostComponentSchema),
  })
);

export const ColumnsComponentSchema: z.ZodType<
  Component & { columns: Component[][] }
> = z.lazy(() =>
  z.object({
    ...baseComponentFields,
    component: z.literal('columns'),
    columns: z.array(z.array(ComponentSchema)),
  })
);

export const RecipeComponentSchema: z.ZodType<
  Component & { recipe?: Recipe; url?: string; components: Component[] }
> = z.lazy(() =>
  z.object({
    ...baseComponentFields,
    component: z.literal('recipe'),
    recipe: RecipeSchema.optional(),
    url: z.string().optional(),
    components: z.array(ComponentSchema),
  })
);

// ─── Inferred types ──────────────────────────────────────────────────────────

export type GalleryImage = z.infer<typeof GalleryImageSchema>;
export type GalleryComponent = z.infer<typeof GalleryComponentSchema>;
export type ImageComponent = z.infer<typeof ImageComponentSchema>;
export type TextComponent = z.infer<typeof TextComponentSchema>;
export type HTMLTableComponent = z.infer<typeof HTMLTableComponentSchema>;
export type VideoComponent = z.infer<typeof VideoComponentSchema>;
export type YoutubeComponent = z.infer<typeof YoutubeComponentSchema>;
export type VimeoComponent = z.infer<typeof VimeoComponentSchema>;
export type DailymotionComponent = z.infer<typeof DailymotionComponentSchema>;
export type TikTokComponent = z.infer<typeof TikTokComponentSchema>;
export type AudioComponent = z.infer<typeof AudioComponentSchema>;
export type ButtonComponent = z.infer<typeof ButtonComponentSchema>;
export type TwitterComponent = z.infer<typeof TwitterComponentSchema>;
export type InstagramComponent = z.infer<typeof InstagramComponentSchema>;
export type InfogramComponent = z.infer<typeof InfogramComponentSchema>;
export type SpacerComponent = z.infer<typeof SpacerComponentSchema>;
export type CustomComponent = z.infer<typeof CustomComponentSchema>;
export type RecipeComponent = z.infer<typeof RecipeComponentSchema>;
export type ColumnsComponent = z.infer<typeof ColumnsComponentSchema>;
export type LiveContainerComponent = z.infer<
  typeof LiveContainerComponentSchema
>;
export type LivePostComponent = z.infer<typeof LivePostComponentSchema>;
export type ContainerComponent = z.infer<typeof ContainerComponentSchema>;
export type LinkContainerComponent = z.infer<
  typeof LinkContainerComponentSchema
>;
export type FigureContainerComponent = z.infer<
  typeof FigureContainerComponentSchema
>;
// ---- Validation Functions

const validRoleType = new Set([
  'headline',
  'title',
  'subtitle',
  'intro',
  'body',
  'crosshead',
  'byline',
  'blockquote',
  'footer',
  'imagecaption',
]);
for (let i = 1; i <= MAX_TEXT; i++) {
  validRoleType.add(`text${i}`);
}

export function isGalleryComponent(
  object: unknown
): object is GalleryComponent {
  const potential = object as Record<string, unknown>;

  return (
    typeof object === 'object' &&
    object !== null &&
    potential.component === 'gallery'
  );
}

export function isGalleryImage(object: unknown): object is GalleryComponent {
  const result = GalleryImageSchema.safeParse(object);
  return result.success;
}

export function isImageComponent(object: unknown): object is ImageComponent {
  const potential = object as Record<string, unknown>;

  return (
    typeof object === 'object' &&
    object !== null &&
    typeof potential.imageurl === 'string' &&
    potential.component === 'image'
  );
}

export function isValidTextRole(role: string): boolean {
  return validRoleType.has(role);
}

export function isTextComponent(object: unknown): object is TextComponent {
  const potential = object as Record<string, unknown>;

  return (
    typeof object === 'object' &&
    object !== null &&
    typeof potential.text === 'string' &&
    typeof potential.component === 'string' &&
    isValidTextRole(potential.component)
  );
}

export function isHTMLTableComponent(
  object: unknown
): object is HTMLTableComponent {
  const potential = object as Record<string, unknown>;

  return (
    typeof object === 'object' &&
    object !== null &&
    potential.component === 'htmltable' &&
    typeof potential.html === 'string'
  );
}

export function isVideoComponent(object: unknown): object is VideoComponent {
  const potential = object as Record<string, unknown>;

  return (
    typeof object === 'object' &&
    object !== null &&
    potential.component === 'video'
  );
}

export function isYoutubeComponent(
  object: unknown
): object is YoutubeComponent {
  const potential = object as Record<string, unknown>;

  return (
    typeof object === 'object' &&
    object !== null &&
    potential.vidtype === 'youtube'
  );
}

export function isVimeoComponent(object: unknown): object is VimeoComponent {
  const potential = object as Record<string, unknown>;

  return (
    typeof object === 'object' &&
    object !== null &&
    potential.vidtype === 'vimeo'
  );
}

export function isDailymotionComponent(
  object: unknown
): object is DailymotionComponent {
  const potential = object as Record<string, unknown>;

  return (
    typeof object === 'object' &&
    object !== null &&
    potential.vidtype === 'dailymotion'
  );
}

export function isTikTokComponent(object: unknown): object is TikTokComponent {
  const potential = object as Record<string, unknown>;

  return (
    typeof object === 'object' &&
    object !== null &&
    potential.vidtype === 'tiktok'
  );
}

export function isRecipeComponent(object: unknown): object is RecipeComponent {
  const potential = object as Record<string, unknown>;

  return (
    typeof object === 'object' &&
    object !== null &&
    potential.component === 'recipe'
  );
}

export function isContainerComponent(
  object: unknown
): object is ContainerComponent {
  const potential = object as Record<string, unknown>;

  return (
    typeof object === 'object' &&
    object !== null &&
    potential.component === 'container'
  );
}

export function isLinkContainerComponent(
  object: unknown
): object is LinkContainerComponent {
  const potential = object as Record<string, unknown>;
  const isValid =
    typeof object === 'object' &&
    object !== null &&
    potential.type === 'link' &&
    potential.component === 'container';
  return isValid;
}

export function isFigureContainerComponent(
  object: unknown
): object is FigureContainerComponent {
  const potential = object as Record<string, unknown>;
  const isValid =
    typeof object === 'object' &&
    object !== null &&
    potential.type === 'figure' &&
    potential.component === 'container';
  return isValid;
}

export function isButtonComponent(object: unknown): object is ButtonComponent {
  const potential = object as Record<string, unknown>;

  return (
    typeof object === 'object' &&
    object !== null &&
    potential.component === 'button'
  );
}

export function isAudioComponent(object: unknown): object is AudioComponent {
  const potential = object as Record<string, unknown>;

  return (
    typeof object === 'object' &&
    object !== null &&
    potential.component === 'audio'
  );
}

export function isTwitterComponent(
  object: unknown
): object is TwitterComponent {
  const potential = object as Record<string, unknown>;

  return (
    typeof object === 'object' &&
    object !== null &&
    potential.component === 'twitter'
  );
}

export function isInstagramComponent(
  object: unknown
): object is InstagramComponent {
  const potential = object as Record<string, unknown>;

  return (
    typeof object === 'object' &&
    object !== null &&
    potential.component === 'instagram'
  );
}

export function isInfogramComponent(
  object: unknown
): object is InfogramComponent {
  const potential = object as Record<string, unknown>;

  return (
    typeof object === 'object' &&
    object !== null &&
    potential.component === 'infogram'
  );
}

export function isSpacerComponent(object: unknown): object is SpacerComponent {
  const potential = object as Record<string, unknown>;

  return (
    typeof object === 'object' &&
    object !== null &&
    potential.component === 'spacer'
  );
}

export function isCustomComponent(object: unknown): object is CustomComponent {
  const potential = object as Record<string, unknown>;

  return (
    typeof object === 'object' &&
    object !== null &&
    potential.component === 'custom'
  );
}
