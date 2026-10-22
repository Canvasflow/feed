import path from 'path';
import { readFileSync } from 'fs';

import { test, describe } from 'vite-plus/test';

import { HTMLMapper } from '../component/html/html-mapper';
import type { Params } from '../component/mapping/mapping';

const htmlDir = path.join(__dirname, '../support/html');
const largeHtml = readFileSync(
  path.join(
    htmlDir,
    'new-apple-intelligence-and-siri-confirmed-by-google.html'
  ),
  'utf-8'
);
const smallHtml = readFileSync(
  path.join(htmlDir, 'custom-mapping-gallery.html'),
  'utf-8'
);

const customParams: Params = {
  mappings: [
    {
      component: 'container',
      match: 'any',
      filters: [{ type: 'class', items: ['gallery'], match: 'any' }],
    },
    {
      component: 'columns',
      match: 'any',
      filters: [{ type: 'class', items: ['columns', 'grid'], match: 'any' }],
      column: { match: 'any', filters: [{ type: 'tag', items: ['li'] }] },
    },
  ],
  excludes: [
    {
      match: 'any',
      filters: [{ type: 'tag', items: ['aside', 'nav', 'footer'] }],
    },
  ],
};

// Stress-tests attribute-map allocation: 20 class-based mappings + 10
// tag/attribute excludes means ~30 getAttributes() calls per element node.
const heavyParams: Params = {
  mappings: Array.from({ length: 20 }, (_, i) => ({
    component: 'container' as const,
    match: 'any' as const,
    filters: [
      {
        type: 'class' as const,
        items: [`widget-${i}`, `box-${i}`],
        match: 'any' as const,
      },
    ],
  })),
  excludes: [
    ...Array.from({ length: 5 }, (_, i) => ({
      match: 'any' as const,
      filters: [
        {
          type: 'class' as const,
          items: [`ad-${i}`, `promo-${i}`],
          match: 'any' as const,
        },
      ],
    })),
    ...Array.from({ length: 5 }, () => ({
      match: 'any' as const,
      filters: [
        {
          type: 'tag' as const,
          items: ['aside', 'nav', 'footer', 'script', 'style'],
        },
      ],
    })),
  ],
};

describe('HTMLMapper.toComponents() — large HTML fixture (~2.8 MB)', () => {
  test('toComponents() — no params', async ({ bench }) => {
    await bench('toComponents() — no params', () => {
      HTMLMapper.toComponents(largeHtml);
    }).run();
  });

  test('toComponents() — with custom mappings + excludes', async ({
    bench,
  }) => {
    await bench('toComponents() — with custom mappings + excludes', () => {
      HTMLMapper.toComponents(largeHtml, customParams);
    }).run();
  });
});

describe('HTMLMapper.toComponents() — small HTML fixture (~26 KB)', () => {
  test('toComponents() — no params', async ({ bench }) => {
    await bench('toComponents() — no params', () => {
      HTMLMapper.toComponents(smallHtml);
    }).run();
  });

  test('toComponents() — with custom mappings + excludes', async ({
    bench,
  }) => {
    await bench('toComponents() — with custom mappings + excludes', () => {
      HTMLMapper.toComponents(smallHtml, customParams);
    }).run();
  });

  test('toComponents() — heavy params (20 mappings, 10 excludes)', async ({
    bench,
  }) => {
    await bench('toComponents() — heavy params (20 mappings, 10 excludes)', () => {
      HTMLMapper.toComponents(smallHtml, heavyParams);
    }).run();
  });
});

describe('HTMLMapper.toComponents() — large HTML fixture, heavy params', () => {
  test('toComponents() — heavy params (20 mappings, 10 excludes)', async ({
    bench,
  }) => {
    await bench('toComponents() — heavy params (20 mappings, 10 excludes)', () => {
      HTMLMapper.toComponents(largeHtml, heavyParams);
    }).run();
  });
});
