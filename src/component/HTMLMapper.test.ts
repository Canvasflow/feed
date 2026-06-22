import path, { join } from 'path';
import { readFileSync } from 'fs';

import { test, expect, describe, beforeEach } from 'vite-plus/test';

import { HTMLMapper } from './HTMLMapper';
import {
  type ComponentMapping,
  type Mapping,
  isValidParams,
  isValidMapping,
  processTextLinks,
} from './Mapping';
import {
  type GalleryComponent,
  type ImageComponent,
  type TextComponent,
  type TwitterComponent,
  type InstagramComponent,
  type YoutubeComponent,
  type VideoComponent,
  type AudioComponent,
  type TikTokComponent,
  type ButtonComponent,
  type RecipeComponent,
  type HTMLTableComponent,
  type DailymotionComponent,
  type VimeoComponent,
  type ContainerComponent,
  type CustomComponent,
  type ColumnsComponent,
  type LiveContainerComponent,
  isTextComponent,
  isImageComponent,
  isHTMLTableComponent,
  isButtonComponent,
  isGalleryComponent,
  isGalleryImage,
} from './Component';

describe('Root Element', () => {
  test(
    'It should return the root element with an all filter with tag',
    { tags: ['unit', 'html'] },
    () => {
      const rootMapping: Mapping = {
        match: 'all',
        filters: [
          {
            type: 'tag',
            items: ['main'],
          },
        ],
      };
      const rootElement = `<main><p class="text-md">This is the first content</p><h2>This is a title</h2></main>`;
      const content = `
        <html>
          <div data-widget="header">
            <h1>Example</h1>
          </div>
          ${rootElement}
        </html>
      `;
      const rootContent = HTMLMapper.getRootElement(content, rootMapping);
      expect(rootContent).toBe(rootElement);
    }
  );

  test(
    'It should return the root element with any filter with tag or class',
    { tags: ['unit', 'html'] },
    () => {
      const rootMapping: Mapping = {
        match: 'any',
        filters: [
          {
            type: 'tag',
            items: ['main'],
          },
          {
            type: 'class',
            match: 'any',
            items: ['main'],
          },
        ],
      };
      const rootElement = `<div class="main"><p>This is the first content</p><h2>This is a title</h2></div>`;
      const content = `
        <html>
          <div data-widget="header">
            <h1>Example</h1>
          </div>
          ${rootElement}
        </html>
      `;
      const rootContent = HTMLMapper.getRootElement(content, rootMapping);
      expect(rootContent).toBe(rootElement);
    }
  );

  test(
    'It should return the root element with any filter with an id',
    { tags: ['unit', 'html'] },
    () => {
      const rootMapping: Mapping = {
        match: 'all',
        filters: [
          {
            type: 'attribute',
            key: 'id',
            value: 'main',
          },
        ],
      };
      const rootElement = `<div id="main"><p>This is the first content</p><h2>This is a title</h2></div>`;
      const content = `
        <html>
          <div data-widget="header">
            <h1 data-component-on>Example</h1>
          </div>
          ${rootElement}
        </html>
      `;
      const rootContent = HTMLMapper.getRootElement(content, rootMapping);
      expect(rootContent).toBe(rootElement);
    }
  );

  test(
    'It should return the root element with an attribute regex filter',
    { tags: ['unit', 'html'] },
    () => {
      const rootMapping: Mapping = {
        match: 'all',
        filters: [
          {
            type: 'attribute',
            key: 'id',
            regex: '^article-body-\\d+$',
          },
        ],
      };
      const rootElement = `<div id="article-body-42"><p>This is the first content</p><h2>This is a title</h2></div>`;
      const content = `
        <html>
          <div data-widget="header">
            <h1>Example</h1>
          </div>
          ${rootElement}
        </html>
      `;
      const rootContent = HTMLMapper.getRootElement(content, rootMapping);
      expect(rootContent).toBe(rootElement);
    }
  );

  test(
    'It should return empty when the attribute regex filter does not match',
    { tags: ['unit', 'html'] },
    () => {
      const rootMapping: Mapping = {
        match: 'all',
        filters: [
          {
            type: 'attribute',
            key: 'id',
            regex: '^article-body-\\d+$',
          },
        ],
      };
      const rootElement = `<div id="article-body-main"><p>This is the first content</p><h2>This is a title</h2></div>`;
      const content = `
        <html>
          <div data-widget="header">
            <h1>Example</h1>
          </div>
          ${rootElement}
        </html>
      `;
      const rootContent = HTMLMapper.getRootElement(content, rootMapping);
      expect(rootContent).toBe(null);
    }
  );

  test(
    'It should match an attribute regex filter with the any match mode',
    { tags: ['unit', 'html'] },
    () => {
      const rootMapping: Mapping = {
        match: 'any',
        filters: [
          {
            type: 'attribute',
            key: 'data-component-name',
            regex: 'Recirculation:.*',
          },
        ],
      };
      const rootElement = `<div data-component-name="Recirculation:ArticleRiver"><p>This is the first content</p></div>`;
      const content = `
        <html>
          <div data-widget="header">
            <h1>Example</h1>
          </div>
          ${rootElement}
        </html>
      `;
      const rootContent = HTMLMapper.getRootElement(content, rootMapping);
      expect(rootContent).toBe(rootElement);
    }
  );

  test(
    'It should return empty because the root element do not match the all mapping',
    { tags: ['unit', 'html'] },
    () => {
      const rootMapping: Mapping = {
        match: 'all',
        filters: [
          {
            type: 'tag',
            items: ['main'],
          },
          {
            type: 'class',
            match: 'any',
            items: ['main'],
          },
        ],
      };
      const rootElement = `<div class="main"><p>This is the first content</p><h2>This is a title</h2></div>`;
      const content = `
        <html>
          <div data-widget="header">
            <h1 data-component-on>Example</h1>
          </div>
          ${rootElement}
        </html>
      `;
      const rootContent = HTMLMapper.getRootElement(content, rootMapping);
      expect(rootContent).toBe(null);
    }
  );
});

