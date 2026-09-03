import { test, expect, describe } from 'vite-plus/test';

import { buildItem, type BuildItemContext } from '../rss-feed';
import type { ParsedItem } from '../parsed-xml';
import {
  isFigureContainerComponent,
  isGalleryComponent,
  isImageComponent,
  isVideoComponent,
  type ImageComponent,
} from '../../component/component';

const ctx: BuildItemContext = {};

const base: ParsedItem = {
  title: 'Test item',
  guid: 'guid-1',
};

function firstImage(item: ReturnType<typeof buildItem>): ImageComponent {
  const [component] = item.components;
  if (!component) throw new Error('expected a component');
  if (isImageComponent(component)) return component;
  if (isFigureContainerComponent(component)) {
    const inner = component.components[0];
    if (inner && isImageComponent(inner)) return inner;
  }
  throw new Error('expected an image component');
}

describe('relative media URLs are prepended with the item link origin', () => {
  test(
    'a leading-slash relative <img src> is prepended with the origin',
    { tags: ['unit', 'rss'] },
    () => {
      const item = buildItem(
        {
          ...base,
          link: 'https://lindyssports.com/nba/some-article',
          'content:encoded':
            '<figure><img src="/.image/photo.jpg?profile=rss" height="675" width="1013"></figure>',
        },
        ctx
      );

      expect(firstImage(item).imageurl).toBe(
        'https://lindyssports.com/.image/photo.jpg?profile=rss'
      );
    }
  );

  test(
    'a bare relative <img src> (no leading slash) is prepended with the origin',
    { tags: ['unit', 'rss'] },
    () => {
      const item = buildItem(
        {
          ...base,
          link: 'https://example.org/wnba/some-article',
          'content:encoded': '<figure><img src="image.png"></figure>',
        },
        ctx
      );

      expect(firstImage(item).imageurl).toBe('https://example.org/image.png');
    }
  );

  test(
    'an already-absolute http(s) <img src> is left unchanged',
    { tags: ['unit', 'rss'] },
    () => {
      const item = buildItem(
        {
          ...base,
          link: 'https://example.org/wnba/some-article',
          'content:encoded':
            '<figure><img src="https://cdn.example.net/photo.jpg"></figure>',
        },
        ctx
      );

      expect(firstImage(item).imageurl).toBe(
        'https://cdn.example.net/photo.jpg'
      );
    }
  );

  test(
    'a missing <link> leaves relative URLs untouched and does not throw',
    { tags: ['unit', 'rss'] },
    () => {
      const item = buildItem(
        {
          ...base,
          'content:encoded': '<figure><img src="/image.png"></figure>',
        },
        ctx
      );

      expect(firstImage(item).imageurl).toBe('/image.png');
    }
  );

  test(
    'gallery images with relative src are all prepended with the origin',
    { tags: ['unit', 'rss'] },
    () => {
      const item = buildItem(
        {
          ...base,
          link: 'https://example.org/section/article',
          'content:encoded':
            '<div role="gallery"><img src="/one.jpg"><img src="two.jpg"></div>',
        },
        ctx
      );

      const [component] = item.components;
      if (!component || !isGalleryComponent(component)) {
        throw new Error('expected a gallery component');
      }
      expect(component.images.map((i) => i.imageurl)).toEqual([
        'https://example.org/one.jpg',
        'https://example.org/two.jpg',
      ]);
    }
  );

  test(
    'a relative <video src> is prepended with the origin',
    { tags: ['unit', 'rss'] },
    () => {
      const item = buildItem(
        {
          ...base,
          link: 'https://example.org/section/article',
          'content:encoded': '<video src="/clip.mp4" controls></video>',
        },
        ctx
      );

      const [component] = item.components;
      if (!component || !isVideoComponent(component)) {
        throw new Error('expected a video component');
      }
      expect(component.url).toBe('https://example.org/clip.mp4');
    }
  );
});
