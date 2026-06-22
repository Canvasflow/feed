# Recommendations

A review of `@canvasflow/feed` (v1.15.8), with recommendations grouped by
category and ordered within each category by importance. Categories themselves
are ordered roughly by impact/risk.

> This list shows only the **outstanding** items. Recommendations that have been
> implemented (publish-pipeline registry pinning, lint/build gating, the Node
> test matrix, the documentation-accuracy fixes, removal of the HTMLMapper
> `any` casts, Dependabot dependency automation, root `SECURITY.md` /
> `CONTRIBUTING.md`) and the coverage-threshold enforcement check (verified
> gating CI) have been removed. The LICENSE recommendation was dropped: this
> library is internal-only.

---

## 1. CI/CD & Release Safety

1. **No CI on pull requests or pushes.** The only workflow
   (`.github/workflows/publish.yml`) triggers exclusively on `v*` tags. Tests,
   lint, and build never run on PRs or on pushes to `main`/`develop`, so broken
   code can merge undetected and only fails at release time. Add a `ci.yml` that
   runs on `pull_request` and `push` executing `lint`, `build`, and `coverage`.

## 2. Code Quality & Type Safety

1. **Large, monolithic modules.** `src/component/mapping/Mapping.ts` is ~2,546
   lines and `HTMLMapper.test.ts` ~3,830 lines. These are hard to navigate and
   review. Consider splitting `Mapping.ts` along the lines it already hints at
   (`Mapping.embeds.ts`, `Mapping.utils.ts`, `Mapping.schema.ts`) and breaking
   the test file by component family.
2. **`ParsedXml` boundary still uses `any`.** The `HTMLMapper` `any` casts were
   removed, but `RSSFeed`'s `ParsedXml` (raw `fast-xml-parser` output) remains
   `Record<string, any>` because `build()` reads its leaf values loosely as
   strings/numbers/objects/arrays. Properly removing it means zod-validating the
   parsed feed into a typed structure — a larger refactor left for later.

---

_Generated 2026-06-22 against branch `feature/improvements`; updated to drop
implemented items._
