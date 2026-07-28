/**
 * XML boundary narrowing helpers.
 *
 * `fast-xml-parser` output is dynamically shaped: a tag value can be a plain
 * string, a number, `undefined`, or a `{ '#text': T, '@_attr': V, … }` wrapper
 * object when attributes are present.  These helpers extract typed values from
 * that raw output so the rest of the library stays free of `as` casts.
 *
 * All `as` type assertions confined to this module are justified:
 *   - `val as Record<string, unknown>` in `recordOf` follows a runtime
 *     `typeof val === 'object'` check — the assertion only widens to a safe
 *     structural type, never lying about the runtime shape.
 */

/**
 * Extract a string from a plain string, a number, or a `{ '#text'?: unknown }`
 * attribute-wrapper object.  Returns `undefined` when the value carries no
 * usable text.
 */
export function textOf(val: unknown): string | undefined {
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (val !== null && typeof val === 'object') {
    const text = (val as Record<string, unknown>)['#text'];
    if (typeof text === 'string') return text;
    if (typeof text === 'number') return String(text);
  }
  return undefined;
}

/**
 * Safely narrow `val` to a `Record<string, unknown>`.
 * Returns `undefined` when `val` is not a non-null, non-array object.
 */
export function recordOf(val: unknown): Record<string, unknown> | undefined {
  if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
    return val as Record<string, unknown>;
  }
  return undefined;
}
