import { test, expect, describe } from 'vite-plus/test';

import { getHtmlContent } from '../http';

const tags = { tags: ['unit', 'rss'] };

function fakeResponse(
  body: string,
  init: { ok?: boolean; status?: number } = {}
): Response {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    url: 'https://example.com/r',
    text: async () => body,
    body: null,
  } as unknown as Response;
}

describe('getHtmlContent', () => {
  test('uses an injected fetch instead of globalThis.fetch', tags, async () => {
    let calledWith: [string, RequestInit | undefined] | undefined;
    const fetchStub = (async (
      url: string | URL | Request,
      init?: RequestInit
    ) => {
      calledWith = [String(url), init];
      return fakeResponse('<html>ok</html>');
    }) as typeof fetch;

    const html = await getHtmlContent('https://example.com/page', {
      fetch: fetchStub,
    });
    expect(html).toBe('<html>ok</html>');
    expect(calledWith?.[0]).toBe('https://example.com/page');
  });

  test('passes an AbortSignal derived from timeoutMs', tags, async () => {
    let sawSignal: AbortSignal | undefined;
    const fetchStub = (async (_url, init?: RequestInit) => {
      sawSignal = init?.signal ?? undefined;
      return fakeResponse('ok');
    }) as typeof fetch;

    await getHtmlContent('https://example.com', {
      fetch: fetchStub,
      timeoutMs: 50,
    });
    expect(sawSignal).toBeInstanceOf(AbortSignal);
  });

  test('rejects when the request exceeds timeoutMs', tags, async () => {
    const fetchStub = ((_url: string | URL | Request, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('The operation was aborted.', 'AbortError'));
        });
      });
    }) as typeof fetch;

    await expect(
      getHtmlContent('https://example.com', { fetch: fetchStub, timeoutMs: 10 })
    ).rejects.toThrow();
  });

  test('throws a descriptive error on a non-ok response', tags, async () => {
    const fetchStub = (async () =>
      fakeResponse('server error', { ok: false, status: 500 })) as typeof fetch;

    await expect(
      getHtmlContent('https://example.com', { fetch: fetchStub })
    ).rejects.toThrow('failed with status 500');
  });

  test(
    'caps the response body at maxBytes when a stream is available',
    tags,
    async () => {
      const chunks = [new TextEncoder().encode('a'.repeat(50))];
      let i = 0;
      const body = {
        getReader: () => ({
          read: async () => {
            if (i < chunks.length) {
              return { done: false, value: chunks[i++] };
            }
            return { done: true, value: undefined };
          },
          cancel: async () => {},
        }),
      };
      const response = {
        ok: true,
        status: 200,
        url: 'https://example.com',
        body,
        text: async () => 'a'.repeat(50),
      } as unknown as Response;
      const fetchStub = (async () => response) as typeof fetch;

      await expect(
        getHtmlContent('https://example.com', {
          fetch: fetchStub,
          maxBytes: 10,
        })
      ).rejects.toThrow(/byte limit/);
    }
  );

  test(
    'returns the full body when under maxBytes via a stream',
    tags,
    async () => {
      const text = 'hello world';
      const chunks = [new TextEncoder().encode(text)];
      let i = 0;
      const body = {
        getReader: () => ({
          read: async () => {
            if (i < chunks.length) {
              return { done: false, value: chunks[i++] };
            }
            return { done: true, value: undefined };
          },
          cancel: async () => {},
        }),
      };
      const response = {
        ok: true,
        status: 200,
        url: 'https://example.com',
        body,
        text: async () => text,
      } as unknown as Response;
      const fetchStub = (async () => response) as typeof fetch;

      const html = await getHtmlContent('https://example.com', {
        fetch: fetchStub,
        maxBytes: 1024,
      });
      expect(html).toBe(text);
    }
  );
});

