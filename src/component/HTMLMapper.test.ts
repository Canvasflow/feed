import { test, expect, describe } from 'vitest';

import { HTMLMapper, type Mapping, isValidParams } from './HTMLMapper';
import type {
  GalleryComponent,
  ImageComponent,
  TextComponent,
  TwitterComponent,
  InstagramComponent,
  YoutubeComponent,
  VideoComponent,
  AudioComponent,
  TikTokComponent,
  ButtonComponent,
  RecipeComponent,
} from './Component';

describe('HTMLMapper', () => {
  describe('Text components', () => {
    test('It should create a p component from plain text', () => {
      const content = `Hello world`;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(1);
      const component = components.pop() as TextComponent;
      expect(component).toBeDefined();
      expect(component.component).toBe('body');
      expect(component?.text).toBe(`<p>${content}</p>`);
    });

    test('It should create a body component from anchor', () => {
      const content = `<a
  href="https://www.forbes.com/sites/iainmartin/2025/07/23/vibe-coding-turned-this-swedish-ai-unicorn-into-the-fastest-growing-software-startup-ever/"
  rel="nofollow noopener noreferrer"
  aria-label="Vibe Coding Turned This Swedish AI Unicorn Into The Fastest Growing Software Startup Ever" target="_self" role-fo>
  <div>
  <span>MORE FROM FORBES</span><span>Vibe Coding Turned This Swedish AI Unicorn Into The Fastest Growing Software Startup Ever</span>
<small>By Iain Martin</small>
  </div>
  <img
    src="https://specials-images.forbesimg.com/imageserve/6880ed77fb9e5395d961b1fc/960x0.jpg">
</a>`;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(1);
      const component = components.pop() as TextComponent;
      expect(component).toBeDefined();
      expect(component.component).toBe('body');
    });

    test('It should set a text45 component base on role', () => {
      const id = 'cf-123';
      const textContent = `<p id="${id}" role="text45">Hello world</p>`;
      const content = `${textContent}<style>body {color: red;}</style>`;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(1);
      const component = components.shift() as TextComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('text45');
      expect(component.id).toBe(id);
      expect(component.text).toBe(textContent);
    });

    test('It should remove the image component', () => {
      const components = HTMLMapper.toComponents(`
        <p role="text45"><img src="test.jpg"/>Hello <b>world</b></p>
      `);
      expect(components.length).toBe(1);
      const component = components.pop() as TextComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('text45');
      expect(component.text).toBe(`<p role="text45">Hello <b>world</b></p>`);
    });

    test('It should ignore the component', () => {
      const components = HTMLMapper.toComponents(`
        <p role="text45" data-cf-ignore>Hello world</p>
      `);
      expect(components.length).toBe(0);
    });
    test('Anchors should be present', () => {
      const content =
        '<a href="https://example.com" target="_blank" rel="nofollow noopener">Hello world</a>';
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(1);
      const component = components.pop() as TextComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('body');
      expect(component.text).toBe(content);
    });
  });

  describe('Instagram component', () => {
    test('It should create an Instagram post component', () => {
      const components = HTMLMapper.toComponents(
        `<blockquote class="instagram-media" data-instgrm-captioned data-instgrm-permalink="https://www.instagram.com/p/DKZFL6pIVwo/?utm_source=ig_embed&amp;utm_campaign=loading" data-instgrm-version="14"> <a href="https://www.instagram.com/p/DKZFL6pIVwo/?utm_source=ig_embed&amp;utm_campaign=loading" target="_blank">  View this post on Instagram</a><p><a href="https://www.instagram.com/p/DKZFL6pIVwo/?utm_source=ig_embed&amp;utm_campaign=loading" target="_blank">A post shared by Max Verstappen (@maxverstappen1)</a></p></blockquote>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as InstagramComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('instagram');
      expect(component.type).toBe(`post`);
      expect(component.id).toBe(`DKZFL6pIVwo`);
    });

    test('It should create an Instagram reel component', () => {
      const components = HTMLMapper.toComponents(
        `<blockquote class="instagram-media" data-instgrm-captioned data-instgrm-permalink="https://www.instagram.com/reel/DLA3R_4SSKy/?utm_source=ig_embed&amp;utm_campaign=loading" data-instgrm-version="14"> <a href="https://www.instagram.com/reel/DLA3R_4SSKy/?utm_source=ig_embed&amp;utm_campaign=loading" target="_blank">  View this post on Instagram</a><p><a href="https://www.instagram.com/reel/DLA3R_4SSKy/?utm_source=ig_embed&amp;utm_campaign=loading" target="_blank">A post shared by Jake Mourkas (@jakes__junk)</a></p></blockquote>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as InstagramComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('instagram');
      expect(component.type).toBe(`reel`);
      expect(component.id).toBe(`DLA3R_4SSKy`);
    });

    test('It should create an Instagram tv component', () => {
      const components = HTMLMapper.toComponents(
        `<blockquote class="instagram-media" data-instgrm-captioned data-instgrm-permalink="https://www.instagram.com/tv/DLA3R_4SSKy/?utm_source=ig_embed&amp;utm_campaign=loading" data-instgrm-version="14"> <a href="https://www.instagram.com/tv/DLA3R_4SSKy/?utm_source=ig_embed&amp;utm_campaign=loading" target="_blank">  View this post on Instagram</a><p><a href="https://www.instagram.com/tv/DLA3R_4SSKy/?utm_source=ig_embed&amp;utm_campaign=loading" target="_blank">A post shared by Jake Mourkas (@jakes__junk)</a></p></blockquote>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as InstagramComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('instagram');
      expect(component.type).toBe(`tv`);
      expect(component.id).toBe(`DLA3R_4SSKy`);
    });
  });

  describe('Button component', () => {
    test('It should create an button component from a tag', () => {
      const text = `Buy Now`;
      const link = 'https://example.com';
      const components = HTMLMapper.toComponents(
        `<a
          href="${link}"
          role="button"
          rel="nofollow noopener"
          aria-label="${text}"
          target="_blank">
            ${text}
        </a>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as ButtonComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('button');
      expect(component.text).toBeDefined();
      expect(component.text).toBe(text);
      expect(component.link).toBeDefined();
      expect(component.link).toBe(link);
    });

    test('It should create an button component from button tag', () => {
      const text = `Buy Now`;
      const link = 'https://example.com';
      const components = HTMLMapper.toComponents(
        `<button>
          <a
            href="${link}"
            rel="nofollow noopener"
            aria-label="${text}"
            target="_blank">
              ${text}
          </a>
        </button>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as ButtonComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('button');
      expect(component.text).toBeDefined();
      expect(component.text).toBe(text);
      expect(component.link).toBeDefined();
      expect(component.link).toBe(link);
    });

    test('It should create an button component from a tag with button as children', () => {
      const text = `Buy Now`;
      const link = 'https://example.com';
      const components = HTMLMapper.toComponents(
        `<a
          href="${link}"
          rel="nofollow noopener"
          aria-label="${text}"
          target="_blank">
        <button>
          ${text}
        </button>
        </a>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as ButtonComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('button');
      expect(component.text).toBeDefined();
      expect(component.text).toBe(text);
      expect(component.link).toBeDefined();
      expect(component.link).toBe(link);
    });
  });

  describe('Twitter Component', () => {
    test('It should create a twitter tweet component', () => {
      const components = HTMLMapper.toComponents(
        `<blockquote class="twitter-tweet"><p lang="en" dir="ltr">"He did it!" Jimmie Johnson and Bobby Labonte put on a show in the 2005 Coca-Cola 600 at Charlotte Motor Speedway. <a href="https://t.co/t2j2mXmL3L">pic.twitter.com/t2j2mXmL3L</a></p>&mdash; FOX: NASCAR (@NASCARONFOX) <a href="https://twitter.com/NASCARONFOX/status/1397629106427101185?ref_src=twsrc%5Etfw">May 26, 2021</a></blockquote>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as TwitterComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('twitter');
      expect(component.height).toBe(`350`);
      expect(component.params.account).toBe(`NASCARONFOX`);
      expect(component.params.id).toBe(`1397629106427101185`);
    });
    test('It should create a twitter tweet component inside a figure', () => {
      const components = HTMLMapper.toComponents(
        `<figure
	class="wp-block-embed is-type-rich is-provider-twitter wp-block-embed-twitter"
>
	<div class="wp-block-embed__wrapper">
		<blockquote class="twitter-tweet" data-width="500" data-dnt="true">
			<p lang="en" dir="ltr">
				Greetings, Vault Hunters - We need to share that the release of
				Borderlands 4 on Nintendo Switch 2 is being delayed. We do not
				take this decision lightly, but are committed to ensuring we
				deliver the best possible experience to our fans, and the game
				needs additional development…
			</p>
			&mdash; Borderlands (@Borderlands)
			<a
				href="https://twitter.com/Borderlands/status/1970609156936868102?ref_src=twsrc%5Etfw"
				>September 23, 2025</a
			>
		</blockquote>
		<script
			async
			src="https://platform.twitter.com/widgets.js"
			charset="utf-8"
		></script>
	</div>
</figure>

`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as TwitterComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('twitter');
      expect(component.height).toBe(`350`);
      expect(component.params.account).toBe(`Borderlands`);
      expect(component.params.id).toBe(`1970609156936868102`);
    });
  });

  describe('Youtube Component', () => {
    test('It should create an Youtube embed component', () => {
      const components = HTMLMapper.toComponents(
        `<iframe allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen="" frameborder="0" height="315" src="https://www.youtube.com/embed/ZrCs3HYxflk?si=8USctaxbSBPyMsBE" title="YouTube video player" width="560"></iframe>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as YoutubeComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('video');
      expect(component.vidtype).toBe('youtube');
      expect(component.params).toEqual({ id: 'ZrCs3HYxflk' });
    });
    test('It should create an Youtube embed component from figure', () => {
      const components = HTMLMapper.toComponents(
        `<figure>
          <div>
            <iframe
              loading="lazy"
              title="[DIY] Building a PORTABLE All-in-One PlayStation 5"
              width="500"
              height="281"
              src="https://www.youtube.com/embed/XQ87p2Rhb_A?feature=oembed"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin"
              allowfullscreen>
            </iframe>
          </div>
        </figure>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as YoutubeComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('video');
      expect(component.vidtype).toBe('youtube');
      expect(component.params).toEqual({ id: 'XQ87p2Rhb_A' });
    });
    test('It should create an Youtube embed component from figure with caption', () => {
      const components = HTMLMapper.toComponents(
        `<figure>
          <div>
            <iframe
              loading="lazy"
              title="[DIY] Building a PORTABLE All-in-One PlayStation 5"
              width="500"
              height="281"
              src="https://www.youtube.com/embed/XQ87p2Rhb_A?feature=oembed"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin"
              allowfullscreen>
            </iframe>
          </div>
          <figcaption>This is a valid caption</figcaption>
        </figure>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as YoutubeComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('video');
      expect(component.vidtype).toBe('youtube');
      expect(component.params).toEqual({ id: 'XQ87p2Rhb_A' });
      expect(component?.caption).toBe('This is a valid caption');
    });
  });

  describe('TikTok Component', () => {
    test('It should create a TikTok embed component', () => {
      const components = HTMLMapper.toComponents(
        `<blockquote
          class="tiktok-embed"
          cite="https://www.tiktok.com/@kingar4__/video/7388884417025985824">
        </blockquote> `
      );
      expect(components.length).toBe(1);
      const component = components.pop() as TikTokComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('video');
      expect(component.vidtype).toBe('tiktok');
      expect(component.params).toEqual({
        id: '7388884417025985824',
        username: '@kingar4__',
      });
    });

    test('It should create a TikTok embed component inside a figure', () => {
      const components = HTMLMapper.toComponents(
        `
        <figure>
          <blockquote
            class="tiktok-embed"
            cite="https://www.tiktok.com/@kingar4__/video/7388884417025985824">
          </blockquote>
        </figure>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as TikTokComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('video');
      expect(component.vidtype).toBe('tiktok');
      expect(component.params).toEqual({
        id: '7388884417025985824',
        username: '@kingar4__',
      });
    });

    test('It should create a TikTok embed component inside a div', () => {
      const components = HTMLMapper.toComponents(
        `
        <div>
          <blockquote
            class="tiktok-embed"
            cite="https://www.tiktok.com/@kingar4__/video/7388884417025985824">
          </blockquote>
        </div>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as TikTokComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('video');
      expect(component.vidtype).toBe('tiktok');
      expect(component.params).toEqual({
        id: '7388884417025985824',
        username: '@kingar4__',
      });
    });

    test('It should return errors for an invalid TikTok URL', () => {
      const components = HTMLMapper.toComponents(
        `<blockquote
        class="tiktok-embed"
        cite="https://www.tiktok.com/invalid-url-format">
      </blockquote>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as TikTokComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('video');
      expect(component.vidtype).toBe('tiktok');
      expect(component.params).toEqual({
        id: '',
        username: '',
      });
      expect(component.errors.length).toBeGreaterThan(0);
      expect(component.errors[0]).toBe('Invalid TikTok video URL format.');
    });

    test('It should return errors if TikTok cite attribute is missing', () => {
      const components = HTMLMapper.toComponents(
        `<blockquote class="tiktok-embed"></blockquote>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as TikTokComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('video');
      expect(component.vidtype).toBe('tiktok');
      expect(component.params).toEqual({
        id: '',
        username: '',
      });
      expect(component.errors.length).toBeGreaterThan(0);
      expect(component.errors[0]).toBe('cite attribute is required');
    });
  });

  describe('Image component', () => {
    test('It should process a simple image component', () => {
      const content = `<img src="example.jpg" alt="Hello world"/>`;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(1);
      const component = components.pop() as ImageComponent;
      expect(component).toBeDefined();
      expect(component.component).toBe('image');
      expect(component?.imageurl).toBe('example.jpg');
      expect(component?.alt).toBe('Hello world');
      expect(component.caption).toBeUndefined();
    });

    test('It should process a simple picture element with invalid caption', () => {
      const content = `<picture>
        <source media="(min-width: 1024px)" srcset="full-size.jpg"/>
        <source media="(min-width: 700px)" srcset="medium-size.jpg"/>
        <img src="cover.jpg" alt="My image"/>
        <ficaption>This caption should be ignored</figcaption>
      </picture>`;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(1);
      const component = components.pop() as ImageComponent;
      expect(component).toBeDefined();
      expect(component.component).toBe('image');
      expect(component?.imageurl).toBe('cover.jpg');
      expect(component?.alt).toBe('My image');
    });

    test('It should process a simple picture element with valid caption', () => {
      const content = `
        <figure>
          <picture>
            <source media="(min-width: 1024px)" srcset="full-size.jpg">
            <source media="(min-width: 700px)" srcset="medium-size.jpg">
            <img src="cover.jpg" alt="My image">
          </picture>
          <figcaption>This is a valid caption</figcaption>
        </figure>`;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(1);
      const component = components.pop() as ImageComponent;
      expect(component).toBeDefined();
      expect(component.component).toBe('image');
      expect(component?.imageurl).toBe('cover.jpg');
      expect(component?.alt).toBe('My image');
      expect(component?.caption).toBe('This is a valid caption');
    });

    test('It should process a figure component without caption', () => {
      const content = `
        <figure>
          <img src="cover.jpg" alt="My image">
        </figure>`;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(1);
      const component = components.pop() as ImageComponent;
      expect(component).toBeDefined();
      expect(component.component).toBe('image');
      expect(component?.imageurl).toBe('cover.jpg');
      expect(component?.alt).toBe('My image');
      expect(component?.caption).toBeUndefined();
    });

    test('It should process a figure component with caption', () => {
      const content = `
        <figure>
          <img src="cover.jpg" alt="My image">
          <figcaption>This is a caption</figcaption>
        </figure>`;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(1);
      const component = components.pop() as ImageComponent;
      expect(component).toBeDefined();
      expect(component.component).toBe('image');
      expect(component?.imageurl).toBe('cover.jpg');
      expect(component?.alt).toBe('My image');
      expect(component?.caption).toBe('This is a caption');
    });

    test('It should process a figure component with caption and credit', () => {
      const content = `
        <figure>
          <img src="cover.jpg"
            alt="Memphis-xAI" />
            <figcaption>
              <p>FILE = The xAI data center is seen</p>
              <small>Copyright 2025 The Associated Press. All rights reserved</small>
            </figcaption>
        </figure>`;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(1);
      const component = components.pop() as ImageComponent;
      expect(component).toBeDefined();
      expect(component.component).toBe('image');
      expect(component.imageurl).toBe('cover.jpg');
      expect(component?.alt).toBe('Memphis-xAI');
      expect(component?.caption).toBe('FILE = The xAI data center is seen');
      expect(component?.credit).toBe(
        'Copyright 2025 The Associated Press. All rights reserved'
      );
    });

    test('It should process a figure component with caption and role credit', () => {
      const content = `
        <figure>
          <img src="cover.jpg" alt="My image">
          <figcaption>
            This is
            a caption
            <span role="credit">This is a credit</span>
          </figcaption>
        </figure>`;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(1);
      const component = components.pop() as ImageComponent;
      expect(component).toBeDefined();
      expect(component.component).toBe('image');
      expect(component?.imageurl).toBe('cover.jpg');
      expect(component?.alt).toBe('My image');
      expect(component?.caption).toBe('This is a caption');
      expect(component?.credit).toBe('This is a credit');
    });
  });

  describe('Gallery components', () => {
    test('It should create a simple gallery component', () => {
      const components = HTMLMapper.toComponents(`
        <figure role="gallery">
            <figure>
              <img src="image1.jpg"/>
              <figcaption>
                Image 1 Caption
                <small role="credit">Photographer 1</small>
              </figcaption>
            </figure>
            <figure>
              <img src="image2.jpg"/>
              <figcaption>
                Image 2 Caption
                <small role="credit">Photographer 2</small>
              </figcaption>
            </figure>
            <img src="image3.jpg"/>
             <picture>
            <source media="(min-width: 1024px)" srcset="full-size.jpg">
            <source media="(min-width: 700px)" srcset="medium-size.jpg">
            <img src="image4.jpg" alt="My image">
          </picture>
            <figcaption>Gallery Caption</figcaption>
        </figure>
      `);
      expect(components.length).toBe(1);
      const component = components.pop() as GalleryComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.caption).toBe('Gallery Caption');
      expect(component.images.length).toBe(4);
      expect(component.images[0]).toEqual({
        caption: 'Image 1 Caption',
        imageurl: 'image1.jpg',
        credit: 'Photographer 1',
      });
      expect(component.images[1]).toEqual({
        caption: 'Image 2 Caption',
        imageurl: 'image2.jpg',
        credit: 'Photographer 2',
      });
      expect(component.images[2]).toEqual({
        imageurl: 'image3.jpg',
      });
      expect(component.images[3]).toEqual({
        alt: 'My image',
        imageurl: 'image4.jpg',
      });
    });
    test('It should create a gallery component from wordpress', () => {
      const components = HTMLMapper.toComponents(`
        <figure role="gallery"
          class="wp-block-gallery has-nested-images columns-default
          is-cropped wp-block-gallery-1 is-layout-flex
          wp-block-gallery-is-layout-flex">
          <figure class="wp-block-image wp-lightbox size-large">
            <a href="https://cdn.wccftech.com/wp-content/uploads/2025/09/iPhone-Air-1TB-storage-upgrade-failure.jpg">
              <img
                loading="lazy"
                decoding="async"
                width="728"
                height="453"
                data-id="1664604"
                src="https://cdn.wccftech.com/wp-content/uploads/2025/09/iPhone-Air-1TB-storage-upgrade-failure-728x453.jpg"
                alt="iPhone Air modded storage upgrade failure" class="wp-image-1664604"
                srcset="https://cdn.wccftech.com/wp-content/uploads/2025/09/iPhone-Air-1TB-storage-upgrade-failure-728x453.jpg 728w, https://cdn.wccftech.com/wp-content/uploads/2025/09/iPhone-Air-1TB-storage-upgrade-failure-564x351.jpg 564w, https://cdn.wccftech.com/wp-content/uploads/2025/09/iPhone-Air-1TB-storage-upgrade-failure.jpg 1102w"
                sizes="auto, (max-width: 728px) 100vw, 728px" />
            </a>
          </figure>

          <figure class="wp-block-image wp-lightbox size-large">
            <img
              loading="lazy"
              decoding="async"
              width="728"
              height="446"
              data-id="1664603"
              src="https://cdn.wccftech.com/wp-content/uploads/2025/09/iPhone-Air-512GB-storage-upgrade-failure-728x446.jpg"
              alt="iPhone Air modded storage upgrade failure" class="wp-image-1664603"
              srcset="https://cdn.wccftech.com/wp-content/uploads/2025/09/iPhone-Air-512GB-storage-upgrade-failure-728x446.jpg 728w, https://cdn.wccftech.com/wp-content/uploads/2025/09/iPhone-Air-512GB-storage-upgrade-failure-564x346.jpg 564w, https://cdn.wccftech.com/wp-content/uploads/2025/09/iPhone-Air-512GB-storage-upgrade-failure.jpg 1116w"
              sizes="auto, (max-width: 728px) 100vw, 728px" />
          </figure>

          <figure class="wp-block-image wp-lightbox size-large">
            <img
              loading="lazy"
              decoding="async"
              width="728"
              height="455"
              data-id="1664602"
              src="https://cdn.wccftech.com/wp-content/uploads/2025/09/iPhone-Air-256GB-storage-upgrade-failure-728x455.jpg"
              alt="iPhone Air modded storage upgrade failure" class="wp-image-1664602"
              srcset="https://cdn.wccftech.com/wp-content/uploads/2025/09/iPhone-Air-256GB-storage-upgrade-failure-728x455.jpg 728w, https://cdn.wccftech.com/wp-content/uploads/2025/09/iPhone-Air-256GB-storage-upgrade-failure-564x352.jpg 564w, https://cdn.wccftech.com/wp-content/uploads/2025/09/iPhone-Air-256GB-storage-upgrade-failure.jpg 1095w"
              sizes="auto, (max-width: 728px) 100vw, 728px" />
            </figure>
        </figure>
      `);
      expect(components.length).toBe(1);
      const component = components.pop() as GalleryComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('gallery');
      expect(component.direction).toBe('horizontal');
      expect(component.errors).toHaveLength(0);
      expect(component.warnings).toHaveLength(0);
      expect(component.images.length).toBe(3);
      expect(component.images[0]).toEqual({
        link: 'https://cdn.wccftech.com/wp-content/uploads/2025/09/iPhone-Air-1TB-storage-upgrade-failure.jpg',
        alt: 'iPhone Air modded storage upgrade failure',
        imageurl:
          'https://cdn.wccftech.com/wp-content/uploads/2025/09/iPhone-Air-1TB-storage-upgrade-failure-728x453.jpg',
        height: 453,
        width: 728,
      });
      expect(component.images[1]).toEqual({
        alt: 'iPhone Air modded storage upgrade failure',
        height: 446,
        width: 728,
        imageurl:
          'https://cdn.wccftech.com/wp-content/uploads/2025/09/iPhone-Air-512GB-storage-upgrade-failure-728x446.jpg',
      });
      expect(component.images[2]).toEqual({
        alt: 'iPhone Air modded storage upgrade failure',
        imageurl:
          'https://cdn.wccftech.com/wp-content/uploads/2025/09/iPhone-Air-256GB-storage-upgrade-failure-728x455.jpg',
        height: 455,
        width: 728,
      });
    });
  });

  describe('Video component', () => {
    test('It should process a simple video element', () => {
      const src = 'movie.mp4';
      const poster = 'poster.jpg';
      const content = `
        <video
          src="${src}"
          poster="${poster}"
          controls
          loop
          muted/>`;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(1);
      const component = components.pop() as VideoComponent;
      expect(component).toBeDefined();
      expect(component.component).toBe('video');
      expect(component.url).toBe(src);
      expect(component.poster).toBe(poster);
      expect(component.loop).toBe(true);
      expect(component.autoplay).toBe(false);
      expect(component.controls).toBe(true);
      expect(component.muted).toBe(true);
    });
    test('It should process a video element with multiple sources', () => {
      const src = 'movie.mp4';
      const poster = 'poster.jpg';
      const content = `
        <video
          poster="${poster}"
          controls
          loop
          muted>
          <source src="${src}" type="video/mp4">
          <source src="movie.ogv" type="video/ogg">
          <source src="movie.webm" type="video/webm">
        </video>`;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(1);
      const component = components.pop() as VideoComponent;
      expect(component).toBeDefined();
      expect(component.component).toBe('video');
      expect(component.url).toBe(src);
      expect(component.poster).toBe(poster);
      expect(component.loop).toBe(true);
      expect(component.autoplay).toBe(false);
      expect(component.controls).toBe(true);
      expect(component.muted).toBe(true);
    });
    test('It should use source instead of src attribute', () => {
      const src = 'movie.mp4';
      const poster = 'poster.jpg';
      const content = `
        <video
          poster="${poster}"
          controls
          loop
          src="movie-1.mp4"
          muted>
          <source src="${src}" type="video/mp4">
          <source src="movie.ogv" type="video/ogg">
          <source src="movie.webm" type="video/webm">
        </video>`;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(1);
      const component = components.pop() as VideoComponent;
      expect(component).toBeDefined();
      expect(component.component).toBe('video');
      expect(component.url).toBe(src);
      expect(component.poster).toBe(poster);
      expect(component.loop).toBe(true);
      expect(component.autoplay).toBe(false);
      expect(component.controls).toBe(true);
      expect(component.muted).toBe(true);
    });
    test('It should detect video component with caption', () => {
      const src = 'movie.mp4';
      const poster = 'poster.jpg';
      const caption = 'This is a caption';
      const content = `
        <figure>
          <video
            poster="${poster}"
            controls
            loop
            src="movie-1.mp4"
            muted>
            <source src="${src}" type="video/mp4">
            <source src="movie.ogv" type="video/ogg">
            <source src="movie.webm" type="video/webm">
          </video>
          <figcaption>
            ${caption}
          </figcaption>
        </figure>`;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(1);
      const component = components.pop() as VideoComponent;
      expect(component).toBeDefined();
      expect(component.component).toBe('video');
      expect(component.url).toBe(src);
      expect(component.poster).toBe(poster);
      expect(component.loop).toBe(true);
      expect(component.autoplay).toBe(false);
      expect(component.controls).toBe(true);
      expect(component.muted).toBe(true);
      expect(component.caption).toBe(caption);
    });
  });

  describe('Audio component', () => {
    test('It should process a simple audio element', () => {
      const src = 'audio.mp3';
      const content = `
        <audio
          src="${src}"
          controls
          loop
          muted/>`;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(1);
      const component = components.pop() as AudioComponent;
      expect(component).toBeDefined();
      expect(component.component).toBe('audio');
      expect(component.url).toBe(src);
      expect(component.loop).toBe(true);
      expect(component.autoplay).toBe(false);
      expect(component.controls).toBe(true);
      expect(component.muted).toBe(true);
    });
    test('It should process a audio element with multiple sources', () => {
      const src = 'audio.ogg';
      const content = `
        <audio
          loop
          muted>
          <source src="${src}" type="audio/ogg">
          <source src="audio.mp3" type="audio/mpeg">
        </audio>`;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(1);
      const component = components.pop() as AudioComponent;
      expect(component).toBeDefined();
      expect(component.component).toBe('audio');
      expect(component.url).toBe(src);
      expect(component.loop).toBe(true);
      expect(component.muted).toBe(true);
      expect(component.autoplay).toBe(false);
      expect(component.controls).toBe(false);
    });
    test('It should use source instead of src attribute', () => {
      const src = 'audio.mp3';
      const content = `
        <audio
          controls
          loop
          src="audio-1.mp3"
          muted>
          <source src="${src}" type="audio/mpeg">
          <source src="audio.mp3" type="audio/ogg">
        </audio>`;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(1);
      const component = components.pop() as AudioComponent;
      expect(component).toBeDefined();
      expect(component.component).toBe('audio');
      expect(component.url).toBe(src);
      expect(component.loop).toBe(true);
      expect(component.autoplay).toBe(false);
      expect(component.controls).toBe(true);
      expect(component.muted).toBe(true);
    });
    test('It should process an audio using figure', () => {
      const src = 'audio.mp3';
      const caption = 'Example audio';
      const content = `
        <figure>
          <audio
            src="${src}"
            controls
            loop
            muted/>
          <figcaption>
            ${caption}
          </figcaption>
        </figure>
        `;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(1);
      const component = components.pop() as AudioComponent;
      expect(component).toBeDefined();
      expect(component.component).toBe('audio');
      expect(component.url).toBe(src);
      expect(component.loop).toBe(true);
      expect(component.autoplay).toBe(false);
      expect(component.controls).toBe(true);
      expect(component.muted).toBe(true);
      expect(component.caption).toBe(caption);
    });
    test('It should process an audio using figure with div between the tag', () => {
      const src = 'audio.mp3';
      const caption = 'Example audio';
      const content = `
        <figure>
          <div>
            <audio
              src="${src}"
              controls
              loop
              muted/>
          </div>
          <figcaption>
            ${caption}
          </figcaption>
        </figure>
        `;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(1);
      const component = components.pop() as AudioComponent;
      expect(component).toBeDefined();
      expect(component.component).toBe('audio');
      expect(component.url).toBe(src);
      expect(component.loop).toBe(true);
      expect(component.autoplay).toBe(false);
      expect(component.controls).toBe(true);
      expect(component.muted).toBe(true);
      expect(component.caption).toBe(caption);
    });
  });

  describe('Recipe components', () => {
    test('It should map recipe component from class attribute', () => {
      const mappings: Array<Mapping> = [
        {
          component: 'recipe',
          match: 'all',
          filters: [
            {
              type: 'tag',
              items: ['div'],
            },
            {
              type: 'class',
              match: 'any',
              items: ['recipe'],
            },
          ],
        },
      ];
      const content = `
        <div class="recipe top">
            <h4 class="text-lg hidden-xs">
              This is a large text
            </h4>
            <p>Subtitle</p>
        </div>
      `;
      const components = HTMLMapper.toComponents(content, { mappings });
      expect(components.length).toBe(1);
      const recipeComponent = components.pop() as RecipeComponent;
      expect(recipeComponent).toBeDefined();
      if (!recipeComponent) {
        return;
      }
      expect(recipeComponent.components[0].component).toBe('intro');
      expect(recipeComponent.components[1].component).toBe('body');
    });
    test('It should map empty recipe component', () => {
      const mappings: Array<Mapping> = [
        {
          component: 'recipe',
          match: 'all',
          filters: [
            {
              type: 'tag',
              items: ['div'],
            },
            {
              type: 'class',
              match: 'any',
              items: ['recipe'],
            },
          ],
        },
      ];
      const content = `
        <div class="recipe"></div>
      `;
      const components = HTMLMapper.toComponents(content, { mappings });
      expect(components.length).toBe(1);
      const recipeComponent = components.pop() as RecipeComponent;
      expect(recipeComponent).toBeDefined();
      if (!recipeComponent) {
        return;
      }
      expect(recipeComponent.components.length).toBe(0);
    });
  });

  describe('Mapping', () => {
    test('It should map components using match any with filters any', () => {
      const mappings: Array<Mapping> = [
        {
          component: 'headline',
          match: 'any',
          filters: [
            {
              type: 'tag',
              items: ['h2'],
            },
            {
              type: 'class',
              match: 'any',
              items: ['text-md'],
            },
          ],
        },
        {
          component: 'text48',
          match: 'any',
          filters: [
            {
              type: 'class',
              match: 'any',
              items: ['text-lg'],
            },
          ],
        },
        {
          component: 'subtitle',
          match: 'any',
          filters: [
            {
              type: 'class',
              match: 'any',
              items: ['sub-sm'],
            },
          ],
        },
      ];
      const content = `
        <h2>This is a headline</h2>
        <h4 class="text-lg hidden-xs">
          This is a large text
        </h4>
        <p class="sub-sm">Subtitle</p>
        <p class="text-md">Headline</p>
      `;
      const components = HTMLMapper.toComponents(content, { mappings });
      expect(components.length).toBe(4);
      expect(components[0].component).toBe('headline');
      expect(components[1].component).toBe('text48');
      expect(components[2].component).toBe('subtitle');
      expect(components[3].component).toBe('headline');
    });
    test('It should map components using match any with filters all', () => {
      const mappings: Array<Mapping> = [
        {
          component: 'text33',
          match: 'any',
          filters: [
            {
              type: 'class',
              match: 'all',
              items: ['top', 'head'],
            },
          ],
        },
        {
          component: 'text35',
          match: 'any',
          filters: [
            {
              type: 'class',
              match: 'all',
              items: ['heading', 'story'],
            },
          ],
        },
      ];
      const content = `
        <p class="head top primary">Text example</p>
        <p class="heading primary">Text example</p>
      `;
      const components = HTMLMapper.toComponents(content, { mappings });
      expect(components.length).toBe(2);
      expect(components[0].component).toBe('text33');
      expect(components[1].component).toBe('body');
    });
    test('It should map components using match any with filters equal', () => {
      const mappings: Array<Mapping> = [
        {
          component: 'text36',
          match: 'any',
          filters: [
            {
              type: 'class',
              match: 'equal',
              items: ['head', 'story'],
            },
          ],
        },
      ];
      const content = `
        <p class="story head">Text example</p>
        <p class="head story headline">Text example</p>
      `;
      const components = HTMLMapper.toComponents(content, { mappings });
      expect(components.length).toBe(2);
      expect(components[0].component).toBe('text36');
      expect(components[1].component).toBe('body');
    });
    test('It should map components using match all with filters any', () => {
      const mappings: Array<Mapping> = [
        {
          component: 'text48',
          match: 'all',
          filters: [
            {
              type: 'tag',
              items: ['h2'],
            },
            {
              type: 'class',
              match: 'all',
              items: ['text-lg'],
            },
          ],
        },
        {
          component: 'subtitle',
          match: 'all',
          filters: [
            {
              type: 'class',
              match: 'any',
              items: ['sub-sm'],
            },
          ],
        },
      ];
      const content = `
        <h2 class="text-lg hidden-xs">
          This is a large text
        </h2>
        <h2>
          This is a large text
        </h2>
        <p class="sub-sm">Subtitle</p>
      `;
      const components = HTMLMapper.toComponents(content, { mappings });
      expect(components.length).toBe(3);
      expect(components[0].component).toBe('text48');
      expect(components[1].component).toBe('title');
      expect(components[2].component).toBe('subtitle');
    });
    test('It should map components using match all with filters all', () => {
      const mappings: Array<Mapping> = [
        {
          component: 'text33',
          match: 'all',
          filters: [
            {
              type: 'tag',
              items: ['h3', 'h2'],
            },
            {
              type: 'class',
              match: 'all',
              items: ['top', 'head'],
            },
          ],
        },
        {
          component: 'text35',
          match: 'all',
          filters: [
            {
              type: 'tag',
              items: ['p', 'ol'],
            },
            {
              type: 'class',
              match: 'all',
              items: ['heading', 'story'],
            },
          ],
        },
      ];
      const content = `
        <h3 class="head top primary">Text example</h3>
        <h2 class="head top primary">Text example</h2>
        <h2>Text example</h2>
        <p class="heading story">Text example</p>
        <p class="heading top">Text example</p>
        <ol class="heading story">
          <li>Item 1</li>
        </ol>
      `;
      const components = HTMLMapper.toComponents(content, { mappings });
      expect(components.length).toBe(6);
      expect(components[0].component).toBe('text33');
      expect(components[1].component).toBe('text33');
      expect(components[2].component).toBe('title');
      expect(components[3].component).toBe('text35');
      expect(components[4].component).toBe('body');
      expect(components[5].component).toBe('text35');
    });
    test('It should map components using match all with filters equal', () => {
      const mappings: Array<Mapping> = [
        {
          component: 'text36',
          match: 'all',
          filters: [
            {
              type: 'tag',
              items: ['p'],
            },
            {
              type: 'class',
              match: 'equal',
              items: ['head', 'story'],
            },
          ],
        },
      ];
      const content = `
        <p class="head story">Text example</p>
        <h1 class="head story headline">Text <span class="teasdsaasdasd">example</span></h1>
        <h3 class="head story">Text example</h3>
      `;
      const components = HTMLMapper.toComponents(content, { mappings });
      expect(components.length).toBe(3);
      expect(components[0].component).toBe('text36');
      expect(components[1].component).toBe('headline');
      expect(components[2].component).toBe('subtitle');
    });

    describe('Validation', () => {
      test('It should return a valid mapping', () => {
        const mappings = [
          {
            component: 'text36',
            match: 'all',
            filters: [
              {
                type: 'tag',
                items: ['p'],
              },
              {
                type: 'class',
                match: 'equal',
                items: ['head', 'story'],
              },
            ],
          },
        ];
        const isValid = isValidParams({
          mappings,
        });
        expect(isValid).toBe(true);
      });
      test('It should throw an invalid null mapping', () => {
        const mappings = [null];
        const isValid = isValidParams({
          mappings,
        });
        expect(isValid).toBe(false);
      });
    });
  });
});
