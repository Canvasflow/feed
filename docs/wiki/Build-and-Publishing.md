# Build & Publishing

How `@canvasflow/feed` is built, published to GitHub Packages, and how this wiki is synced.

← Back to [Home](Home.md) · Related: [Getting Started](Getting-Started.md) · [Testing](Testing.md)

## Build

```bash
npm run build      # vp pack → dist/
```

The build is configured under the `pack` key in [`vite.config.ts`](../../vite.config.ts):

- `entry: ['src/index.ts']` — the single public entry point.
- `format: ['esm']` — **ESM only**.
- `dts: true` — emit TypeScript declarations (`dist/index.d.mts`).
- `unbundle: true` — emit unbundled, per-module output mirroring `src/`.
- `clean: true` — wipe `dist/` first.

Only `dist/` is published (`files` in `package.json`). The package exposes `./dist/index.mjs` (module/main) and `./dist/index.d.mts` (types).

## Publishing

Publishing is automated by the **🚀 Publish** workflow ([`.github/workflows/publish.yml`](../../.github/workflows/publish.yml)), triggered when a `v*` tag is pushed.

| Job | Trigger | What it does |
| --- | --- | --- |
| **🧪 Test** | push of a `v*` tag | `npm ci`, then `npm run coverage` and append a coverage summary to the run summary. |
| **🚀 Publish** | after Test | `npm ci` → `npm run build` → `npm pack --dry-run` → `npm publish` to GitHub Packages (`@canvasflow` scope). |
| **📚 Sync Wiki** | push of a `v*` tag | Mirror `docs/wiki/` into the repository's GitHub Wiki (independent of the other jobs). |

### Releasing

1. Land changes on `main`.
2. Bump the version (`package.json`) and update `CHANGELOG.md` (`npm run changelog`).
3. Tag a release `vX.Y.Z` and push the tag — the Publish workflow tests, builds, publishes, and syncs the wiki.

## Wiki sync

The **Sync Wiki** job mirrors the Markdown in [`docs/wiki/`](.) into the repo's GitHub Wiki. It:

- runs on push of a `v*` tag, independently of the test/publish jobs;
- clones the wiki Git repo (or initializes it if the wiki has never been created — the **Wikis** feature must be enabled in *Settings → Features*);
- `rsync`s `docs/wiki/` into the wiki root with `--delete`, so pages removed from source are removed from the wiki;
- strips the `.md` suffix from links between sibling wiki pages (leaving repo-relative `../../…` and absolute `https://…` links untouched), then commits and pushes to the wiki's `master` branch.

Because of that link rewriting, write internal links as `[Page](Page.md)` — they work in-repo and resolve correctly once published.

### Authoring conventions

- One page per file; the filename (with spaces as hyphens) is the wiki page title, e.g. `Getting-Started.md` → *Getting Started*.
- `Home.md` is the landing page; `_Sidebar.md` is the navigation sidebar.
- Link sibling pages with the `.md` suffix; link repo files with `../../` relative paths.
