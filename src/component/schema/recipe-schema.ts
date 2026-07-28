import { z } from 'zod';

// ─── Explicit types declared first ───────────────────────────────────────────
// Required for all schemas that are self-referential or mutually recursive.
// z.lazy() forces a ZodType<T> annotation; T must be known before the schema
// is defined, so we declare the TypeScript types here and infer the rest.

export type Thing = {
  identifier?: string | undefined;
  url?: string | undefined;
  name?: string | undefined;
  description?: string | undefined;
};

export type Person = {
  '@type': 'Person';
  name?: string | undefined;
  email?: string | undefined;
  url?: string | undefined;
  familyName?: string | undefined;
  givenName?: string | undefined;
};

export type Organization = {
  '@type': 'Organization';
  address?: string | undefined;
  email?: string | undefined;
  url?: string | undefined;
};

export type QuantitativeValue = {
  '@type': 'QuantitativeValue';
  minValue?: number | undefined;
  maxValue?: number | undefined;
  unitCode?: string | undefined;
  unitText?: string | undefined;
  value?: string | boolean | number | undefined;
  name?: string | undefined;
};

export type NutritionInformation = {
  '@type': 'NutritionInformation';
  calories?: string | undefined;
  carbohydrateContent?: string | undefined;
  cholesterolContent?: string | undefined;
  fatContent?: string | undefined;
  fiberContent?: string | undefined;
  proteinContent?: string | undefined;
  saturatedFatContent?: string | undefined;
  servingSize?: string | undefined;
  sodiumContent?: string | undefined;
  sugarContent?: string | undefined;
  transFatContent?: string | undefined;
  unsaturatedFatContent?: string | undefined;
};

export type PropertyValue = Thing & {
  '@type': 'PropertyValue';
  name: string;
  value: string | number | boolean;
  propertyID?: string | undefined;
  maxValue?: number | undefined;
  minValue?: number | undefined;
  unitCode?: string | undefined;
  unitText?: string | undefined;
};

export type ListItem = Thing & {
  '@type':
    | 'HowToStep'
    | 'HowToSection'
    | 'HowToTip'
    | 'HowToDirection'
    | 'HowToItem';
  position?: number | undefined;
  numberOfItems?: number | undefined;
  text?: string | undefined;
  itemListElement?: Array<ListItem> | undefined;
};

export type ItemList = Thing & {
  '@type': 'ItemList';
  name: string;
  itemListElement: Array<string | ListItem | PropertyValue>;
  itemListOrder?: string | undefined;
  numberOfItems?: number | undefined;
};

export type CreativeWork = Thing & {
  author?: Person | Organization | { '@id': string } | undefined;
  thumbnail?: ImageObject | undefined;
  thumbnailUrl?: string | undefined;
};

export type MediaObject = CreativeWork & {
  bitrate?: string | undefined;
  contentSize?: string | undefined;
  contentUrl?: string | undefined;
  embedUrl?: string | undefined;
};

export type ImageObject = MediaObject & {
  caption?: MediaObject | string | undefined;
  embeddedTextCaption?: string | undefined;
  exifData?: string | PropertyValue | undefined;
  representativeOfPage?: boolean | undefined;
};

export type Recipe = CreativeWork & {
  '@type': 'Recipe';
  '@id': string;
  datePublished?: string | undefined;
  image?: string | string[] | ImageObject | undefined;
  recipeYield?: string | string[] | QuantitativeValue | undefined;
  prepTime?: string | undefined;
  cookTime?: string | undefined;
  totalTime?: string | undefined;
  recipeIngredient?: Array<string | ItemList | PropertyValue> | undefined;
  recipeInstructions?: Array<ListItem> | undefined;
  recipeCategory?: string[] | string | undefined;
  recipeCuisine?: string[] | string | undefined;
  keywords?: string | undefined;
  nutrition?: NutritionInformation | undefined;
  isPartOf?: { '@id': string } | undefined;
  mainEntityOfPage?: string | undefined;
};

// ─── Schemas ─────────────────────────────────────────────────────────────────

export const ThingSchema = z.object({
  identifier: z.string().optional(),
  url: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
});

export const PersonSchema = z.object({
  '@type': z.literal('Person'),
  name: z.string().optional(),
  email: z.string().optional(),
  url: z.string().optional(),
  familyName: z.string().optional(),
  givenName: z.string().optional(),
});

export const OrganizationSchema = z.object({
  '@type': z.literal('Organization'),
  address: z.string().optional(),
  email: z.string().optional(),
  url: z.string().optional(),
});

export const QuantitativeValueSchema = z.object({
  '@type': z.literal('QuantitativeValue'),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  unitCode: z.string().optional(),
  unitText: z.string().optional(),
  value: z.union([z.string(), z.boolean(), z.number()]).optional(),
  name: z.string().optional(),
});

