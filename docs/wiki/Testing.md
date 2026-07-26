# Testing

Tests run on **Vitest** via the Vite+ runner (`vp test`). Configuration is in [`vite.config.ts`](https://github.com/canvasflow/feed/blob/main/vite.config.ts) under the `test` key.

← Back to [Home](Home.md) · Related: [Contributing](Contributing.md) · [Build & Publishing](Build-and-Publishing.md)

## Layout

Tests are colocated with the code they cover in a sibling `__tests__/` folder, as `*.test.ts`:

```
src/
├── rss/__tests__/rss-feed.test.ts
├── rss/__tests__/rss-feed.coverage.test.ts
├── component/__tests__/component.test.ts
├── component/html/__tests__/html-mapper.{text,embeds,media,table,container,mapping}.test.ts
├── component/html/__tests__/html-mapper.coverage.test.ts
├── component/mapping/__tests__/mapping.test.ts
├── component/mapping/__tests__/mapping.coverage.test.ts
├── component/node/__tests__/node-helpers.test.ts
└── component/schema/__tests__/recipe-schema.test.ts
```

> The large `HTMLMapper` suite is split into per-component-family files under
> `component/html/__tests__/` (text, embeds, media, table, container, mapping). The
> `*.coverage.test.ts` files target otherwise-uncovered branches. File names are
> kebab-case, enforced by `unicorn/filename-case` in `vite.config.ts` — see
> [ADR-0001](https://github.com/canvasflow/feed/blob/main/docs/adr/0001-kebab-case-naming-and-colocated-test-conventions.md).

`setupFiles` runs [`src/setup-tests.ts`](https://github.com/canvasflow/feed/blob/main/src/setup-tests.ts), which exposes `process.env.SUPPORT_PATH` and `process.env.FEEDS_PATH` so tests read fixtures (under `src/support/`) without hardcoded paths.

## Running tests

| Command               | What it does                                                 |
| --------------------- | ------------------------------------------------------------ |
| `npm test`            | Run the full suite once (`vp test`).                         |
| `npm run test:debug`  | No timeout, no file parallelism (for debugging/breakpoints). |
| `npm run test:ui`     | Watch mode + interactive Vitest UI.                          |
| `npm run coverage`    | Run the suite with a v8 coverage report.                     |
| `npm run coverage:ui` | Coverage in watch mode + UI.                                 |

Run a single file:

```bash
npx vitest run src/rss/__tests__/rss-feed.test.ts
```

## Test tags

Tests are tagged via `{ tags: [...] }` in their Vitest options. The configured tags are:

| Tag           | Meaning                                                       |
| ------------- | ------------------------------------------------------------- |
| `unit`        | Isolated logic.                                               |
| `rss`         | Feed structure / XML / channel metadata.                      |
| `html`        | DOM → component conversion.                                   |
| `integration` | Cross-module / network tests — **skipped by default**.        |
| `recipe`      | JSON-LD recipe extraction (network) — **skipped by default**. |
| `todo`        | Incomplete / under development.                               |
| `broken`      | Known-failing, needs fixing.                                  |

The UI scripts filter on a tag, e.g. `npm run test:unit`, `npm run test:integration`, `npm run test:todo`, `npm run test:broken`.

> `integration` and `recipe` are skipped in `vite.config.ts` because they make
> network requests. Tag new tests appropriately: `unit` for isolated logic,
> `rss` for feed parsing, `html` for component conversion.

### Running the skipped tags

`integration` and `recipe` have `skip: true` in `vite.config.ts`, so a normal
`npm test` never runs them (they require network access).

`--tagsFilter` only **selects** which tests to consider — it does **not**
override a tag's `skip`. A test is skipped if _any_ of its tags is skipped, and
the network tests are tagged `['integration', 'recipe']`. So `npm run
test:integration` (which just adds `--tags-filter=integration`) still reports
them as skipped.

To actually run them, flip `skip: true` → `false` for **both** tags in
`vite.config.ts`, then run the filter:

```ts
// vite.config.ts → test.tags
{ name: 'integration', /* … */ skip: false },
{ name: 'recipe',      /* … */ skip: false },
```

```bash
npx vp test --tags-filter=integration
```

## Coverage thresholds

Coverage uses the **v8** provider and is gated by thresholds in `vite.config.ts`; `npm run coverage` fails if any drops below:

| Metric     | Minimum |
| ---------- | ------- |
| Statements | 95%     |
| Branches   | 95%     |
| Functions  | 95%     |
| Lines      | 95%     |

`src/index.ts`, config files, and `*.d.ts` are excluded from coverage.

## The gate

CI (and good practice before a PR) runs:

```bash
npm run lint && npm run coverage
```

See [Contributing](Contributing.md).
