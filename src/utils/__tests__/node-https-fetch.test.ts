import { test, expect, describe, beforeAll, afterAll } from 'vite-plus/test';
import * as http from 'node:http';
import type { AddressInfo } from 'node:net';

import { nodeHttpsFetch } from '../node-https-fetch';
import { getHtmlContent } from '../http';

const tags = { tags: ['unit', 'rss'] };

// A real local HTTP server (no TLS — `nodeHttpsFetch` dispatches on
// `url.protocol`, and `http:` needs no certificate) so these tests exercise
// `nodeHttpsFetch`'s actual `node:http` request/response handling —
// redirects, header passthrough, aborts, streaming — without any real
// network I/O, unlike the `RUN_NETWORK_TESTS`-gated suite below.
describe('nodeHttpsFetch', () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      const url = new URL(req.url ?? '/', baseUrl);

      if (url.pathname === '/redirect') {
        res.writeHead(302, { Location: '/target' });
        res.end();
        return;
      }

      if (url.pathname === '/echo-headers') {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify(req.headers));
        return;
      }

      if (url.pathname === '/slow') {
        // Never responds on its own — only used by the abort test, which
        // destroys the request itself.
        return;
      }

      if (url.pathname === '/large') {
        res.writeHead(200);
        res.end('a'.repeat(1024));
        return;
      }

      if (url.pathname === '/not-found') {
        res.writeHead(404);
        res.end('missing');
        return;
      }

      res.writeHead(200, { 'content-type': 'text/plain' });
      res.end('hello from ' + url.pathname);
    });

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  test('performs a basic GET and returns the body', tags, async () => {
    const response = await nodeHttpsFetch()(`${baseUrl}/target`);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('hello from /target');
  });

  test('forwards request headers to the server', tags, async () => {
    const response = await nodeHttpsFetch()(`${baseUrl}/echo-headers`, {
      headers: { 'User-Agent': 'Canvasflow', 'X-Test': 'abc' },
    });
    const received = (await response.json()) as Record<string, string>;
    expect(received['user-agent']).toBe('Canvasflow');
    expect(received['x-test']).toBe('abc');
  });

  test('follows a redirect to its final target', tags, async () => {
    const response = await nodeHttpsFetch()(`${baseUrl}/redirect`);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('hello from /target');
  });

  test('surfaces a non-2xx status without throwing itself', tags, async () => {
    // `nodeHttpsFetch` only adapts the transport — turning a non-2xx into a
    // thrown error is `getHtmlContent`'s job (`response.ok`), so the raw
    // adapter just reports the status as-is.
    const response = await nodeHttpsFetch()(`${baseUrl}/not-found`);
    expect(response.status).toBe(404);
    expect(response.ok).toBe(false);
  });

  test('aborts the request when the AbortSignal fires', tags, async () => {
    const controller = new AbortController();
    const promise = nodeHttpsFetch()(`${baseUrl}/slow`, {
      signal: controller.signal,
    });
    controller.abort();
    await expect(promise).rejects.toThrow();
  });

  test(
    'streams the body so getHtmlContent.maxBytes still applies',
    tags,
    async () => {
      await expect(
        getHtmlContent(`${baseUrl}/large`, {
          fetch: nodeHttpsFetch(),
          maxBytes: 10,
        })
      ).rejects.toThrow(/byte limit/);
    }
  );

  test(
    'getHtmlContent returns the full body via nodeHttpsFetch',
    tags,
    async () => {
      const html = await getHtmlContent(`${baseUrl}/target`, {
        fetch: nodeHttpsFetch(),
      });
      expect(html).toBe('hello from /target');
    }
  );
});

// Debugging aid demonstrating the actual fix against the real, live site
// that started this investigation — not a regression test with a fixed
// expected outcome (see the equivalent comment in `./http.test.ts`). Tagged
// `integration`, gated behind `RUN_NETWORK_TESTS` for the same reason as
// `./http.test.ts`'s own network-gated suite: `npm test`/CI apply no tag
// filter by default in this repo, and this hits a real, rate-limit-sensitive
// third-party site. Run with `RUN_NETWORK_TESTS=1 npx vitest run
// src/utils/__tests__/node-https-fetch.test.ts -t wanderlustmagazine
// --reporter=verbose`.
describe.skipIf(!process.env.RUN_NETWORK_TESTS)(
  'getHtmlContent — succeeds against wanderlustmagazine.com via nodeHttpsFetch',
  { tags: ['integration'] },
  () => {
    const url =
      'https://www.wanderlustmagazine.com/inspiration/us-national-parks-what-you-need-to-know-about-visiting-in-2025/';

    test(
      'fails without a User-Agent header, same as plain fetch',
      { tags: ['integration'] },
      async () => {
        // Only asserts "fails" rather than a specific error message — same
        // reasoning as `./http.test.ts`: repeated requests against this URL
        // during this investigation escalated from a 403 (`Response.ok`
        // false, handled by `getHtmlContent`'s own status check) to a raw
        // connection-level `ETIMEDOUT` (an `AggregateError` with an empty
        // top-level `.message`, thrown before any response —
        // `getHtmlContent` never gets the chance to turn it into its usual
        // "failed with status N" message). Which shape of failure you get
        // is itself part of what's non-deterministic about Cloudflare's
        // mitigation, not a flaw in this test.
        await expect(
          getHtmlContent(url, { fetch: nodeHttpsFetch() })
        ).rejects.toThrow();
      }
    );

    // The actual fix, demonstrated end to end: pass `nodeHttpsFetch()` as
    // the `fetch` implementation, plus the `User-Agent: Canvasflow` header
    // (canvasflow/transformer's RssStandardService.ts `getLinkContent` uses
    // this exact same header, via axios) — `getHtmlContent` now succeeds
    // and returns the real article HTML instead of a Cloudflare challenge
    // page, with zero new dependencies.
    test(
      'succeeds when given a User-Agent header, via nodeHttpsFetch instead of fetch',
      { tags: ['integration'] },
      async () => {
        const html = await getHtmlContent(url, {
          fetch: nodeHttpsFetch(),
          headers: { 'User-Agent': 'Canvasflow' },
        });

        expect(html).toContain('US National Parks');
        expect(html).not.toContain('Just a moment');
      }
    );
  }
);
