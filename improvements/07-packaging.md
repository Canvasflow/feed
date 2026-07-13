# 07 — Packaging, Publishing & DX

## Completion checklist

- [ ] `publint` and `@arethetypeswrong/cli` pass and run in CI on every PR (not just on tag).
- [ ] `"sideEffects": false` is declared (after verifying no module has import-time side effects) so consumers' bundlers can tree-shake.
- [ ] `package.json` metadata is exports-first: `exports` is the single source of truth; legacy `main`/`module`/`types` either removed or kept deliberately with a comment/ADR (they currently duplicate `exports`).
- [ ] CI runs tests on PRs/pushes to `develop` — today the full test job only runs on `v*` tag push, i.e. *after* the release decision.
- [ ] A size budget (`size-limit` or `npm pack` byte check) is enforced in CI, with the current baseline recorded.
- [ ] npm provenance (`npm publish --provenance`) is enabled in the publish workflow.
- [ ] A `CHANGELOG`-visible deprecation/versioning policy exists (what constitutes breaking for types, error strings, component output shapes).
- [ ] `README.md` / wiki install docs cover consumer setup for GitHub Packages registry auth, minimal usage, and the support matrix (Node ≥ 20.19.2, ESM-only) — verified against a scratch consumer project.

## Overview

Packaging is already above average: ESM with `.mjs`/`.d.mts`, an `exports`
map, `files: ["dist"]`, engines pinned, a tag-triggered publish pipeline with
a Node matrix, changelog + wiki automation. The remaining work is mostly
verification and guardrails — cheap to add, and they permanently prevent the
class of "package looks fine locally, breaks in the consumer" bugs:

- **Nothing validates the published artifact.** `vp pack` output is assumed
  correct; `publint` (packaging mistakes) and `arethetypeswrong` (type
  resolution under every module setting) verify it mechanically.
- **Tree-shaking is off the table** without `sideEffects: false` — for a
  library whose consumers may bundle for serverless, this matters; it also
  pairs with 01's size goals.
- **CI ordering:** the test matrix runs only on `v*` tags — a broken commit is
  discovered while releasing. PR-triggered CI moves the failure earlier.
- **Supply-chain posture:** GitHub Packages + `GITHUB_TOKEN` is fine, but
  `--provenance` attestation is nearly free and customers consuming a
  self-service library may care.
- **DX for the second consumer:** since customers self-serve, treat "new
  consumer onboarding" as a tested artifact — a scratch project that installs
  the tarball and compiles under `moduleResolution: node16` + `bundler`.

## Files to review

- `package.json` — `exports` vs `main`/`module`/`types` duplication, missing `sideEffects`, `publishConfig`, `overrides` (audit whether the vite/vitest overrides are still needed as vite-plus evolves), `license` field (currently **absent** — check and fix; SECURITY.md exists but no LICENSE file)
- `.github/workflows/publish.yml` — trigger conditions, missing PR workflow, provenance, `npm pack --dry-run` step (good — extend it)
- `vite.config.ts` — `pack` options (`unbundle: true` — verify what that means for the published file tree and deep-import exposure)
- `.github/dependabot.yml` — grouping/cadence
- `README.md`, `docs/wiki/Getting-Started.md`, `docs/wiki/Build-and-Publishing.md`
- `dist/` after a build — actually read the emitted `.mjs` + `.d.mts` once
- `.node-version`, `engines`, workflow `NODE_VERSION` (24.14.1) — keep aligned

## Resources

**Articles / blog posts**

- publint: <https://publint.dev> (paste the packed tarball; also the CLI docs)
- Are The Types Wrong: <https://arethetypeswrong.github.io> + CLI README
- "Ship ESM & CJS in a single package" (Anthony Fu) — even though you're ESM-only, the pitfalls list is the canonical reference: <https://antfu.me/posts/publish-esm-and-cjs>
- Node.js docs — *Packages* (`exports`, conditions, dual-package hazard): <https://nodejs.org/api/packages.html>
- webpack docs on `sideEffects`: <https://webpack.js.org/guides/tree-shaking/>
- npm provenance / SLSA: <https://docs.npmjs.com/generating-provenance-statements> (verify GitHub Packages support status when implementing)
- size-limit: <https://github.com/ai/size-limit>
- "Semantic Versioning for TypeScript types" (the `semver-ts` spec used by Ember): <https://www.semver-ts.org> — directly answers "is a type change breaking?"

**Videos**

- Anthony Fu — ViteConf/JSNation talks on modern package publishing
- "Publishing JavaScript packages the right way" (any recent talk covering exports maps + attw)

**Books**

- No book needed here; the Node *Packages* doc + semver-ts are the canonical texts. (*Software Engineering at Google*, ch. on "Dependency Management", is good background for the versioning-policy discussion.)

## Study guide

1. **Exports resolution (½ day).** Read the Node Packages doc sections on
   `exports`, conditions order, and types condition placement. Then run
   `attw --pack .` and interpret every cell of its matrix (node10 / node16-cjs
   / node16-esm / bundler).
2. **Tree-shaking semantics (½ day).** Understand what counts as a side
   effect (top-level mutation, module-level caches?) — note
   `Mapping.utils.ts` has module-level caches: confirm they are
   initialization-only and safe under `sideEffects: false`.
3. **semver-ts (½ day).** Read the spec's "what is breaking" tables; draft
   this repo's policy (component output shapes and issue codes are API too —
   coordinate with 03/04).
4. **Scratch consumer (½ day).** Create a throwaway project outside the repo,
   `npm pack` this library, install the tarball, and compile a usage sample
   under `"moduleResolution": "node16"` and `"bundler"`, plus run under plain
   `node`. Script what you learn (step 5 below).

## Actionable plan

1. **Add a PR/`develop` CI workflow** (lint + typecheck + test + build on the
   Node matrix); keep the tag workflow for publishing only (it can `needs` the
   same reusable workflow).
2. **Wire `publint` + `attw`** into that CI (`npx publint` and
   `npx @arethetypeswrong/cli --pack .` after `npm run build`). Fix whatever
   they report (likely: `main`/`module`/`types` duplication warnings).
3. **Declare `sideEffects: false`** after the study-guide audit; add a bundle
   test (esbuild a sample import of one export and assert unrelated modules
   are shaken — a 20-line script).
4. **Add a LICENSE file** and `license` field (decide: proprietary/UNLICENSED
   vs OSS — currently ambiguous, which is a real problem for a
   customer-consumed package).
5. **Size budget:** `size-limit` (or a raw `npm pack --json` byte assertion)
   with the current baseline; ratchet it down as 01 lands.
6. **Provenance:** add `--provenance` (plus `id-token: write` permission) to
   the publish job if supported for GitHub Packages at implementation time;
   otherwise record in an ADR and revisit.
7. **Consumer smoke test in CI:** script the scratch-consumer check
   (`scripts/smoke-consumer.mjs`): pack → install into a temp dir → `node`
   run + `tsc` compile under two moduleResolution modes. This is the test
   that would have caught most historical packaging breakages in any library.
8. **Write the versioning policy** (semver-ts-informed) into
   `CONTRIBUTING.md`/wiki: what's breaking (exported types, issue codes,
   component shapes, default mapping table), and how deprecations are
   announced in `CHANGELOG.md`.
9. **Housekeeping:** align `.node-version`/`engines`/workflow Node versions;
   audit `overrides` in `package.json` (document why each exists, drop stale
   ones); add `repository.directory`/`homepage` fields if useful for
   consumers.
