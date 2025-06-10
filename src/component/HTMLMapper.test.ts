import { test, expect, describe } from 'vitest';

import { HTMLMapper } from './HTMLMapper';
import type { ImageComponent, TextComponent } from './Component';

describe.only('HTMLMapper', () => {
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

  test.skip('It should process a simple picture element', () => {
    const content = `<picture>
      <source media="(min-width: 1024px)" srcset="full-size.jpg">
      <source media="(min-width: 700px)" srcset="medium-size.jpg">
      <img src="cover.jpg" alt="My image">
      <ficaption></figcaption>
    </picture>`;
    const components = HTMLMapper.toComponents(content);
    expect(components.length).toBe(1);
    const component = components.pop() as ImageComponent;
    expect(component).toBeDefined();
    console.log(component);
    expect(component.component).toBe('image');
    expect(component?.imageurl).toBe('cover.jpg');
  });
});
