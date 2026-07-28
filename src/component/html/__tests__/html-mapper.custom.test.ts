import { test, expect, describe } from 'vite-plus/test';
import { HTMLMapper } from '../html-mapper';
import { type ComponentMapping } from '../../mapping/mapping';
import { type CustomComponent } from '../../component';

describe('Custom component mapping', () => {
  describe('Hawk affiliate link deal button', () => {
    const html = `<a data-google-interstitial="false" 
      aria-label="View Snow Peak Hotlips 2-Piece Set on snowpeak.co.uk" 
      href="https://www.snowpeak.co.uk/products/hotlips-2-piece-set-mgh-001" 
      referrerpolicy="no-referrer-when-downgrade" 
      class="hawk-affiliate-link-deal-button" data-product-key="" 
      data-url="https://www.snowpeak.co.uk/products/hotlips-2-piece-set-mgh-001" 
      data-model-id="0" data-match-id="0" data-product-type="300" 
      data-link-merchant="snowpeak.co.uk" data-merchant-name="snowpeak.co.uk" 
      rel="sponsored noopener" target="_blank" 
      role="link" tabindex="0">View Deal</a>`;

    const mapping: ComponentMapping = {
      component: 'custom',
      match: 'all',
      properties: {
        component2: 'button',
      },
      filters: [
        {
          type: 'class',
          match: 'any',
          items: ['hawk-affiliate-link-deal-button'],
        },
      ],
    };

    test(
      'It should map a hawk affiliate link to a custom component',
      { tags: ['unit', 'html'] },
      () => {
        const components = HTMLMapper.toComponents(html, {
          mappings: [mapping],
        });

        expect(components.length).toBe(1);
        const component = components[0] as CustomComponent;
        expect(component.component).toBe('custom');
      }
    );

    test(
      'It should preserve the properties on the custom component',
      { tags: ['unit', 'html'] },
      () => {
        const components = HTMLMapper.toComponents(html, {
          mappings: [mapping],
        });

        const component = components[0] as CustomComponent;
        expect(component.properties).toEqual({ component2: 'button' });
      }
    );

    test(
      'It should preserve the element tag and attributes on the custom component',
      { tags: ['unit', 'html'] },
      () => {
        const components = HTMLMapper.toComponents(html, {
          mappings: [mapping],
        });

        const component = components[0] as CustomComponent;
        expect(component.element).toBeDefined();
        if (component.element === undefined) {
          return;
        }
        expect(component.element.tag).toBe('a');
        expect(component.element.attributes).toBeDefined();
        if (component.element.attributes === undefined) {
          return;
        }
        expect(component.element.attributes['href']).toBe(
          'https://www.snowpeak.co.uk/products/hotlips-2-piece-set-mgh-001'
        );
        expect(component.element.attributes['class']).toBe(
          'hawk-affiliate-link-deal-button'
        );
      }
    );

    test(
      'It should not match an anchor without the hawk class',
      { tags: ['unit', 'html'] },
      () => {
        const components = HTMLMapper.toComponents(
          `<a href="https://example.com">Regular link</a>`,
          { mappings: [mapping] }
        );

        const custom = components.find((c) => c.component === 'custom');
        expect(custom).toBeUndefined();
      }
    );

    test(
      'It should map a custom component without properties',
      { tags: ['unit', 'html'] },
      () => {
        const mappingWithoutProperties: ComponentMapping = {
          component: 'custom',
          match: 'all',
          filters: [
            {
              type: 'class',
              match: 'any',
              items: ['hawk-affiliate-link-deal-button'],
            },
          ],
        };

        const components = HTMLMapper.toComponents(html, {
          mappings: [mappingWithoutProperties],
        });

        expect(components.length).toBe(1);
        const component = components[0] as CustomComponent;
        expect(component.component).toBe('custom');
        expect(component.properties).toBeUndefined();
      }
    );

    test(
      'It should map multiple custom components in the same HTML block',
      { tags: ['unit', 'html'] },
      () => {
        const content = `
          <p>Best camping gear of 2025</p>
          ${html}
          <p>More products below</p>
          <a class="hawk-affiliate-link-deal-button" href="https://example.com/product-b">View Deal</a>
        `;

        const components = HTMLMapper.toComponents(content, {
          mappings: [mapping],
        });
        const customComponents = components.filter(
          (c) => c.component === 'custom'
        );

        expect(customComponents.length).toBe(2);
      }
    );

    test(
      'It should map a custom component using an attribute filter',
      { tags: ['unit', 'html'] },
      () => {
        const mappings: Array<ComponentMapping> = [
          {
            component: 'custom',
            match: 'all',
            filters: [
              {
                type: 'attribute',
                key: 'data-google-interstitial',
                value: 'false',
              },
            ],
          },
        ];

        const components = HTMLMapper.toComponents(html, { mappings });

        expect(components.length).toBe(1);
        expect(components[0]!.component).toBe('custom');
      }
    );

    test(
      'It should map a custom component using combined class and attribute filters',
      { tags: ['unit', 'html'] },
      () => {
        const mappings: Array<ComponentMapping> = [
          {
            component: 'custom',
            match: 'all',
            properties: {
              component2: 'button',
            },
            filters: [
              {
                type: 'class',
                match: 'any',
                items: ['hawk-affiliate-link-deal-button'],
              },
              {
                type: 'attribute',
                key: 'data-google-interstitial',
                value: 'false',
              },
            ],
          },
        ];

        const components = HTMLMapper.toComponents(html, { mappings });

        expect(components.length).toBe(1);
        const component = components[0] as CustomComponent;
        expect(component.component).toBe('custom');
        expect(component.properties).toEqual({ component2: 'button' });
      }
    );

    test(
      'It should not match when one filter fails under match all',
      { tags: ['unit', 'html'] },
      () => {
        const mappings: Array<ComponentMapping> = [
          {
            component: 'custom',
            match: 'all',
            filters: [
              {
                type: 'class',
                match: 'any',
                items: ['hawk-affiliate-link-deal-button'],
              },
              {
                type: 'attribute',
                key: 'data-google-interstitial',
                value: 'true', // does not match; actual value is "false"
              },
            ],
          },
        ];

        const components = HTMLMapper.toComponents(html, { mappings });

        const custom = components.find((c) => c.component === 'custom');
        expect(custom).toBeUndefined();
      }
    );
  });
});
