# Contributing

Thanks for working on `@canvasflow/feed`. This page is a quick pointer; the full
guide lives on the [Contributing wiki page](https://github.com/Canvasflow/feed/wiki/Contributing).

## Quick start

```bash
npm install            # install dependencies
npm run build          # vp pack → dist/
npm test               # run the suite once
npm run lint           # lint the source
npm run coverage       # tests + threshold-gated coverage report
```

## Before you open a PR — the gate

```bash
npm run lint && npm run coverage
```

Coverage is threshold-gated (statements 95 / branches 88 / functions 99 /
lines 97). A pre-commit hook also formats, lints, and runs the suite on staged
files. Update tests (`*.test.ts`, tagged `unit` / `rss` / `html`) and any
affected [wiki docs](https://github.com/Canvasflow/feed/wiki) in the same PR.

## Coding style

Formatting and linting are enforced by Vite+ (`vp fmt` / `vp lint`), configured
under `fmt` in [`vite.config.ts`](./vite.config.ts): `semi`, `singleQuote`,
`trailingComma: 'es5'`, `printWidth: 80`. Match the surrounding code — existing
naming (`*Component`, `is*Component`, `Mapping.*` modules), import style, and
comment density.

## Architectural guidelines

- Keep the library **pure**: no I/O beyond the explicit `fetch` helpers on
  `RSSFeed`.
- Don't throw for malformed input — accumulate `errors` / `warnings` so one bad
  element never aborts a conversion.
- Reuse the Zod schemas in `mapping/Mapping.schema.ts` rather than re-deriving
  shapes, and add type guards (`is*Component`) alongside new component kinds.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/) (`type(scope):
subject`), enforced by **commitlint**. Interactive helper: `npm run commit`.

See the [Contributing wiki page](https://github.com/Canvasflow/feed/wiki/Contributing)
for the complete conventions.
