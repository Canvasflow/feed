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

## Test layers

The suite has five layers. Use the right layer for each kind of assertion — they are complementary, not substitutes.

| Layer | What it does | How to run | Files |
|---|---|---|---|
| **Unit** | Isolated logic for a single function or converter. Fast, no I/O. | `vp test --tags-filter=unit` | `*.test.ts` (most files) |
| **No-throw / fuzz** | Seeded-PRNG corpus asserting that arbitrary strings never throw. Catches structural crashes before they reach CI. | `vp test --tags-filter=unit` (fuzz tests are tagged `unit`) | `*.fuzz.test.ts` |
| **Snapshot** | Full-pipeline characterisation: every fixture file snapshotted so any output change is a visible diff. | `npm test` | `rss-feed.snapshot.test.ts`, `html-mapper.snapshot.test.ts` |
| **Integration (offline)** | Recipe extraction and similar cross-module flows driven by stored HTML fixtures under `src/support/http/` — no network required. | `npm test` (or `vp test --tags-filter=recipe`) | `rss-feed.test.ts` (Recipe describe), `recipe.test.ts` |
| **Live** (opt-in) | True end-to-end tests against real publisher URLs. Not run in normal CI. Enable by passing `skip: false` for the `integration` tag in `vite.config.ts` and running with `--tags-filter=integration`. | Manual only | Any test tagged `integration` |

### Adding a new test

1. **Bug or feature** — write a unit test in the nearest `__tests__/` sibling. Tag it `unit` (and `rss`/`html` as appropriate).
2. **New fixture** — use `node scripts/add-fixture.mjs <url-or-path>` to fetch or copy a feed into `src/support/feeds/`, then run `npm test -- --update-snapshot` to add it to the snapshot baseline.
3. **New network-dependent flow** — store a representative HTML response in `src/support/http/`, stub `fetch` via `getRecipeFromUrl`/`getHtmlContent`'s injected-fetch option (see `recipe.ts`), and tag the test `unit` (not `integration`).

### Snapshot review discipline

A snapshot diff is a **question**, not a failure. When a snapshot changes:
1. Read the diff — understand what output changed and why.
2. If the change is intentional (parser upgrade, bug fix, new field): update with `npm test -- --update-snapshot`.
3. If the change is unintentional: that is a regression — fix the code, not the snapshot.

Never blindly accept snapshot updates without reading the diff.

### Fixture curation

- RSS feeds live in `src/support/feeds/*.rss`; HTML fixtures for `toComponents` testing live in `src/support/feeds/*.html` and `src/support/html/*.html`.
- HTTP response fixtures (for offline recipe/integration tests) live in `src/support/http/`.
- Strip any personally identifying information or auth tokens before committing a fixture.
- Run `npm test -- --update-snapshot` after adding a fixture to establish the baseline.
