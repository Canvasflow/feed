import fs from 'fs';
import path from 'path';
import { test, expect, describe } from 'vite-plus/test';

import { HTMLMapper } from '../html-mapper';
import { parse } from '../parser';
import type { Component } from '../../component';
import { isTextComponent } from '../../component';
import {
  textAllowedTags,
  htmlTableAllowedTags,
} from '../../mapping/mapping.constants';

// ─── helpers ────────────────────────────────────────────────────────────────

function allTagsIn(html: string): string[] {
  const tags: string[] = [];
  function walk(nodes: ReturnType<typeof parse>): void {
    for (const node of nodes) {
      if (node.type === 'element') {
        tags.push(node.tagName);
        walk(node.children);
      }
    }
  }
  walk(parse(html));
  return tags;
}

const textAllowedSet = new Set(textAllowedTags);
const tableAllowedSet = new Set(htmlTableAllowedTags);

// ─── Allow-list compliance ───────────────────────────────────────────────────
//
// After toComponents, every TextComponent's `text` field must only contain
// tags from textAllowedTags. HTMLTableComponent `html` fields must only
// contain tags from htmlTableAllowedTags. No script/style/iframe should
// survive in any component's HTML output.

const feedsPath = path.join(__dirname, '..', '..', '..', 'support', 'feeds');
const htmlPath = path.join(__dirname, '..', '..', '..', 'support', 'html');

function loadAllFixtures(): Array<[string, string]> {
  const result: Array<[string, string]> = [];
  for (const [dir, prefix] of [
    [feedsPath, 'feeds/'],
    [htmlPath, 'html/'],
  ] as const) {
    for (const f of fs
      .readdirSync(dir)
      .filter((x) => x.endsWith('.html'))
      .sort()) {
      result.push([prefix + f, fs.readFileSync(path.join(dir, f), 'utf-8')]);
    }
  }
  return result;
}

const DANGEROUS_TAGS = new Set([
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'form',
  'input',
]);

function collectComponentHtml(
  components: readonly Component[]
): Array<{ source: string; html: string }> {
  const out: Array<{ source: string; html: string }> = [];
  for (const c of components) {
    if (isTextComponent(c) && c.text) {
      out.push({ source: 'text.text', html: c.text });
    }
    if (c.component === 'htmltable' && c.html) {
      out.push({ source: 'htmltable.html', html: c.html });
    }
    if ('components' in c && Array.isArray(c.components)) {
      out.push(...collectComponentHtml(c.components as Component[]));
    }
  }
  return out;
}

describe('HTMLMapper.toComponents — allow-list compliance', () => {
  for (const [label, html] of loadAllFixtures()) {
    test(
      `no dangerous tags in output: ${label}`,
      { tags: ['html', 'unit'] },
      () => {
        const components = HTMLMapper.toComponents(html);
        const htmlFields = collectComponentHtml(components);
        for (const { html: field } of htmlFields) {
          const tags = allTagsIn(field);
          for (const tag of tags) {
            expect(
              DANGEROUS_TAGS.has(tag),
              `Dangerous tag <${tag}> found in component HTML output`
            ).toBe(false);
          }
        }
      }
    );

    test(
      `text components only use allowed tags: ${label}`,
      { tags: ['html', 'unit'] },
      () => {
        const components = HTMLMapper.toComponents(html);
        for (const c of components) {
          if (!isTextComponent(c) || !c.text) continue;
          const tags = allTagsIn(c.text);
          for (const tag of tags) {
            expect(
              textAllowedSet.has(tag),
              `Disallowed tag <${tag}> found in TextComponent.text`
            ).toBe(true);
          }
        }
      }
    );
  }

  test(
    'htmltable components only use allowed tags',
    { tags: ['html', 'unit'] },
    () => {
      const html = `
      <table>
        <thead><tr><th><b>Name</b></th><th>Value</th></tr></thead>
        <tbody>
          <tr><td><em>foo</em></td><td><script>alert(1)</script>bar</td></tr>
        </tbody>
      </table>`;
      const components = HTMLMapper.toComponents(html);
      const tableComp = components.find((c) => c.component === 'htmltable');
      if (!tableComp || !tableComp.html) return;
      const tags = allTagsIn(tableComp.html);
      for (const tag of tags) {
        expect(
          tableAllowedSet.has(tag),
          `Disallowed tag <${tag}> found in HTMLTableComponent.html`
        ).toBe(true);
      }
    }
  );
});

// ─── Filter law: match:'all' ⊆ match:'any' ──────────────────────────────────
//
// If an element is matched by ALL specified filters, it is necessarily matched
// by ANY of them. So for mappings, match:'all' is always a subset of
// match:'any' for the same filter set: anything match:'all' would include,
// match:'any' also includes.
//
// For excludes, the dual holds: match:'any' is at least as aggressive as
// match:'all' — anything excluded by match:'any' is also excluded by
// match:'all' being looser (i.e. the any-excluded set ⊇ the all-excluded set).

