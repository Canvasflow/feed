# Recommendations

A review of `@canvasflow/feed` (v1.15.8), with recommendations grouped by
category and ordered within each category by importance. Categories themselves
are ordered roughly by impact/risk.

> This list shows only the **outstanding** items. Recommendations that have been
> implemented (publish-pipeline registry pinning, lint/build gating, the Node
> test matrix, the documentation-accuracy fixes) and the coverage-threshold
> enforcement check (verified gating CI) have been removed.

---

## 1. CI/CD & Release Safety

1. **No CI on pull requests or pushes.** The only workflow
   (`.github/workflows/publish.yml`) triggers exclusively on `v*` tags. Tests,
   lint, and build never run on PRs or on pushes to `main`/`develop`, so broken
   code can merge undetected and only fails at release time. Add a `ci.yml` that
   runs on `pull_request` and `push` executing `lint`, `build`, and `coverage`.

## 2. Project Governance & Metadata

1. **No LICENSE file.** Publishing a package with no license is a legal blocker
   for consumers. Add one (and a `"license"` field in `package.json`, which is
   currently absent).
2. **No dependency automation.** There's no `dependabot.yml` or Renovate config.
   For a library with several parsing/sanitization dependencies
   (`sanitize-html`, `fast-xml-parser`, `linkedom`), automated security/version
   PRs are valuable. Add Dependabot.
3. **No `SECURITY.md` / `CONTRIBUTING.md` at repo root.** Contribution guidance
   lives in `docs/wiki/Contributing.md`, but a root `SECURITY.md` (this package
   parses untrusted HTML/XML) and a discoverable contributing pointer are worth
   adding.

## 3. Code Quality & Type Safety

1. **Large, monolithic modules.** `src/component/mapping/Mapping.ts` is ~2,546
   lines and `HTMLMapper.test.ts` ~3,830 lines. These are hard to navigate and
   review. Consider splitting `Mapping.ts` along the lines it already hints at
   (`Mapping.embeds.ts`, `Mapping.utils.ts`, `Mapping.schema.ts`) and breaking
   the test file by component family.
2. **`any` escape hatches.** There are `no-explicit-any` eslint-disables in
   `RSSFeed.ts:34` and `HTMLMapper.ts` (lines 96, 112, 116). Since `zod` is
   already a dependency, prefer schema-validated/narrowed types at these
   parser boundaries instead of `any`.

---

_Generated 2026-06-22 against branch `feature/improvements`; updated to drop
implemented items._
