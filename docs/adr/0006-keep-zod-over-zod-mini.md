# ADR-0006: Keep full `zod` over `zod/mini`

**Status:** Accepted
**Date:** 2026-07-24

## Context

`zod` (v4) is used in two capacities in this library:

1. **Config validation** — `mapping.schema.ts` validates consumer-supplied
   `Params` and `Mapping` objects at runtime via `ParamsSchema.safeParse()` /
   `MappingSchema.safeParse()`.
2. **Public type derivation** — every `ComponentType` interface in
   `component.ts` (`ImageComponent`, `GalleryComponent`,
   `ContainerComponent`, …) is `z.infer<typeof XSchema>`, and all of those
   `*Schema` objects are re-exported through `src/index.ts`. Consumers can
   call `.safeParse()` on them directly.

`zod/mini` is a subpath export of the same `zod` package that exposes a
functional API (`z.optional(z.string())` instead of `z.string().optional()`)
designed to let bundlers tree-shake the method-chaining API surface away.

The library is consumed **primarily on the backend** (Node.js, no bundler)
with **one known frontend use case**.

## Decision

**Keep full `zod`.** Do not migrate to `zod/mini` at this time.

### Rationale

**Backend (majority of consumers):** `zod/mini` provides zero benefit. Node.js
runs directly from `node_modules`; tree-shaking never applies. The install
weight is identical — `zod/mini` is a subpath of the same package, not a
smaller package.

**Frontend (one use case):** The tree-shaking benefit is real but conditional
on two things both being true simultaneously:

1. The frontend consumer bundles this library (Vite / webpack / Rollup).
2. The frontend code imports the exported zod schemas directly (e.g.
   `ImageComponentSchema.safeParse(...)`) rather than just consuming the
   typed output.

If the frontend only uses the component output and never imports the schemas,
the bundler gain is zero there too.

**Migration cost is non-trivial:**

- Every schema in `mapping.schema.ts` and `component.ts` must rewrite from
  method-chain to functional form — a mechanical but wide diff with real
  regression risk.
- `z.lazy` is used for recursive component types; `zod/mini`'s handling of
  recursive / lazy schemas must be verified against the current version
  (`4.4.3`) before committing, not assumed from the announcement post.
- All re-exported schema types are public API; a broken migration silently
  changes consumer type inference.

The seam work done for `he` and `luxon` (ADR-0003, ADR-0005) gave isolation
for free because those were internal call sites. Migrating to `zod/mini` is a
rewrite of the public schema layer for a benefit that is conditional on a
specific bundling scenario that may not apply to the one frontend consumer.

## Consequences

**Positive**

- ✅ No migration risk. The public `*Schema` exports keep their exact type
  and runtime shape.
- ✅ No `z.lazy` verification work required now.
- ✅ Backend consumers (the majority) are unaffected in install size either
  way.

**Negative / Trade-offs**

- ⚠️ Frontend consumers that bundle this library and import the zod schemas
  directly will carry the full method-chaining API surface in their bundle.
- ⚠️ Revisit if bundle size becomes a measured problem on the frontend side,
  or if the frontend use case expands to multiple consumers.
