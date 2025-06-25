import { test, expect, describe } from 'vitest';

import { HTMLMapper, type Mapping } from './HTMLMapper';
import type {
  GalleryComponent,
  ImageComponent,
  TextComponent,
  TwitterComponent,
  InstagramComponent,
  YoutubeComponent,
  VideoComponent,
  AudioComponent,
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

    test('It should set a text45 component base on role', () => {
      const id = 'cf-123';
      const content = `<p id="${id}" role="text45">Hello world</p>`;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(1);
      const component = components.pop() as TextComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('text45');
      expect(component.id).toBe(id);
      expect(component.text).toBe(content);
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
      expect(component?.caption).toBe('Hello world');
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
      expect(component?.caption).toBeUndefined();
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
      expect(component?.caption).toBe('This is a caption');
      expect(component?.credit).toBe('<span>This is a credit</span>');
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
      });
      expect(component.images[1]).toEqual({
        caption: 'Image 2 Caption',
        imageurl: 'image2.jpg',
      });
      expect(component.images[2]).toEqual({
        imageurl: 'image3.jpg',
      });
      expect(component.images[3]).toEqual({
        imageurl: 'image4.jpg',
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
      `;
      const components = HTMLMapper.toComponents(content, { mappings });
      expect(components.length).toBe(3);
      expect(components[0].component).toBe('headline');
      expect(components[1].component).toBe('text48');
      expect(components[2].component).toBe('subtitle');
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
        <p class="head story">Text example</p>
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
              match: 'any',
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
        <h1 class="head story headline">Text example</h1>
        <h3 class="head story">Text example</h3>
      `;
      const components = HTMLMapper.toComponents(content, { mappings });
      expect(components.length).toBe(3);
      expect(components[0].component).toBe('text36');
      expect(components[1].component).toBe('headline');
      expect(components[2].component).toBe('subtitle');
    });
  });
});
