import { test, expect, describe } from 'vite-plus/test';

import {
  // type guards
  isGalleryComponent,
  isGalleryImage,
  isImageComponent,
  isValidTextRole,
  isTextComponent,
  isHTMLTableComponent,
  isVideoComponent,
  isYoutubeComponent,
  isVimeoComponent,
  isDailymotionComponent,
  isTikTokComponent,
  isRecipeComponent,
  isContainerComponent,
  isLinkContainerComponent,
  isFigureContainerComponent,
  isButtonComponent,
  isAudioComponent,
  isTwitterComponent,
  isInstagramComponent,
  isInfogramComponent,
  isSpacerComponent,
  isCustomComponent,
  // schemas
  ComponentTypeSchema,
  ContainerComponentSchema,
  LinkContainerComponentSchema,
  FigureContainerComponentSchema,
  LivePostComponentSchema,
  LiveContainerComponentSchema,
  ColumnsComponentSchema,
  RecipeComponentSchema,
} from './Component';

describe('Component type guards', () => {
  test(
    'It should narrow each component by its discriminator',
    {
      tags: ['unit', 'html'],
    },
    () => {
      // Positive cases
      expect(isGalleryComponent({ component: 'gallery' })).toBe(true);
      expect(
        isImageComponent({ component: 'image', imageurl: 'https://x/a.jpg' })
      ).toBe(true);
      expect(isTextComponent({ component: 'body', text: 'hi' })).toBe(true);
      expect(
        isHTMLTableComponent({
          component: 'htmltable',
          html: '<table></table>',
        })
      ).toBe(true);
      expect(isVideoComponent({ component: 'video' })).toBe(true);
      expect(isYoutubeComponent({ vidtype: 'youtube' })).toBe(true);
      expect(isVimeoComponent({ vidtype: 'vimeo' })).toBe(true);
      expect(isDailymotionComponent({ vidtype: 'dailymotion' })).toBe(true);
      expect(isTikTokComponent({ vidtype: 'tiktok' })).toBe(true);
      expect(isRecipeComponent({ component: 'recipe' })).toBe(true);
      expect(isContainerComponent({ component: 'container' })).toBe(true);
      expect(
        isLinkContainerComponent({ component: 'container', type: 'link' })
      ).toBe(true);
      expect(
        isFigureContainerComponent({ component: 'container', type: 'figure' })
      ).toBe(true);
      expect(isButtonComponent({ component: 'button' })).toBe(true);
      expect(isAudioComponent({ component: 'audio' })).toBe(true);
      expect(isTwitterComponent({ component: 'twitter' })).toBe(true);
      expect(isInstagramComponent({ component: 'instagram' })).toBe(true);
      expect(isInfogramComponent({ component: 'infogram' })).toBe(true);
      expect(isSpacerComponent({ component: 'spacer' })).toBe(true);
      expect(isCustomComponent({ component: 'custom' })).toBe(true);

      // Negative cases (non-object / wrong discriminator)
      expect(isGalleryComponent(null)).toBe(false);
      expect(isImageComponent({ component: 'image' })).toBe(false);
      expect(isTextComponent({ component: 'nope', text: 'x' })).toBe(false);
      expect(isHTMLTableComponent({ component: 'htmltable' })).toBe(false);
      expect(isVideoComponent('not-an-object')).toBe(false);
      expect(isYoutubeComponent({ vidtype: 'vimeo' })).toBe(false);
      expect(isVimeoComponent({ vidtype: 'youtube' })).toBe(false);
      expect(isDailymotionComponent({})).toBe(false);
      expect(isTikTokComponent(undefined)).toBe(false);
      expect(isRecipeComponent({ component: 'image' })).toBe(false);
      expect(isContainerComponent({ component: 'image' })).toBe(false);
      expect(isLinkContainerComponent({ component: 'container' })).toBe(false);
      expect(isFigureContainerComponent({ component: 'container' })).toBe(
        false
      );
      expect(isButtonComponent({ component: 'image' })).toBe(false);
      expect(isAudioComponent({ component: 'image' })).toBe(false);
      expect(isTwitterComponent({ component: 'image' })).toBe(false);
      expect(isInstagramComponent({ component: 'image' })).toBe(false);
      expect(isInfogramComponent({ component: 'image' })).toBe(false);
      expect(isSpacerComponent({ component: 'image' })).toBe(false);
      expect(isCustomComponent({ component: 'image' })).toBe(false);
    }
  );

  test(
    'isValidTextRole recognizes defaults and textN roles',
    {
      tags: ['unit', 'html'],
    },
    () => {
      expect(isValidTextRole('headline')).toBe(true);
      expect(isValidTextRole('text1')).toBe(true);
      expect(isValidTextRole('not-a-role')).toBe(false);
    }
  );

  test(
    'isGalleryImage validates against the gallery image schema',
    {
      tags: ['unit', 'html'],
    },
    () => {
      expect(
        isGalleryImage({
          component: 'image',
          imageurl: 'https://example.com/a.jpg',
        })
      ).toBe(true);
      expect(isGalleryImage({ nope: true })).toBe(false);
    }
  );
});

describe('Component schemas (lazy)', () => {
  test(
    'ComponentTypeSchema accepts known types and rejects unknown',
    {
      tags: ['unit', 'html'],
    },
    () => {
      expect(ComponentTypeSchema.safeParse('image').success).toBe(true);
      expect(ComponentTypeSchema.safeParse('not-a-component').success).toBe(
        false
      );
    }
  );

  test(
    'It should resolve and validate the recursive container schemas',
    {
      tags: ['unit', 'html'],
    },
    () => {
      const meta = { errors: [], warnings: [] };
      expect(
        ContainerComponentSchema.safeParse({
          ...meta,
          component: 'container',
          components: [],
        }).success
      ).toBe(true);
      expect(
        LinkContainerComponentSchema.safeParse({
          ...meta,
          component: 'container',
          type: 'link',
          components: [],
        }).success
      ).toBe(true);
      expect(
        FigureContainerComponentSchema.safeParse({
          ...meta,
          component: 'container',
          type: 'figure',
          components: [],
        }).success
      ).toBe(true);
      expect(
        LivePostComponentSchema.safeParse({
          ...meta,
          component: 'live_post',
          components: [],
        }).success
      ).toBe(true);
      expect(
        LiveContainerComponentSchema.safeParse({
          ...meta,
          component: 'live_container',
          posts: [],
        }).success
      ).toBe(true);
      expect(
        ColumnsComponentSchema.safeParse({
          ...meta,
          component: 'columns',
          columns: [[]],
        }).success
      ).toBe(true);
      expect(
        RecipeComponentSchema.safeParse({
          ...meta,
          component: 'recipe',
          components: [],
        }).success
      ).toBe(true);

      // Trigger the lazy factories on invalid input too.
      expect(ContainerComponentSchema.safeParse({}).success).toBe(false);
    }
  );
});
