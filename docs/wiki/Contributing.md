# Contributing

Conventions for making changes in `@canvasflow/feed`.

← Back to [Home](Home.md) · Related: [Testing](Testing.md) · [Build & Publishing](Build-and-Publishing.md)

## Before you finish — the gate

Run the checks before opening a PR:

```bash
npm run lint && npm run coverage
```

Coverage is threshold-gated (see [Testing](Testing.md)). A pre-commit hook also formats, lints, and runs the suite on staged files.

## Coding style

Formatting is enforced by Vite+ (`vp fmt`), configured under `fmt` in [`vite.config.ts`](../../vite.config.ts):

- `semi: true`, `singleQuote: true`, `trailingComma: 'es5'`, `printWidth: 80`.
- `npm run lint` (and `npm run lint:fix`) lint the source; `npm run format` formats the project.

Match the surrounding code: existing naming (`*Component`, `is*Component`, `Mapping.*` modules), the import style, and comment density.

## Architectural guidelines

- Keep the library **pure**: no I/O beyond the explicit `fetch` helpers on `RSSFeed`.
- Don't throw for malformed input — accumulate `errors`/`warnings` so one bad element never aborts a conversion. See [Architecture](Architecture.md).
- Reuse the Zod schemas in `mapping/Mapping.schema.ts` for validation rather than re-deriving shapes.
- Keep `Mapping.ts` for the recursive detection engine; put leaf concerns (constants, pure utilities, embeds) in the sibling `Mapping.*` modules and re-export them so the public API is unchanged.
- Add type guards (`is*Component`) alongside new component kinds in `Component.ts`.

## Tests

Add or update tests next to the code (`*.test.ts`) and tag them (`unit`, `rss`, `html`). Use the fixtures under `src/support/` rather than inlining large payloads. See [Testing](Testing.md).

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/), enforced by **commitlint**:

```
type(scope): subject
```

- `type` ∈ `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, … ; `scope` optional.
- Interactive helper: `npm run commit` (commitizen).

## Updating docs & this wiki

The deep references live in [`docs/`](../../docs) (`HTML.md`, `Mappings.md`, `RSS.md`) and the onboarding pages live in [`docs/wiki/`](.). When you change behaviour, update the relevant page **in the same PR** — if code and docs disagree, the code wins. The wiki is published automatically on release; see [Build & Publishing](Build-and-Publishing.md).
