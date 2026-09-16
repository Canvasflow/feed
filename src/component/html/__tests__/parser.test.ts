import { test, expect, describe } from 'vite-plus/test';

import { parse } from '../parser';
import { HTMLMapper } from '../html-mapper';
import { isAudioComponent, isTextComponent } from '../../component';
import type { ElementNode } from '../../node/node-helpers';

function tagNames(nodes: ReturnType<typeof parse>): string[] {
  return nodes
    .filter((n): n is ElementNode => n.type === 'element')
    .map((n) => n.tagName);
}

describe('parse — explicitly self-closed non-void tags', () => {
  test(
    'a self-closed <audio ... /> does not swallow its following sibling',
    { tags: ['unit', 'html'] },
    () => {
      const html =
        '<audio src="https://example.com/a.mp3" controls loop muted />' +
        '<section class="c">text</section>';

      const nodes = parse(html);

      expect(tagNames(nodes)).toEqual(['audio', 'section']);
      const audio = nodes[0] as ElementNode;
      expect(audio.children).toEqual([]);
    }
  );

  test(
    'the self-close still holds across a multi-line start tag',
    { tags: ['unit', 'html'] },
    () => {
      const html = `<audio
    src="https://example.com/a.mp3"
    controls loop muted />
<section class="c">text</section>`;

      const nodes = parse(html);

      expect(tagNames(nodes)).toEqual(['audio', 'section']);
    }
  );

  test(
    'a bare `<div/>` (no attributes) self-closes',
    { tags: ['unit', 'html'] },
    () => {
      const nodes = parse('<div/>after');
      const div = nodes[0] as ElementNode;
      expect(div.tagName).toBe('div');
      expect(div.children).toEqual([]);
      expect(nodes.some((n) => n.type === 'text')).toBe(true);
    }
  );

  test(
    'a spaced `<div />` self-closes the same way',
    { tags: ['unit', 'html'] },
    () => {
      const nodes = parse('<div class="x" />after');
      const div = nodes[0] as ElementNode;
      expect(div.children).toEqual([]);
    }
  );

  test(
    'a boolean attribute directly followed by "/" (no space) still self-closes',
    { tags: ['unit', 'html'] },
    () => {
      // Real-world case: publisher markup with no space before the self-close
      // slash (`muted/>` rather than `muted />`). Unlike an unquoted
      // *attribute value* ending in "/" (which HTML5 folds into the value —
      // see the `data-x=foo/` case below), a bare boolean attribute has no
      // `=`, so per the HTML5 tokenizer the `/` unambiguously starts
      // self-closing regardless of the missing whitespace.
      const html =
        '<audio src="https://example.com/a.mp3" controls loop muted/>' +
        '<section class="c">text</section>';

      const nodes = parse(html);

      expect(tagNames(nodes)).toEqual(['audio', 'section']);
      const audio = nodes[0] as ElementNode;
      expect(audio.children).toEqual([]);
    }
  );

  test(
    'void elements are unaffected — already self-close regardless of `/`',
    { tags: ['unit', 'html'] },
    () => {
      const nodes = parse('<br/><p>text</p>');
      expect(tagNames(nodes)).toEqual(['br', 'p']);
    }
  );

  test(
    'a trailing slash inside a quoted attribute value is not mistaken for self-close',
    { tags: ['unit', 'html'] },
    () => {
      const nodes = parse(
        '<a href="http://example.com/">child</a><p>after</p>'
      );
      const a = nodes[0] as ElementNode;
      expect(a.tagName).toBe('a');
      expect(a.children.length).toBeGreaterThan(0);
      expect(tagNames(nodes)).toEqual(['a', 'p']);
    }
  );

  test(
    'an unquoted attribute value ending in "/" is not treated as self-close',
    { tags: ['unit', 'html'] },
    () => {
      // Per the HTML5 tokenizer, `data-x=foo/` with no following whitespace
      // reads the whole "foo/" as the unquoted attribute value — the `/`
      // isn't a self-close marker here, so this must fall through
      // unchanged rather than being rewritten.
      const nodes = parse('<div data-x=foo/><p>after</p>');
      const div = nodes[0] as ElementNode;
      expect(div.tagName).toBe('div');
      // The <p> got consumed as a child, matching plain HTML5 parsing —
      // proof the ambiguous case was left alone rather than "fixed".
      expect(tagNames(nodes)).toEqual(['div']);
    }
  );

  test(
    'HTMLMapper.toComponents produces separate components for the audio and its sibling',
    { tags: ['unit', 'html'] },
    () => {
      const html =
        '<audio src="https://example.com/a.mp3" controls loop muted />' +
        '<p>Read the transcript below.</p>';

      const components = HTMLMapper.toComponents(html);

      expect(components).toHaveLength(2);
      expect(isAudioComponent(components[0])).toBe(true);
      expect(isTextComponent(components[1])).toBe(true);
      if (isAudioComponent(components[0])) {
        expect(components[0].url).toBe('https://example.com/a.mp3');
        expect(components[0].controls).toBe(true);
        expect(components[0].loop).toBe(true);
        expect(components[0].muted).toBe(true);
      }
    }
  );

  test(
    'the reported real-world case: a whitespace-only sibling section disappears cleanly, not nested',
    { tags: ['unit', 'html'] },
    () => {
      const html = `<audio
    src="https://cdn.example.com/a.mp3"
    controls loop muted />
<section class="c-content-block content-block content-section">

</section>`;

      const components = HTMLMapper.toComponents(html);

      expect(components).toHaveLength(1);
      expect(isAudioComponent(components[0])).toBe(true);
    }
  );
});
