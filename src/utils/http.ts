/**
 * Network I/O extracted from `RSSFeed` (Section 3, "Network I/O extraction"):
 * a parsing library should not hide unbounded `fetch` calls behind its public
 * API. `RSSFeed.getRecipeFromUrl`/`getHtmlContent` remain as thin
 * backward-compatible wrappers around these functions.
 *
 * Every network-facing option is injectable so callers (and tests) never
 * need to touch `globalThis.fetch`.
 *
 * Three flavors, from least to most validated:
 * - `fetchUrl` — status check + body cap only, no content-type opinion.
 * - `getHtml` — `fetchUrl` plus a `Content-Type: text/html` check.
 * - `getJson` — `fetchUrl` plus a `Content-Type: application/json` check,
 *   parsed for you.
 */
export interface FetchOptions {
  /** Defaults to `globalThis.fetch`, resolved at call time. */
  fetch?: typeof fetch | undefined;
  headers?: HeadersInit | undefined;
  /** Abort the request after this many milliseconds. Default: 10s. */
  timeoutMs?: number | undefined;
  /** Reject once the response body exceeds this many bytes. Default: 5MB. */
  maxBytes?: number | undefined;
}

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;

/**
 * Issues the actual `GET` (timeout + status check), shared by `fetchUrl`,
 * `getHtml`, and `getJson` — each only differs in what it does with the
 * `Response` afterward (return the raw body, validate+return it as HTML, or
 * validate+parse it as JSON).
 *
 * @param {string} url
 * @param {FetchOptions} options
 * @returns {Promise<Response>}
 */
async function fetchResponse(
  url: string,
  options: FetchOptions
): Promise<Response> {
  const {
    fetch: fetchImpl = globalThis.fetch,
    headers,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = options;

  const response = await fetchImpl(url, {
    method: 'GET',
    ...(headers ? { headers } : {}),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new Error(
      `Request to "${url}" failed with status ${response.status}`
    );
  }

  return response;
}

/**
 * Fetch `url` and return its body as text, with a timeout, a response-status
 * check, and a body-size cap — no validation of what the response actually
 * is, unlike `getHtml`/`getJson`. Use this when the caller doesn't know or
 * care about the content type ahead of time.
 *
 * @param {string} url
 * @param {FetchOptions} [options]
 * @returns {Promise<string>}
 */
export async function fetchUrl(
  url: string,
  options: FetchOptions = {}
): Promise<string> {
  const response = await fetchResponse(url, options);
  return readBodyCapped(response, options.maxBytes ?? DEFAULT_MAX_BYTES);
}

/**
 * Checks a `Content-Type` header value against an expected MIME type,
 * ignoring parameters (`; charset=utf-8`) and case.
 *
 * @param {string | null} contentType
 * @param {string} expected
 * @returns {boolean}
 */
function isContentType(contentType: string | null, expected: string): boolean {
  if (!contentType) return false;
  return contentType.split(';', 1)[0]!.trim().toLowerCase() === expected;
}

/**
 * Fetch `url` and return its body as text — same as `fetchUrl`, plus a
 * `Content-Type: text/html` check on the response. A 2xx response whose
 * `Content-Type` isn't HTML (a JSON API error page, a redirect-to-login
 * disguised as a 200, a Cloudflare challenge page that happens to *not* be
 * flagged as one) is rejected the same way a non-2xx status already is,
 * rather than silently handed back as if it were the real page.
 *
 * @param {string} url
 * @param {FetchOptions} [options]
 * @returns {Promise<string>}
 */
export async function getHtml(
  url: string,
  options: FetchOptions = {}
): Promise<string> {
  const response = await fetchResponse(url, options);
  const contentType = response.headers.get('content-type');
  if (!isContentType(contentType, 'text/html')) {
    throw new Error(
      `Response from "${url}" is not HTML (Content-Type: "${contentType ?? 'none'}")`
    );
  }
  return readBodyCapped(response, options.maxBytes ?? DEFAULT_MAX_BYTES);
}

/**
 * @deprecated Renamed to `getHtml`. Prefer importing `getHtml` from
 * `@canvasflow/feed` directly, which behaves identically.
 */
export const getHtmlContent = getHtml;

/**
 * Fetch `url`, validate its `Content-Type` is `application/json`, and parse
 * the body as JSON. Rejects the same way `getHtml` does for a wrong
 * `Content-Type` — a 2xx response that isn't actually JSON is a failure, not
 * something to hand `JSON.parse` and let throw its own, less specific error.
 *
 * @template T
 * @param {string} url
 * @param {FetchOptions} [options]
 * @returns {Promise<T>}
 */
export async function getJson<T = unknown>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const response = await fetchResponse(url, options);
  const contentType = response.headers.get('content-type');
  if (!isContentType(contentType, 'application/json')) {
    throw new Error(
      `Response from "${url}" is not JSON (Content-Type: "${contentType ?? 'none'}")`
    );
  }
  const text = await readBodyCapped(
    response,
    options.maxBytes ?? DEFAULT_MAX_BYTES
  );
  return JSON.parse(text) as T;
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
