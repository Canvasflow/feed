import { DateTime } from 'luxon';

/**
 * Parse a feed date string (RFC 2822 or ISO 8601) and return an ISO 8601
 * string preserving the original timezone offset, or `null` when the input
 * cannot be parsed.
 *
 * Tries RFC 2822 first (the format mandated by the RSS 2.0 spec), then ISO
 * 8601, then falls back to `new Date` for non-standard strings that real
 * publishers emit. All three paths use luxon so the timezone offset is
 * preserved — `Date.toISOString()` would silently convert everything to UTC.
 *
 * Abstracted here so the call site is a single seam: if luxon is ever
 * replaced, only this file changes.
 */
export function parseDate(str: string): string | null {
  let dt = DateTime.fromRFC2822(str, { setZone: true });
  if (dt.isValid) return dt.toISO();

  dt = DateTime.fromISO(str, { setZone: true });
  if (dt.isValid) return dt.toISO();

  dt = DateTime.fromJSDate(new Date(str), { zone: 'utc' });
  if (dt.isValid) return dt.toISO();

  return null;
}
