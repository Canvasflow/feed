import fs from 'fs';
import path from 'path';
import { test, expect, describe } from 'vite-plus/test';

import { HTMLMapper } from '../html-mapper';

const feedsPath = path.join(__dirname, '..', '..', '..', 'support', 'feeds');
const htmlPath = path.join(__dirname, '..', '..', '..', 'support', 'html');

function collectHtmlFixtures(): Array<{ label: string; filePath: string }> {
  const fixtures: Array<{ label: string; filePath: string }> = [];
  for (const [dir, prefix] of [
    [feedsPath, 'feeds/'],
    [htmlPath, 'html/'],
  ] as const) {
    for (const filename of fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.html'))
      .sort()) {
      fixtures.push({
        label: prefix + filename,
        filePath: path.join(dir, filename),
      });
    }
  }
  return fixtures;
}

const fixtures = collectHtmlFixtures();

describe('HTMLMapper.toComponents full-pipeline snapshots', () => {
  for (const { label, filePath } of fixtures) {
    test(label, { tags: ['html'] }, () => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const components = HTMLMapper.toComponents(content);
      expect(components).toMatchSnapshot();
    });
  }
});
