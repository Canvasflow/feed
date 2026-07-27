#!/usr/bin/env node
/**
 * Consumer smoke test.
 *
 * Packs the library, installs it into a temporary directory, and verifies:
 *   1. JS runtime: `import { RSSFeed, HTMLMapper }` works under Node ESM.
 *   2. TypeScript: compiles under moduleResolution: bundler.
 *   3. TypeScript: compiles under moduleResolution: node16.
 *
 * This catches packaging mistakes (missing files, wrong exports map,
 * broken type declarations) that unit tests cannot detect.
 *
 * Run: npm run smoke   (runs build first)
 * CI:  triggered via check:smoke after npm run build
 *
 * Requirements: Node 20+, TypeScript available in devDependencies.
 */

import { execSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(import.meta.url), '..', '..');
const tmp = mkdtempSync(join(tmpdir(), 'canvasflow-feed-smoke-'));
let tarballPath = null;

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: 'inherit', ...opts });
}

try {
  // 1. Pack the built library.
  console.log('\n--- Packing library ---');
  const packOutput = execSync('npm pack --json', { cwd: root }).toString();
  const [{ filename }] = JSON.parse(packOutput);
  tarballPath = resolve(root, filename);
  console.log(`Packed: ${filename}`);

  // 2. Bootstrap a minimal consumer project in the temp directory.
  console.log(`\n--- Setting up consumer in ${tmp} ---`);

  writeFileSync(
    join(tmp, 'package.json'),
    JSON.stringify({ name: 'smoke-consumer', version: '1.0.0', type: 'module' }),
  );

  // Install the tarball directly (no registry auth needed).
  run(`npm install --no-save "${tarballPath}"`, { cwd: tmp });

  // 3. Runtime import test (Node ESM).
  console.log('\n--- Runtime import test ---');
  const runtimeScript = `
import { RSSFeed, HTMLMapper } from '@canvasflow/feed';
const feed = new RSSFeed('<rss version="2.0"><channel></channel></rss>');
const rss = await feed.build();
if (!rss || !rss.channel) throw new Error('build() did not return a valid RSS object');
const components = HTMLMapper.toComponents('<h1>Smoke test</h1><p>OK</p>');
if (!Array.isArray(components) || components.length === 0) {
  throw new Error('toComponents() did not return a component array');
}
console.log('Runtime import: OK (' + components.length + ' components)');
`;
  writeFileSync(join(tmp, 'test.mjs'), runtimeScript);
  run('node test.mjs', { cwd: tmp });

  // 4. TypeScript compilation — moduleResolution: bundler.
  console.log('\n--- TypeScript check (moduleResolution: bundler) ---');
  const tsConsumer = `
import { RSSFeed, HTMLMapper } from '@canvasflow/feed';
import type { Component, RSS } from '@canvasflow/feed';

const feed: RSSFeed = new RSSFeed('<rss></rss>');
const _rss: Promise<RSS> = feed.build();
const _components: Component[] = HTMLMapper.toComponents('<p>hello</p>');
`;
  writeFileSync(join(tmp, 'consumer.ts'), tsConsumer);

  writeFileSync(
    join(tmp, 'tsconfig.bundler.json'),
    JSON.stringify({
      compilerOptions: {
        module: 'preserve',
        moduleResolution: 'bundler',
        target: 'es2022',
        strict: true,
        noEmit: true,
      },
      include: ['consumer.ts'],
    }),
  );

  const tsBin = resolve(root, 'node_modules', '.bin', 'tsc');
  run(`"${tsBin}" --project tsconfig.bundler.json`, { cwd: tmp });
  console.log('TypeScript (bundler): OK');

  // 5. TypeScript compilation — moduleResolution: node16.
  console.log('\n--- TypeScript check (moduleResolution: node16) ---');
  writeFileSync(
    join(tmp, 'tsconfig.node16.json'),
    JSON.stringify({
      compilerOptions: {
        module: 'node16',
        moduleResolution: 'node16',
        target: 'es2022',
        strict: true,
        noEmit: true,
      },
      include: ['consumer.ts'],
    }),
  );

  run(`"${tsBin}" --project tsconfig.node16.json`, { cwd: tmp });
  console.log('TypeScript (node16): OK');

  console.log('\n✅ Smoke consumer test passed\n');
} finally {
  rmSync(tmp, { recursive: true, force: true });
  if (tarballPath && existsSync(tarballPath)) {
    rmSync(tarballPath);
  }
}
