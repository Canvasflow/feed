import he from 'he';

/**
 * Decode HTML entities in a plain-text string (titles, descriptions, etc.).
 * Delegates to `he` which covers the full HTML5 named-character-reference
 * table — a hand-rolled table would silently mis-render the long tail of
 * named entities that appear in real publisher feeds.
 *
 * Abstracted here so the call site is a single seam: if `he` is ever
 * replaced, only this file changes.
 */
export function decodeEntities(value: string): string {
  return he.decode(value);
}
