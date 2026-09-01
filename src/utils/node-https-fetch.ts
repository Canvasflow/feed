import * as http from 'node:http';
import * as https from 'node:https';
import { Readable } from 'node:stream';

/**
 * Some sites' bot-mitigation (Cloudflare managed/JS challenges in
 * particular) scores requests on the underlying TLS/HTTP client's own
 * fingerprint (TLS ClientHello cipher/extension order, HTTP header
 * shape/order) — not just on headers like `User-Agent`. Node's built-in
 * `fetch` (undici) can get flagged/challenged by a site that a request
 * through Node's classic `http`/`https` module sails through with the
 * *exact same* headers, because the two produce different fingerprints.
 *
 * `nodeHttpsFetch` is a `typeof fetch`-compatible adapter backed directly by
 * `node:http`/`node:https` for exactly that situation: pass it as
 * `FetchOptions.fetch` (see `./http`'s `fetchUrl`, or any other
 * `fetch`-shaped call site) to route a request through Node's classic HTTP
 * client instead of undici, with no third-party dependency.
 *
 * Not a drop-in replacement for every `fetch` capability — no cookie jar,
 * no HTTP/2, no compression negotiation beyond whatever headers the caller
 * supplies — but it does follow redirects, stream the response body (so a
 * caller's own byte cap, like `fetchUrl`'s `maxBytes`, still applies),
 * and honor an `AbortSignal`, which covers every real caller in this
 * codebase.
 *
 * @returns {typeof fetch}
 */
export function nodeHttpsFetch(): typeof fetch {
  const fetchImpl = async (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    return performRequest(url, init, MAX_REDIRECTS);
  };
  // `typeof fetch`'s lib.dom.d.ts type also carries a call signature with a
  // `preconnect` static method neither this adapter nor any caller in this
  // codebase uses — the only honest way to satisfy that extra shape without
  // fabricating a fake `preconnect` is this one cast, isolated here rather
  // than scattered as `as typeof fetch` on every call site that needs a
  // `FetchOptions.fetch` value.
  return fetchImpl as typeof fetch;
}

const MAX_REDIRECTS = 5;

function performRequest(
  url: URL,
  init: RequestInit | undefined,
  redirectsRemaining: number
): Promise<Response> {
  const headers = init?.headers
    ? (Object.fromEntries(new Headers(init.headers)) as Record<string, string>)
    : undefined;
  const method = init?.method ?? 'GET';
  const requestModule = url.protocol === 'http:' ? http : https;

  return new Promise<Response>((resolve, reject) => {
    const req = requestModule.request(url, { method, headers }, (res) => {
      const status = res.statusCode ?? 0;
      const location = res.headers.location;

      if (status >= 300 && status < 400 && location && redirectsRemaining > 0) {
        // The redirect target is discarded — the caller only ever sees the
        // final response, matching `fetch`'s own default `redirect:
        // 'follow'` behavior.
        res.resume();
        const nextUrl = new URL(location, url);
        resolve(performRequest(nextUrl, init, redirectsRemaining - 1));
        return;
      }

      // `res.headers`' type (`IncomingHttpHeaders`) marks every value as
      // possibly `undefined` for defensive typing, but Node's own HTTP
      // parser never actually populates an entry with `undefined` — an
      // absent header is simply an absent key, never a key mapped to
      // `undefined` — so this doesn't need its own `undefined` guard.
      const responseHeaders = new Headers();
      for (const [key, value] of Object.entries(res.headers)) {
        for (const v of Array.isArray(value) ? value : [value as string]) {
          responseHeaders.append(key, v);
        }
      }

      resolve(
        new Response(Readable.toWeb(res) as ReadableStream<Uint8Array>, {
          status,
          headers: responseHeaders,
        })
      );
    });

    req.on('error', reject);

    if (init?.signal) {
      if (init.signal.aborted) {
        req.destroy();
        reject(init.signal.reason);
        return;
      }
      init.signal.addEventListener('abort', () => req.destroy(), {
        once: true,
      });
    }

    if (typeof init?.body === 'string') {
      req.write(init.body);
    }
    req.end();
  });
}
