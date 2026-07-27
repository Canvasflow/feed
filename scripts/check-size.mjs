#!/usr/bin/env node
/**
 * Pack size budget check.
 *
 * Baseline (2026-07-27, v1.17.5): packed 50.7 KB / unpacked 304.5 KB.
 * Budgets are set at 50% above baseline to allow for growth while catching
 * accidental bloat (e.g. fixture files accidentally added to `files`).
 *
 * Run: node scripts/check-size.mjs
 * CI:  npm run check:size  (after npm run build)
 */

import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PACKED_BUDGET_KB = 75;
const UNPACKED_BUDGET_KB = 460;

const root = resolve(fileURLToPath(import.meta.url), '..', '..');
const output = execSync('npm pack --json --dry-run', { cwd: root }).toString();
const [{ size, unpackedSize }] = JSON.parse(output);

const packedKB = (size / 1024).toFixed(1);
const unpackedKB = (unpackedSize / 1024).toFixed(1);

console.log(`Packed:   ${packedKB} KB  (budget: ${PACKED_BUDGET_KB} KB)`);
console.log(`Unpacked: ${unpackedKB} KB  (budget: ${UNPACKED_BUDGET_KB} KB)`);

let failed = false;

if (size > PACKED_BUDGET_KB * 1024) {
  console.error(
    `❌ Packed size ${packedKB} KB exceeds budget ${PACKED_BUDGET_KB} KB`,
  );
  failed = true;
}

if (unpackedSize > UNPACKED_BUDGET_KB * 1024) {
  console.error(
    `❌ Unpacked size ${unpackedKB} KB exceeds budget ${UNPACKED_BUDGET_KB} KB`,
  );
  failed = true;
}

if (!failed) {
  console.log('✅ Size budget OK');
}

process.exit(failed ? 1 : 0);
