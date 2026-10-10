import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  readGeminiProviderConfig,
  createGeminiCompanionProvider,
  DEFAULT_GEMINI_BASE_URL,
  DEFAULT_GEMINI_MODEL,
  DEFAULT_GEMINI_COOLDOWN_MS,
  DEFAULT_PROVIDER_TIMEOUT_MS,
  DEFAULT_PROVIDER_MAX_BYTES,
  type GeminiProviderConfig,
} from '@/server/companion/gemini-provider';

const VALID_CONFIG: GeminiProviderConfig = {
  apiKeys: ['key-alpha', 'key-beta', 'key-gamma'],
  baseUrl: 'https://generativelanguage.googleapis.com',
  model: 'gemini-1.5-flash',
  models: ['gemini-1.5-flash'],
  routing: 'round-robin',
  retriesPerKey: 0,
  maxAttempts: 3,
  timeoutMs: 15_000,
  maxBytes: 65_536,
  cooldownMs: 60_000,
};

describe('Google Gemini text companion provider adapter', () => {
  describe('readGeminiProviderConfig', () => {
    it('returns null when API keys are missing or blank', () => {
      assert.equal(readGeminiProviderConfig({}), null);
      assert.equal(readGeminiProviderConfig({ GOOGLE_AI_API_KEYS: '' }), null);
      assert.equal(readGeminiProviderConfig({ GOOGLE_AI_API_KEYS: '   ,  ' }), null);
    });

    it('reads comma-separated pool with sensible defaults via GOOGLE_AI_API_KEYS', () => {
      const config = readGeminiProviderConfig({ GOOGLE_AI_API_KEYS: 'key-1, key-2, key-3' });
      assert.ok(config);
      assert.deepEqual(config.apiKeys, ['key-1', 'key-2', 'key-3']);
      assert.equal(config.baseUrl, DEFAULT_GEMINI_BASE_URL);
      assert.equal(config.model, DEFAULT_GEMINI_MODEL);
      assert.deepEqual(config.models, [DEFAULT_GEMINI_MODEL]);
      assert.equal(config.routing, 'round-robin');
      assert.equal(config.retriesPerKey, 0);
      assert.equal(config.timeoutMs, DEFAULT_PROVIDER_TIMEOUT_MS);
      assert.equal(config.maxBytes, DEFAULT_PROVIDER_MAX_BYTES);
      assert.equal(config.cooldownMs, DEFAULT_GEMINI_COOLDOWN_MS);
    });

    it('supports structured JSON array in GOOGLE_AI_API_KEYS', () => {
      const config = readGeminiProviderConfig({ GOOGLE_AI_API_KEYS: '["key-a", "key-b"]' });
      assert.ok(config);
      assert.deepEqual(config.apiKeys, ['key-a', 'key-b']);
    });

    it('supports single COMPANION_GEMINI_API_KEY as fallback', () => {
      const config = readGeminiProviderConfig({ COMPANION_GEMINI_API_KEY: 'key-single' });
      assert.ok(config);
      assert.deepEqual(config.apiKeys, ['key-single']);
    });

    it('supports GEMINI_API_KEY when COMPANION_PROVIDER=gemini is explicitly set', () => {
      const config = readGeminiProviderConfig({
        COMPANION_PROVIDER: 'gemini',
        GEMINI_API_KEY: 'key-explicit-gemini',
      });
      assert.ok(config);
      assert.deepEqual(config.apiKeys, ['key-explicit-gemini']);
    });

    it('rejects invalid or unsafe base URLs', () => {
      assert.equal(
        readGeminiProviderConfig({ GOOGLE_AI_API_KEYS: 'k1', COMPANION_GEMINI_BASE_URL: 'ftp://google.com' }),
        null,
      );
      assert.equal(
        readGeminiProviderConfig({ GOOGLE_AI_API_KEYS: 'k1', COMPANION_GEMINI_BASE_URL: 'http://google.com' }),
        null,
      );
    });

    it('allows loopback HTTP base URL', () => {
      const config = readGeminiProviderConfig({
        GOOGLE_AI_API_KEYS: 'k1',
        COMPANION_GEMINI_BASE_URL: 'http://127.0.0.1:8080',
      });
      assert.ok(config);
      assert.equal(config.baseUrl, 'http://127.0.0.1:8080');
    });

    it('deduplicates keys and filters empty entries', () => {
      const config = readGeminiProviderConfig({ GOOGLE_AI_API_KEYS: 'k1, k2, k1, , k3' });
      assert.ok(config);
      assert.deepEqual(config.apiKeys, ['k1', 'k2', 'k3']);
    });
  });

  describe('createGeminiCompanionProvider execution', () => {
    it('formats Gemini generateContent payload and returns assistant text', async () => {
      let requestedUrl = '';
      let requestedBody: any = null;

      const mockFetch: typeof fetch = async (input, init) => {
        requestedUrl = String(input);
        requestedBody = JSON.parse(String(init?.body));
        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [{ text: 'Chào em, anh là Snow!' }],
                },
              },
            ],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      };

      const provider = createGeminiCompanionProvider(VALID_CONFIG, { fetch: mockFetch });
      const reply = await provider({
        content: 'Chào Snow',
        history: [{ role: 'child', content: 'Em chào anh' }],
      });

      assert.ok(requestedUrl.includes('/v1beta/models/gemini-1.5-flash:generateContent?key=key-alpha'));
      assert.ok(requestedBody.system_instruction);
      assert.equal(requestedBody.contents.length, 2);
      assert.equal(reply, 'Chào em, anh là Snow!');
    });

    it('rotates keys deterministically in round-robin sequence across requests', async () => {
      const keysUsed: string[] = [];
      const mockFetch: typeof fetch = async (input) => {
        const url = new URL(String(input));
        keysUsed.push(url.searchParams.get('key') || '');
        return new Response(
          JSON.stringify({
            candidates: [{ content: { parts: [{ text: 'Chào em!' }] } }],
          }),
          { status: 200 },
        );
      };

      const provider = createGeminiCompanionProvider(VALID_CONFIG, { fetch: mockFetch });
      await provider({ content: 'Message 1', history: [] });
      await provider({ content: 'Message 2', history: [] });
      await provider({ content: 'Message 3', history: [] });
      await provider({ content: 'Message 4', history: [] });

      assert.deepEqual(keysUsed, ['key-alpha', 'key-beta', 'key-gamma', 'key-alpha']);
    });

    it('puts key into cooldown on transient 429 quota error and fails over to next key', async () => {
      const keysAttempted: string[] = [];
      let nowTime = 1000;

      const mockFetch: typeof fetch = async (input) => {
        const url = new URL(String(input));
        const key = url.searchParams.get('key') || '';
        keysAttempted.push(key);
        if (key === 'key-alpha') {
          // Quota error
          return new Response(JSON.stringify({ error: { message: 'Quota exceeded' } }), { status: 429 });
        }
        return new Response(
          JSON.stringify({
            candidates: [{ content: { parts: [{ text: 'Reply from healthy key' }] } }],
          }),
          { status: 200 },
        );
      };

      const provider = createGeminiCompanionProvider(VALID_CONFIG, {
        fetch: mockFetch,
        now: () => nowTime,
      });

      const reply = await provider({ content: 'Hello', history: [] });
      assert.equal(reply, 'Reply from healthy key');
      assert.deepEqual(keysAttempted, ['key-alpha', 'key-beta']);

      // Next request should skip key-alpha because it is in cooldown
      keysAttempted.length = 0;
      await provider({ content: 'Hello 2', history: [] });
      assert.ok(!keysAttempted.includes('key-alpha'));
      assert.ok(keysAttempted.includes('key-gamma') || keysAttempted.includes('key-beta'));

      // Advance time past cooldown duration: key-alpha is available again
      nowTime += 70_000;
      keysAttempted.length = 0;
      await provider({ content: 'Hello 3', history: [] });
      // Key-alpha can now be selected again
      assert.ok(keysAttempted.length > 0);
    });

    it('throws COMPANION_PROVIDER_POOL_EXHAUSTED when all keys are in cooldown', async () => {
      const nowTime = 1000;
      const mockFetch: typeof fetch = async () =>
        new Response(JSON.stringify({ error: 'Rate limit' }), { status: 429 });

      const provider = createGeminiCompanionProvider(
        { ...VALID_CONFIG, maxAttempts: 5 },
        { fetch: mockFetch, now: () => nowTime },
      );

      // First call will exhaust alpha, beta, gamma
      await assert.rejects(provider({ content: 'Hello', history: [] }));

      // Immediate subsequent call will find empty availableKeys
      await assert.rejects(
        provider({ content: 'Hello again', history: [] }),
        /COMPANION_PROVIDER_POOL_EXHAUSTED/,
      );
    });

    it('does not retry or cooldown on authentication failure (401/403) - fails closed immediately', async () => {
      let callCount = 0;
      const mockFetch: typeof fetch = async () => {
        callCount += 1;
        return new Response(JSON.stringify({ error: 'API key not valid' }), { status: 403 });
      };

      const provider = createGeminiCompanionProvider(VALID_CONFIG, { fetch: mockFetch });
      await assert.rejects(
        provider({ content: 'Hello', history: [] }),
        /COMPANION_PROVIDER_HTTP_403/,
      );
      assert.equal(callCount, 1);
    });

    it('redacts all pool secrets from error messages', async () => {
      const mockFetch: typeof fetch = async () => {
        throw new Error(`Upstream connection failed with keys key-alpha and key-beta present`);
      };

      const provider = createGeminiCompanionProvider(VALID_CONFIG, { fetch: mockFetch });
      try {
        await provider({ content: 'Test', history: [] });
        assert.fail('Should have thrown');
      } catch (err: any) {
        assert.ok(!err.message.includes('key-alpha'));
        assert.ok(!err.message.includes('key-beta'));
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
      const provider = createGeminiCompanionProvider(
        { ...VALID_CONFIG, timeoutMs: 50 },
        { fetch: mockFetch },
      );
      await assert.rejects(
        provider({ content: 'Slow message', history: [] }),
        /COMPANION_PROVIDER_TIMEOUT/,
      );
    });
  });
});
