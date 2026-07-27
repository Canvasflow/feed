import path from 'path';
import { readFileSync } from 'fs';

import { bench, describe } from 'vite-plus/test';

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

describe('HTMLMapper.toComponents() — large HTML fixture (~2.8 MB)', () => {
  bench('toComponents() — no params', () => {
    HTMLMapper.toComponents(largeHtml);
  });

  bench('toComponents() — with custom mappings + excludes', () => {
    HTMLMapper.toComponents(largeHtml, customParams);
  });
});

describe('HTMLMapper.toComponents() — small HTML fixture (~26 KB)', () => {
  bench('toComponents() — no params', () => {
    HTMLMapper.toComponents(smallHtml);
  });

  bench('toComponents() — with custom mappings + excludes', () => {
    HTMLMapper.toComponents(smallHtml, customParams);
  });
});
