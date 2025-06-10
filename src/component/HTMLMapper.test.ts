import { test, expect, describe } from 'vitest';

import { HTMLMapper } from './HTMLMapper';
import type { ImageComponent, TextComponent } from './Component';

describe.only('HTMLMapper', () => {
  describe('Text components', () => {
    test('It should create a p component', () => {
      const content = `<p>Hello world</p>`;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(1);
      const component = components.pop() as TextComponent;
      expect(component).toBeDefined();
      expect(component.component).toBe('body');
      expect(component?.text).toBe(content);
    });

    test('It should set a text45 component base on role', () => {
      const content = `<p role="text45">Hello world</p>`;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(1);
      const component = components.pop() as TextComponent;
      expect(component).toBeDefined();
      expect(component.component).toBe('text45');
      expect(component?.text).toBe(content);
    });

    test('It should remove the image component', () => {
      const components = HTMLMapper.toComponents(`
        <p role="text45"><img src="test.jpg"/>Hello <b>world</b></p>
      `);
      expect(components.length).toBe(1);
      const component = components.pop() as TextComponent;
      expect(component).toBeDefined();
      expect(component.component).toBe('text45');
      expect(component?.text).toBe(`<p role="text45">Hello <b>world</b></p>`);
    });
  });

  describe('Image components', () => {
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

    test.skip('It should process a simple picture element with invalid caption', () => {
      const content = `<picture>
        <source media="(min-width: 1024px)" srcset="full-size.jpg">
        <source media="(min-width: 700px)" srcset="medium-size.jpg">
        <img src="cover.jpg" alt="My image">
        <ficaption>This caption should be ignored</figcaption>
      </picture>`;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(1);
      const component = components.pop() as ImageComponent;
      expect(component).toBeDefined();
      console.log(component);
      expect(component.component).toBe('image');
      expect(component?.imageurl).toBe('cover.jpg');
      expect(component?.caption).toBeUndefined();
    });

    test.skip('It should process a simple picture element with valid caption', () => {
      const content = `
        <figure>
          <picture>
            <source media="(min-width: 1024px)" srcset="full-size.jpg">
            <source media="(min-width: 700px)" srcset="medium-size.jpg">
            <img src="cover.jpg" alt="My image">
          </picture>
          <ficaption>This is a valid caption</figcaption>
        </figure>`;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(1);
      const component = components.pop() as ImageComponent;
      expect(component).toBeDefined();
      console.log(component);
      expect(component.component).toBe('image');
      expect(component?.imageurl).toBe('cover.jpg');
      expect(component?.caption).toBe('This is a valid caption');
    });
    test.skip('It should process a figure component without caption', () => {
      const content = `
        <figure>
          <img src="cover.jpg" alt="My image">
        </figure>`;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(1);
      const component = components.pop() as ImageComponent;
      expect(component).toBeDefined();
      console.log(component);
      expect(component.component).toBe('image');
      expect(component?.imageurl).toBe('cover.jpg');
      expect(component?.caption).toBeUndefined();
    });
    test.skip('It should process a figure component with caption', () => {
      const content = `
        <figure>
          <img src="cover.jpg" alt="My image">
          <figcaption>This is a caption</figcaption>
        </figure>`;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(1);
      const component = components.pop() as ImageComponent;
      expect(component).toBeDefined();
      console.log(component);
      expect(component.component).toBe('image');
      expect(component?.imageurl).toBe('cover.jpg');
      expect(component?.caption).toBe('This is a caption');
    });
    test.skip('It should process a figure component with caption and credit', () => {
      const content = `
        <figure>
          <img src="cover.jpg" alt="My image">
          <figcaption>
            This is a caption
            <small>This is a credit</small>
          </figcaption>
        </figure>`;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(1);
      const component = components.pop() as ImageComponent;
      expect(component).toBeDefined();
      console.log(component);
      expect(component.component).toBe('image');
      expect(component?.imageurl).toBe('cover.jpg');
      expect(component?.caption).toBe('This is a caption');
      expect(component?.credit).toBe('This is a credit');
    });
    test.skip('It should process a figure component with caption and role credit', () => {
      const content = `
        <figure>
          <img src="cover.jpg" alt="My image">
          <figcaption>
            This is a caption
            <span role="credit">This is a credit</small>
            <p>This shouldn't show up</p>
          </figcaption>
        </figure>`;
      const components = HTMLMapper.toComponents(content);
      expect(components.length).toBe(1);
      const component = components.pop() as ImageComponent;
      expect(component).toBeDefined();
      console.log(component);
      expect(component.component).toBe('image');
      expect(component?.imageurl).toBe('cover.jpg');
      expect(component?.caption).toBe('This is a caption');
      expect(component?.credit).toBe('This is a credit');
    });
  });
});
