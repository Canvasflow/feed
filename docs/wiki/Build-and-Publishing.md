# Build & Publishing

How `@canvasflow/feed` is built, published to GitHub Packages, and how this wiki is synced.

← Back to [Home](Home.md) · Related: [Getting Started](Getting-Started.md) · [Testing](Testing.md)

## Build

```bash
npm run build      # vp pack → dist/
```

The build is configured under the `pack` key in [`vite.config.ts`](https://github.com/canvasflow/feed/blob/main/vite.config.ts):

- `entry: ['src/index.ts']` — the single public entry point.
- `format: ['esm']` — **ESM only**.
- `dts: true` — emit TypeScript declarations (`dist/index.d.mts`).
- `unbundle: true` — emit unbundled, per-module output mirroring `src/`.
- `clean: true` — wipe `dist/` first.

Only `dist/` is published (`files` in `package.json`). The package exposes `./dist/index.mjs` (module/main) and `./dist/index.d.mts` (types).

## CI

Every PR and push to `main`, `develop`, or `feature/**` triggers the **🔍 CI** workflow ([`.github/workflows/ci.yml`](https://github.com/canvasflow/feed/blob/main/.github/workflows/ci.yml)):

| Job                      | What it does                                                      |
| ------------------------ | ----------------------------------------------------------------- |
| **🧹 Lint**              | `npm run lint` — ESLint via vite-plus                             |
| **📦 Package quality**   | `npm run build` → `publint` → `attw --pack .` → size budget check |
| **🧪 Test (Node 22/24)** | `npm run coverage` on each Node version in the support matrix     |

This workflow must pass before merging. Failures catch lint errors, packaging regressions, and test failures on the full Node matrix — not just at release time.

## Publishing

Publishing is automated by the **🚀 Publish** workflow ([`.github/workflows/publish.yml`](https://github.com/canvasflow/feed/blob/main/.github/workflows/publish.yml)), triggered when a `v*` tag is pushed.

| Job                      | Trigger                                | What it does                                                                                                                                                                               |
| ------------------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **🧪 Test (Node 22/24)** | push of a `v*` tag                     | `npm ci`, `npm run lint`, `npm run build`, then `npm run coverage` and append a coverage summary to the run summary.                                                                       |
| **🚀 Publish**           | after Test                             | `npm ci` → `npm run build` → `check:publint`/`check:attw`/`check:size` → `npm pack --dry-run` → `npm publish` to GitHub Packages (`@canvasflow` scope), authenticated with `GITHUB_TOKEN`. |
| **📝 Update CHANGELOG**  | after Publish                          | Diffs against the previous semver tag, runs `scripts/update-changelog.mjs`, and pushes a `docs(changelog): add vX.Y.Z release notes` commit to `develop` — a no-op if nothing changed.     |
| **📚 Sync Wiki**         | push of a `v*` tag, or manual dispatch | Mirror `docs/wiki/` into the repository's GitHub Wiki — independent of the other jobs, so it still runs even if `test`/`release`/`changelog` fail.                                         |

Consult [`publish.yml`](https://github.com/canvasflow/feed/blob/main/.github/workflows/publish.yml) directly for the exact, current flags and permissions of each step.

### Releasing

1. Land changes on `main` (in practice via `git flow`: a `hotfix/X.Y.Z` branch is finished into both `main` and `develop` before tagging).
2. Bump the version (`package.json`/`package-lock.json`) and refresh `CHANGELOG.md` (`npm run changelog`) as part of that branch, so the tagged commit on `main` already has both.
3. Tag the resulting commit on `main` as `vX.Y.Z` and push the tag — the Publish workflow tests, builds, publishes, appends the release's CHANGELOG section to `develop` (idempotent if step 2 already covered it), and syncs the wiki.

## Wiki sync

The **Sync Wiki** job mirrors the Markdown in [`docs/wiki/`](.) into the repo's GitHub Wiki. It:

- runs on push of a `v*` tag, independently of the test/publish jobs;
- clones the wiki Git repo (or initializes it if the wiki has never been created — the **Wikis** feature must be enabled in _Settings → Features_);
- `rsync`s `docs/wiki/` into the wiki root with `--delete`, so pages removed from source are removed from the wiki;
- strips the `.md` suffix from links between sibling wiki pages (leaving repo-relative `../../…` and absolute `https://…` links untouched), then commits and pushes to the wiki's `master` branch.

Because of that link rewriting, write internal links as `[Page](Page.md)` — they work in-repo and resolve correctly once published.

### Authoring conventions

- One page per file; the filename (with spaces as hyphens) is the wiki page title, e.g. `Getting-Started.md` → _Getting Started_.
- `Home.md` is the landing page; `_Sidebar.md` is the navigation sidebar.
- Link sibling pages with the `.md` suffix; link repo files with `../../` relative paths.
