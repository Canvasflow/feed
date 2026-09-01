import { test, expect, describe } from 'vite-plus/test';

import { fetchUrl, getHtml, getHtmlContent, getJson } from '../http';

const tags = { tags: ['unit', 'rss'] };

function fakeResponse(
  body: string,
  init: { ok?: boolean; status?: number; headers?: Record<string, string> } = {}
): Response {
  const headers = new Headers(init.headers);
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    url: 'https://example.com/r',
    headers,
    text: async () => body,
    body: null,
  } as unknown as Response;
}

describe('fetchUrl', () => {
  test('uses an injected fetch instead of globalThis.fetch', tags, async () => {
    let calledWith: [string, RequestInit | undefined] | undefined;
    const fetchStub = (async (
      url: string | URL | Request,
      init?: RequestInit
    ) => {
      calledWith = [String(url), init];
      return fakeResponse('<html>ok</html>');
    }) as typeof fetch;

    const html = await fetchUrl('https://example.com/page', {
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

    await fetchUrl('https://example.com', {
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
      fetchUrl('https://example.com', { fetch: fetchStub, timeoutMs: 10 })
    ).rejects.toThrow();
  });

  test('throws a descriptive error on a non-ok response', tags, async () => {
    const fetchStub = (async () =>
      fakeResponse('server error', { ok: false, status: 500 })) as typeof fetch;

    await expect(
      fetchUrl('https://example.com', { fetch: fetchStub })
    ).rejects.toThrow('failed with status 500');
  });

  test(
    'does not care what the Content-Type is, unlike getHtml/getJson',
    tags,
    async () => {
      const fetchStub = (async () =>
        fakeResponse('{"not":"html"}', {
          headers: { 'content-type': 'application/json' },
        })) as typeof fetch;

      const text = await fetchUrl('https://example.com', {
        fetch: fetchStub,
      });
      expect(text).toBe('{"not":"html"}');
    }
  );

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
        headers: new Headers(),
        body,
        text: async () => 'a'.repeat(50),
      } as unknown as Response;
      const fetchStub = (async () => response) as typeof fetch;

      await expect(
        fetchUrl('https://example.com', {
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
        headers: new Headers(),
        body,
        text: async () => text,
      } as unknown as Response;
      const fetchStub = (async () => response) as typeof fetch;

      const html = await fetchUrl('https://example.com', {
        fetch: fetchStub,
        maxBytes: 1024,
      });
      expect(html).toBe(text);
    }
  );
});

describe('getHtml', () => {
  test('returns the body when Content-Type is text/html', tags, async () => {
    const fetchStub = (async () =>
      fakeResponse('<html>ok</html>', {
        headers: { 'content-type': 'text/html' },
      })) as typeof fetch;

    const html = await getHtml('https://example.com', { fetch: fetchStub });
    expect(html).toBe('<html>ok</html>');
  });

  test('ignores Content-Type parameters like charset', tags, async () => {
    const fetchStub = (async () =>
      fakeResponse('<html>ok</html>', {
        headers: { 'content-type': 'text/html; charset=utf-8' },
      })) as typeof fetch;

    const html = await getHtml('https://example.com', { fetch: fetchStub });
    expect(html).toBe('<html>ok</html>');
  });

  test(
    'throws when a 2xx response Content-Type is not text/html',
    tags,
    async () => {
      const fetchStub = (async () =>
        fakeResponse('{"not":"html"}', {
          headers: { 'content-type': 'application/json' },
        })) as typeof fetch;

      await expect(
        getHtml('https://example.com', { fetch: fetchStub })
      ).rejects.toThrow('is not HTML');
    }
  );

  test('throws when Content-Type is missing entirely', tags, async () => {
    const fetchStub = (async () => fakeResponse('ok')) as typeof fetch;

    await expect(
      getHtml('https://example.com', { fetch: fetchStub })
    ).rejects.toThrow('is not HTML');
  });

  test(
    'still throws on a non-ok status before checking Content-Type',
    tags,
    async () => {
      const fetchStub = (async () =>
        fakeResponse('server error', {
          ok: false,
          status: 500,
        })) as typeof fetch;

      await expect(
        getHtml('https://example.com', { fetch: fetchStub })
      ).rejects.toThrow('failed with status 500');
    }
  );
});

describe('getJson', () => {
  test(
    'parses the body when Content-Type is application/json',
    tags,
    async () => {
      const fetchStub = (async () =>
        fakeResponse('{"a":1,"b":"two"}', {
          headers: { 'content-type': 'application/json' },
        })) as typeof fetch;

      const parsed = await getJson<{ a: number; b: string }>(
        'https://example.com',
        { fetch: fetchStub }
      );
      expect(parsed).toEqual({ a: 1, b: 'two' });
    }
  );

  test('ignores Content-Type parameters like charset', tags, async () => {
    const fetchStub = (async () =>
      fakeResponse('{"a":1}', {
        headers: { 'content-type': 'application/json; charset=utf-8' },
      })) as typeof fetch;

    const parsed = await getJson('https://example.com', { fetch: fetchStub });
    expect(parsed).toEqual({ a: 1 });
  });

  test(
    'throws when a 2xx response Content-Type is not application/json',
    tags,
    async () => {
      const fetchStub = (async () =>
        fakeResponse('<html>not json</html>', {
          headers: { 'content-type': 'text/html' },
        })) as typeof fetch;

      await expect(
        getJson('https://example.com', { fetch: fetchStub })
      ).rejects.toThrow('is not JSON');
    }
  );

  test('throws when Content-Type is missing entirely', tags, async () => {
    const fetchStub = (async () => fakeResponse('{}')) as typeof fetch;

    await expect(
      getJson('https://example.com', { fetch: fetchStub })
    ).rejects.toThrow('is not JSON');
  });

  test(
    'still throws on a non-ok status before checking Content-Type',
    tags,
    async () => {
      const fetchStub = (async () =>
        fakeResponse('server error', {
          ok: false,
          status: 500,
        })) as typeof fetch;

      await expect(
        getJson('https://example.com', { fetch: fetchStub })
      ).rejects.toThrow('failed with status 500');
    }
  );
});

test('getHtmlContent is a deprecated alias for getHtml', tags, () => {
  expect(getHtmlContent).toBe(getHtml);
});

// A real-world case worth its own coverage: some sites' bot-mitigation
// (Cloudflare's managed/JS challenge in particular — discovered debugging a
// live 403 from wanderlustmagazine.com against `fetchUrl`/`getHtml`)
// responds with a "successful" HTTP response that's actually a challenge
// page, not the real content — `server: cloudflare` +
// `cf-mitigated: challenge` headers and a "Just a moment..." title.
// `fakeResponse` fabricates that exact shape so this is a deterministic,
// offline unit test instead of a real network call to a live,
// rate-limit-sensitive third-party site: it verifies `fetchUrl` surfaces
// this as the same "non-ok" failure it already handles for a plain 403,
// which is genuinely all `fetchUrl` itself can do here (the response *is*
// non-2xx) — see `nodeHttpsFetch`
// (`../node-https-fetch.ts`/`../__tests__/node-https-fetch.test.ts`) for
// the actual fix a caller can plug in via `FetchOptions.fetch`. A
// Cloudflare challenge that instead came back as a 2xx (some deployments
// do) is exactly what `getHtml`'s own Content-Type check above additionally
// guards against.
describe('fetchUrl — a Cloudflare bot-mitigation challenge response', () => {
  const cloudflareChallengeResponse = () =>
    fakeResponse(
      '<html><head><title>Just a moment...</title></head><body></body></html>',
      {
        ok: false,
        status: 403,
        headers: { server: 'cloudflare', 'cf-mitigated': 'challenge' },
      }
    );

  test(
    'surfaces the challenge as a "failed with status 403" error',
    tags,
    async () => {
      const fetchStub = (async () =>
        cloudflareChallengeResponse()) as typeof fetch;

      await expect(
        fetchUrl('https://example.com/article', { fetch: fetchStub })
      ).rejects.toThrow('failed with status 403');
    }
  );

  test(
    'fails the same way even with a realistic User-Agent header',
    tags,
    async () => {
      // Mirrors what the real investigation found: sending a header alone
      // (the same `User-Agent: Canvasflow` transformer's `getLinkContent`
      // sends via axios) does not change the outcome through `fetch` — the
      // challenge is scored on the underlying HTTP client, not the header.
      let sawHeaders: HeadersInit | undefined;
      const fetchStub = (async (_url, init?: RequestInit) => {
        sawHeaders = init?.headers;
        return cloudflareChallengeResponse();
      }) as typeof fetch;

      await expect(
        fetchUrl('https://example.com/article', {
          fetch: fetchStub,
          headers: { 'User-Agent': 'Canvasflow' },
        })
      ).rejects.toThrow('failed with status 403');
      expect(new Headers(sawHeaders).get('User-Agent')).toBe('Canvasflow');
    }
  );
});
