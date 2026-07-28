import { test, expect, describe } from 'vite-plus/test';

import { HTMLMapper } from '../../../component/html/html-mapper';

const tags = { tags: ['unit'] };

describe('fromNode — depth guard', () => {
  test(
    'moderately-deep HTML (500 levels) does not throw a stack overflow',
    tags,
    () => {
      // 500 levels > MAX_FROMNODE_DEPTH (256). The parser can handle this
      // depth fine; the depth guard in fromNode silently drops content beyond
      // 256 levels rather than recursing until the JS call stack exhausts.
      const html = '<div>'.repeat(500) + 'deep text' + '</div>'.repeat(500);

      expect(() => HTMLMapper.toComponents(html)).not.toThrow();
    }
  );

  test(
    'content beyond MAX_FROMNODE_DEPTH is silently dropped, not thrown',
    tags,
    () => {
      // 300 levels > MAX_FROMNODE_DEPTH (256); the deep content should be
      // dropped, but the shallow content must still come through.
      const deep = '<div>'.repeat(300) + '<p>deep</p>' + '</div>'.repeat(300);
      const html = `<p>shallow</p>${deep}`;

      let components: unknown[];
      expect(() => {
        components = HTMLMapper.toComponents(html);
      }).not.toThrow();

      // text components use the `text` field; check the shallow <p> made it through
      const texts = (components! as Array<{ text?: string }>)
        .map((c) => c.text ?? '')
        .join(' ');
      expect(texts).toContain('shallow');
      // deep content is beyond the guard — it is absent but not an error
      expect(texts).not.toContain('deep');
    }
  );
});
