import { test, expect, describe } from 'vite-plus/test';
import { HTMLMapper } from '../html-mapper';
import { type ComponentMapping } from '../../mapping/mapping';
import {
  type DividerComponent,
  type SpacerComponent,
  type CustomComponent,
} from '../../component';

describe('Divider component mapping', () => {
  test(
    'It should map an <hr> tag to a divider component',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents('<hr>');

      expect(components.length).toBe(1);
      const component = components[0] as DividerComponent;
      expect(component.component).toBe('divider');
    }
  );

  test(
    'It should preserve the element tag and attributes on the divider component',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents('<hr id="section-break" />');

      const component = components[0] as DividerComponent;
      expect(component.id).toBe('section-break');
      expect(component.element).toBeDefined();
      if (component.element === undefined) return;
      expect(component.element.tag).toBe('hr');
      expect(component.element.attributes?.['id']).toBe('section-break');
    }
  );

  test(
    'It should map an <hr> among other content into a divider alongside the surrounding components',
    { tags: ['unit', 'html'] },
    () => {
      const html = `
        <p>Before the break</p>
        <hr>
        <p>After the break</p>
      `;

      const components = HTMLMapper.toComponents(html);

      expect(components.map((c) => c.component)).toEqual([
        'body',
        'divider',
        'body',
      ]);
    }
  );

  test(
    'It should map an <hr> to a custom component when a matching mapping is provided',
    { tags: ['unit', 'html'] },
    () => {
      const mapping: ComponentMapping = {
        component: 'custom',
        match: 'all',
        filters: [{ type: 'tag', items: ['hr'] }],
      };

      const components = HTMLMapper.toComponents('<hr class="fancy-rule">', {
        mappings: [mapping],
      });

      expect(components.length).toBe(1);
      const component = components[0] as CustomComponent;
      expect(component.component).toBe('custom');
      expect(component.element?.tag).toBe('hr');
    }
  );

  test(
    'It should map an arbitrary element to a divider component via a divider mapping',
    { tags: ['unit', 'html'] },
    () => {
      const mapping: ComponentMapping = {
        component: 'divider',
        match: 'all',
        filters: [{ type: 'class', match: 'any', items: ['divider'] }],
      };

      const components = HTMLMapper.toComponents(
        '<span class="divider"></span>',
        { mappings: [mapping] }
      );

      expect(components.length).toBe(1);
      const component = components[0] as DividerComponent;
      expect(component.component).toBe('divider');
      expect(component.element?.tag).toBe('span');
    }
  );

  test(
    'It should preserve properties on a mapping-driven divider component',
    { tags: ['unit', 'html'] },
    () => {
      const mapping: ComponentMapping = {
        component: 'divider',
        match: 'all',
        properties: { style: 'dashed' },
        filters: [{ type: 'class', match: 'any', items: ['divider'] }],
      };

      const components = HTMLMapper.toComponents(
        '<span class="divider"></span>',
        { mappings: [mapping] }
      );

      const component = components[0] as DividerComponent;
      expect(component.properties).toEqual({ style: 'dashed' });
    }
  );
});

describe('Spacer component mapping', () => {
  test(
    'It should map a <br> tag to a spacer component',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents('<div><br></div>');

      expect(components.length).toBe(1);
      const component = components[0] as SpacerComponent;
      expect(component.component).toBe('spacer');
      expect(component.margin).toBe('margin-20');
    }
  );

  test(
    'It should preserve the element tag and attributes on the spacer component',
    { tags: ['unit', 'html'] },
    () => {
      const components = HTMLMapper.toComponents(
        '<div><br id="gap-1" /></div>'
      );

      const component = components[0] as SpacerComponent;
      expect(component.id).toBe('gap-1');
      expect(component.element).toBeDefined();
      if (component.element === undefined) return;
      expect(component.element.tag).toBe('br');
      expect(component.element.attributes?.['id']).toBe('gap-1');
    }
  );

  test(
    'It should map a <br> to a custom component when a matching mapping is provided',
    { tags: ['unit', 'html'] },
    () => {
      const mapping: ComponentMapping = {
        component: 'custom',
        match: 'all',
        filters: [{ type: 'tag', items: ['br'] }],
      };

      const components = HTMLMapper.toComponents('<div><br></div>', {
        mappings: [mapping],
      });

      expect(components.length).toBe(1);
      const component = components[0] as CustomComponent;
      expect(component.component).toBe('custom');
      expect(component.element?.tag).toBe('br');
    }
  );

  test(
    'It should map an arbitrary element to a spacer component via a spacer mapping, using the default margin',
    { tags: ['unit', 'html'] },
    () => {
      const mapping: ComponentMapping = {
        component: 'spacer',
        match: 'all',
        filters: [{ type: 'class', match: 'any', items: ['spacer'] }],
      };

      const components = HTMLMapper.toComponents(
        '<span class="spacer"></span>',
        { mappings: [mapping] }
      );

      expect(components.length).toBe(1);
      const component = components[0] as SpacerComponent;
      expect(component.component).toBe('spacer');
      expect(component.margin).toBe('margin-20');
      expect(component.element?.tag).toBe('span');
    }
  );

  test(
    'It should preserve properties on a mapping-driven spacer component',
    { tags: ['unit', 'html'] },
    () => {
      const mapping: ComponentMapping = {
        component: 'spacer',
        match: 'all',
        properties: { size: 'large' },
        filters: [{ type: 'class', match: 'any', items: ['spacer'] }],
      };

      const components = HTMLMapper.toComponents(
        '<span class="spacer"></span>',
        { mappings: [mapping] }
      );

      const component = components[0] as SpacerComponent;
      expect(component.properties).toEqual({ size: 'large' });
    }
  );
});
