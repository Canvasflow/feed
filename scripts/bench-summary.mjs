#!/usr/bin/env node
// Render bench-results.json as a Markdown report for the GitHub Actions
// step summary. Output goes to stdout; the workflow appends it to
// $GITHUB_STEP_SUMMARY.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const resultsPath = join(root, 'bench-results.json');

let results;
try {
  results = JSON.parse(readFileSync(resultsPath, 'utf8'));
} catch {
  console.log('## 📊 Benchmark Results\n');
  console.log('> `bench-results.json` not found. Did the bench run complete?');
  process.exit(0);
}

function fmt(hz) {
  if (hz == null || !isFinite(hz)) return '—';
  if (hz >= 1_000_000) return `${(hz / 1_000_000).toFixed(2)} M`;
  if (hz >= 1_000) return `${(hz / 1_000).toFixed(1)} K`;
  return hz.toFixed(2);
}

function fmtMs(ms) {
  if (ms == null || !isFinite(ms)) return '—';
  if (ms < 0.001) return `${(ms * 1_000_000).toFixed(0)} ns`;
  if (ms < 1) return `${(ms * 1_000).toFixed(2)} µs`;
  return `${ms.toFixed(2)} ms`;
}

const lines = [];
lines.push('## 📊 Benchmark Results\n');
lines.push(
  '> Informational only — these numbers are machine-dependent and should be\n' +
    '> compared across runs on the same runner type, not treated as hard limits.\n'
);

// Vitest 5 writes benchmarks through the regular JSON reporter: each test
// result carries a `benchmarks` array of `{ name, tasks }`, and each task has
// tinybench `latency` (ms) and `throughput` (ops/s) statistics.
for (const file of results.testResults ?? []) {
  const groups = new Map();
  for (const test of file.assertionResults ?? []) {
    const title = test.ancestorTitles?.at(-1) ?? test.title;
    const tasks = (test.benchmarks ?? []).flatMap((b) => b.tasks ?? []);
    if (!tasks.length) continue;
    if (!groups.has(title)) groups.set(title, []);
    groups.get(title).push(...tasks);
  }

  for (const [title, tasks] of groups) {
    lines.push(`### ${title}\n`);
    lines.push('| Benchmark | hz | mean | p75 | p99 | rme | samples |');
    lines.push('|---|---|---|---|---|---|---|');
    for (const t of tasks) {
      const cols = [
        t.name,
        `${fmt(t.throughput?.mean)} hz`,
        fmtMs(t.latency?.mean),
        fmtMs(t.latency?.p75),
        fmtMs(t.latency?.p99),
        t.latency?.rme == null ? '—' : `±${t.latency.rme.toFixed(1)}%`,
        t.latency?.samplesCount ?? '—',
      ];
      lines.push(`| ${cols.join(' | ')} |`);
    }
    lines.push('');
  }
}

console.log(lines.join('\n'));
