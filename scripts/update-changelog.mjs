#!/usr/bin/env node
/**
 * Prepends (or refreshes) the CHANGELOG.md section for the version currently in
 * package.json, built from the commits that are about to land on `main`.
 *
 * Two ways it runs:
 *   - From the `post-merge` hook when a hotfix/release lands on main: the hook
 *     passes the incoming commit range explicitly via --base HEAD^1 --tip HEAD^2.
 *   - Standalone (`npm run changelog`) on a hotfix/release branch before merging:
 *     falls back to the commits not yet on main (<main>..HEAD).
 *
 * Idempotent: if the top section already targets the same version it is
 * replaced, so re-running never duplicates an entry.
 *
 * Usage:
 *   node scripts/update-changelog.mjs [--base <ref>] [--tip <ref>] [--version <x.y.z>]
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHANGELOG = join(ROOT, 'CHANGELOG.md');

const sh = (cmd) =>
  execSync(cmd, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
const shSafe = (cmd) => {
  try {
    return sh(cmd);
  } catch {
    return '';
  }
};

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

// --- repo URL (https://github.com/Owner/Repo) -------------------------------
function repoUrl() {
  const raw = shSafe('git remote get-url origin');
  const m = raw.match(/github\.com[:/](.+?)(?:\.git)?$/);
  return m ? `https://github.com/${m[1]}` : '';
}

// --- conventional-commit categorisation -------------------------------------
const CAT = {
  feat: { head: '✨ Features', order: 1 },
  fix: { head: '🐛 Fixed', order: 2 },
  perf: { head: '⚡️ Performance', order: 3 },
  refactor: { head: '♻️ Refactor', order: 4 },
  test: { head: '🧪 Tests', order: 5 },
  ci: { head: '🐳 Build & CI', order: 6 },
  build: { head: '🐳 Build & CI', order: 6 },
  docs: { head: '📝 Docs', order: 7 },
  style: { head: '🎨 Style', order: 8 },
  chore: { head: '🧹 Chores', order: 9 },
};
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function parse(subject) {
  const m = subject.match(/^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/);
  let type, scope, desc;
  if (m) {
    [, type, scope, , desc] = m;
    type = type.toLowerCase();
  } else {
    type = 'chore';
    desc = subject;
  }
  const cat = CAT[type] || CAT.chore;
  desc = desc.replace(/^(:[a-z0-9_+-]+:\s*)+/i, ''); // strip gitmoji shortcodes
  if (/^bump version(\s|$)|^bump version to/i.test(desc)) return null; // drop pure bumps
  const text = scope ? `(${scope}) ${cap(desc)}` : cap(desc);
  return { head: cat.head, order: cat.order, text };
}

// --- resolve mode, range and version ----------------------------------------
// tip = newest commit to include; base = last commit already released on main.
// The post-merge hook passes these explicitly (HEAD^2 / HEAD^1). Standalone runs
// on a hotfix/release branch fall back to <main>..HEAD.
const tip = arg('tip') || 'HEAD';

let base = arg('base');
if (!base) {
  base = shSafe('git rev-parse --verify --quiet main')
    ? 'main'
    : shSafe('git rev-parse --verify --quiet origin/main')
      ? 'origin/main'
      : '';
}
if (!base) {
  console.error(
    'changelog: could not determine a base branch to diff against; skipping.'
  );
  process.exit(0);
}

const version =
  arg('version') ||
  JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;
const date =
  shSafe(`git log -1 --pretty=%cs ${tip}`) ||
  new Date().toISOString().slice(0, 10);

const log = shSafe(
  `git log ${base}..${tip} --no-merges --pretty=format:%H%x09%s`
);
if (!log) {
  console.error(`changelog: no new commits in ${base}..${tip}; nothing to do.`);
  process.exit(0);
}

// --- build the grouped section ----------------------------------------------
const URL = repoUrl();
const groups = new Map(); // head -> { order, items: [] }
const seen = new Set();
for (const line of log.split('\n')) {
  if (!line.trim()) continue;
  const tab = line.indexOf('\t');
  const hash = line.slice(0, tab);
  const subject = line.slice(tab + 1);

  // Skip commits that only touch the changelog itself (avoids self-reference noise).
  const files = shSafe(`git show --pretty=format: --name-only ${hash}`)
    .split('\n')
    .filter(Boolean);
  if (files.length && files.every((f) => f === 'CHANGELOG.md')) continue;

  const p = parse(subject);
  if (!p || seen.has(p.text)) continue;
  seen.add(p.text);
  if (!groups.has(p.head)) groups.set(p.head, { order: p.order, items: [] });
  const short = hash.slice(0, 7);
  const link = URL
    ? ` ([\`${short}\`](${URL}/commit/${hash}))`
    : ` (\`${short}\`)`;
  groups.get(p.head).items.push(`- ${p.text}${link}`);
}
if (groups.size === 0) {
  console.error('changelog: no user-facing commits to record; nothing to do.');
  process.exit(0);
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const [y, mo, d] = date.split('-').map(Number);
let section = `## 🏷️ ${version}\n\n_${MONTHS[mo - 1]} ${d}, ${y}_\n`;
for (const [head, g] of [...groups.entries()].sort(
  (a, b) => a[1].order - b[1].order
)) {
  section += `\n${head}\n\n${g.items.join('\n')}\n`;
}

// --- splice into CHANGELOG.md -----------------------------------------------
const HEADER = '# CHANGELOG';
let body = existsSync(CHANGELOG)
  ? readFileSync(CHANGELOG, 'utf8')
  : `${HEADER}\n`;
if (!body.startsWith(HEADER)) body = `${HEADER}\n\n${body}`;

const after = body.slice(HEADER.length).replace(/^\n+/, '');
// Drop an existing leading section for the same version so re-runs are idempotent.
const sameVersion = new RegExp(
  `^## 🏷️ ${version.replace(/\./g, '\\.')}\\b[\\s\\S]*?(?=\\n## |$)`
);
const rest = after.replace(sameVersion, '').replace(/^\n+/, '');

const out = `${HEADER}\n\n${section}\n${rest}`
  .replace(/\n{3,}/g, '\n\n')
  .replace(/\s*$/, '\n');
writeFileSync(CHANGELOG, out);
console.error(
  `changelog: wrote section for ${version} (${seen.size} entries from ${base}..${tip}).`
);
