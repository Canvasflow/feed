import path, { join } from 'path';
import { readFileSync } from 'fs';
import { test, expect, describe, beforeEach } from 'vite-plus/test';
import { HTMLMapper } from './HTMLMapper';
import { type ComponentMapping } from '../mapping/Mapping';
import {
  type GalleryComponent,
  type ImageComponent,
  type VideoComponent,
  type AudioComponent,
  isGalleryComponent,
  isGalleryImage,
} from '../Component';

describe('Image component', () => {
  test(
    'It should process a simple image component',
    { tags: ['unit', 'html'] },
    () => {
      const content = `<img src="example.jpg" alt="Hello world"/>`;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(1);
      const component = components.pop() as ImageComponent;
      expect(component).toBeDefined();
      expect(component.component).toBe('image');
      expect(component?.imageurl).toBe('example.jpg');
      expect(component?.alt).toBe('Hello world');
      expect(component.caption).toBeUndefined();
    }
  );

  test(
    'It should process a simple picture element with invalid caption',
    { tags: ['unit', 'html'] },
    () => {
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
    }
  );

  test(
    'It should process a simple picture element with valid caption',
    { tags: ['unit', 'html'] },
    () => {
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
    }
  );

  test(
    'It should process a figure component without caption',
    { tags: ['unit', 'html'] },
    () => {
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
      expect(component?.caption).toBe('');
    }
  );

  test(
    'It should process a figure component with caption',
    { tags: ['unit', 'html'] },
    () => {
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
    }
  );

  test(
    'It should process a figure with credit',
    { tags: ['unit', 'html'] },
    () => {
      const content = `
        <figure>
            <div>
                <picture>
                    <source type="image/webp"
                        srcset="https://cdn.mos.cms.futurecdn.net/votjqh4AFn3tEQhRBq8Arn-1920-80.jpg.webp 1920w, https://cdn.mos.cms.futurecdn.net/votjqh4AFn3tEQhRBq8Arn-1600-80.jpg.webp 1600w, https://cdn.mos.cms.futurecdn.net/votjqh4AFn3tEQhRBq8Arn-1280-80.jpg.webp 1280w, https://cdn.mos.cms.futurecdn.net/votjqh4AFn3tEQhRBq8Arn-1024-80.jpg.webp 1024w, https://cdn.mos.cms.futurecdn.net/votjqh4AFn3tEQhRBq8Arn-768-80.jpg.webp 768w, https://cdn.mos.cms.futurecdn.net/votjqh4AFn3tEQhRBq8Arn-415-80.jpg.webp 415w"
                        sizes="(min-width: 1024px) 970px, 100vw" />
                    <img src="https://cdn.mos.cms.futurecdn.net/votjqh4AFn3tEQhRBq8Arn.jpg" alt="Car fan"
                        srcset="https://cdn.mos.cms.futurecdn.net/votjqh4AFn3tEQhRBq8Arn-1920-80.jpg 1920w, https://cdn.mos.cms.futurecdn.net/votjqh4AFn3tEQhRBq8Arn-1600-80.jpg 1600w, https://cdn.mos.cms.futurecdn.net/votjqh4AFn3tEQhRBq8Arn-1280-80.jpg 1280w, https://cdn.mos.cms.futurecdn.net/votjqh4AFn3tEQhRBq8Arn-1024-80.jpg 1024w, https://cdn.mos.cms.futurecdn.net/votjqh4AFn3tEQhRBq8Arn-768-80.jpg 768w, https://cdn.mos.cms.futurecdn.net/votjqh4AFn3tEQhRBq8Arn-415-80.jpg 415w"
                        sizes="(min-width: 1024px) 970px, 100vw" data-new-v2-image="true">
                </picture>
                <picture>
                    <source type="image/webp"
                        srcset="https://cdn.mos.cms.futurecdn.net/ki3fuFZNuyXGrsiq3WhFsj-200-100.png.webp" />
                    <img src="https://cdn.mos.cms.futurecdn.net/ki3fuFZNuyXGrsiq3WhFsj-200-100.png">
                </picture>
            </div>
            <figcaption>
                <div class="credit">(Image credit: Getty Images / <a
                        href="https://www.gettyimages.co.uk/search/2/image?artistexact=Prostock-Studio"
                        rel="nofollow">Prostock-Studio</a>)</div>
            </figcaption>
        </figure>`;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(2);
      let component = components.shift() as ImageComponent;
      expect(component).toBeDefined();
      expect(component.component).toBe('image');
      expect(component?.alt).toBe('Car fan');
      expect(component?.caption).toBe('');
      expect(component?.credit).toBe('(Image credit: Getty Images / Prostock-Studio)');
      expect(component?.imageurl).toBe('https://cdn.mos.cms.futurecdn.net/votjqh4AFn3tEQhRBq8Arn.jpg');
      
      component = components.shift() as ImageComponent;
      expect(component).toBeDefined();
      expect(component.component).toBe('image');
      expect(component?.alt).toBeUndefined();
      expect(component?.caption).toBe('');
      expect(component?.credit).toBe('(Image credit: Getty Images / Prostock-Studio)');
      expect(component?.imageurl).toBe('https://cdn.mos.cms.futurecdn.net/ki3fuFZNuyXGrsiq3WhFsj-200-100.png');
    }
  );

  test(
    'It should process a figure component with caption and html',
    { tags: ['unit', 'html'] },
    () => {
      const content = `
        <figure>
          <img src="cover.jpg"
            alt="Aaron Moten in the second season of Fallout, image courtesy of Amazon Prime Video"
            width="2560"
            height="1814"/>
          <figcaption>
            Aaron Moten in <em>Fallout</em>. All imagery courtesy of Amazon Prime Video.
          </figcaption>
        </figure>`;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(1);
      const component = components.pop() as ImageComponent;
      expect(component).toBeDefined();
      expect(component.component).toBe('image');
      expect(component?.imageurl).toBe('cover.jpg');
      expect(component?.alt).toBe(
        'Aaron Moten in the second season of Fallout, image courtesy of Amazon Prime Video'
      );
      expect(component?.caption).toBe(
        'Aaron Moten in <em>Fallout</em>. All imagery courtesy of Amazon Prime Video.'
      );
    }
  );

  test(
    'It should process a figure component with caption and credit',
    { tags: ['unit', 'html'] },
    () => {
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
    }
  );

  test(
    'It should process a figure component with caption and role credit',
    { tags: ['unit', 'html'] },
    () => {
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
      expect(component?.credit).toBe('<span>This is a credit</span>');
    }
  );

  test(
    'It should process a figure component with caption and credit with class',
    { tags: ['unit', 'html'] },
    () => {
      const content = `
        <figure>
          <img src="cover.jpg" alt="My image">
          <figcaption>
            This is
            a caption
          </figcaption>
          <span class="credit">This <b>is</b> a credit</span>
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
    }
  );

  test(
    'It should process images inside p tags',
    { tags: ['unit', 'html'] },
    () => {
      const content = `<p>Hello <img src="a.jpg"> world <img src="b.jpg">!</p>`;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(5);
      expect(components[0].component).toBe('body');
      expect(components[1].component).toBe('image');
      expect(components[2].component).toBe('body');
      expect(components[3].component).toBe('image');
      expect(components[4].component).toBe('body');
    }
  );

  test(
    'It should process images inside headers tags',
    { tags: ['unit', 'html'] },
    () => {
      const headers = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
      for (const header of headers) {
        const content = `<${header}><img decoding="async" class="alignnone size-full wp-image-1470895" src="https://www.motorsportmagazine.com/wp-content/uploads/2025/11/Audi-F1-2026-car-livery-with-ring-background-scaled.jpg" alt="Audi F1 2026 car livery with ring background" width="2560" height="1440" srcset="https://www.motorsportmagazine.com/wp-content/uploads/2025/11/Audi-F1-2026-car-livery-with-ring-background-scaled.jpg 2560w, https://www.motorsportmagazine.com/wp-content/uploads/2025/11/Audi-F1-2026-car-livery-with-ring-background-1024x576.jpg 1024w, https://www.motorsportmagazine.com/wp-content/uploads/2025/11/Audi-F1-2026-car-livery-with-ring-background-768x432.jpg 768w, https://www.motorsportmagazine.com/wp-content/uploads/2025/11/Audi-F1-2026-car-livery-with-ring-background-450x253.jpg 450w, https://www.motorsportmagazine.com/wp-content/uploads/2025/11/Audi-F1-2026-car-livery-with-ring-background-818x460.jpg 818w" sizes="(max-width: 2560px) 100vw, 2560px"></${header}>`;
        const components = HTMLMapper.toComponents(content);
        expect(components.length).toBe(1);
        expect(components[0].component).toBe('image');
        const component = components.pop() as ImageComponent;
        expect(component.imageurl).toBe(
          'https://www.motorsportmagazine.com/wp-content/uploads/2025/11/Audi-F1-2026-car-livery-with-ring-background-scaled.jpg'
        );
      }
    }
  );

  test('It should process images with link', { tags: ['unit', 'html'] }, () => {
    const content = `
        <a
          href="https://wwww.example.com"
          rel="attachment wp-att-74859">
          <img
            loading="lazy"
            decoding="async"
            class="alignnone size-large wp-image-74859"
            src="https://wwww.example.com/image.jpg"
            alt="My image"
            width="600"
            height="800">
        </a>
      `;
    const components = HTMLMapper.toComponents(content);
    expect(components.length).toBe(1);
    const component = components.pop() as ImageComponent;
    expect(component).toBeDefined();
    expect(component.component).toBe('image');
    expect(component?.imageurl).toBe('https://wwww.example.com/image.jpg');
    expect(component?.link).toBe('https://wwww.example.com');
    expect(component?.alt).toBe('My image');
  });

  test(
    'It should process images with wrapper elements',
    { tags: ['unit', 'html'] },
    () => {
      const content = `
        <div>
        <a
          href="https://wwww.example.com"
          rel="attachment wp-att-74859">
          <img
            loading="lazy"
            decoding="async"
            class="alignnone size-large wp-image-74859"
            src="https://wwww.example.com/image.jpg"
            alt="My image"
            width="600"
            height="800">
        </a>
        </div>
      `;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(1);
      const component = components.pop() as ImageComponent;
      expect(component).toBeDefined();
      expect(component.component).toBe('image');
      expect(component?.imageurl).toBe('https://wwww.example.com/image.jpg');
      expect(component?.link).toBe('https://wwww.example.com');
      expect(component?.alt).toBe('My image');
    }
  );

  test(
    'It should process images with link inside a p tag',
    { tags: ['unit', 'html'] },
    () => {
      const content = `
      <p>
        <a
          href="https://wwww.example.com"
          rel="attachment wp-att-74859">
          <img
            loading="lazy"
            decoding="async"
            class="alignnone size-large wp-image-74859"
            src="https://wwww.example.com/image.jpg"
            alt="My image"
            width="600"
            height="800">
        </a>
      </p>`;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(1);
      const component = components.pop() as ImageComponent;
      expect(component).toBeDefined();
      expect(component.component).toBe('image');
      expect(component?.imageurl).toBe('https://wwww.example.com/image.jpg');
      expect(component?.link).toBe('https://wwww.example.com');
      expect(component?.alt).toBe('My image');
    }
  );

  test(
    'It should process images with link inside header tags',
    { tags: ['unit', 'html'] },
    () => {
      const headers = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
      for (const header of headers) {
        const content = `
  <${header}>
        <a
          href="https://wwww.example.com"
          rel="attachment wp-att-74859">
          <img
            loading="lazy"
            decoding="async"
            class="alignnone size-large wp-image-74859"
            src="https://wwww.example.com/image.jpg"
            alt="My image"
            width="600"
            height="800">
        </a></${header}>
      `;
        const components = HTMLMapper.toComponents(content);
        expect(components.length).toBe(1);
        const component = components.pop() as ImageComponent;
        expect(component).toBeDefined();
        expect(component.component).toBe('image');
        expect(component?.imageurl).toBe('https://wwww.example.com/image.jpg');
        expect(component?.link).toBe('https://wwww.example.com');
        expect(component?.alt).toBe('My image');
      }
    }
  );
});

describe('Gallery components', () => {
  let htmlDirPath: string = '';

  beforeEach(() => {
    htmlDirPath = join(`${process.env.SUPPORT_PATH}`, 'html');
  });
  test(
    'It should create a simple gallery component',
    { tags: ['unit', 'html'] },
    () => {
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
    }
  );
  test(
    'It should create a gallery component from wordpress',
    { tags: ['unit', 'html'] },
    () => {
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
    }
  );
  test(
    'It should create a gallery component from mapping',
    { tags: ['unit', 'html'] },
    () => {
      const properties = {
        success: true,
      };
      const mappings: Array<ComponentMapping> = [
        {
          component: 'gallery',
          match: 'any',
          filters: [
            {
              type: 'class',
              match: 'any',
              items: ['inline-gallery__items'],
            },
          ],
          properties,
          slide: {
            match: 'all',
            filters: [
              {
                type: 'tag',
                items: ['div'],
              },
              {
                type: 'class',
                match: 'any',
                items: ['items__item'],
              },
            ],
          },
        },
      ];
      const content = readFileSync(
        path.join(htmlDirPath, 'custom-mapping-gallery.html'),
        'utf-8'
      );
      const components = HTMLMapper.toComponents(content, { mappings });
      expect(components.length).toBe(1);
      const component = components.pop() as GalleryComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(isGalleryComponent(component)).toBe(true);
      const { images } = component;
      expect(images.length).toBe(4);
      for (const image of images) {
        expect(isGalleryImage(image)).toBe(true);
      }
    }
  );
});

describe('Video component', () => {
  test(
    'It should process a simple video element',
    { tags: ['unit', 'html'] },
    () => {
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
    }
  );
  test(
    'It should process a video element with multiple sources',
    { tags: ['unit', 'html'] },
    () => {
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
    }
  );
  test(
    'It should use source instead of src attribute',
    { tags: ['unit', 'html'] },
    () => {
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
    }
  );
  test(
    'It should detect video component with caption',
    { tags: ['unit', 'html'] },
    () => {
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
    }
  );
});

describe('Audio component', () => {
  test(
    'It should process a simple audio element',
    { tags: ['unit', 'html'] },
    () => {
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
    }
  );
  test(
    'It should process a audio element with multiple sources',
    { tags: ['unit', 'html'] },
    () => {
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
    }
  );
  test(
    'It should use source instead of src attribute',
    { tags: ['unit', 'html'] },
    () => {
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
    }
  );
  test(
    'It should process an audio using figure',
    { tags: ['unit', 'html'] },
    () => {
      const src = 'audio.mp3';
      const caption = 'Example audio';
      const content = `
        <figure>
          <audio
            src="${src}"
            controls
            loop
            muted></audio>
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
    }
  );
  test(
    'It should process an audio using figure with div between the tag',
    { tags: ['unit', 'html'] },
    () => {
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
    }
  );
  test(
    'It should process an apple podcast episode',
    { tags: ['unit', 'html'] },
    () => {
      const src =
        'https://embed.podcasts.apple.com/us/podcast/all-bark-no-bite-the-reality-behind-dog-the-bounty-hunter/id1849068807?i=1000761154684';
      const content = `
       <iframe
        allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
        frameborder="0"
        height="450"
        style="width:100%;max-width:660px;overflow:hidden;border-radius:10px;"
        sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
        src="${src}">
       </iframe>`;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(1);
      const component = components.pop() as AudioComponent;
      expect(component).toBeDefined();
      expect(component.component).toBe('audio');
      expect(component.url).toBe(src);
      expect(component.loop).toBe(false);
      expect(component.autoplay).toBe(true);
      expect(component.controls).toBe(false);
      expect(component.muted).toBe(false);
    }
  );
  test(
    'It should process an apple podcast series',
    { tags: ['unit', 'html'] },
    () => {
      const src =
        'https://embed.podcasts.apple.com/us/podcast/unheard-true-crime-in-their-own-words/id1849068807';
      const content = `
       <iframe
        allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
        frameborder="0"
        height="450"
        style="width:100%;max-width:660px;overflow:hidden;border-radius:10px;"
        sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
        src="${src}">
       </iframe>`;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(1);
      const component = components.pop() as AudioComponent;
      expect(component).toBeDefined();
      expect(component.component).toBe('audio');
      expect(component.url).toBe(src);
      expect(component.loop).toBe(false);
      expect(component.autoplay).toBe(true);
      expect(component.controls).toBe(false);
      expect(component.muted).toBe(false);
    }
  );
});
