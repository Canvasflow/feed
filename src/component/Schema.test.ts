import { test, expect, describe } from 'vite-plus/test';

import {
  PropertyValueSchema,
  ListItemSchema,
  ItemListSchema,
  ImageObjectSchema,
  MediaObjectSchema,
  CreativeWorkSchema,
  RecipeSchema,
} from './Schema';

describe('Schema (lazy recursive schemas)', () => {
  test(
    'PropertyValueSchema validates a property value',
    {
      tags: ['unit', 'html'],
    },
    () => {
      expect(
        PropertyValueSchema.safeParse({
          '@type': 'PropertyValue',
          name: 'calories',
          value: '120',
        }).success
      ).toBe(true);
      expect(PropertyValueSchema.safeParse({}).success).toBe(false);
    }
  );

  test(
    'ListItemSchema validates a nested how-to step',
    {
      tags: ['unit', 'html'],
    },
    () => {
      expect(
        ListItemSchema.safeParse({
          '@type': 'HowToStep',
          text: 'Mix the batter',
          itemListElement: [{ '@type': 'HowToTip', text: 'Be gentle' }],
        }).success
      ).toBe(true);
      expect(ListItemSchema.safeParse({}).success).toBe(false);
    }
  );

  test(
    'ItemListSchema validates a list of items',
    {
      tags: ['unit', 'html'],
    },
    () => {
      expect(
        ItemListSchema.safeParse({
          '@type': 'ItemList',
          name: 'Ingredients',
          itemListElement: ['flour', 'sugar'],
        }).success
      ).toBe(true);
      expect(ItemListSchema.safeParse({}).success).toBe(false);
    }
  );

  test(
    'ImageObjectSchema and MediaObjectSchema validate media',
    {
      tags: ['unit', 'html'],
    },
    () => {
      expect(
        ImageObjectSchema.safeParse({
          thumbnailUrl: 'https://example.com/t.jpg',
          caption: 'A caption',
        }).success
      ).toBe(true);
      expect(
        MediaObjectSchema.safeParse({
          contentUrl: 'https://example.com/v.mp4',
        }).success
      ).toBe(true);
    }
  );

  test(
    'CreativeWorkSchema validates a creative work',
    {
      tags: ['unit', 'html'],
    },
    () => {
      expect(
        CreativeWorkSchema.safeParse({
          thumbnailUrl: 'https://example.com/t.jpg',
        }).success
      ).toBe(true);
    }
  );

  test(
    'RecipeSchema validates a full recipe',
    {
      tags: ['unit', 'html'],
    },
    () => {
      expect(
        RecipeSchema.safeParse({
          '@type': 'Recipe',
          '@id': 'recipe-1',
          name: 'Pancakes',
          recipeIngredient: ['flour', 'eggs'],
          recipeInstructions: [{ '@type': 'HowToStep', text: 'Mix' }],
          recipeYield: '4 servings',
          image: 'https://example.com/p.jpg',
        }).success
      ).toBe(true);
      expect(RecipeSchema.safeParse({}).success).toBe(false);
    }
  );
});