// Debugging aid for a specific real-world 403, not a regression test with a
// fixed expected outcome. Tagged `integration` per convention (real network
// I/O), but the tag alone does NOT keep it out of a plain `npm test`/CI run
// in this repo — `vp test`/`vp test --coverage` (what `npm test`/CI's
// `npm run coverage` actually invoke) apply no tag filter unless one is
// passed explicitly, despite CLAUDE.md describing `integration` as "skipped
// by default." Gated behind `RUN_NETWORK_TESTS` instead, which is a real
// opt-in: run with `RUN_NETWORK_TESTS=1 npx vitest run
// src/utils/__tests__/http.test.ts -t wanderlustmagazine --reporter=verbose`
// (the `--reporter=verbose` is what actually surfaces the `console.log`
// diagnostics below — the default reporter hides stdout on a passing test).
//
// What this found, isolated by comparing against `getLinkContent` in
// canvasflow/transformer's RssStandardService.ts (axios, header
// `User-Agent: Canvasflow`) against the exact same URL:
//
//   - It is NOT the missing `User-Agent` header: `fetch(url, { headers: {
//     'User-Agent': 'Canvasflow' } })` — the *same* header axios sends —
//     still gets the 403.
//   - It is NOT HTTP/2 vs HTTP/1.1: undici's default `Agent` already has
//     `allowH2: false` (Node's `fetch` is HTTP/1.1-only by default), so
//     `fetch` and axios are both already on HTTP/1.1 here, and `fetch`
//     still gets the 403.
//   - It IS something about the TLS/HTTP connection fingerprint itself.
//     Cloudflare's bot-mitigation (`server: cloudflare`,
//     `cf-mitigated: challenge` — the "Just a moment..." JS interstitial)
//     scores requests on their TLS ClientHello (JA3/JA4 — cipher order,
//     extensions) and HTTP header shape (order/casing/defaults), which
//     differ between undici (`fetch`'s implementation) and Node's classic
//     `http`/`https` module (what axios uses) even for byte-identical
//     headers and the same protocol version. `curl --http1.1` also passes
//     and `curl --http2` also fails against this same URL — another distinct
//     TLS stack producing yet another split — which is consistent with a
//     fingerprint-based check rather than anything in the request undici
//     controls.
//
// This is not a bug in `getHtmlContent` to fix by copying one specific
// header — it's a bot-mitigation wall that scores the underlying HTTP
// client, which `getHtmlContent` has no visibility into or control over via
// the `fetch` API surface. It's also not something this library should try
// to spoof further (mimicking a specific TLS/HTTP fingerprint on purpose is
// a bot-detection bypass, out of scope here). The actionable fix is
// `nodeHttpsFetch` (`../node-https-fetch.ts`, see its own test file) — an
// exported `FetchOptions.fetch` implementation for exactly this situation.
describe.skipIf(!process.env.RUN_NETWORK_TESTS)(
  'getHtmlContent — wanderlustmagazine.com 403 (real network)',
  { tags: ['integration'] },
  () => {
    const url =
      'https://www.wanderlustmagazine.com/inspiration/us-national-parks-what-you-need-to-know-about-visiting-in-2025/';

    // Reproduces the reported bug as-is: no custom headers, same call shape
    // as any caller (RSSFeed's shouldFetchRemote path, the `tools` app's
    // proxy) invoking `getHtmlContent(url)` with defaults.
    test(
      'fails with a 403 using default fetch, no headers',
      { tags: ['integration'] },
      async () => {
        await expect(getHtmlContent(url)).rejects.toThrow(
          'failed with status 403'
        );
      }
    );

    // Isolates the header question and reports whatever actually happens —
    // purely observational, no fixed pass/fail assertion. Sends the *exact*
    // header (`User-Agent: Canvasflow`) that makes axios/`node:https` reliably
    // succeed (see `../node-https-fetch.test.ts`) through plain `fetch`
    // instead. Three outcomes have all been observed across separate runs of
    // this same test during this investigation: a 403 Cloudflare challenge,
    // a connection-level `fetch failed`/`ETIMEDOUT` (Cloudflare or the
    // runner's network path blocking the connection outright), and —
    // occasionally — an actual 200 with the real article. That third
    // outcome is what confirms this is genuinely probabilistic bot-scoring,
    // not a hard rule: plain `fetch` sometimes gets through, it just scores
    // worse / less reliably than `node:https` (axios's underlying client)
    // does, which is exactly why `nodeHttpsFetch` exists as the fix rather
    // than "this one header."
    test(
      'reports whatever fetch does with the same User-Agent axios uses',
      { tags: ['integration'] },
      async () => {
        try {
          const html = await getHtmlContent(url, {
            headers: { 'User-Agent': 'Canvasflow' },
          });
          console.log(
            'fetch succeeded — title:',
            /<title>(.*?)<\/title>/.exec(html)?.[1]
          );
        } catch (err) {
          console.log('fetch failed:', err);
        }
      }
    );

    // Bypasses `getHtmlContent` (which only exposes `response.ok`/`status`
    // on failure, and gives up entirely on a connection-level error) to
    // inspect the raw response/error for diagnosis — same three possible
    // outcomes as the previous test, all just logged rather than asserted.
    test(
      'inspects the raw response/error for diagnosis',
      { tags: ['integration'] },
      async () => {
        try {
          const response = await fetch(url, {
            headers: { 'User-Agent': 'Canvasflow' },
          });
          console.log('status:', response.status);
          console.log('server:', response.headers.get('server'));
          console.log('cf-mitigated:', response.headers.get('cf-mitigated'));
          const body = await response.text();
          console.log('body <title>:', /<title>(.*?)<\/title>/.exec(body)?.[1]);
        } catch (err) {
          // The connection-level failure mode (`fetch failed`/`ETIMEDOUT`/
          // `ENETUNREACH`) — logged instead of re-thrown so the test still
          // reports which failure mode actually happened.
          console.log('fetch threw instead of resolving:', err);
        }
      }
    );
  }
);
