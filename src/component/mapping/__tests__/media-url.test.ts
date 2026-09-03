import { test, expect, describe } from 'vite-plus/test';

import { resolveMediaUrl, resolveComponentMediaUrls } from '../mapping.utils';
import type {
  AudioComponent,
  ColumnsComponent,
  Component,
  ContainerComponent,
  GalleryComponent,
  ImageComponent,
  LiveContainerComponent,
  LivePostComponent,
  RecipeComponent,
  VideoComponent,
} from '../../component';

const ORIGIN = 'https://example.org';

describe('resolveMediaUrl', () => {
  test(
    'a leading-slash relative URL is prepended with the origin',
    { tags: ['unit'] },
    () => {
      expect(resolveMediaUrl('/image.png', ORIGIN)).toBe(
        'https://example.org/image.png'
      );
    }
  );

  test(
    'a bare relative URL (no leading slash) is prepended with the origin',
    { tags: ['unit'] },
    () => {
      expect(resolveMediaUrl('image.png', ORIGIN)).toBe(
        'https://example.org/image.png'
      );
    }
  );

  test('an absolute http URL is left unchanged', { tags: ['unit'] }, () => {
    expect(resolveMediaUrl('http://cdn.example.net/a.jpg', ORIGIN)).toBe(
      'http://cdn.example.net/a.jpg'
    );
  });

  test('an absolute https URL is left unchanged', { tags: ['unit'] }, () => {
    expect(resolveMediaUrl('https://cdn.example.net/a.jpg', ORIGIN)).toBe(
      'https://cdn.example.net/a.jpg'
    );
  });

  test('a protocol-relative URL is left unchanged', { tags: ['unit'] }, () => {
    expect(resolveMediaUrl('//cdn.example.net/a.jpg', ORIGIN)).toBe(
      '//cdn.example.net/a.jpg'
    );
  });

  test('an empty URL is left unchanged', { tags: ['unit'] }, () => {
    expect(resolveMediaUrl('', ORIGIN)).toBe('');
  });

  test(
    'a URL that fails to resolve against the origin is left unchanged',
    { tags: ['unit'] },
    () => {
      expect(resolveMediaUrl('moz-icon://[bad', ORIGIN)).toBe(
        'moz-icon://[bad'
      );
    }
  );
});

describe('resolveComponentMediaUrls', () => {
  test(
    'a missing origin leaves every component unchanged',
    { tags: ['unit'] },
    () => {
      const image: ImageComponent = {
        component: 'image',
        imageurl: '/image.png',
        errors: [],
        warnings: [],
      };

      resolveComponentMediaUrls([image], undefined);

      expect(image.imageurl).toBe('/image.png');
    }
  );

  test('an image component is resolved', { tags: ['unit'] }, () => {
    const image: ImageComponent = {
      component: 'image',
      imageurl: '/image.png',
      errors: [],
      warnings: [],
    };

    resolveComponentMediaUrls([image], ORIGIN);

    expect(image.imageurl).toBe('https://example.org/image.png');
  });

  test('every gallery image is resolved', { tags: ['unit'] }, () => {
    const gallery: GalleryComponent = {
      component: 'gallery',
      images: [
        { imageurl: '/one.jpg' },
        { imageurl: 'two.jpg' },
        { imageurl: 'https://cdn.example.net/three.jpg' },
      ],
      errors: [],
      warnings: [],
    };

    resolveComponentMediaUrls([gallery], ORIGIN);

    expect(gallery.images.map((i) => i.imageurl)).toEqual([
      'https://example.org/one.jpg',
      'https://example.org/two.jpg',
      'https://cdn.example.net/three.jpg',
    ]);
  });

  test('both the video url and poster are resolved', { tags: ['unit'] }, () => {
    const video: VideoComponent = {
      component: 'video',
      url: '/clip.mp4',
      poster: '/poster.jpg',
      errors: [],
      warnings: [],
    };

    resolveComponentMediaUrls([video], ORIGIN);

    expect(video.url).toBe('https://example.org/clip.mp4');
    expect(video.poster).toBe('https://example.org/poster.jpg');
  });

  test(
    'a video without a url or poster (e.g. a hosted-service video) is left alone',
    { tags: ['unit'] },
    () => {
      const video: VideoComponent = {
        component: 'video',
        errors: [],
        warnings: [],
      };

      expect(() => resolveComponentMediaUrls([video], ORIGIN)).not.toThrow();
      expect(video.url).toBeUndefined();
      expect(video.poster).toBeUndefined();
    }
  );

  test('an audio url is resolved', { tags: ['unit'] }, () => {
    const audio: AudioComponent = {
      component: 'audio',
      url: '/track.mp3',
      controls: true,
      autoplay: false,
      loop: false,
      muted: false,
      errors: [],
      warnings: [],
    };

    resolveComponentMediaUrls([audio], ORIGIN);

    expect(audio.url).toBe('https://example.org/track.mp3');
  });

  test(
    'a container component resolves images nested in its components',
    { tags: ['unit'] },
    () => {
      const image: ImageComponent = {
        component: 'image',
        imageurl: '/nested.jpg',
        errors: [],
        warnings: [],
      };
      const container: ContainerComponent = {
        component: 'container',
        components: [image],
        errors: [],
        warnings: [],
      };

      resolveComponentMediaUrls([container], ORIGIN);

      expect(image.imageurl).toBe('https://example.org/nested.jpg');
    }
  );

  test(
    'a recipe component resolves images nested in its components',
    { tags: ['unit'] },
    () => {
      const image: ImageComponent = {
        component: 'image',
        imageurl: '/nested.jpg',
        errors: [],
        warnings: [],
      };
      const recipe: RecipeComponent = {
        component: 'recipe',
        components: [image],
        errors: [],
        warnings: [],
      };

      resolveComponentMediaUrls([recipe], ORIGIN);

      expect(image.imageurl).toBe('https://example.org/nested.jpg');
    }
  );

  test(
    'every column resolves the images it contains',
    { tags: ['unit'] },
    () => {
      const left: ImageComponent = {
        component: 'image',
        imageurl: '/left.jpg',
        errors: [],
        warnings: [],
      };
      const right: ImageComponent = {
        component: 'image',
        imageurl: '/right.jpg',
        errors: [],
        warnings: [],
      };
      const columns: ColumnsComponent = {
        component: 'columns',
        columns: [[left], [right]],
        errors: [],
        warnings: [],
      };

      resolveComponentMediaUrls([columns], ORIGIN);

      expect(left.imageurl).toBe('https://example.org/left.jpg');
      expect(right.imageurl).toBe('https://example.org/right.jpg');
    }
  );

  test("every live post's components are resolved", { tags: ['unit'] }, () => {
    const image: ImageComponent = {
      component: 'image',
      imageurl: '/live.jpg',
      errors: [],
      warnings: [],
    };
    const post: LivePostComponent = {
      component: 'live_post',
      components: [image],
      errors: [],
      warnings: [],
    };
    const liveContainer: LiveContainerComponent = {
      component: 'live_container',
      posts: [post],
      errors: [],
      warnings: [],
    };

    resolveComponentMediaUrls([liveContainer], ORIGIN);

    expect(image.imageurl).toBe('https://example.org/live.jpg');
  });

  test(
    'unrelated component types are passed through untouched',
    { tags: ['unit'] },
    () => {
      const text: Component = {
        component: 'body',
        errors: [],
        warnings: [],
      };

      expect(() => resolveComponentMediaUrls([text], ORIGIN)).not.toThrow();
    }
  );
});
