# Recommendations

A review of `@canvasflow/feed` (v1.15.8), with recommendations grouped by
category and ordered within each category by importance. Categories themselves
are ordered roughly by impact/risk.

> This list shows only the **outstanding** items. Recommendations that have been
> implemented (publish-pipeline registry pinning, lint/build gating, the Node
> test matrix, the documentation-accuracy fixes, removal of the HTMLMapper
> `any` casts, splitting `HTMLMapper.test.ts` into per-family modules, replacing
> `RSSFeed`'s `ParsedXml` `any` boundary with typed interfaces, Dependabot
> dependency automation, root `SECURITY.md` / `CONTRIBUTING.md`) and the
> coverage-threshold enforcement check (verified gating CI) have been removed.
> The LICENSE recommendation was dropped: this library is internal-only.

---

## 1. CI/CD & Release Safety

1. **No CI on pull requests or pushes.** The only workflow
   (`.github/workflows/publish.yml`) triggers exclusively on `v*` tags. Tests,
   lint, and build never run on PRs or on pushes to `main`/`develop`, so broken
   code can merge undetected and only fails at release time. Add a `ci.yml` that
   runs on `pull_request` and `push` executing `lint`, `build`, and `coverage`.

---

_Generated 2026-06-22 against branch `feature/improvements`; updated to drop
implemented items._
