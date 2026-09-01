import { test, expect, describe, beforeAll, afterAll } from 'vite-plus/test';
import * as http from 'node:http';
import type { AddressInfo } from 'node:net';

import { nodeHttpsFetch } from '../node-https-fetch';
import { fetchUrl } from '../http';

const tags = { tags: ['unit', 'rss'] };

// A real local HTTP server (no TLS — `nodeHttpsFetch` dispatches on
// `url.protocol`, and `http:` needs no certificate) so these tests exercise
// `nodeHttpsFetch`'s actual `node:http` request/response handling —
// redirects, header passthrough, aborts, streaming, and a faked
// Cloudflare-style bot-gate — entirely offline, with no real network I/O.
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

      if (url.pathname === '/echo-body') {
        let received = '';
        req.setEncoding('utf8');
        req.on('data', (chunk: string) => {
          received += chunk;
        });
        req.on('end', () => {
          res.writeHead(200, { 'content-type': 'text/plain' });
          res.end(received);
        });
        return;
      }

      // Fakes the exact real-world shape a Cloudflare-gated site returns:
      // 403 + `cf-mitigated: challenge` for a request without the expected
      // `User-Agent`, 200 with the real content once it's sent — modeling
      // what the actual investigation found against wanderlustmagazine.com
      // (see `./http.test.ts`'s own Cloudflare-challenge test) without any
      // live network call.
      if (url.pathname === '/bot-gated') {
        if (req.headers['user-agent'] !== 'Canvasflow') {
          res.writeHead(403, {
            server: 'cloudflare',
            'cf-mitigated': 'challenge',
            'content-type': 'text/html',
          });
          res.end('<html><head><title>Just a moment...</title></head></html>');
          return;
        }
        res.writeHead(200, { 'content-type': 'text/html' });
        res.end('<html><body>the real article content</body></html>');
        return;
      }

      if (url.pathname === '/multi-header') {
        res.writeHead(200, { 'set-cookie': ['a=1', 'b=2'] });
        res.end('ok');
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

  test('accepts a Request object, not just a URL string', tags, async () => {
    const response = await nodeHttpsFetch()(new Request(`${baseUrl}/target`));
    expect(await response.text()).toBe('hello from /target');
  });

  test('dispatches an https: URL through node:https', tags, async () => {
    // No real TLS server here — this only proves the `https:` branch of
    // `performRequest`'s module dispatch is taken (a connection error
    // rather than the `http:` fixture server's own response), not that a
    // TLS handshake actually completes.
    await expect(nodeHttpsFetch()('https://127.0.0.1:1/')).rejects.toThrow();
  });

  test(
    'collects a repeated response header into one Headers entry',
    tags,
    async () => {
      const response = await nodeHttpsFetch()(`${baseUrl}/multi-header`);
      expect(response.headers.getSetCookie()).toEqual(['a=1', 'b=2']);
    }
  );

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
    // thrown error is `fetchUrl`'s job (`response.ok`), so the raw
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
    'rejects immediately for a signal that is already aborted',
    tags,
    async () => {
      const controller = new AbortController();
      controller.abort();
      await expect(
        nodeHttpsFetch()(`${baseUrl}/target`, { signal: controller.signal })
      ).rejects.toThrow();
    }
  );

  test('sends a string request body to the server', tags, async () => {
    const response = await nodeHttpsFetch()(`${baseUrl}/echo-body`, {
      method: 'POST',
      body: 'hello server',
    });
    expect(await response.text()).toBe('hello server');
  });

  test(
    'streams the body so fetchUrl.maxBytes still applies',
    tags,
    async () => {
      await expect(
        fetchUrl(`${baseUrl}/large`, {
          fetch: nodeHttpsFetch(),
          maxBytes: 10,
        })
      ).rejects.toThrow(/byte limit/);
    }
  );

  test('fetchUrl returns the full body via nodeHttpsFetch', tags, async () => {
    const html = await fetchUrl(`${baseUrl}/target`, {
      fetch: nodeHttpsFetch(),
    });
    expect(html).toBe('hello from /target');
  });

  // Models the actual scenario this adapter exists for — a
  // Cloudflare-gated site that 403s a request missing the expected
  // `User-Agent` and succeeds once it's sent (`/bot-gated` above, shaped
  // after the real investigation against wanderlustmagazine.com; see
  // `./http.test.ts`'s Cloudflare-challenge test) — through
  // `fetchUrl(url, { fetch: nodeHttpsFetch(), headers })`, fully
  // offline and deterministic.
  test(
    'fetchUrl fails against the bot-gated route with no headers',
    tags,
    async () => {
      await expect(
        fetchUrl(`${baseUrl}/bot-gated`, { fetch: nodeHttpsFetch() })
      ).rejects.toThrow('failed with status 403');
    }
  );

  test(
    'fetchUrl succeeds against the bot-gated route with the right User-Agent',
    tags,
    async () => {
      const html = await fetchUrl(`${baseUrl}/bot-gated`, {
        fetch: nodeHttpsFetch(),
        headers: { 'User-Agent': 'Canvasflow' },
      });

      expect(html).toContain('the real article content');
      expect(html).not.toContain('Just a moment');
    }
  );
});
