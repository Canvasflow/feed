import { z } from 'zod';

import { TextTypeSchema } from './Component';

// Primitives
export const MatchTypeSchema = z.enum(['any', 'all']);

// Filters
export const TagFilterSchema = z.object({
  type: z.literal('tag'),
  items: z.array(z.string()),
});

export const ClassFilterSchema = z.object({
  type: z.literal('class'),
  match: z.union([MatchTypeSchema, z.literal('equal')]),
  items: z.array(z.string()),
});

export const AttributeValueFilterSchema = z.object({
  type: z.literal('attribute'),
  key: z.string(),
  value: z.string().nullable(),
});

export const AttributePatternFilterSchema = z.object({
  type: z.literal('attribute'),
  key: z.string(),
  pattern: z.string(),
});

export const AttributeFilterSchema = z.union([
  AttributeValueFilterSchema,
  AttributePatternFilterSchema,
]);

export const FilterSchema = z.union([
  TagFilterSchema,
  ClassFilterSchema,
  AttributeFilterSchema,
]);

// Base Mapping
export const MappingSchema = z.object({
  match: MatchTypeSchema,
  filters: z.array(FilterSchema),
  properties: z.record(z.string(), z.unknown()).optional(),
});

// Component Mappings
export const RecipeMappingSchema = MappingSchema.extend({
  name: z.string().optional(),
  component: z.literal('recipe'),
});

export const ColumnsMappingSchema = MappingSchema.extend({
  name: z.string().optional(),
  component: z.literal('columns'),
  column: z.object({
    match: MatchTypeSchema,
    filters: z.array(FilterSchema),
  }),
});

export const LiveContainerMappingSchema = MappingSchema.extend({
  name: z.string().optional(),
  component: z.literal('live_container'),
  post: z.object({
    match: MatchTypeSchema,
    filters: z.array(FilterSchema),
  }),
});

export const ContainerMappingSchema = MappingSchema.extend({
  name: z.string().optional(),
  component: z.literal('container'),
});

export const CustomMappingSchema = MappingSchema.extend({
  name: z.string().optional(),
  component: z.literal('custom'),
});

export const TextMappingSchema = MappingSchema.extend({
  name: z.string().optional(),
  component: TextTypeSchema,
});

export const GalleryMappingSchema = MappingSchema.extend({
  name: z.string().optional(),
  component: z.literal('gallery'),
  slide: z.object({
    match: MatchTypeSchema,
    filters: z.array(FilterSchema),
  }),
});

export const ComponentMappingSchema = z.union([
  ContainerMappingSchema,
  ColumnsMappingSchema,
  LiveContainerMappingSchema,
  RecipeMappingSchema,
  CustomMappingSchema,
  TextMappingSchema,
  GalleryMappingSchema,
]);

// Params
export const ParamsSchema = z.object({
  mappings: z.array(ComponentMappingSchema).optional(),
  excludes: z.array(MappingSchema).optional(),
  ignoreParagraphWrap: z.boolean().optional(),
});

// LinkResponse
export const LinkResponseSchema = z.object({
  link: z.string(),
  imageurl: z.string(),
  alt: z.string(),
  warnings: z.array(z.string()),
  errors: z.array(z.string()),
  width: z.number().optional(),
  height: z.number().optional(),
});
