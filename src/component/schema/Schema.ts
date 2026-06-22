import { z } from 'zod';

// ─── Explicit types declared first ───────────────────────────────────────────
// Required for all schemas that are self-referential or mutually recursive.
// z.lazy() forces a ZodType<T> annotation; T must be known before the schema
// is defined, so we declare the TypeScript types here and infer the rest.

export type Thing = {
  identifier?: string;
  url?: string;
  name?: string;
  description?: string;
};

export type Person = {
  '@type': 'Person';
  name?: string;
  email?: string;
  url?: string;
  familyName?: string;
  givenName?: string;
};

export type Organization = {
  '@type': 'Organization';
  address?: string;
  email?: string;
  url?: string;
};

export type QuantitativeValue = {
  '@type': 'QuantitativeValue';
  minValue?: number;
  maxValue?: number;
  unitCode?: string;
  unitText?: string;
  value?: string | boolean | number;
  name?: string;
};

export type NutritionInformation = {
  '@type': 'NutritionInformation';
  calories?: string;
  carbohydrateContent?: string;
  cholesterolContent?: string;
  fatContent?: string;
  fiberContent?: string;
  proteinContent?: string;
  saturatedFatContent?: string;
  servingSize?: string;
  sodiumContent?: string;
  sugarContent?: string;
  transFatContent?: string;
  unsaturatedFatContent?: string;
};

export type PropertyValue = Thing & {
  '@type': 'PropertyValue';
  name: string;
  value: string | number | boolean;
  propertyID?: string;
  maxValue?: number;
  minValue?: number;
  unitCode?: string;
  unitText?: string;
};

export type ListItem = Thing & {
  '@type':
    | 'HowToStep'
    | 'HowToSection'
    | 'HowToTip'
    | 'HowToDirection'
    | 'HowToItem';
  position?: number;
  numberOfItems?: number;
  text?: string;
  itemListElement?: Array<ListItem>;
};

export type ItemList = Thing & {
  '@type': 'ItemList';
  name: string;
  itemListElement: Array<string | ListItem | PropertyValue>;
  itemListOrder?: string;
  numberOfItems?: number;
};

export type CreativeWork = Thing & {
  author?: Person | Organization | { '@id': string };
  thumbnail?: ImageObject;
  thumbnailUrl?: string;
};

export type MediaObject = CreativeWork & {
  bitrate?: string;
  contentSize?: string;
  contentUrl?: string;
  embedUrl?: string;
};

export type ImageObject = MediaObject & {
  caption?: MediaObject | string;
  embeddedTextCaption?: string;
  exifData?: string | PropertyValue;
  representativeOfPage?: boolean;
};

export type Recipe = CreativeWork & {
  '@type': 'Recipe';
  '@id': string;
  datePublished?: string;
  image?: string | string[] | ImageObject;
  recipeYield?: string | string[] | QuantitativeValue;
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  recipeIngredient?: Array<string | ItemList | PropertyValue>;
  recipeInstructions?: Array<ListItem>;
  recipeCategory?: string[] | string;
  recipeCuisine?: string[] | string;
  keywords?: string;
  nutrition?: NutritionInformation;
  isPartOf?: { '@id': string };
  mainEntityOfPage?: string;
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