describe("HTMLMapper.toComponents — filter law: match:'all' ⊆ match:'any'", () => {
  test(
    'for mappings: match-all result is a subset of match-any result',
    { tags: ['html', 'unit'] },
    () => {
      const html = `
      <p class="a b">both</p>
      <p class="a">only-a</p>
      <p class="b">only-b</p>
      <p class="c">neither</p>
    `;
      const filters = [
        { type: 'class' as const, match: 'any' as const, items: ['a'] },
        { type: 'class' as const, match: 'any' as const, items: ['b'] },
      ];
      const mappingBase = { component: 'body' as const, type: 'body' as const };

      const anyResult = HTMLMapper.toComponents(html, {
        mappings: [{ ...mappingBase, match: 'any', filters }],
      });
      const allResult = HTMLMapper.toComponents(html, {
        mappings: [{ ...mappingBase, match: 'all', filters }],
      });

      // match:'all' produces only elements matching ALL class filters (both a AND b)
      // match:'any' produces elements matching ANY filter (a OR b)
      // So all-matched ⊆ any-matched
      expect(allResult.length).toBeLessThanOrEqual(anyResult.length);

      const anyTexts = new Set(
        anyResult.filter(isTextComponent).map((c) => c.text)
      );
      for (const c of allResult) {
        if (isTextComponent(c)) {
          expect(anyTexts.has(c.text)).toBe(true);
        }
      }
    }
  );

  test(
    'for excludes: match-any excludes at least as much as match-all',
    { tags: ['html', 'unit'] },
    () => {
      const html = `
      <p class="a b">both</p>
      <p class="a">only-a</p>
      <p class="b">only-b</p>
      <p>neither</p>
    `;
      const filters = [
        { type: 'class' as const, match: 'any' as const, items: ['a'] },
        { type: 'class' as const, match: 'any' as const, items: ['b'] },
      ];

      const anyExcludeResult = HTMLMapper.toComponents(html, {
        excludes: [{ match: 'any', filters }],
      });
      const allExcludeResult = HTMLMapper.toComponents(html, {
        excludes: [{ match: 'all', filters }],
      });

      // match:'any' excludes anything with class a OR b (more aggressive)
      // match:'all' excludes only things with class a AND b (less aggressive)
      // So any-excluded ⊇ all-excluded → all-exclude-result ⊇ any-exclude-result
      expect(allExcludeResult.length).toBeGreaterThanOrEqual(
        anyExcludeResult.length
      );

      const allTexts = new Set(
        allExcludeResult.filter(isTextComponent).map((c) => c.text)
      );
      for (const c of anyExcludeResult) {
        if (isTextComponent(c)) {
          expect(allTexts.has(c.text)).toBe(true);
        }
      }
    }
  );

  test('filter law holds for tag filters', { tags: ['html', 'unit'] }, () => {
    const html = '<div><p>p-text</p><h2>h2-text</h2><span>span</span></div>';
    const filters = [
      { type: 'tag' as const, items: ['p'] },
      { type: 'tag' as const, items: ['h2'] },
    ];
    const mappingBase = { component: 'body' as const, type: 'body' as const };

    const anyResult = HTMLMapper.toComponents(html, {
      mappings: [{ ...mappingBase, match: 'any', filters }],
    });
    const allResult = HTMLMapper.toComponents(html, {
      mappings: [{ ...mappingBase, match: 'all', filters }],
    });

    expect(allResult.length).toBeLessThanOrEqual(anyResult.length);
    const anyTexts = new Set(
      anyResult.filter(isTextComponent).map((c) => c.text)
    );
    for (const c of allResult) {
      if (isTextComponent(c)) {
        expect(anyTexts.has(c.text)).toBe(true);
      }
    }
  });

  test(
    'filter law holds for attribute filters',
    { tags: ['html', 'unit'] },
    () => {
      const html = '<p id="a">id-a</p><p id="b">id-b</p><p>none</p>';
      const filters = [
        { type: 'attribute' as const, key: 'id', value: 'a' as string | null },
        { type: 'attribute' as const, key: 'id', value: 'b' as string | null },
      ];
      const mappingBase = { component: 'body' as const, type: 'body' as const };

      const anyResult = HTMLMapper.toComponents(html, {
        mappings: [{ ...mappingBase, match: 'any', filters }],
      });
      const allResult = HTMLMapper.toComponents(html, {
        mappings: [{ ...mappingBase, match: 'all', filters }],
      });

      expect(allResult.length).toBeLessThanOrEqual(anyResult.length);
      const anyTexts = new Set(
        anyResult.filter(isTextComponent).map((c) => c.text)
      );
      for (const c of allResult) {
        if (isTextComponent(c)) {
          expect(anyTexts.has(c.text)).toBe(true);
        }
      }
    }
  );
});