export const NutritionInformationSchema = z.object({
  '@type': z.literal('NutritionInformation'),
  calories: z.string().optional(),
  carbohydrateContent: z.string().optional(),
  cholesterolContent: z.string().optional(),
  fatContent: z.string().optional(),
  fiberContent: z.string().optional(),
  proteinContent: z.string().optional(),
  saturatedFatContent: z.string().optional(),
  servingSize: z.string().optional(),
  sodiumContent: z.string().optional(),
  sugarContent: z.string().optional(),
  transFatContent: z.string().optional(),
  unsaturatedFatContent: z.string().optional(),
});

// ─── Recursive / mutually-recursive schemas ───────────────────────────────────

export const PropertyValueSchema: z.ZodType<PropertyValue> = z.lazy(() =>
  z.object({
    ...ThingSchema.shape,
    '@type': z.literal('PropertyValue'),
    name: z.string(),
    value: z.union([z.string(), z.number(), z.boolean()]),
    propertyID: z.string().optional(),
    maxValue: z.number().optional(),
    minValue: z.number().optional(),
    unitCode: z.string().optional(),
    unitText: z.string().optional(),
  })
);

// ListItem references itself via itemListElement
export const ListItemSchema: z.ZodType<ListItem> = z.lazy(() =>
  z.object({
    ...ThingSchema.shape,
    '@type': z.enum([
      'HowToStep',
      'HowToSection',
      'HowToTip',
      'HowToDirection',
      'HowToItem',
    ]),
    position: z.number().optional(),
    numberOfItems: z.number().optional(),
    text: z.string().optional(),
    itemListElement: z.array(ListItemSchema).optional(),
  })
);

// ItemList references ListItem and PropertyValue
export const ItemListSchema: z.ZodType<ItemList> = z.lazy(() =>
  z.object({
    ...ThingSchema.shape,
    '@type': z.literal('ItemList'),
    name: z.string(),
    itemListElement: z.array(
      z.union([z.string(), ListItemSchema, PropertyValueSchema])
    ),
    itemListOrder: z.string().optional(),
    numberOfItems: z.number().optional(),
  })
);

// Shared author field used across CreativeWork, MediaObject, ImageObject, Recipe
const authorSchema = z
  .union([PersonSchema, OrganizationSchema, z.object({ '@id': z.string() })])
  .optional();

// ImageObject and MediaObject are mutually recursive (caption: MediaObject | string)
export const ImageObjectSchema: z.ZodType<ImageObject> = z.lazy(() =>
  z.object({
    ...ThingSchema.shape,
    author: authorSchema,
    thumbnail: ImageObjectSchema.optional(),
    thumbnailUrl: z.string().optional(),
    // MediaObject fields
    bitrate: z.string().optional(),
    contentSize: z.string().optional(),
    contentUrl: z.string().optional(),
    embedUrl: z.string().optional(),
    // ImageObject fields
    caption: z.union([MediaObjectSchema, z.string()]).optional(),
    embeddedTextCaption: z.string().optional(),
    exifData: z.union([z.string(), PropertyValueSchema]).optional(),
    representativeOfPage: z.boolean().optional(),
  })
);

export const MediaObjectSchema: z.ZodType<MediaObject> = z.lazy(() =>
  z.object({
    ...ThingSchema.shape,
    author: authorSchema,
    thumbnail: ImageObjectSchema.optional(),
    thumbnailUrl: z.string().optional(),
    bitrate: z.string().optional(),
    contentSize: z.string().optional(),
    contentUrl: z.string().optional(),
    embedUrl: z.string().optional(),
  })
);

export const CreativeWorkSchema: z.ZodType<CreativeWork> = z.lazy(() =>
  z.object({
    ...ThingSchema.shape,
    author: authorSchema,
    thumbnail: ImageObjectSchema.optional(),
    thumbnailUrl: z.string().optional(),
  })
);

export const RecipeSchema: z.ZodType<Recipe> = z.lazy(() =>
  z.object({
    ...ThingSchema.shape,
    author: authorSchema,
    thumbnail: ImageObjectSchema.optional(),
    thumbnailUrl: z.string().optional(),
    '@type': z.literal('Recipe'),
    '@id': z.string(),
    datePublished: z.string().optional(),
    image: z
      .union([z.string(), z.array(z.string()), ImageObjectSchema])
      .optional(),
    recipeYield: z
      .union([z.string(), z.array(z.string()), QuantitativeValueSchema])
      .optional(),
    prepTime: z.string().optional(),
    cookTime: z.string().optional(),
    totalTime: z.string().optional(),
    recipeIngredient: z
      .array(z.union([z.string(), ItemListSchema, PropertyValueSchema]))
      .optional(),
    recipeInstructions: z.array(ListItemSchema).optional(),
    recipeCategory: z.union([z.array(z.string()), z.string()]).optional(),
    recipeCuisine: z.union([z.array(z.string()), z.string()]).optional(),
    keywords: z.string().optional(),
    nutrition: NutritionInformationSchema.optional(),
    isPartOf: z.object({ '@id': z.string() }).optional(),
    mainEntityOfPage: z.string().optional(),
  })
);
