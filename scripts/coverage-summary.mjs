#!/usr/bin/env node
// Render coverage/coverage-summary.json as a Markdown report, styled to match
// the Vitest Test Report that vite-plus writes to the GitHub Actions summary.
// Output goes to stdout; the workflow appends it to $GITHUB_STEP_SUMMARY.

import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const summaryPath = join(root, 'coverage', 'coverage-summary.json');

let summary;
try {
  summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
} catch {
  console.log('## 📊 Coverage Report\n');
  console.log('> Coverage summary not found. Did the coverage run complete?');
  process.exit(0);
}

const status = (pct) => (pct >= 80 ? '🟢' : pct >= 50 ? '🟡' : '🔴');
const pct = (m) => `${m.pct}%`;
const ratio = (m) => `${m.covered} / ${m.total}`;

const total = summary.total;

const lines = [];
lines.push('## 📊 Vitest Coverage Report');
lines.push('');
lines.push('### Summary');
lines.push('');
lines.push(
  `- **Statements:** ${status(total.statements.pct)} ${pct(total.statements)} · ${ratio(total.statements)}`
);
lines.push(
  `- **Branches:** ${status(total.branches.pct)} ${pct(total.branches)} · ${ratio(total.branches)}`
);
lines.push(
  `- **Functions:** ${status(total.functions.pct)} ${pct(total.functions)} · ${ratio(total.functions)}`
);
lines.push(
  `- **Lines:** ${status(total.lines.pct)} ${pct(total.lines)} · ${ratio(total.lines)}`
);
lines.push('');

// Per-file breakdown
const files = Object.keys(summary)
  .filter((key) => key !== 'total')
  .sort();

if (files.length) {
  lines.push('<details>');
  lines.push('<summary>Per-file coverage</summary>');
  lines.push('');
  lines.push('| File | Statements | Branches | Functions | Lines |');
  lines.push('| :--- | ---: | ---: | ---: | ---: |');
  for (const file of files) {
    const m = summary[file];
    const name = relative(root, file) || file;
    lines.push(
      `| \`${name}\` | ${status(m.statements.pct)} ${pct(m.statements)} | ${status(m.branches.pct)} ${pct(m.branches)} | ${status(m.functions.pct)} ${pct(m.functions)} | ${status(m.lines.pct)} ${pct(m.lines)} |`
    );
  }
  lines.push('');
  lines.push('</details>');
}

console.log(lines.join('\n'));
