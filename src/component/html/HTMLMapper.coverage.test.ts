import { test, expect, describe } from 'vite-plus/test';

import { HTMLMapper } from './HTMLMapper';
import { type TextComponent } from '../Component';

const tags = { tags: ['unit', 'html'] };

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
