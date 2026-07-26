import { test, expect, describe } from 'vite-plus/test';

import { getHtmlContent, getRecipeFromUrl } from '../recipe';

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

describe('getRecipeFromUrl', () => {
  test(
    'skips a malformed ld+json block and finds a later valid one',
    tags,
    async () => {
      const html = `<html><head>
      <script type="application/ld+json">{ not valid json </script>
      <script type="application/ld+json">${JSON.stringify({
        '@type': 'Recipe',
        name: 'Soup',
      })}</script>
    </head><body></body></html>`;
      const fetchStub = (async () => fakeResponse(html)) as typeof fetch;

      const recipe = await getRecipeFromUrl('https://example.com/r', {
        fetch: fetchStub,
      });
      expect(recipe?.name).toBe('Soup');
    }
  );

  test('returns null when every ld+json block is malformed', tags, async () => {
    const html = `<html><head>
      <script type="application/ld+json">{ not valid json </script>
    </head><body></body></html>`;
    const fetchStub = (async () => fakeResponse(html)) as typeof fetch;

    const recipe = await getRecipeFromUrl('https://example.com/r', {
      fetch: fetchStub,
    });
    expect(recipe).toBe(null);
  });
});
