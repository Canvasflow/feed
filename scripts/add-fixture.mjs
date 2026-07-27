#!/usr/bin/env node
/**
 * add-fixture.mjs — add a new RSS/HTML fixture to src/support/feeds/.
 *
 * Usage:
 *   node scripts/add-fixture.mjs <url-or-file-path> [output-name]
 *
 * Examples:
 *   node scripts/add-fixture.mjs https://www.example.com/feed.rss
 *   node scripts/add-fixture.mjs https://www.example.com/feed.rss my-feed.rss
 *   node scripts/add-fixture.mjs /tmp/downloaded-feed.rss my-feed.rss
 *
 * If output-name is omitted the name is derived from the URL path or input
 * filename. The extension (.rss or .html) is preserved; anything else
 * defaults to .rss.
 *
 * After the file is written, run:
 *   npm test -- --update-snapshot
 * to add it to the snapshot baseline.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FEEDS_DIR = path.resolve(__dirname, '..', 'src', 'support', 'feeds');

function usage() {
  console.error('Usage: node scripts/add-fixture.mjs <url-or-file-path> [output-name]');
  process.exit(1);
}

function deriveOutputName(input) {
  let base;
  try {
    const url = new URL(input);
    base = path.basename(url.pathname) || 'feed';
  } catch {
    base = path.basename(input);
  }
  // Normalise: lowercase, replace spaces and non-word chars with hyphens
  base = base.toLowerCase().replace(/[^a-z0-9._-]/g, '-').replace(/-+/g, '-');
  // Ensure a recognised extension
  if (!base.endsWith('.rss') && !base.endsWith('.html') && !base.endsWith('.xml')) {
    base += '.rss';
  }
  return base;
}

async function fetchUrl(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'canvasflow-feed-fixture-intake/1.0' },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }
  return response.text();
}

async function main() {
  const [, , input, outputName] = process.argv;
  if (!input) usage();

  const outName = outputName ?? deriveOutputName(input);
  const outPath = path.join(FEEDS_DIR, outName);

  if (fs.existsSync(outPath)) {
    console.error(`\nFixture already exists: ${outPath}`);
    console.error('Remove it first or choose a different output name.');
    process.exit(1);
  }

  let content;
  const isUrl = /^https?:\/\//.test(input);
  if (isUrl) {
    console.log(`Fetching ${input} ...`);
    content = await fetchUrl(input);
  } else {
    const src = path.resolve(input);
    if (!fs.existsSync(src)) {
      console.error(`File not found: ${src}`);
      process.exit(1);
    }
    content = fs.readFileSync(src, 'utf-8');
    console.log(`Read ${src}`);
  }

  fs.mkdirSync(FEEDS_DIR, { recursive: true });
  fs.writeFileSync(outPath, content, 'utf-8');

  console.log(`\nFixture written: ${outPath}`);
  console.log('\nNext steps:');
  console.log('  1. Review the file for sensitive data before committing.');
  console.log('  2. Run:  npm test -- --update-snapshot');
  console.log('     to add this fixture to the snapshot baseline.');
  console.log('  3. Commit both the fixture and its snapshot.');
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
