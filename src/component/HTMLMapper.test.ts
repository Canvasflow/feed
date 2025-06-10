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
    const content = `<img src="example.jpg"/>`;
    const components = HTMLMapper.toComponents(content);
    expect(components.length).toBe(1);
    const component = components.pop() as ImageComponent;
    expect(component).toBeDefined();
    expect(component.component).toBe('image');
    expect(component?.imageurl).toBe('example.jpg');
  });
});
