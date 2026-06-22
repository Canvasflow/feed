# Testing

Tests run on **Vitest** via the Vite+ runner (`vp test`). Configuration is in [`vite.config.ts`](../../vite.config.ts) under the `test` key.

← Back to [Home](Home.md) · Related: [Contributing](Contributing.md) · [Build & Publishing](Build-and-Publishing.md)

## Layout

Tests are colocated with the code they cover as `*.test.ts`:

```
src/
├── rss/RSSFeed.test.ts
├── component/HTMLMapper.test.ts
├── component/Component.test.ts
├── component/mapping/Mapping.test.ts
├── component/node/Node.test.ts
└── component/schema/Schema.test.ts
```

`setupFiles` runs [`src/setupTests.ts`](../../src/setupTests.ts), which exposes `process.env.SUPPORT_PATH` and `process.env.FEEDS_PATH` so tests read fixtures (under `src/support/`) without hardcoded paths.

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
npx vitest run src/rss/RSSFeed.test.ts
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

> `integration` and `recipe` are skipped in `vite.config.ts` because they make network requests. Tag new tests appropriately: `unit` for isolated logic, `rss` for feed parsing, `html` for component conversion.

## Coverage thresholds

Coverage uses the **v8** provider and is gated by thresholds in `vite.config.ts`; `npm run coverage` fails if any drops below:

| Metric     | Minimum |
| ---------- | ------- |
| Statements | 95%     |
| Branches   | 88%     |
| Functions  | 99%     |
| Lines      | 97%     |

`src/index.ts`, config files, and `*.d.ts` are excluded from coverage.

## The gate

CI (and good practice before a PR) runs:

```bash
npm run lint && npm run coverage
```

See [Contributing](Contributing.md).
