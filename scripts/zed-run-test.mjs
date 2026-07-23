#!/usr/bin/env node
// Invoked by .zed/tasks.json's "vitest test $ZED_SYMBOL" task (both the run
// and the auto-derived debug variant Zed generates from it — see the tags
// field on that task). Two problems this solves:
//
// 1. vitest's -t/--testNamePattern is a regex, but $ZED_SYMBOL is a raw
//    test/describe name that often contains literal regex metacharacters
//    (e.g. "youtube iframe (direct origin)") — passed through unescaped,
//    those silently match zero tests instead of erroring.
// 2. For the debug variant to actually stop at breakpoints inside the test
//    file, the debugged Node process must be the SAME process that runs
//    vitest — spawning `vp` as a child process (e.g. via child_process.spawn)
//    would only let the debugger see this wrapper, not the test code. So
//    instead of spawning, this mutates process.argv and dynamically imports
//    vite-plus's own CLI entry point, running it in this same process.
import { fileURLToPath } from 'node:url';

const [symbol, file] = process.argv.slice(2);
if (!symbol || !file) {
  console.error('usage: zed-run-test.mjs <symbol> <file>');
  process.exit(1);
}

const escapedSymbol = symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

process.argv = [
  process.argv[0],
  process.argv[1],
  'test',
  'run',
  '--no-file-parallelism',
  '--pool=threads',
  '--hideSkippedTests',
  '-t',
  escapedSymbol,
  file,
];

const vpBin = fileURLToPath(
  new URL('../node_modules/vite-plus/bin/vp', import.meta.url)
);
await import(vpBin);