describe('Text components', () => {
  test(
    'It should create a p component from plain text',
    { tags: ['unit', 'html'] },
    () => {
      const content = `Hello world`;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(1);
      const component = components.pop() as TextComponent;
      expect(component).toBeDefined();
      expect(component.component).toBe('body');
      expect(component?.text).toBe(`<p>${content}</p>`);
    }
  );

  test(
    'It should create a body component from anchor',
    { tags: ['unit', 'html'] },
    () => {
      const content = `<p>Sunshine-loving&nbsp;<a href="~/link.aspx?_id=35AD2F39D521448B972FB6C074D8A817&amp;_z=z" target="_blank" title="View page">tomatoes</a> loathe the cold and deteriorate rapidly when chilled.</p>`;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(1);
      const component = components.pop() as TextComponent;
      expect(component).toBeDefined();
      expect(component.component).toBe('body');
    }
  );

  test(
    'It should support space between html tags',
    { tags: ['unit', 'html'] },
    () => {
      const content = `<p><span class="hawk-deal-widget-title-retailer-price"> <span class="hawk-deal-widget-title-price">now $452</span> <span class="hawk-deal-widget-title-retailer">at Amazon</span></span></p>`;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(1);
      const component = components.pop() as TextComponent;
      expect(component).toBeDefined();
      expect(component.component).toBe('body');
    }
  );

  test(
    'It should create a body component from anchor that also has an image',
    { tags: ['unit', 'html'] },
    () => {
      const content = `<a href="https://example.com">
        <div><p>Example</p><div>
        <img src="https://example.com/image.jpg"/>
      </a>`;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(2);
      const component = components.pop();
      expect(component).toBeDefined();
      if (!component) return;
      expect(component.component).toBe('image');
    }
  );

  test(
    'It should set a text45 component base on role',
    { tags: ['unit', 'html'] },
    () => {
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
    }
  );

  test('It should ignore the component', { tags: ['unit', 'html'] }, () => {
    const components = HTMLMapper.toComponents(`
        <p role="text45" data-cf-ignore>Hello world</p>
      `);
    expect(components.length).toBe(0);
  });

  test('Anchors should be present', { tags: ['unit', 'html'] }, () => {
    const content =
      '<a href="https://example.com" target="_blank" rel="nofollow noopener"><p>Hello world</p></a>';
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

  test('Replace invalid links with #', { tags: ['unit', 'html'] }, () => {
    const content = `<p><a href="https://hello world">Hello</a></p>`;
    const expectedContent = `<p><a href="#">Hello</a></p>`;
    const components = HTMLMapper.toComponents(content);
    expect(components.length).toBe(1);
    const component = components.pop() as TextComponent;
    expect(component).toBeDefined();
    if (!component) {
      return;
    }
    expect(component.component).toBe('body');
    expect(component.text).toBe(expectedContent);
  });

  test(
    'Should pass across the properties of the link container',
    { tags: ['unit', 'html'] },
    () => {
      const content = `<a data-google-interstitial="false" aria-label="View Bowers &amp; Wilkins 805 D4 on Amazon"
        href="https://target.georiot.com/Proxy.ashx?tsid=8434&amp;GR_URL=https%3A%2F%2Fwww.amazon.co.uk%2Fs%2Fref%3Dnb_sb_noss%3Fa%3Db%26field-keywords%3DBowers%2B%26Wilkins_805_D4%3D%26tag%3Dftr-t3-ie-21%26ascsubtag%3Dt3-ie-8123647751342797649-21"
        referrerpolicy="no-referrer-when-downgrade" class="hawk-affiliate-link-button"
        data-product-key="20036-583204787"
        data-url="https://target.georiot.com/Proxy.ashx?tsid=8434&amp;GR_URL=https%3A%2F%2Fwww.amazon.co.uk%2Fs%2Fref%3Dnb_sb_noss%3Fa%3Db%26field-keywords%3DBowers%2B%26Wilkins_805_D4%3D%26tag%3Dftr-t3-ie-21%26ascsubtag%3Dt3-ie-8123647751342797649-21"
        data-model-id="1" data-match-id="108853847" data-product-type="200" data-link-merchant="Amazon"
        data-merchant-id="1027" data-merchant-name="Amazon" data-merchant-url="https://www.amazon.co.uk/"
        data-merchant-network="Amazonuk" rel="sponsored noopener" target="_blank" role="link" tabindex="0"
        data-mrf-recirculation="[T3] Affiliation - Affiliate Container"
        data-mrf-link="https://target.georiot.com/Proxy.ashx?tsid=8434&amp;GR_URL=https%3A%2F%2Fwww.amazon.co.uk%2Fs%2Fref%3Dnb_sb_noss%3Fa%3Db%26field-keywords%3DBowers%2B%26Wilkins_805_D4%3D%26tag%3Dftr-t3-ie-21%26ascsubtag%3Dt3-ie-8123647751342797649-21"
        cmp-ltrk="[T3] Affiliation - Affiliate Container" cmp-ltrk-idx="4"
        mrfobservableid="cd5ee766-2f9b-49a8-bb55-3234e14c2593">Check Amazon</a>`;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBeGreaterThan(0);
      const component = components.pop() as TextComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('body');
    }
  );

  test(
    'Should keep the span in the content',
    { tags: ['unit', 'html'] },
    () => {
      const content = `<a data-google-interstitial="false" aria-label="View Philips Hue Dimmer Switch on Conrad Electronic"
    href="https://www.awin1.com/pclick.php?clickref=t3-ie-1080240011994533165&amp;p=28526326903&amp;a=103504&amp;m=5769"
    referrerpolicy="no-referrer-when-downgrade" class="hawk-affiliate-link-container"
    data-product-key="132856-28526326903"
    data-url="https://www.awin1.com/pclick.php?clickref=t3-ie-1080240011994533165&amp;p=28526326903&amp;a=103504&amp;m=5769"
    data-model-id="688615" data-match-id="3838417" data-product-type="1000" data-link-merchant="Conrad Electronic"
    data-merchant-id="8288" data-merchant-name="Conrad Electronic"
    data-merchant-url="http://www.conrad-electronic.co.uk/ce/" data-merchant-network="AW" rel="sponsored noopener"
    target="_blank" role="link" tabindex="0" data-mrf-recirculation="[T3] Affiliation - Affiliate Container"
    data-mrf-link="https://www.awin1.com/pclick.php?clickref=t3-ie-1080240011994533165&amp;p=28526326903&amp;a=103504&amp;m=5769"
    cmp-ltrk="[T3] Affiliation - Affiliate Container" cmp-ltrk-idx="3"
    mrfobservableid="8efec8ff-c17b-4a99-a719-981e4580409b"><span class="hawk-display-price-container"
        data-type="retail"> <span class="hawk-display-price-price">€25.99</span></span></a>`;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBeGreaterThan(0);
      const component = components.pop() as TextComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('body');
    }
  );
});

describe('Instagram component', () => {
  test(
    'It should create an Instagram post component',
    { tags: ['unit', 'html'] },
    () => {
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
    }
  );

  test(
    'It should create an Instagram reel component',
    { tags: ['unit', 'html'] },
    () => {
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
    }
  );

  test(
    'It should create an Instagram tv component',
    { tags: ['unit', 'html'] },
    () => {
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
    }
  );

  test(
    'It should create an Instagram post component with legacy embed API',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(
        `<blockquote class="instagram-media" data-instgrm-captioned="" data-instgrm-version="6"
          style="width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);">
            <p><a href="https://www.instagram.com/p/DYiEPOqC9_d/" target="_blank"
              data-url="https://www.instagram.com/p/DYiEPOqC9_d/" referrerpolicy="no-referrer-when-downgrade"
              data-hl-processed="none">A post shared by Thesis Training
                (@thesistraining)</a></p>
            <p>A photo posted by on </p>
      </blockquote>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as InstagramComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('instagram');
      expect(component.type).toBe(`post`);
      expect(component.id).toBe(`DYiEPOqC9_d`);
    }
  );

  test(
    'It should create an Instagram tv component with legacy embed API',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(
        `<blockquote class="instagram-media" data-instgrm-captioned="" data-instgrm-version="6"
          style="width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);">
            <p><a href="https://www.instagram.com/tv/DYiEPOqC9_d/" target="_blank"
              data-url="https://www.instagram.com/tv/DYiEPOqC9_d/" referrerpolicy="no-referrer-when-downgrade"
              data-hl-processed="none">A post shared by Thesis Training
                (@thesistraining)</a></p>
            <p>A photo posted by on </p>
      </blockquote>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as InstagramComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('instagram');
      expect(component.type).toBe('tv');
      expect(component.id).toBe(`DYiEPOqC9_d`);
    }
  );

  test(
    'It should create an Instagram reel component with legacy embed API',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(
        `<blockquote class="instagram-media" data-instgrm-captioned="" data-instgrm-version="6"
          style="width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);">
            <p><a href="https://www.instagram.com/reel/DYiEPOqC9_d/" target="_blank"
              data-url="https://www.instagram.com/reel/DYiEPOqC9_d/" referrerpolicy="no-referrer-when-downgrade"
              data-hl-processed="none">A post shared by Thesis Training
                (@thesistraining)</a></p>
            <p>A photo posted by on </p>
      </blockquote>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as InstagramComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('instagram');
      expect(component.type).toBe('reel');
      expect(component.id).toBe(`DYiEPOqC9_d`);
    }
  );
});

describe('Button component', () => {
  test(
    'It should create an button component from a tag',
    { tags: ['unit', 'html'] },
    () => {
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
    }
  );

  test(
    'It should create an button component from button tag',
    { tags: ['unit', 'html'] },
    () => {
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
    }
  );

  test(
    'It should create an button component from a tag with button as children',
    { tags: ['unit', 'html'] },
    () => {
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
    }
  );
});

describe('Twitter Component', () => {
  test(
    'It should create a twitter tweet component',
    { tags: ['unit', 'html'] },
    () => {
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
    }
  );
  test(
    'It should create a twitter tweet component inside a figure',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(
        `<figure
	        class="wp-block-embed is-type-rich
            is-provider-twitter wp-block-embed-twitter"
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
				        >September 23, 2025</a>
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
    }
  );
  test(
    'It should create a twitter tweet component with image',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(
        `<blockquote class="twitter-tweet">
            <p dir="ltr" lang="en">
                Randy Arozarena's MRI showed mild inflammation -- more than expected.
                With Luke Raley dealing with back issues and Josh Naylor out with a
                wrist injury, the Mariners are placing Arozarena on the injured list.
                They are selecting outfielder Curtis Washington from High-A Everett --…
            </p>
            — Ryan Divish (@RyanDivish)
            <a
                target="_blank"
                href="https://x.com/RyanDivish/status/2067043835797209515?ref_src=twsrc%5Etfw"
                >June 17, 2026</a
            >
        </blockquote>
`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as TwitterComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('twitter');
      expect(component.params.account).toBe(`RyanDivish`);
      expect(component.params.id).toBe(`2067043835797209515`);
    }
  );
  test(
    'It should create a twitter tweet inside a div',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(
        `<blockquote class="twitter-tweet hawk-ignore" data-lang="en">
    <p lang="en" dir="ltr">
        Samsung Galaxy S26 Series Timeline (South Korea)Unpacked Event:
        February 25Pre-order period: February 26 to March 4Pre-sale period:
        March 5 to March 10Market launch date: March 11
    </p>
    <a href="https://twitter.com/cantworkitout/status/2013951595541913988">January 21, 2026</a>
</blockquote>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as TwitterComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('twitter');
      expect(component.height).toBe(`350`);
      expect(component.params.account).toBe(`cantworkitout`);
      expect(component.params.id).toBe(`2013951595541913988`);
    }
  );
  test(
    'It should create a twitter from an anchor tag in the children',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(
        `<blockquote class="twitter-tweet hawk-ignore" data-lang="en">
    <p lang="en" dir="ltr">ICYMI: You can now use touch controls on your Mac
        display with Sidecar on iPad! &#128064; pic.twitter.com/KOErLtoZCA<a
            href="https://twitter.com/cantworkitout/status/2064234331434852632"
            data-url="https://twitter.com/cantworkitout/status/2064234331434852632" target="_blank"
            referrerpolicy="no-referrer-when-downgrade" data-hl-processed="none">June 9, 2026</a></p>
</blockquote>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as TwitterComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('twitter');
      expect(component.height).toBe(`350`);
      expect(component.params.account).toBe(`cantworkitout`);
      expect(component.params.id).toBe(`2064234331434852632`);
    }
  );
  test(
    'It should create a x tweet from an iframe',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(
        `<iframe
          src="https://embedly.forbes.com/widgets/media.html?type=text%2Fhtml&amp;key=3ce26dc7e3454db5820ba084d28b4935&amp;schema=twitter&amp;url=https%3A//x.com/delayed3A/status/2018627889923826089&amp;image=">
        </iframe>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as TwitterComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('twitter');
      expect(component.height).toBe(`350`);
      expect(component.params.account).toBe(`delayed3A`);
      expect(component.params.id).toBe(`2018627889923826089`);
    }
  );
  test(
    'It should create a twitter tweet from an iframe',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(
        `<iframe
          src="https://embedly.forbes.com/widgets/media.html?type=text%2Fhtml&amp;key=3ce26dc7e3454db5820ba084d28b4935&amp;schema=twitter&amp;url=https%3A//twitter.com/delayed3A/status/2018627889923826089&amp;image=">
        </iframe>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as TwitterComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('twitter');
      expect(component.height).toBe(`350`);
      expect(component.params.account).toBe(`delayed3A`);
      expect(component.params.id).toBe(`2018627889923826089`);
    }
  );
});

describe('Youtube Component', () => {
  test(
    'It should create an Youtube embed component',
    { tags: ['unit', 'html'] },
    () => {
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
    }
  );
  test(
    'It should create an Youtube embed component from figure',
    { tags: ['unit', 'html'] },
    () => {
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
    }
  );
  test(
    'It should create an Youtube embed component from figure with caption',
    { tags: ['unit', 'html'] },
    () => {
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
    }
  );
  test(
    'It should create an Youtube embed component from embed.ly',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(
        `<iframe
            src="https://embedly.forbes.com/widgets/media.html?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DdQw4w9WgXcQ&amp;type=text%2Fhtml&amp;schema=youtu&amp;display_name=YouTube&amp;src=https%3A%2F%2Fwww.youtube.com%2Fembed%2FdQw4w9WgXcQ">
        </iframe>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as YoutubeComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('video');
      expect(component.vidtype).toBe('youtube');
      expect(component.params).toEqual({ id: 'dQw4w9WgXcQ' });
    }
  );
  test(
    'It should create an Youtube embed component from embed.ly with short url',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(
        `<iframe class="embedly-embed" src="//cdn.embedly.com/widgets/media.html?src=https%3A%2F%2Fwww.youtube.com%2Fembed%2FF_Rf-ubc8zQ%3Ffeature%3Doembed&display_name=YouTube&url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DF_Rf-ubc8zQ&image=https%3A%2F%2Fi.ytimg.com%2Fvi%2FF_Rf-ubc8zQ%2Fhqdefault.jpg&type=text%2Fhtml&schema=youtube" width="500" height="281" scrolling="no" title="YouTube embed" frameborder="0" allow="autoplay; fullscreen; encrypted-media; picture-in-picture;" allowfullscreen="true"></iframe>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as YoutubeComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('video');
      expect(component.vidtype).toBe('youtube');
      expect(component.params).toEqual({ id: 'F_Rf-ubc8zQ' });
    }
  );

  test(
    'It should create an Youtube embed component from an anchor tag',
    { tags: ['unit', 'html'] },
    () => {
      const excludes: Array<Mapping> = [
        {
          match: 'any',
          filters: [
            {
              type: 'class',
              match: 'any',
              items: ['video-aspect-box'],
            },
          ],
        },
      ];
      const components = HTMLMapper.toComponents(
        `<div class="youtube-video youtube-facade" data-nosnippet="" id="elk-u8zoxUlFo7E">
              <div class="video-aspect-box">
                  <div class="watch-on-iframe-u8zoxUlFo7E" data-yt-video-token="u8zoxUlFo7E"
                      title="Everything David Corenswet Did To Become Superman - YouTube">
                      <span class="youtube-video-title">Everything David Corenswet Did To
                          Become Superman - YouTube</span>
                      <img src="https://img.youtube.com/vi/u8zoxUlFo7E/maxresdefault.jpg"
                          alt="Everything David Corenswet Did To Become Superman - YouTube" data-aspect-ratio="16/9"
                          loading="lazy">
                  </div>
              </div>
              <svg class="play-button" xmlns="http://www.w3.org/2000/svg" viewbox="0 0 234.67 165.33">
                  <path fill="red"
                      d="M229.763 25.817c-2.699-10.162-10.65-18.165-20.748-20.881C190.716 0 117.333 0 117.333 0S43.951 0 25.651 4.936C15.553 7.652 7.6 15.655 4.903 25.817 0 44.236 0 82.667 0 82.667s0 38.429 4.903 56.85C7.6 149.68 15.553 157.681 25.65 160.4c18.3 4.934 91.682 4.934 91.682 4.934s73.383 0 91.682-4.934c10.098-2.718 18.049-10.72 20.748-20.882 4.904-18.421 4.904-56.85 4.904-56.85s0-38.431-4.904-56.85">
                  </path>
                  <path fill="#fff" d="m93.333 117.559 61.333-34.89-61.333-34.894z">
                  </path>
              </svg>
              <a class="watch-on-youtube-u8zoxUlFo7E" href="https://youtu.be/u8zoxUlFo7E" target="_blank"
                  data-url="https://youtu.be/u8zoxUlFo7E" referrerpolicy="no-referrer-when-downgrade"
                  data-hl-processed="none">Watch On <svg class="youtube-logo" xmlns="http://www.w3.org/2000/svg"
                      viewbox="0 0 507.9 113.39">
                      <g fill="#fff">
                          <path
                              d="M64.792 80.99V32.396l42.082 24.297zm93.803-63.285a20.285 20.285 0 0 0-14.32-14.32C131.642 0 80.99 0 80.99 0S30.337 0 17.705 3.385a20.286 20.286 0 0 0-14.32 14.32C0 30.338 0 56.693 0 56.693S0 83.049 3.385 95.68A20.285 20.285 0 0 0 17.705 110c12.632 3.386 63.285 3.386 63.285 3.386s50.652 0 63.285-3.386a20.284 20.284 0 0 0 14.32-14.32c3.385-12.632 3.385-38.988 3.385-38.988s0-26.355-3.385-38.988m94.473 74.326c.887-2.314 1.332-6.098 1.332-11.35V58.556c0-5.097-.445-8.822-1.332-11.178-.888-2.355-2.452-3.533-4.69-3.533-2.163 0-3.69 1.178-4.577 3.533-.888 2.356-1.332 6.081-1.332 11.178V80.68c0 5.25.424 9.035 1.275 11.35.848 2.318 2.392 3.475 4.633 3.475 2.239 0 3.803-1.157 4.691-3.475zm-17.953 11.122c-3.207-2.16-5.486-5.52-6.835-10.079-1.352-4.554-2.027-10.617-2.027-18.185v-10.31c0-7.644.771-13.784 2.316-18.417 1.544-4.633 3.956-8.011 7.24-10.135 3.282-2.123 7.587-3.186 12.916-3.186 5.251 0 9.459 1.082 12.626 3.243 3.165 2.162 5.482 5.542 6.95 10.136 1.466 4.595 2.2 10.715 2.2 18.36v10.31c0 7.567-.714 13.65-2.142 18.243-1.43 4.595-3.747 7.955-6.951 10.077-3.205 2.124-7.548 3.186-13.03 3.186-5.64 0-10.06-1.082-13.263-3.243m248.053-57.981c-.81 1.005-1.352 2.646-1.621 4.923-.272 2.278-.404 5.734-.404 10.367v5.097h11.697V60.46c0-4.555-.155-8.011-.463-10.367-.309-2.355-.868-4.014-1.678-4.98-.812-.966-2.067-1.449-3.766-1.449-1.7 0-2.954.503-3.765 1.506zm-2.025 29.886v3.591c0 4.557.132 7.974.404 10.251.269 2.279.828 3.94 1.68 4.982.849 1.041 2.16 1.564 3.938 1.564 2.392 0 4.035-.927 4.923-2.781.887-1.853 1.37-4.942 1.447-9.268l13.785.812c.077.62.116 1.469.116 2.548 0 6.565-1.795 11.47-5.387 14.712-3.589 3.242-8.669 4.865-15.232 4.865-7.876 0-13.398-2.47-16.564-7.414-3.168-4.94-4.75-12.586-4.75-22.935V63.589c0-10.657 1.641-18.436 4.924-23.342 3.281-4.903 8.9-7.355 16.854-7.355 5.482 0 9.691 1.004 12.626 3.012 2.933 2.01 5 5.137 6.197 9.383 1.197 4.247 1.796 10.117 1.796 17.607v12.163h-26.757m-284.953-1.33-18.187-65.68h15.869l6.37 29.77c1.623 7.339 2.82 13.594 3.591 18.766h.464c.54-3.706 1.738-9.922 3.591-18.65l6.603-29.886h15.869l-18.417 65.68v31.51h-15.754v-31.51M322.115 34.23v71.007h-12.511l-1.39-8.688h-.347c-3.399 6.564-8.496 9.845-15.291 9.845-4.71 0-8.185-1.543-10.425-4.633-2.24-3.087-3.359-7.915-3.359-14.48V34.23h15.985v52.126c0 3.168.348 5.426 1.043 6.776.695 1.353 1.853 2.027 3.475 2.027 1.39 0 2.722-.423 3.996-1.275 1.274-.849 2.22-1.928 2.838-3.241V34.229h15.986m81.995.001v71.007h-12.511l-1.391-8.688h-.345c-3.402 6.564-8.498 9.845-15.292 9.845-4.711 0-8.186-1.543-10.426-4.633-2.24-3.087-3.358-7.915-3.358-14.48V34.23h15.985v52.126c0 3.168.347 5.426 1.041 6.776.696 1.353 1.855 2.027 3.476 2.027 1.391 0 2.723-.423 3.996-1.275 1.275-.849 2.22-1.928 2.839-3.241V34.229h15.985">
                          </path>
                          <path
                              d="M365.552 20.908h-15.87v84.329h-15.637v-84.33h-15.869V8.05h47.376v12.858m76.811 53.636c0 5.174-.215 9.229-.639 12.162-.424 2.937-1.139 5.021-2.143 6.255-1.004 1.236-2.357 1.854-4.053 1.854a7.404 7.404 0 0 1-3.65-.927c-1.12-.618-2.026-1.544-2.722-2.78V50.796c.54-1.93 1.467-3.513 2.78-4.749 1.313-1.234 2.74-1.853 4.285-1.853 1.623 0 2.876.637 3.766 1.91.886 1.275 1.505 3.418 1.853 6.43.348 3.011.523 7.297.523 12.857zm14.652-28.964c-.967-4.478-2.531-7.721-4.692-9.73-2.163-2.007-5.136-3.011-8.919-3.011-2.935 0-5.676.83-8.224 2.49a16.926 16.926 0 0 0-5.908 6.545h-.117l.001-37.416h-15.405v100.777h13.204l1.622-6.717h.347c1.235 2.393 3.088 4.285 5.56 5.675 2.47 1.39 5.213 2.085 8.225 2.085 5.404 0 9.382-2.491 11.931-7.471 2.548-4.982 3.823-12.76 3.823-23.341V64.23c0-7.953-.484-14.17-1.448-18.65">
                          </path>
                      </g>
                  </svg></a>
          </div>`,
        {
          excludes,
        }
      );
      expect(components.length).toBe(1);
      const component = components.pop() as YoutubeComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('video');
      expect(component.vidtype).toBe('youtube');
      expect(component.params).toEqual({ id: 'u8zoxUlFo7E' });
    }
  );
});

describe('Dailymotion Component', () => {
  test(
    'It should create an Dailymotion embed component',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(
        `<iframe class="embedly-embed" src="//cdn.embedly.com/widgets/media.html?src=https%3A%2F%2Fgeo.dailymotion.com%2Fplayer.html%3Fvideo%3Dx9z6sty%26&display_name=Dailymotion&url=https%3A%2F%2Fwww.dailymotion.com%2Fvideo%2Fx9z6sty&image=https%3A%2F%2Fs1.dmcdn.net%2Fv%2FZzPvs1fWfaf6KsK8h%2Fx240&type=text%2Fhtml&schema=dailymotion" width="480" height="269" scrolling="no" title="Dailymotion embed" frameborder="0" allow="autoplay; fullscreen; encrypted-media; picture-in-picture;" allowfullscreen="true"></iframe>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as DailymotionComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('video');
      expect(component.vidtype).toBe('dailymotion');
      expect(component.params).toEqual({ id: 'x9z6sty' });
    }
  );
});

describe('Vimeo Component', () => {
  test(
    'It should create a Vimeo embed component',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(
        `<iframe class="embedly-embed" src="//cdn.embedly.com/widgets/media.html?src=https%3A%2F%2Fplayer.vimeo.com%2Fvideo%2F1138248349%3Fapp_id%3D122963&dntp=1&display_name=Vimeo&url=https%3A%2F%2Fvimeo.com%2F1138248349&image=https%3A%2F%2Fi.vimeocdn.com%2Fvideo%2F2084551378-2d500d442b25ca58722aab3e62d9ca47a8c9ac2e57afe061995a01c8fd71ac92-d_1280%3Fregion%3Dus&type=text%2Fhtml&schema=vimeo" width="500" height="281" scrolling="no" title="Vimeo embed" frameborder="0" allow="autoplay; fullscreen; encrypted-media; picture-in-picture;" allowfullscreen="true"></iframe>`
      );
      expect(components.length).toBe(1);
      const component = components.pop() as VimeoComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('video');
      expect(component.vidtype).toBe('vimeo');
      expect(component.params).toEqual({ id: '1138248349' });
    }
  );
});

describe('TikTok Component', () => {
  test(
    'It should create a TikTok embed component',
    { tags: ['unit', 'html'] },
    () => {
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
    }
  );
  test(
    'It should create a TikTok embed component inside a figure',
    { tags: ['unit', 'html'] },
    () => {
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
    }
  );
  test(
    'It should create a TikTok embed component inside a div',
    { tags: ['unit', 'html'] },
    () => {
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
    }
  );
  test(
    'It should return errors for an invalid TikTok URL',
    { tags: ['unit', 'html'] },
    () => {
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
    }
  );
  test(
    'It should return errors if TikTok cite attribute is missing',
    { tags: ['unit', 'html'] },
    () => {
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
    }
  );
  test(
    'It should create a Tiktok component from embed.ly',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(
        `<iframe
          class="embedly-embed"
          src="//cdn.embedly.com/widgets/media.html?src=https%3A%2F%2Fwww.tiktok.com%2Fembed%2Fv2%2F7593022588272561430&display_name=tiktok&url=https%3A%2F%2Fwww.tiktok.com%2F%40rickastleyofficial%2Fvideo%2F7593022588272561430&image=https%3A%2F%2Fp19-common-sign.tiktokcdn-us.com%2Ftos-no1a-p-0037-no%2Fo0RBVFFlD1yfKtXxdpH6AykfhHQEQA40D91JEg%7Etplv-tiktokx-origin.image%3Fdr%3D9636%26x-expires%3D1770382800%26x-signature%3DSub%252FfFdUPmtmCszcGV3IaEFu9NI%253D%26t%3D4d5b0474%26ps%3D13740610%26shp%3D81f88b70%26shcp%3D43f4a2f9%26idc%3Duseast8&type=text%2Fhtml&schema=tiktok"
          width="340"
          height="700"
          scrolling="no"
          title="tiktok embed"
          frameborder="0"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture;"
          allowfullscreen="true">
        </iframe>`
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
        id: '7593022588272561430',
        username: '@rickastleyofficial',
      });
    }
  );
});

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

describe('HTMLTable components', () => {
  test(
    'It should create a simple htmltable component',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(`
        <table
          id="tablepress-175"
          class="tablepress tablepress-id-175"
          aria-labelledby="tablepress-175-name"
        >
          <thead>
            <tr class="row-1">
              <th class="column-1">Intel HEDT Family</th>
              <th class="column-2">Granite Rapids</th>
              <th class="column-3">Sapphire Rapids Refresh</th>
              <th class="column-4">Sapphire Rapids</th>
              <th class="column-5">Cascade Lake</th>
              <th class="column-6">Skylake</th>
              <th class="column-7">Skylake</th>
              <th class="column-8">Skylake</th>
              <th class="column-9">Broadwell</th>
              <th class="column-10">Haswell</th>
              <th class="column-11">Ivy Bridge</th>
              <th class="column-12">Sandy Bridge</th>
              <th class="column-13">Gulftown</th>
            </tr>
          </thead>
          <tbody class="row-striping row-hover">
            <tr class="row-2">
              <td class="column-1">Process Node</td>
              <td class="column-2">Intel 3</td>
              <td class="column-3">10nm ESF</td>
              <td class="column-4">10nm ESF</td>
              <td class="column-5">14nm++</td>
              <td class="column-6">14nm+</td>
              <td class="column-7">14nm+</td>
              <td class="column-8">14nm+</td>
              <td class="column-9">14nm</td>
              <td class="column-10">22nm</td>
              <td class="column-11">22nm</td>
              <td class="column-12">32nm</td>
              <td class="column-13">32nm</td>
            </tr>
            <tr class="row-3">
              <td class="column-1">Flagship SKU</td>
              <td class="column-2">TBD</td>
              <td class="column-3">
                Xeon W9-3595X<br />
                Xeon W7-2595X
              </td>
              <td class="column-4">
                Xeon W9-3495X<br />
                Xeon W7-2495X
              </td>
              <td class="column-5">Core i9-10980XE</td>
              <td class="column-6">Xeon W-3175X</td>
              <td class="column-7">Core i9-9980XE</td>
              <td class="column-8">Core i9-7980XE</td>
              <td class="column-9">Core i7-6950X</td>
              <td class="column-10">Core i7-5960X</td>
              <td class="column-11">Core i7-4960X</td>
              <td class="column-12">Core i7-3960X</td>
              <td class="column-13">Core i7-980X</td>
            </tr>
            <tr class="row-4">
              <td class="column-1">Max Cores/Threads</td>
              <td class="column-2">86/172?</td>
              <td class="column-3">
                60/120<br />
                26/52
              </td>
              <td class="column-4">
                56/112<br />
                24/48
              </td>
              <td class="column-5">18/36</td>
              <td class="column-6">28/56</td>
              <td class="column-7">18/36</td>
              <td class="column-8">18/36</td>
              <td class="column-9">10/20</td>
              <td class="column-10">8/16</td>
              <td class="column-11">6/12</td>
              <td class="column-12">6/12</td>
              <td class="column-13">6/12</td>
            </tr>
            <tr class="row-5">
              <td class="column-1">Clock Speeds</td>
              <td class="column-2">TBD</td>
              <td class="column-3">4.8 GHz</td>
              <td class="column-4">4.8 GHz</td>
              <td class="column-5">3.00 / 4.80 GHz</td>
              <td class="column-6">3.10/4.30 GHz</td>
              <td class="column-7">3.00/4.50 GHz</td>
              <td class="column-8">2.60/4.20 GHz</td>
              <td class="column-9">3.00/3.50 GHz</td>
              <td class="column-10">3.00/3.50 GHz</td>
              <td class="column-11">3.60/4.00 GHz</td>
              <td class="column-12">3.30/3.90 GHz</td>
              <td class="column-13">3.33/3,60 GHz</td>
            </tr>
            <tr class="row-6">
              <td class="column-1">Max Cache</td>
              <td class="column-2">TBD</td>
              <td class="column-3">105 MB L3</td>
              <td class="column-4">105 MB L3</td>
              <td class="column-5">24.75 MB L3</td>
              <td class="column-6">38.5 MB L3</td>
              <td class="column-7">24.75 MB L3</td>
              <td class="column-8">24.75 MB L3</td>
              <td class="column-9">25 MB L3</td>
              <td class="column-10">20 MB L3</td>
              <td class="column-11">15 MB L3</td>
              <td class="column-12">15 MB L3</td>
              <td class="column-13">12 MB L3</td>
            </tr>
            <tr class="row-7">
              <td class="column-1">Max PCI-Express Lanes (CPU)</td>
              <td class="column-2">128 Gen 5</td>
              <td class="column-3">112 Gen 5</td>
              <td class="column-4">112 Gen 5</td>
              <td class="column-5">44 Gen3</td>
              <td class="column-6">44 Gen3</td>
              <td class="column-7">44 Gen3</td>
              <td class="column-8">44 Gen3</td>
              <td class="column-9">40 Gen3</td>
              <td class="column-10">40 Gen3</td>
              <td class="column-11">40 Gen3</td>
              <td class="column-12">40 Gen2</td>
              <td class="column-13">32 Gen2</td>
            </tr>
            <tr class="row-8">
              <td class="column-1">Chipset Compatiblity</td>
              <td class="column-2">W890</td>
              <td class="column-3">W790</td>
              <td class="column-4">W790</td>
              <td class="column-5">X299</td>
              <td class="column-6">C612E</td>
              <td class="column-7">X299</td>
              <td class="column-8">X299</td>
              <td class="column-9">X99 Chipset</td>
              <td class="column-10">X99 Chipset</td>
              <td class="column-11">X79 Chipset</td>
              <td class="column-12">X79 Chipset</td>
              <td class="column-13">X58 Chipset</td>
            </tr>
            <tr class="row-9">
              <td class="column-1">Socket Compatiblity</td>
              <td class="column-2">LGA 4710?</td>
              <td class="column-3">LGA 4677</td>
              <td class="column-4">LGA 4677</td>
              <td class="column-5">LGA 2066</td>
              <td class="column-6">LGA 3647</td>
              <td class="column-7">LGA 2066</td>
              <td class="column-8">LGA 2066</td>
              <td class="column-9">LGA 2011-3</td>
              <td class="column-10">LGA 2011-3</td>
              <td class="column-11">LGA 2011</td>
              <td class="column-12">LGA 2011</td>
              <td class="column-13">LGA 1366</td>
            </tr>
            <tr class="row-10">
              <td class="column-1">Memory Compatiblity</td>
              <td class="column-2">DDR5-6000?</td>
              <td class="column-3">DDR5-4800</td>
              <td class="column-4">DDR5-4800</td>
              <td class="column-5">DDR4-2933</td>
              <td class="column-6">DDR4-2666</td>
              <td class="column-7">DDR4-2800</td>
              <td class="column-8">DDR4-2666</td>
              <td class="column-9">DDR4-2400</td>
              <td class="column-10">DDR4-2133</td>
              <td class="column-11">DDR3-1866</td>
              <td class="column-12">DDR3-1600</td>
              <td class="column-13">DDR3-1066</td>
            </tr>
            <tr class="row-11">
              <td class="column-1">Max TDP</td>
              <td class="column-2">350W?</td>
              <td class="column-3">350W</td>
              <td class="column-4">350W</td>
              <td class="column-5">165W</td>
              <td class="column-6">255W</td>
              <td class="column-7">165W</td>
              <td class="column-8">165W</td>
              <td class="column-9">140W</td>
              <td class="column-10">140W</td>
              <td class="column-11">130W</td>
              <td class="column-12">130W</td>
              <td class="column-13">130W</td>
            </tr>
            <tr class="row-12">
              <td class="column-1">Launch</td>
              <td class="column-2">2025?</td>
              <td class="column-3">2024</td>
              <td class="column-4">2023</td>
              <td class="column-5">Q4 2019</td>
              <td class="column-6">Q4 2018</td>
              <td class="column-7">Q4 2018</td>
              <td class="column-8">Q3 2017</td>
              <td class="column-9">Q2 2016</td>
              <td class="column-10">Q3 2014</td>
              <td class="column-11">Q3 2013</td>
              <td class="column-12">Q4 2011</td>
              <td class="column-13">Q1 2010</td>
            </tr>
            <tr class="row-13">
              <td class="column-1">Launch Price (Top SKU)</td>
              <td class="column-2">TBD</td>
              <td class="column-3">TBD</td>
              <td class="column-4">$5889</td>
              <td class="column-5">$979 US</td>
              <td class="column-6">~$4000 US</td>
              <td class="column-7">$1979 US</td>
              <td class="column-8">$1999 US</td>
              <td class="column-9">$1700 US</td>
              <td class="column-10">$1059 US</td>
              <td class="column-11">$999 US</td>
              <td class="column-12">$999 US</td>
              <td class="column-13">$999 US</td>
            </tr>
          </tbody>
        </table>

      `);
      expect(components.length).toBe(1);
      const component = components.pop() as HTMLTableComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('htmltable');
      expect(component.id).toBe('tablepress-175');
      expect(component.html).toBeDefined();
    }
  );

  test(
    'It should create a simple htmltable component that is inside a figure',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(`
        <figure class="wp-block-table table-wrapper">
          <table class="has-fixed-layout tablepress">
            <thead>
              <tr>
                <th>Category</th>
                <th>Specification</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>I/O</strong></td>
                <td></td>
              </tr>
              <tr>
                <td>Displays</td>
                <td>
                  <strong>DisplayPort 1.4:</strong><br/>- Up to 4K @ 240Hz or
                  8K@60Hz<br/>- Supports HDR, FreeSync, daisy-chaining<br/><strong>HDMI 2.0:
                  </strong><br/>- Up to 4K @ 120Hz<br/>- Supports HDR, FreeSync, CEC
                </td>
              </tr>
              <tr>
                <td>USB</td>
                <td>
                  - Two USB-A 3.2 Gen 1 (front)<br/>- Two USB-A 2.0 High
                  speed (back)<br/>- One USB-C 3.2 Gen 2 (back)
                </td>
              </tr>
              <tr>
                <td>Networking</td>
                <td>Gigabit ethernet</td>
              </tr>
              <tr>
                <td>LED Strip</td>
                <td>
                  17 individually addressable RGB LEDs for system status and
                  customization
                </td>
              </tr>
              <tr>
                <td><strong>Size &amp; Weight</strong></td>
                <td></td>
              </tr>
              <tr>
                <td>Size</td>
                <td>
                  152 mm tall (148 mm without feet), 162.4 mm deep, 156 mm
                  wide
                </td>
              </tr>
              <tr>
                <td>Weight</td>
                <td>2.6 kg</td>
              </tr>
              <tr>
                <td><strong>Software</strong></td>
                <td></td>
              </tr>
              <tr>
                <td>Operating System</td>
                <td>SteamOS 3 (Arch-based)</td>
              </tr>
              <tr>
                <td>Desktop</td>
                <td>KDE Plasma</td>
              </tr>
              <tr>
                <td><strong>General</strong></td>
                <td></td>
              </tr>
              <tr>
                <td>CPU</td>
                <td>
                  Semi-custom AMD Zen 4 6C/12T<br/>- Up to 4.8 GHz, 30W TDP
                </td>
              </tr>
              <tr>
                <td>GPU</td>
                <td>
                  Semi-custom AMD RDNA3 28CUs<br/>- 2.45GHz max sustained
                  clock, 110W TDP
                </td>
              </tr>
              <tr>
                <td>RAM</td>
                <td>16GB DDR5 + 8GB GDDR6 VRAM</td>
              </tr>
              <tr>
                <td>Power</td>
                <td>Internal power supply, AC 110-240V</td>
              </tr>
              <tr>
                <td>Storage</td>
                <td>
                  Two models:<br/>- 512GB NVMe SSD<br/>- 2TB NVMe SSD<br/>-
                  Both include a high-speed microSD slot
                </td>
              </tr>
              <tr>
                <td><strong>Connectivity</strong></td>
                <td></td>
              </tr>
              <tr>
                <td>Wi-Fi</td>
                <td>2x2 Wi-Fi 6E</td>
              </tr>
              <tr>
                <td>Bluetooth</td>
                <td>Bluetooth 5.3 (dedicated antenna)</td>
              </tr>
              <tr>
                <td>Steam Controller</td>
                <td>Integrated 2.4 GHz Steam Controller wireless adapter</td>
              </tr>
            </tbody>
          </table>
        </figure>`);
      expect(components.length).toBe(1);
      const component = components.pop() as HTMLTableComponent;
      expect(component).toBeDefined();
      if (!component) {
        return;
      }
      expect(component.component).toBe('htmltable');
      expect(component.html).toBeDefined();
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

describe('Custom components', () => {
  test(
    'It should create a custom component from iframe',
    { tags: ['unit', 'html'] },
    () => {
      const content = `<iframe src="https://embedly.forbes.com/widgets/media.html?src=https%3A%2F%2Fe.infogram.com%2F_%2FuUje4914RW8zjHHygco0%3Fsrc%3Dembed&amp;display_name=Infogram&amp;url=https%3A%2F%2Finfogram.com%2F1pmnnkvl01yrzki3700wv0e50rhz07ljp0e&amp;image=https%3A%2F%2Finfogram-thumbs-1024.s3-eu-west-1.amazonaws.com%2Fec5e8245-6cc0-4919-830c-aa3a9c2f10e9.jpg&amp;type=text%2Fhtml&amp;schema=infogram"></iframe>`;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(1);
      const component = components.pop() as CustomComponent;
      expect(component).toBeDefined();
      expect(component.component).toBe('custom');
      expect(component?.content.length).toBeGreaterThan(0);
    }
  );

  test('It should map custom component', { tags: ['unit', 'html'] }, () => {
    const properties = {
      success: true,
    };
    const mappings: Array<ComponentMapping> = [
      {
        component: 'custom',
        match: 'all',
        filters: [
          {
            type: 'tag',
            items: ['aside'],
          },
        ],
        properties,
      },
    ];
    const content = `
        <aside>
            <nav>Navigation Bar</nav>
        </aside>
      `;
    const components = HTMLMapper.toComponents(content, { mappings });
    expect(components.length).toBe(1);
    const customComponent = components.pop() as CustomComponent;
    expect(customComponent).toBeDefined();
    if (!customComponent) {
      return;
    }
    expect(customComponent.component).toBe('custom');
    expect(customComponent.properties).toBe(properties);
  });
});

describe('Recipe components', () => {
  test(
    'It should map recipe component from class attribute',
    { tags: ['unit', 'html'] },
    () => {
      const mappings: Array<ComponentMapping> = [
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
    }
  );
  test(
    'It should map empty recipe component',
    { tags: ['unit', 'html'] },
    () => {
      const mappings: Array<ComponentMapping> = [
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
    }
  );
});

describe('Container components', () => {
  test(
    'It should map container component from class attribute',
    { tags: ['unit', 'html'] },
    () => {
      const mappings: Array<ComponentMapping> = [
        {
          component: 'container',
          match: 'all',
          filters: [
            {
              type: 'tag',
              items: ['div'],
            },
            {
              type: 'class',
              match: 'any',
              items: ['cmc-container'],
            },
          ],
        },
      ];
      const content = `
        <div class="cmc-container cmc-example">
            <h1>Test</h1>
        </div>
      `;
      const components = HTMLMapper.toComponents(content, { mappings });
      expect(components.length).toBe(1);
      const containerComponent = components.pop() as ContainerComponent;
      expect(containerComponent).toBeDefined();
      if (!containerComponent) {
        return;
      }
      expect(containerComponent.components.length).toBe(1);
    }
  );
  test(
    'It should map empty recipe component',
    { tags: ['unit', 'html'] },
    () => {
      const mappings: Array<ComponentMapping> = [
        {
          component: 'container',
          match: 'all',
          filters: [
            {
              type: 'tag',
              items: ['div'],
            },
            {
              type: 'class',
              match: 'any',
              items: ['cmc'],
            },
          ],
        },
      ];
      const content = `
        <div class="cmc"></div>
      `;
      const components = HTMLMapper.toComponents(content, { mappings });
      expect(components.length).toBe(1);
      const containerComponent = components.pop() as ContainerComponent;
      expect(containerComponent).toBeDefined();
      if (!containerComponent) {
        return;
      }
      expect(containerComponent.components.length).toBe(0);
    }
  );
});

describe('Columns components', () => {
  test(
    'It should map columns component using classes',
    { tags: ['unit', 'html'] },
    () => {
      const mappings: Array<ComponentMapping> = [
        {
          component: 'container',
          match: 'all',
          filters: [
            {
              type: 'tag',
              items: ['div'],
            },
            {
              type: 'class',
              match: 'any',
              items: ['cmc-container'],
            },
          ],
        },
        {
          component: 'columns',
          match: 'all',
          filters: [
            {
              type: 'tag',
              items: ['div'],
            },
            {
              type: 'class',
              match: 'any',
              items: ['cmc-columns'],
            },
          ],
          column: {
            match: 'any',
            filters: [
              {
                type: 'class',
                match: 'any',
                items: ['cmc-column'],
              },
            ],
          },
        },
      ];
      const content = `
        <article>
            <div class="cmc-columns">
                <div>
                    <div class="cmc-column">
                      <h1>Column 0</h1>
                    </div>
                </div>
                <div class="cmc-column">
                  Column 1
                </div>
                <div class="cmc-column">
                  <h2>Column 2</h2>
                </div>
                <div class="cmc-column">
                  <img src="example.jpg" alt="image in column 3"/>
                </div>
                <section>
                    <div>
                        <div class="cmc-column">
                          <h3>Column 4</h3>
                        </div>
                    </div>
                </section>
            </div>
        </article>
      `;
      const components = HTMLMapper.toComponents(content, { mappings });
      expect(components.length).toBe(1);
      const columnsComponent = components[0] as ColumnsComponent;
      expect(columnsComponent).toBeDefined();
      if (!columnsComponent) {
        return;
      }
      expect(columnsComponent.columns.length).toBe(5);
    }
  );
});

describe('Live container components', () => {
  test(
    'It should map live container component using classes',
    { tags: ['unit', 'html'] },
    () => {
      const mappings: Array<ComponentMapping> = [
        {
          component: 'live_container',
          match: 'all',
          filters: [
            {
              type: 'tag',
              items: ['div'],
            },
            {
              type: 'class',
              match: 'any',
              items: ['live-container'],
            },
          ],
          post: {
            match: 'any',
            filters: [
              {
                type: 'class',
                match: 'any',
                items: ['cmc-post'],
              },
            ],
          },
        },
      ];
      const content = `
        <article>
            <div id="id-example-container" class="live-container">
                <div>
                    <div class="cmc-post">
                      <h1>Column 0</h1>
                    </div>
                </div>
                <div class="cmc-post">
                  Column 1
                </div>
                <div class="cmc-post">
                  <h2>Column 2</h2>
                </div>
                <div class="cmc-post">
                  <img src="example.jpg" alt="image in column 3"/>
                </div>
                <section>
                    <div>
                        <div class="cmc-post">
                          <h3>Column 4</h3>
                        </div>
                    </div>
                </section>
            </div>
        </article>
      `;
      const components = HTMLMapper.toComponents(content, { mappings });
      expect(components.length).toBe(1);
      const columnsComponent = components[0] as LiveContainerComponent;
      expect(columnsComponent).toBeDefined();
      if (!columnsComponent) {
        return;
      }
      expect(columnsComponent.posts.length).toBe(5);
    }
  );
});

describe('Link container components', () => {
  test(
    'It should use anchor tags to map container component',
    { tags: ['unit', 'html'] },
    () => {
      const properties = {
        isText: true,
      };
      const mappings: Array<ComponentMapping> = [
        {
          component: 'text41',
          match: 'any',
          filters: [
            {
              type: 'tag',
              items: ['h1'],
            },
          ],
          properties,
        },
      ];
      const link = 'https://example.org';
      const content = `
        <a href="${link}" target="_blank">
          <div><h1>Test</h1></div>
          <img src="https://example.com/image.jpg"/>
        </a>
      `;
      const components = HTMLMapper.toComponents(content, { mappings });
      expect(components.length).toBe(2);

      const textComponent = components[0] as TextComponent;
      expect(isTextComponent(textComponent)).toBe(true);
      expect(textComponent.component).toBe(mappings[0].component);
      expect(textComponent.properties).toEqual(mappings[0].properties);
      expect(textComponent.text).toBe(
        `<a href="${link}" target="_blank">Test</a>`
      );

      const imageComponent = components[1] as ImageComponent;
      expect(isImageComponent(imageComponent)).toBe(true);
      expect(imageComponent.link).toBe(link);
    }
  );

  test(
    'It should keep audio component that do not use links',
    { tags: ['unit', 'html'] },
    () => {
      const mappings: Array<ComponentMapping> = [];
      const src =
        'https://embed.podcasts.apple.com/us/podcast/all-bark-no-bite-the-reality-behind-dog-the-bounty-hunter/id1849068807?i=1000761154684';
      const link = 'https://example.org';
      const content = `
        <a href="${link}" target="_blank">
          <div><h1>Test</h1></div>
          <img src="https://example.com/image.jpg"/>
          <iframe
            allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
            frameborder="0"
            height="450"
            style="width:100%;max-width:660px;overflow:hidden;border-radius:10px;"
            sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
            src="${src}">
          </iframe>
        </a>
      `;
      const components = HTMLMapper.toComponents(content, { mappings });
      expect(components.length).toBe(3);

      const textComponent = components[0] as TextComponent;
      expect(isTextComponent(textComponent)).toBe(true);
      expect(textComponent.text).toBe(
        `<a href="${link}" target="_blank">Test</a>`
      );

      const imageComponent = components[1] as ImageComponent;
      expect(isImageComponent(imageComponent)).toBe(true);
      expect(imageComponent.link).toBe(link);

      const audioComponent = components[2] as AudioComponent;
      expect(audioComponent).toBeDefined();
      expect(audioComponent.component).toBe('audio');
      expect(audioComponent.url).toBe(src);
      expect(audioComponent.loop).toBe(false);
      expect(audioComponent.autoplay).toBe(true);
      expect(audioComponent.controls).toBe(false);
      expect(audioComponent.muted).toBe(false);
    }
  );

  test(
    'It should keep the text components wrapped in anchor tags',
    { tags: ['unit', 'html'] },
    () => {
      const mappings: Array<ComponentMapping> = [];
      const link = 'https://example.org';
      const content = `
        <a href="${link}" target="_blank">
          <p>Example</p>
          Hello
          <h1>Headline</h1>
        </a>
      `;
      const components = HTMLMapper.toComponents(content, { mappings });
      expect(components.length).toBe(3);

      let textComponent = components[0] as TextComponent;
      expect(isTextComponent(textComponent)).toBe(true);
      expect(textComponent.text).toBe(
        `<a href="${link}" target="_blank"><p>Example</p></a>`
      );

      textComponent = components[1] as TextComponent;
      expect(isTextComponent(textComponent)).toBe(true);
      expect(textComponent.text).toBe(
        `<a href="${link}" target="_blank">Hello</a>`
      );

      textComponent = components[2] as TextComponent;
      expect(isTextComponent(textComponent)).toBe(true);
      expect(textComponent.text).toBe(
        `<a href="${link}" target="_blank">Headline</a>`
      );
    }
  );

  test(
    'It should keep the button component wrapped in anchor tags',
    { tags: ['unit', 'html'] },
    () => {
      const mappings: Array<ComponentMapping> = [];
      const link = 'https://example.org';
      const content = `
        <a href="${link}" target="_blank">
          <button>View</button>
        </a>`;
      const components = HTMLMapper.toComponents(content, { mappings });
      expect(components.length).toBe(1);

      let buttonComponent = components[0] as ButtonComponent;
      expect(isButtonComponent(buttonComponent)).toBe(true);
      expect(buttonComponent.link).toBe(link);
    }
  );
});

describe('Figure container component', () => {
  test(
    'It should use figure tag to map figure container component',
    { tags: ['unit', 'html'] },
    () => {
      const caption = 'Example image';
      const tableContent = '<table><thead></thead><tbody></tbody></table>';
      const imagesUrls = [
        'https://example.com/image-1.jpg',
        'https://example.com/image-2.jpg',
      ];
      const content = `
        <figure>
          <img src="${imagesUrls[0]}"/>
          <div><img src="${imagesUrls[1]}"/></div>
          ${tableContent}
          <figcaption>${caption}</figcaption>
        </figure>
      `;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(3);

      let imageComponent = components[0] as ImageComponent;
      expect(isImageComponent(imageComponent)).toBe(true);
      expect(imageComponent.imageurl).toBe(imagesUrls[0]);
      expect(imageComponent.caption).toBe(caption);

      imageComponent = components[1] as ImageComponent;
      expect(isImageComponent(imageComponent)).toBe(true);
      expect(imageComponent.imageurl).toBe(imagesUrls[1]);
      expect(imageComponent.caption).toBe(caption);

      const htmlTable = components[2] as HTMLTableComponent;
      expect(isHTMLTableComponent(htmlTable)).toBe(true);
      expect(htmlTable.html).toBe(tableContent);
      expect(htmlTable.caption).toBe(caption);
    }
  );
  test(
    'It should use figure tag to map figure container component and ignore invalid components',
    { tags: ['unit', 'html'] },
    () => {
      const mappings: Array<ComponentMapping> = [];
      const caption = 'Example image';
      const imagesUrls = [
        'https://example.com/image-1.jpg',
        'https://example.com/image-2.jpg',
      ];
      const content = `
        <figure>
          <img src="${imagesUrls[0]}"/>
          <img src="${imagesUrls[1]}"/>
          <h1>Headline</h1>
          <figcaption>Example image</figcaption>
        </figure>
      `;
      const components = HTMLMapper.toComponents(content, { mappings });
      expect(components.length).toBe(2);

      let imageComponent = components[0] as ImageComponent;
      expect(isImageComponent(imageComponent)).toBe(true);
      expect(imageComponent.imageurl).toBe(imagesUrls[0]);
      expect(imageComponent.caption).toBe(caption);

      imageComponent = components[1] as ImageComponent;
      expect(isImageComponent(imageComponent)).toBe(true);
      expect(imageComponent.imageurl).toBe(imagesUrls[1]);
      expect(imageComponent.caption).toBe(caption);
    }
  );
});

describe('Mapping', () => {
  test(
    'It should map components using match any with filters any',
    { tags: ['unit', 'html'] },
    () => {
      const mappings: Array<ComponentMapping> = [
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
          component: 'title',
          match: 'all',
          filters: [
            {
              type: 'attribute',
              key: 'id',
              value: 'title',
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
        <h5 id="title">This is a title component</h5>
      `;
      const components = HTMLMapper.toComponents(content, { mappings });
      expect(components.length).toBe(5);
      expect(components[0].component).toBe('headline');
      expect(components[1].component).toBe('text48');
      expect(components[2].component).toBe('subtitle');
      expect(components[3].component).toBe('headline');
      expect(components[4].component).toBe('title');
    }
  );

  test(
    'It should map components using match any with filters all',
    { tags: ['unit', 'html'] },
    () => {
      const mappings: Array<ComponentMapping> = [
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
    }
  );

  test(
    'It should map components using match any with filters equal',
    { tags: ['unit', 'html'] },
    () => {
      const mappings: Array<ComponentMapping> = [
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
    }
  );

  test(
    'It should map components using match all with filters any',
    { tags: ['unit', 'html'] },
    () => {
      const mappings: Array<ComponentMapping> = [
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
    }
  );

  test(
    'It should map components using match all with filters all',
    { tags: ['unit', 'html'] },
    () => {
      const mappings: Array<ComponentMapping> = [
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
    }
  );

  test(
    'It should map components using match all with filters equal',
    { tags: ['unit', 'html'] },
    () => {
      const mappings: Array<ComponentMapping> = [
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
    }
  );

  test(
    'It should map components with match all filters with properties',
    { tags: ['unit', 'html'] },
    () => {
      const properties = {
        styles: [1233, 1111],
        targetElement: '1-col',
      };
      const mappings: Array<ComponentMapping> = [
        {
          component: 'container',
          match: 'all',
          filters: [
            {
              type: 'tag',
              items: ['div'],
            },
            {
              type: 'class',
              match: 'any',
              items: ['cmc'],
            },
          ],
          properties,
        },
      ];
      const content = `
        <div class="cmc"></div>
      `;
      const components = HTMLMapper.toComponents(content, { mappings });
      expect(components.length).toBe(1);
      const containerComponent = components.pop() as ContainerComponent;
      expect(containerComponent).toBeDefined();
      if (!containerComponent) {
        return;
      }
      expect(containerComponent.components.length).toBe(0);
      expect(containerComponent.properties).toBe(properties);
    }
  );

  test(
    'It should exclude components based on tags',
    { tags: ['unit', 'html'] },
    () => {
      const excludes: Array<Mapping> = [
        {
          match: 'all',
          filters: [
            {
              type: 'tag',
              items: ['section'],
            },
          ],
        },
        {
          match: 'all',
          filters: [
            {
              type: 'tag',
              items: ['script'],
            },
          ],
        },
      ];
      const content = `
        <main>
          <script>console.log('hello world')</script>
          <section>
            <h1>This is a headline that shouldn't show</h1>
          </section>
          <div>
            <p>This text is a body</p>
          </div>
          <footer>
            <p>This text should be displayed</p>
          </footer>
        </main>
      `;
      const components = HTMLMapper.toComponents(content, { excludes });
      expect(components.length).toBe(2);
      const textComponent = components.shift() as TextComponent;
      expect(textComponent).toBeDefined();
      expect(textComponent.component).toBe('body');
    }
  );

  test(
    'It should exclude components based on tags and class',
    { tags: ['unit', 'html'] },
    () => {
      const excludes: Array<Mapping> = [
        {
          match: 'all',
          filters: [
            {
              type: 'tag',
              items: ['section'],
            },
          ],
        },
        {
          match: 'all',
          filters: [
            {
              type: 'tag',
              items: ['script'],
            },
          ],
        },
        {
          match: 'all',
          filters: [
            {
              type: 'class',
              match: 'all',
              items: ['excluded'],
            },
          ],
        },
      ];
      const content = `
        <main>
          <script>console.log('hello world')</script>
          <section>
            <h1>This is a headline that shouldn't show</h1>
          </section>
          <div class="excluded">
            <p>This text is a body</p>
          </div>
          <footer>
            <p>This text should be displayed</p>
          </footer>
        </main>
      `;
      const components = HTMLMapper.toComponents(content, { excludes });
      expect(components.length).toBe(1);
      const textComponent = components.shift() as TextComponent;
      expect(textComponent).toBeDefined();
      expect(textComponent.component).toBe('footer');
    }
  );

  describe('Validation', { tags: ['unit', 'html'] }, () => {
    test('It should return a valid mapping', { tags: ['unit', 'html'] }, () => {
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
      const excludes = [
        {
          match: 3,
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
        excludes,
      });
      expect(isValid).toBe(true);
    });

    test(
      'It should throw an invalid null mapping',
      { tags: ['unit', 'html'] },
      () => {
        const mappings = [null];
        const isValid = isValidParams({
          mappings,
        });
        expect(isValid).toBe(false);
      }
    );

    test(
      'It should return that a root mapping is valid',
      { tags: ['unit', 'html'] },
      () => {
        const mappings = {
          match: 'all',
          component: 'body',
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
        };
        const isValid = isValidMapping(mappings);
        expect(isValid).toBe(false);
      }
    );

    test(
      'It should throw an invalid null root mapping',
      { tags: ['unit', 'html'] },
      () => {
        const mappings = [{ hello: 'world' }];
        const isValid = isValidMapping({
          mappings,
        });
        expect(isValid).toBe(false);
      }
    );
  });
});

describe('Relative links', () => {
  test(
    'It should apply relative links with ~ symbol',
    { tags: ['unit', 'html'] },
    () => {
      const link =
        'https://www.saga.co.uk/magazine/homes/foods-you-should-not-store-in-the-fridge';
      const href = '~/link.aspx?_id=35AD2F39D521448B972FB6C074D8A817&amp;_z=z';
      const html = `<a href="${href}">this is a text</a>`;
      const result = `<a href="https://www.saga.co.uk/magazine/homes/foods-you-should-not-store-in-the-fridge/~/link.aspx?_id=35AD2F39D521448B972FB6C074D8A817&amp;_z=z">this is a text</a>`;
      const content = processTextLinks(html, link);
      expect(content).toBeDefined();
      expect(content).toBe(result);
    }
  );

  test(
    'It should apply relative links without trailing slash',
    { tags: ['unit', 'html'] },
    () => {
      const link =
        'https://www.saga.co.uk/magazine/homes/foods-you-should-not-store-in-the-fridge';
      const href = 'link.aspx?_id=35AD2F39D521448B972FB6C074D8A817&amp;_z=z';
      const html = `<a href="${href}">this is a text</a>`;
      const result = `<a href="https://www.saga.co.uk/magazine/homes/foods-you-should-not-store-in-the-fridge/link.aspx?_id=35AD2F39D521448B972FB6C074D8A817&amp;_z=z">this is a text</a>`;
      //www.saga.co.uk/magazine/homes/foods-you-should-not-store-in-the-fridge/link.aspx?_id=35AD2F39D521448B972FB6C074D8A817&_z=z
      const content = processTextLinks(html, link);
      expect(content).toBeDefined();
      expect(content).toBe(result);
    }
  );

  test(
    'It should apply relative links with local directory',
    { tags: ['unit', 'html'] },
    () => {
      const link =
        'https://www.saga.co.uk/magazine/homes/foods-you-should-not-store-in-the-fridge';
      const href = './link.aspx?_id=35AD2F39D521448B972FB6C074D8A817&amp;_z=z';
      const html = `<a href="${href}">this is a text</a>`;
      const result = `<a href="https://www.saga.co.uk/magazine/homes/foods-you-should-not-store-in-the-fridge/link.aspx?_id=35AD2F39D521448B972FB6C074D8A817&amp;_z=z">this is a text</a>`;
      const content = processTextLinks(html, link);
      expect(content).toBeDefined();
      expect(content).toBe(result);
    }
  );

  test(
    'It should apply relative links with trailing url',
    { tags: ['unit', 'html'] },
    () => {
      const link =
        'https://www.saga.co.uk/magazine/homes/foods-you-should-not-store-in-the-fridge/';
      const href = './link.aspx?_id=35AD2F39D521448B972FB6C074D8A817&amp;_z=z';
      const html = `<a href="${href}">this is a text</a>`;
      const result = `<a href="https://www.saga.co.uk/magazine/homes/foods-you-should-not-store-in-the-fridge/link.aspx?_id=35AD2F39D521448B972FB6C074D8A817&amp;_z=z">this is a text</a>`;

      const content = processTextLinks(html, link);
      expect(content).toBeDefined();
      expect(content).toBe(result);
    }
  );

  test(
    'It should apply relative links with trailing url double slash',
    { tags: ['unit', 'html'] },
    () => {
      const link =
        'https://www.saga.co.uk/magazine/homes/foods-you-should-not-store-in-the-fridge/';
      const href = '//link.aspx?_id=35AD2F39D521448B972FB6C074D8A817&amp;_z=z';
      const html = `<a href="${href}">this is a text</a>`;
      const result = `<a href="https://www.saga.co.uk/magazine/homes/foods-you-should-not-store-in-the-fridge/link.aspx?_id=35AD2F39D521448B972FB6C074D8A817&amp;_z=z">this is a text</a>`;
      const content = processTextLinks(html, link);
      expect(content).toBeDefined();
      expect(content).toBe(result);
    }
  );

  test(
    'It should apply relative links invalid port',
    { tags: ['unit', 'html'] },
    () => {
      const href = 'https://javascript:null/';
      const html = `<a href="${href}">this is a text</a>`;
      const result = `<a href="/">this is a text</a>`;
      const content = processTextLinks(html);
      expect(content).toBeDefined();
      expect(content).toBe(result);
    }
  );
  test(
    'It should skip anchor tags that do not have attributes',
    { tags: ['unit', 'html'] },
    () => {
      const html = `<a>this is a text</a>`;
      const result = `<a>this is a text</a>`;
      const content = processTextLinks(html);
      expect(content).toBeDefined();
      expect(content).toBe(result);
    }
  );
});

describe('HTML Articles', () => {
  let htmlDirPath: string = '';

  beforeEach(() => {
    htmlDirPath = join(`${process.env.SUPPORT_PATH}`, 'html');
  });

  test(
    `New Apple Intelligence and Siri confirmed by... Google`,
    { tags: ['html', 'unit'] },
    async () => {
      const htmlFilePath = join(
        htmlDirPath,
        `new-apple-intelligence-and-siri-confirmed-by-google.html`
      );
      const htmlContent = readFileSync(htmlFilePath, 'utf-8');
      const rootMapping: Mapping = {
        match: 'all',
        filters: [
          {
            type: 'attribute',
            key: 'id',
            value: 'article-body',
          },
        ],
      };

      const mappings: Array<ComponentMapping> = [
        {
          component: 'container',
          match: 'all',
          filters: [
            {
              type: 'tag',
              items: ['div'],
            },
            {
              type: 'class',
              match: 'any',
              items: ['fancy-box', 'hawk-multi-model-review-container'],
            },
          ],
          properties: {
            is1Col: true,
            styles: [29916],
          },
        },
        {
          component: 'container',
          match: 'all',
          filters: [
            {
              type: 'tag',
              items: ['1aside'],
            },
          ],
          properties: {
            is1Col: true,
            styles: [29916],
          },
        },
      ];

      const excludes: Mapping[] = [
        {
          match: 'all',
          filters: [
            {
              type: 'tag',
              items: ['script'],
            },
          ],
        },
        {
          match: 'any',
          filters: [
            {
              type: 'attribute',
              key: 'data-component-name',
              value: 'Recirculation:ArticleRiver',
            },
            {
              type: 'attribute',
              key: 'data-component-name',
              value: 'Viafoura:Comments',
            },
          ],
        },
        {
          match: 'any',
          filters: [
            {
              type: 'attribute',
              key: 'id',
              value: 'utility-bar',
            },
            {
              type: 'attribute',
              key: 'id',
              value: 'articleTag',
            },
          ],
        },
        {
          match: 'any',
          filters: [
            {
              type: 'class',
              match: 'any',
              items: [
                'newsletter-inbodyContent-slice',
                'article-continues-below',
                'comment-widget-loaded',
              ],
            },
          ],
        },
      ];

      const content = HTMLMapper.getRootElement(htmlContent, rootMapping);
      expect(content).toBeTruthy();
      if (!content) {
        return;
      }

      // writeFileSync(rootedNodeFilePath, content, 'utf-8');

      const components = HTMLMapper.toComponents(content, {
        excludes,
        mappings,
      });

      expect(components.length).toBe(117);
    }
  );
});
