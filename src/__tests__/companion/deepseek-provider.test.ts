import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  readDeepSeekProviderConfig,
  createDeepSeekCompanionProvider,
  DEFAULT_DEEPSEEK_BASE_URL,
  DEFAULT_DEEPSEEK_MODEL,
  DEFAULT_PROVIDER_TIMEOUT_MS,
  DEFAULT_PROVIDER_MAX_BYTES,
  type DeepSeekProviderConfig,
} from '@/server/companion/deepseek-provider';

const VALID_CONFIG: DeepSeekProviderConfig = {
  apiKey: 'sk-deepseek-test-key-12345678',
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-chat',
  models: ['deepseek-chat'],
  routing: 'failover',
  retriesPerModel: 0,
  maxAttempts: 1,
  timeoutMs: 15_000,
  maxBytes: 65_536,
};

describe('DeepSeek text companion provider adapter', () => {
  describe('readDeepSeekProviderConfig', () => {
    it('returns null when API key is missing or blank', () => {
      assert.equal(readDeepSeekProviderConfig({}), null);
      assert.equal(readDeepSeekProviderConfig({ DEEPSEEK_API_KEY: '' }), null);
      assert.equal(readDeepSeekProviderConfig({ COMPANION_DEEPSEEK_API_KEY: '   ' }), null);
    });

    it('reads configuration with sensible defaults via COMPANION_DEEPSEEK_API_KEY', () => {
      const config = readDeepSeekProviderConfig({ COMPANION_DEEPSEEK_API_KEY: 'sk-deepseek-key' });
      assert.ok(config);
      assert.equal(config.apiKey, 'sk-deepseek-key');
      assert.equal(config.baseUrl, DEFAULT_DEEPSEEK_BASE_URL);
      assert.equal(config.model, DEFAULT_DEEPSEEK_MODEL);
      assert.deepEqual(config.models, [DEFAULT_DEEPSEEK_MODEL]);
      assert.equal(config.routing, 'failover');
      assert.equal(config.retriesPerModel, 0);
      assert.equal(config.timeoutMs, DEFAULT_PROVIDER_TIMEOUT_MS);
      assert.equal(config.maxBytes, DEFAULT_PROVIDER_MAX_BYTES);
    });

    it('supports DEEPSEEK_API_KEY environment variable', () => {
      const config = readDeepSeekProviderConfig({ DEEPSEEK_API_KEY: 'sk-root-deepseek' });
      assert.ok(config);
      assert.equal(config.apiKey, 'sk-root-deepseek');
    });

    it('supports COMPANION_PROVIDER=deepseek explicit mode', () => {
      const config = readDeepSeekProviderConfig({
        COMPANION_PROVIDER: 'deepseek',
        DEEPSEEK_API_KEY: 'sk-explicit-deepseek',
        DEEPSEEK_MODEL: 'deepseek-reasoner',
      });
      assert.ok(config);
      assert.equal(config.apiKey, 'sk-explicit-deepseek');
      assert.equal(config.model, 'deepseek-reasoner');
    });

    it('rejects invalid or unsafe base URLs', () => {
      assert.equal(
        readDeepSeekProviderConfig({ COMPANION_DEEPSEEK_API_KEY: 'sk-key', COMPANION_DEEPSEEK_BASE_URL: 'not-a-url' }),
        null,
      );
      assert.equal(
        readDeepSeekProviderConfig({
          COMPANION_DEEPSEEK_API_KEY: 'sk-key',
          COMPANION_DEEPSEEK_BASE_URL: 'ftp://api.deepseek.com',
        }),
        null,
      );
    });

    it('requires TLS except for loopback providers and rejects credentials or query parameters', () => {
      assert.equal(
        readDeepSeekProviderConfig({
          COMPANION_DEEPSEEK_API_KEY: 'sk-key',
          COMPANION_DEEPSEEK_BASE_URL: 'http://api.deepseek.com',
        }),
        null,
      );
      assert.equal(
        readDeepSeekProviderConfig({
          COMPANION_DEEPSEEK_API_KEY: 'sk-key',
          COMPANION_DEEPSEEK_BASE_URL: 'https://user:pass@api.deepseek.com',
        }),
        null,
      );
      assert.equal(
        readDeepSeekProviderConfig({
          COMPANION_DEEPSEEK_API_KEY: 'sk-key',
          COMPANION_DEEPSEEK_BASE_URL: 'https://api.deepseek.com?auth=in-query',
        }),
        null,
      );
      assert.equal(
        readDeepSeekProviderConfig({
          COMPANION_DEEPSEEK_API_KEY: 'sk-key',
          COMPANION_DEEPSEEK_BASE_URL: 'http://127.0.0.1:8000',
        })?.baseUrl,
        'http://127.0.0.1:8000',
      );
    });

    it('reads a bounded model pool and routing policy', () => {
      const config = readDeepSeekProviderConfig({
        COMPANION_DEEPSEEK_API_KEY: 'sk-key',
        COMPANION_DEEPSEEK_MODELS: 'deepseek-chat, deepseek-coder, deepseek-chat',
        COMPANION_PROVIDER_ROUTING: 'round-robin',
        COMPANION_PROVIDER_RETRIES_PER_MODEL: '1',
      });
      assert.ok(config);
      assert.deepEqual(config.models, ['deepseek-chat', 'deepseek-coder']);
      assert.equal(config.routing, 'round-robin');
      assert.equal(config.retriesPerModel, 1);
    });
  });

  describe('createDeepSeekCompanionProvider execution', () => {
    it('formats OpenAI-compatible chat messages and returns assistant reply', async () => {
      let requestedUrl = '';
      let requestedHeaders: Record<string, string> = {};
      let requestedBody: any = null;

      const mockFetch: typeof fetch = async (input, init) => {
        requestedUrl = String(input);
        requestedHeaders = init?.headers as Record<string, string>;
        requestedBody = JSON.parse(String(init?.body));
        return new Response(
          JSON.stringify({
            choices: [{ message: { role: 'assistant', content: 'Chào em, anh là Snow!' } }],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      };

      const provider = createDeepSeekCompanionProvider(VALID_CONFIG, { fetch: mockFetch });
      const reply = await provider({
        content: 'Chào Snow',
        history: [{ role: 'child', content: 'Em chào anh' }],
      });

      assert.equal(requestedUrl, 'https://api.deepseek.com/v1/chat/completions');
      assert.equal(requestedHeaders.Authorization, `Bearer ${VALID_CONFIG.apiKey}`);
      assert.equal(requestedBody.model, 'deepseek-chat');
      assert.equal(requestedBody.stream, false);
      assert.ok(requestedBody.messages.some((m: any) => m.role === 'system'));
      assert.equal(reply, 'Chào em, anh là Snow!');
    });

    it('rejects upstream HTTP errors without returning fake responses', async () => {
      const mockFetch: typeof fetch = async () =>
        new Response(JSON.stringify({ error: 'Server exploded' }), { status: 500 });
      const provider = createDeepSeekCompanionProvider(VALID_CONFIG, { fetch: mockFetch });
      await assert.rejects(
        provider({ content: 'Test', history: [] }),
        /COMPANION_PROVIDER_HTTP_500/,
      );
    });

    it('does not retry when auth credentials are rejected (401)', async () => {
      let callCount = 0;
      const mockFetch: typeof fetch = async () => {
        callCount += 1;
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
      };
      const provider = createDeepSeekCompanionProvider(
        { ...VALID_CONFIG, retriesPerModel: 2, maxAttempts: 3 },
        { fetch: mockFetch },
      );
      await assert.rejects(
        provider({ content: 'Test', history: [] }),
        /COMPANION_PROVIDER_HTTP_401/,
      );
      assert.equal(callCount, 1);
    });

    it('redacts sensitive API key from error messages', async () => {
      const secretKey = 'sk-super-secret-deepseek-token';
      const mockFetch: typeof fetch = async () => {
        throw new Error(`Failed to contact upstream using key ${secretKey}`);
      };
      const provider = createDeepSeekCompanionProvider(
        { ...VALID_CONFIG, apiKey: secretKey },
        { fetch: mockFetch },
      );
      try {
        await provider({ content: 'Test', history: [] });
        assert.fail('Should have thrown');
      } catch (err: any) {
        assert.ok(!err.message.includes(secretKey));
        assert.ok(err.message.includes('[REDACTED]'));
      }
    });

    it('enforces request timeout bounds via AbortController', async () => {
      const mockFetch: typeof fetch = async (_input, init) => {
        return new Promise<Response>((resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const err = new Error('The operation was aborted');
            err.name = 'AbortError';
            reject(err);
          });
        });
      };
      const provider = createDeepSeekCompanionProvider(
        { ...VALID_CONFIG, timeoutMs: 50 },
        { fetch: mockFetch },
      );
      await assert.rejects(
        provider({ content: 'Slow message', history: [] }),
        /COMPANION_PROVIDER_TIMEOUT/,
      );
    });

    it('rejects empty or whitespace-only response without fabricating content', async () => {
      const mockFetch: typeof fetch = async () =>
        new Response(JSON.stringify({ choices: [{ message: { content: '   ' } }] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      const provider = createDeepSeekCompanionProvider(VALID_CONFIG, { fetch: mockFetch });
      await assert.rejects(
        provider({ content: 'Hello', history: [] }),
        /COMPANION_PROVIDER_EMPTY_REPLY/,
      );
    });
  });
});
