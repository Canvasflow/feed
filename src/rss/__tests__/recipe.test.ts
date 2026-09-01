import { test, expect, describe } from 'vite-plus/test';

import { getRecipeFromUrl } from '../recipe';

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
