# ADR-0008: Keep `validate()`/`build()` `async`

**Status:** Accepted
**Date:** 2026-07-25

## Context

`03-api-robustness.md` flags `RSSFeed.validate()` and `RSSFeed.build()` as an
API lie: both are declared `async` but contain no `await` — internally they
are fully synchronous. This forces every consumer into `Promise`/`await`
handling (or `.then()`) for no real asynchrony, and makes thrown errors land
as promise rejections instead of surfacing through the synchronous error
model the rest of Section 3 is building.

The documented alternative to converting them to sync is an ADR justifying
async, since the conversion is a breaking change: any consumer currently
doing `feed.validate().then(...)` or relying on microtask-deferred execution
(e.g. scheduling UI work after `await feed.build()` in a batch of promises)
would see different timing if these became plain synchronous calls returning
already-resolved values wrapped implicitly, or worse, a hard type change from
`Promise<RSS>` to `RSS` that fails to compile at every call site.

No consumer audit (the Study item in `03-api-robustness.md`) has been done
yet — we don't yet know whether `transformer` or the self-service project
depend on `validate()`/`build()` being awaitable in a `Promise.all([...])`
batch, chain `.then()`, or otherwise rely on the async signature. Shipping a
sync conversion without that audit risks a silent breaking change disguised
as a robustness fix.

## Decision

**Keep `validate()` and `build()` `async` for now.** No internal `await` is
added artificially — the methods remain synchronous in implementation, just
`Promise`-wrapped at the boundary, exactly as today.

This ADR intentionally defers, rather than closes, the underlying question.
Converting to sync remains the preferred end state (it is simpler, faster —
no microtask hop — and removes a category of "why do I need to await this"
support questions) and should happen in the same major version bump that
ships the full `FeedIssue` migration (see the "FeedIssue type" item in
Section 3), once the consumer audit is done. Bundling both breaking changes
into one major avoids asking consumers to absorb two separate migrations for
the same feature area.

## What this ADR does not cover

- The `validate()`-mutates-`this.data` coupling — fixed independently in the
  same commit series (`validateRSS`/`validateChannel`/`validateItem` no
  longer `delete` keys from the parsed input; `validate()` resets its
  accumulator arrays at the top of the method instead, making repeated calls
  idempotent without relying on mutation as a dedup mechanism).
- The consumer audit itself — still open, tracked as a Study item in
  `03-api-robustness.md`.

## Revisit when

- The consumer audit is complete and shows no dependency on the `Promise`
  signature (or documents exactly what needs to change), **and**
- The `FeedIssue` migration is scoped for its major version — do the sync
  conversion in the same release.
