import { test, expect, describe } from 'vite-plus/test';

import { HTMLMapper, splitParagraphImages } from './HTMLMapper';
import { type TextComponent, type ImageComponent } from '../Component';

const tags = { tags: ['unit', 'html'] };

describe('splitParagraphImages', () => {
  test('lifts an img out of a p that contains only the image', tags, () => {
    const result = splitParagraphImages(
      '<div><p><img src="a.jpg" alt="x" /></p></div>',
      'p'
    );
    expect(result).toContain('<img');
    expect(result).not.toMatch(/<p[^>]*><img/);
  });

  test('splits text before and after an img into separate p tags', tags, () => {
    const result = splitParagraphImages(
      '<div><p>Before<img src="a.jpg" />After</p></div>',
      'p'
    );
    expect(result).toContain('Before');
    expect(result).toContain('After');
    expect(result).toContain('<img');
    // img must not appear as a direct child of any p (no tag boundary between)
    expect(result).not.toMatch(/<p[^>]*>[^<]*<img/);
  });

  test('preserves p attributes on the split fragments', tags, () => {
    const result = splitParagraphImages(
      '<div><p class="body">Text<img src="a.jpg" /></p></div>',
      'p'
    );
    expect(result).toContain('class="body"');
  });

  test('leaves a p without an img unchanged', tags, () => {
    const result = splitParagraphImages(
      '<div><p>No image here</p></div>',
      'p'
    );
    expect(result).toContain('<p>No image here</p>');
  });

  test('works end-to-end through HTMLMapper.toComponents', tags, () => {
    const components = HTMLMapper.toComponents(
      '<p>Caption<img src="a.jpg" alt="photo" />After</p>'
    );
    const image = components.find((c) => c.component === 'image') as
      | ImageComponent
      | undefined;
    expect(image).toBeDefined();
    expect(image?.imageurl).toBe('a.jpg');
  });
});

describe('HTMLMapper invalid href handling', () => {
  test('rewrites a whitespace-only href to #', tags, () => {
    const [c] = HTMLMapper.toComponents(`<p><a href="   ">link</a></p>`);
    expect((c as TextComponent).text).toContain('href="#"');
  });

  test('keeps a valid absolute href untouched', tags, () => {
    const [c] = HTMLMapper.toComponents(
      `<p><a href="https://example.com">link</a></p>`
    );
    expect((c as TextComponent).text).toContain('href="https://example.com"');
  });
});
