# ADR-0005: Keep `luxon` wrapped behind `parseDate()`

**Status:** Accepted
**Date:** 2026-07-24

## Context

`luxon` is used in `rss-feed.ts` solely to parse feed date strings and convert
them to ISO 8601. The original function tried RFC 2822 first (the format
mandated by the RSS 2.0 spec), then ISO 8601, then fell back to `new Date` as
a last resort — all with `setZone: true` so the original timezone offset is
preserved in the output.

During the dependency-diet review, `luxon` was flagged as the highest-weight
dependency after `zod` at ≈4.5 MB unpacked. The improvement plan called for
replacing it with a hand-rolled ~60-line RFC 2822 / ISO 8601 parser.

However, the date strings observed across the 30 fixture feeds cover a wider
surface than the plan anticipated:

- RFC 2822 with numeric offsets: `Fri, 04 Apr 2025 11:29:23 +0000`,
  `Fri, 06 Jun 2025 06:30:00 -0400`, `Fri, 16 May 2025 05:01:02 +0100`
- RFC 2822 with the named zone `GMT`: `Tue, 30 Sep 2025 09:58:53 GMT`
- ISO 8601 with `Z` suffix and milliseconds: `2024-03-04T16:54:01.381Z`
- ISO 8601 with `+0000` offset (not `Z`): `2025-05-19T16:00:00+0000`
- ISO 8601 with fractional seconds: `2026-02-05T11:36:34.843Z`

RFC 2822 alone has a non-trivial grammar: two-digit years, obsolete named
timezone abbreviations (`EST`, `EDT`, `CST`, `CDT`, `MST`, `MDT`, `PST`,
`PDT`, `UT`, `GMT`), optional day-of-week prefix, optional seconds. A
hand-rolled parser that covers only the formats seen today would silently fail
on formats seen from new publishers tomorrow. luxon's `fromRFC2822` and
`fromISO` absorb that edge-case maintenance.

The decision at this point mirrors the rationale for `he` (see ADR-0003):
the value of removing the dependency is real but not urgent enough to justify
owning a correct, tested RFC 2822 parser now.

## Decision

**Keep `luxon`.** Move the `parseDate` function from `rss-feed.ts` into
`src/rss/date.ts` and export it. The function's return type changes from
`DateTime` (a luxon type that leaked into the call sites) to `string | null`
(the ISO string on success, `null` on failure), so callers no longer import
or reference luxon at all.

All three call sites in `rss-feed.ts` are updated to use the `string | null`
API, eliminating the `.isValid` / `.toISO()` pattern from the calling code.

## Consequences

**Positive**

- ✅ `luxon` is imported in exactly one file (`date.ts`). No other module
  references it.
- ✅ The return type `string | null` is a cleaner seam than `DateTime` — a
  future replacement only needs to produce an ISO string, not a luxon object.
- ✅ `src/rss/__tests__/date.test.ts` covers RFC 2822 with numeric and named
  offsets, ISO 8601 with `Z`/milliseconds/`+0000`, invalid input, and empty
  string — directly from the formats seen in the real fixture feeds.
- ✅ The three call sites in `rss-feed.ts` are simpler: `parseDate(str) ??
  undefined` replaces the `DateTime` dance.

**Negative / Trade-offs**

- ⚠️ `luxon` remains a runtime dependency at ≈4.5 MB unpacked.
- ⚠️ The hand-rolled replacement is still the right long-term goal if install
  size becomes a concern; the seam is now in place to make it a one-file
  change with tests already written.
