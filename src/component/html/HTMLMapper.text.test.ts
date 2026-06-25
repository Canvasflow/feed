import { test, expect, describe } from 'vite-plus/test';
import { HTMLMapper } from './HTMLMapper';
import {
  type ComponentMapping,
  type Mapping,
  processTextLinks,
} from '../mapping/Mapping';
import { type TextComponent, type CustomComponent } from '../Component';

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
    'It should return the root element with an attribute pattern filter',
    { tags: ['unit', 'html'] },
    () => {
      const rootMapping: Mapping = {
        match: 'all',
        filters: [
          {
            type: 'attribute',
            key: 'id',
            pattern: '^article-body-\\d+$',
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
    'It should return empty when the attribute pattern filter does not match',
    { tags: ['unit', 'html'] },
    () => {
      const rootMapping: Mapping = {
        match: 'all',
        filters: [
          {
            type: 'attribute',
            key: 'id',
            pattern: '^article-body-\\d+$',
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
    'It should match an attribute pattern filter with the any match mode',
    { tags: ['unit', 'html'] },
    () => {
      const rootMapping: Mapping = {
        match: 'any',
        filters: [
          {
            type: 'attribute',
            key: 'data-component-name',
            pattern: 'Recirculation:.*',
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
    'It should preserve whitespace between inline elements as a non-breaking space',
    { tags: ['unit', 'html'] },
    () => {
      const content = `<p><span>now $452</span> <span>at Amazon</span></p>`;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(1);
      const component = components.pop() as TextComponent;
      expect(component).toBeDefined();
      expect(component.component).toBe('body');
      // The whitespace-only text node between the two spans is preserved as a
      // non-breaking space (U+00A0) instead of being collapsed to a regular
      // space, which downstream trimming could drop.
      expect(component.text).toContain('\u00A0');
      expect(component.text).not.toContain('</span> <span>');
      expect(component.text).toBe(
        '<p><span>now $452</span>\u00A0<span>at Amazon</span></p>'
      );
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

  test(
    'It should preserve genuine protocol-relative URLs unchanged',
    { tags: ['unit', 'html'] },
    () => {
      const link = 'https://www.example.com/article/';
      const href = '//cdn.example.com/image.jpg';
      const html = `<a href="${href}">image</a>`;
      const content = processTextLinks(html, link);
      expect(content).toContain(`href="${href}"`);
    }
  );

  test(
    'It should leave absolute URLs unchanged',
    { tags: ['unit', 'html'] },
    () => {
      const link = 'https://www.example.com/article/';
      const href = 'https://other.com/page';
      const html = `<a href="${href}">link</a>`;
      const content = processTextLinks(html, link);
      expect(content).toContain(`href="${href}"`);
    }
  );

  test(
    'It should resolve bare relative links against the base when no trailing slash',
    { tags: ['unit', 'html'] },
    () => {
      const link = 'https://www.example.com/article';
      const href = 'page.html';
      const html = `<a href="${href}">link</a>`;
      const content = processTextLinks(html, link);
      expect(content).toContain(
        `href="https://www.example.com/article/${href}"`
      );
    }
  );
});
