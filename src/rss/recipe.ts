import { parseHTML } from 'linkedom';

import type { Recipe } from '../component/schema/recipe-schema';

/**
 * Network I/O extracted from `RSSFeed` (Section 3, "Network I/O extraction"):
 * a parsing library should not hide unbounded `fetch` calls behind its public
 * API. `RSSFeed.getRecipeFromUrl`/`getHtmlContent` remain as thin
 * backward-compatible wrappers around these functions.
 *
 * Every network-facing option is injectable so callers (and tests) never
 * need to touch `globalThis.fetch`.
 */
export interface FetchOptions {
  /** Defaults to `globalThis.fetch`, resolved at call time. */
  fetch?: typeof fetch;
  headers?: HeadersInit;
  /** Abort the request after this many milliseconds. Default: 10s. */
  timeoutMs?: number;
  /** Reject once the response body exceeds this many bytes. Default: 5MB. */
  maxBytes?: number;
}

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;

/**
 * Fetch `url` and return its body as text, with a timeout, a response-status
 * check, and a body-size cap.
 *
 * @param {string} url
 * @param {FetchOptions} [options]
 * @returns {Promise<string>}
 */
export async function getHtmlContent(
  url: string,
  options: FetchOptions = {}
): Promise<string> {
  const {
    fetch: fetchImpl = globalThis.fetch,
    headers,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxBytes = DEFAULT_MAX_BYTES,
  } = options;

  const response = await fetchImpl(url, {
    method: 'GET',
    headers,
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new Error(
      `Request to "${url}" failed with status ${response.status}`
    );
  }

  return readBodyCapped(response, maxBytes);
}

/**
 * Read a `Response` body as text, aborting once `maxBytes` is exceeded. Falls
 * back to `response.text()` when the response has no readable stream (e.g.
 * simplified fetch stubs in tests) — the cap only applies where a stream is
 * actually available to interrupt.
 *
 * @param {Response} response
 * @param {number} maxBytes
 * @returns {Promise<string>}
 */
async function readBodyCapped(
  response: Response,
  maxBytes: number
): Promise<string> {
  const body = response.body;
  /* v8 ignore next 3 -- real fetch responses always expose a body stream;
     this fallback only serves simplified test stubs. */
  if (!body || typeof body.getReader !== 'function') {
    return response.text();
  }

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let result = '';
  let received = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel();
      throw new Error(
        `Response body from "${response.url}" exceeded the ${maxBytes} byte limit`
      );
    }
    result += decoder.decode(value, { stream: true });
  }
  result += decoder.decode();
  return result;
}

/**
 * Fetch `url` and extract the first LD+JSON `Recipe` found in a
 * `<script type="application/ld+json">` block (top-level or nested in
 * `@graph`). Malformed JSON-LD blocks are skipped rather than thrown, since a
 * page may carry multiple LD+JSON scripts and only one needs to parse.
 *
 * @param {string} url
 * @param {FetchOptions} [options]
 * @returns {Promise<Recipe | null>}
 */
export async function getRecipeFromUrl(
  url: string,
  options: FetchOptions = {}
): Promise<Recipe | null> {
  const html = await getHtmlContent(url, options);
  const { document } = parseHTML(html);
  const scripts = document.querySelectorAll(
    'script[type="application/ld+json"]'
  );

  for (const element of scripts) {
    const content = element.textContent;
    if (!content) {
      continue;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      continue;
    }

    const recipe = findRecipe(parsed);
    if (recipe) {
      return recipe;
    }
  }

  return null;
}

function findRecipe(value: unknown): Recipe | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const node = value as { '@type'?: unknown; '@graph'?: unknown };

  if (node['@type'] === 'Recipe') {
    return value as Recipe;
  }

  if (Array.isArray(node['@graph'])) {
    for (const item of node['@graph']) {
      if (item && typeof item === 'object' && item['@type'] === 'Recipe') {
        return item as Recipe;
      }
    }
  }

  return null;
}
