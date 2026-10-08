import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  readOpenAiProviderConfig,
  createOpenAiCompanionProvider,
  DEFAULT_OPENAI_BASE_URL,
  DEFAULT_OPENAI_MODEL,
  DEFAULT_PROVIDER_TIMEOUT_MS,
  DEFAULT_PROVIDER_MAX_BYTES,
  type OpenAiProviderConfig,
} from '@/server/companion/openai-provider';
import { generateReply, setTestCompanionProvider } from '@/server/companion/contracts';

const VALID_CONFIG: OpenAiProviderConfig = {
  apiKey: 'sk-test-secret-key-12345678',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
  models: ['gpt-4o-mini'],
  routing: 'failover',
  retriesPerModel: 0,
  maxAttempts: 1,
  timeoutMs: 15_000,
  maxBytes: 65_536,
};

describe('OpenAI-compatible text companion provider adapter', () => {
  describe('readOpenAiProviderConfig', () => {
    it('returns null when API key is missing or blank', () => {
      assert.equal(readOpenAiProviderConfig({}), null);
      assert.equal(readOpenAiProviderConfig({ OPENAI_API_KEY: '' }), null);
      assert.equal(readOpenAiProviderConfig({ COMPANION_OPENAI_API_KEY: '   ' }), null);
      assert.equal(readOpenAiProviderConfig({ OPENAI_API_KEY: 'unscoped-key' }), null);
    });

    it('reads configuration with sensible defaults via COMPANION_OPENAI_API_KEY', () => {
      const config = readOpenAiProviderConfig({ COMPANION_OPENAI_API_KEY: 'sk-test-key' });
      assert.ok(config);
      assert.equal(config.apiKey, 'sk-test-key');
      assert.equal(config.baseUrl, DEFAULT_OPENAI_BASE_URL);
      assert.equal(config.model, DEFAULT_OPENAI_MODEL);
      assert.deepEqual(config.models, [DEFAULT_OPENAI_MODEL]);
      assert.equal(config.routing, 'failover');
      assert.equal(config.retriesPerModel, 0);
      assert.equal(config.timeoutMs, DEFAULT_PROVIDER_TIMEOUT_MS);
      assert.equal(config.maxBytes, DEFAULT_PROVIDER_MAX_BYTES);
    });

    it('supports COMPANION_PROVIDER_API_KEY as alternate alias', () => {
      const config = readOpenAiProviderConfig({ COMPANION_PROVIDER_API_KEY: 'sk-alias-key' });
      assert.ok(config);
      assert.equal(config.apiKey, 'sk-alias-key');
    });

    it('supports OPENAI_API_KEY when COMPANION_PROVIDER=openai is explicitly enabled', () => {
      const config = readOpenAiProviderConfig({
        COMPANION_PROVIDER: 'openai',
        OPENAI_API_KEY: 'sk-explicit-openai',
      });
      assert.ok(config);
      assert.equal(config.apiKey, 'sk-explicit-openai');
    });

    it('prefers COMPANION_ prefixed environment variables', () => {
      const config = readOpenAiProviderConfig({
        OPENAI_API_KEY: 'key-standard',
        COMPANION_OPENAI_API_KEY: 'key-companion',
        OPENAI_BASE_URL: 'https://api.standard.com/v1',
        COMPANION_OPENAI_BASE_URL: 'https://api.companion.com/v1/',
        OPENAI_MODEL: 'model-standard',
        COMPANION_OPENAI_MODEL: 'model-companion',
        COMPANION_PROVIDER_TIMEOUT_MS: '8000',
        COMPANION_PROVIDER_MAX_BYTES: '32768',
      });
      assert.ok(config);
      assert.equal(config.apiKey, 'key-companion');
      assert.equal(config.baseUrl, 'https://api.companion.com/v1'); // Stripped trailing slash
      assert.equal(config.model, 'model-companion');
      assert.equal(config.timeoutMs, 8000);
      assert.equal(config.maxBytes, 32768);
    });

    it('rejects invalid or unsafe base URLs', () => {
      assert.equal(readOpenAiProviderConfig({ COMPANION_OPENAI_API_KEY: 'sk-key', COMPANION_OPENAI_BASE_URL: 'not-a-url' }), null);
      assert.equal(readOpenAiProviderConfig({ COMPANION_OPENAI_API_KEY: 'sk-key', COMPANION_OPENAI_BASE_URL: 'ftp://api.example.com' }), null);
    });

    it('requires TLS except for loopback providers and rejects URL credentials or query data', () => {
      assert.equal(readOpenAiProviderConfig({ COMPANION_OPENAI_API_KEY: 'sk-key', COMPANION_OPENAI_BASE_URL: 'http://api.example.com/v1' }), null);
      assert.equal(readOpenAiProviderConfig({ COMPANION_OPENAI_API_KEY: 'sk-key', COMPANION_OPENAI_BASE_URL: 'https://user:pass@api.example.com/v1' }), null);
      assert.equal(readOpenAiProviderConfig({ COMPANION_OPENAI_API_KEY: 'sk-key', COMPANION_OPENAI_BASE_URL: 'https://api.example.com/v1?token=unsafe' }), null);
      assert.equal(readOpenAiProviderConfig({ COMPANION_OPENAI_API_KEY: 'sk-key', COMPANION_OPENAI_BASE_URL: 'http://127.0.0.1:8080/v1' })?.baseUrl, 'http://127.0.0.1:8080/v1');
    });

    it('reads a bounded, de-duplicated model pool and routing policy', () => {
      const config = readOpenAiProviderConfig({
        COMPANION_OPENAI_API_KEY: 'sk-key',
        COMPANION_PROVIDER_MODELS: 'free, opencode, free, navin-coding',
        COMPANION_PROVIDER_ROUTING: 'round-robin',
        COMPANION_PROVIDER_RETRIES_PER_MODEL: '1',
        COMPANION_PROVIDER_MAX_ATTEMPTS: '4',
      });
      assert.ok(config);
      assert.deepEqual(config.models, ['free', 'opencode', 'navin-coding']);
      assert.equal(config.model, 'free');
      assert.equal(config.routing, 'round-robin');
      assert.equal(config.retriesPerModel, 1);
      assert.equal(config.maxAttempts, 4);
    });

    it('fails closed for malformed pools or routing policies', () => {
      assert.equal(readOpenAiProviderConfig({ COMPANION_OPENAI_API_KEY: 'sk-key', COMPANION_PROVIDER_MODELS: 'free,,opencode' }), null);
      assert.equal(readOpenAiProviderConfig({ COMPANION_OPENAI_API_KEY: 'sk-key', COMPANION_PROVIDER_ROUTING: 'random' }), null);
    });

    it('falls back to defaults when numeric bounds are violated', () => {
      const config = readOpenAiProviderConfig({
        COMPANION_OPENAI_API_KEY: 'sk-key',
        COMPANION_PROVIDER_TIMEOUT_MS: 'invalid',
        COMPANION_PROVIDER_MAX_BYTES: '-500',
      });
      assert.ok(config);
      assert.equal(config.timeoutMs, DEFAULT_PROVIDER_TIMEOUT_MS);
      assert.equal(config.maxBytes, DEFAULT_PROVIDER_MAX_BYTES);
    });
  });

  describe('createOpenAiCompanionProvider execution', () => {
    it('formats OpenAI chat messages with history and system prompt and returns assistant reply', async () => {
      let capturedUrl = '';
      let capturedHeaders: HeadersInit | undefined;
      let capturedBody: string | undefined;

      const mockFetch: typeof fetch = async (input, init) => {
        capturedUrl = String(input);
        capturedHeaders = init?.headers;
        capturedBody = init?.body as string;

        const responsePayload = {
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'Hello! I am Snow. What would you like to explore today?',
              },
            },
          ],
        };

        return new Response(JSON.stringify(responsePayload), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      const provider = createOpenAiCompanionProvider(VALID_CONFIG, { fetch: mockFetch });
      const reply = await provider({
        content: 'Hi Snow!',
        history: [
          { role: 'child', content: 'What is a volcano?' },
          { role: 'assistant', content: 'A volcano is a mountain that opens downward to a pool of molten rock!' },
        ],
      });

      assert.equal(reply, 'Hello! I am Snow. What would you like to explore today?');
      assert.equal(capturedUrl, 'https://api.openai.com/v1/chat/completions');

      const headers = capturedHeaders as Record<string, string>;
      assert.equal(headers['Authorization'], 'Bearer sk-test-secret-key-12345678');
      assert.equal(headers['Content-Type'], 'application/json');

      const parsedBody = JSON.parse(capturedBody || '{}') as {
        model: string;
        messages: Array<{ role: string; content: string }>;
      };
      assert.equal(parsedBody.model, 'gpt-4o-mini');
      assert.equal(parsedBody.messages.length, 4);
      assert.equal(parsedBody.messages[0].role, 'system');
      assert.ok(parsedBody.messages[0].content.includes('Snow'));
      assert.ok(parsedBody.messages[0].content.includes('Vietnamese'));
      assert.deepEqual(parsedBody.messages[1], { role: 'user', content: 'What is a volcano?' });
      assert.deepEqual(parsedBody.messages[2], { role: 'assistant', content: 'A volcano is a mountain that opens downward to a pool of molten rock!' });
      assert.deepEqual(parsedBody.messages[3], { role: 'user', content: 'Hi Snow!' });
    });

    it('rejects upstream HTTP errors without returning fake responses', async () => {
      const mockFetch: typeof fetch = async () => {
        return new Response(JSON.stringify({ error: { message: 'Rate limit exceeded' } }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      const provider = createOpenAiCompanionProvider(VALID_CONFIG, { fetch: mockFetch });
      await assert.rejects(
        () => provider({ content: 'Test prompt', history: [] }),
        (err: Error) => {
          assert.equal(err.message, 'COMPANION_PROVIDER_HTTP_429');
          return true;
        },
      );
    });

    it('fails over across configured combo models on retryable upstream errors', async () => {
      const attemptedModels: string[] = [];
      const mockFetch: typeof fetch = async (_input, init) => {
        const body = JSON.parse(String(init?.body)) as { model: string };
        attemptedModels.push(body.model);
        if (body.model === 'free') return new Response('{}', { status: 503 });
        return Response.json({ choices: [{ message: { content: 'Fallback reply' } }] });
      };
      const provider = createOpenAiCompanionProvider({
        ...VALID_CONFIG,
        model: 'free',
        models: ['free', 'opencode', 'navin-coding'],
        maxAttempts: 3,
      }, { fetch: mockFetch });
      await assert.doesNotReject(async () => {
        assert.equal(await provider({ content: 'Hello', history: [] }), 'Fallback reply');
      });
      assert.deepEqual(attemptedModels, ['free', 'opencode']);
    });

    it('rotates the first combo in round-robin mode', async () => {
      const attemptedModels: string[] = [];
      const mockFetch: typeof fetch = async (_input, init) => {
        const body = JSON.parse(String(init?.body)) as { model: string };
        attemptedModels.push(body.model);
        return Response.json({ choices: [{ message: { content: 'ok' } }] });
      };
      const provider = createOpenAiCompanionProvider({
        ...VALID_CONFIG,
        model: 'free',
        models: ['free', 'opencode', 'navin-coding'],
        routing: 'round-robin',
        maxAttempts: 3,
      }, { fetch: mockFetch });
      await provider({ content: 'one', history: [] });
      await provider({ content: 'two', history: [] });
      await provider({ content: 'three', history: [] });
      assert.deepEqual(attemptedModels, ['free', 'opencode', 'navin-coding']);
    });

    it('does not rotate or retry when credentials are rejected', async () => {
      let attempts = 0;
      const mockFetch: typeof fetch = async () => {
        attempts += 1;
        return new Response('{}', { status: 401 });
      };
      const provider = createOpenAiCompanionProvider({
        ...VALID_CONFIG,
        model: 'free',
        models: ['free', 'opencode'],
        retriesPerModel: 2,
        maxAttempts: 6,
      }, { fetch: mockFetch });
      await assert.rejects(() => provider({ content: 'Hello', history: [] }), /COMPANION_PROVIDER_HTTP_401/);
      assert.equal(attempts, 1);
    });

    it('bounds retry attempts across models', async () => {
      const attemptedModels: string[] = [];
      const mockFetch: typeof fetch = async (_input, init) => {
        const body = JSON.parse(String(init?.body)) as { model: string };
        attemptedModels.push(body.model);
        return new Response('{}', { status: 429 });
      };
      const provider = createOpenAiCompanionProvider({
        ...VALID_CONFIG,
        model: 'free',
        models: ['free', 'opencode', 'navin-coding'],
        retriesPerModel: 1,
        maxAttempts: 4,
      }, { fetch: mockFetch });
      await assert.rejects(() => provider({ content: 'Hello', history: [] }), /COMPANION_PROVIDER_HTTP_429/);
      assert.equal(attemptedModels.length, 4);
      assert.deepEqual(attemptedModels, ['free', 'free', 'opencode', 'opencode']);
    });

    it('rejects empty or whitespace-only assistant content without fake answers', async () => {
      const mockFetch: typeof fetch = async () => {
        return new Response(JSON.stringify({ choices: [{ message: { content: '   ' } }] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      const provider = createOpenAiCompanionProvider(VALID_CONFIG, { fetch: mockFetch });
      await assert.rejects(
        () => provider({ content: 'Test prompt', history: [] }),
        (err: Error) => {
          assert.equal(err.message, 'COMPANION_PROVIDER_EMPTY_REPLY');
          return true;
        },
      );
    });

    it('rejects assistant replies that exceed the persisted message limit', async () => {
      const mockFetch: typeof fetch = async () => new Response(
        JSON.stringify({ choices: [{ message: { content: 'a'.repeat(8_001) } }] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
      const provider = createOpenAiCompanionProvider(VALID_CONFIG, { fetch: mockFetch });
      await assert.rejects(
        () => provider({ content: 'Test prompt', history: [] }),
        (err: Error) => {
          assert.equal(err.message, 'COMPANION_PROVIDER_REPLY_TOO_LARGE');
          return true;
        },
      );
    });

    it('enforces request timeout bounds via AbortController', async () => {
      const mockFetch: typeof fetch = async (_input, init) => {
        return new Promise<Response>((_resolve, reject) => {
          const signal = init?.signal;
          if (signal) {
            signal.addEventListener('abort', () => {
              reject(new Error('The operation was aborted.'));
            });
          }
        });
      };

      const provider = createOpenAiCompanionProvider(
        { ...VALID_CONFIG, timeoutMs: 50 },
        { fetch: mockFetch },
      );

      await assert.rejects(
        () => provider({ content: 'Test timeout', history: [] }),
        (err: Error) => {
          assert.equal(err.message, 'COMPANION_PROVIDER_TIMEOUT');
          return true;
        },
      );
    });

    it('enforces payload size limits via content-length header', async () => {
      const mockFetch: typeof fetch = async () => {
        return new Response('{}', {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': '70000', // exceeds maxBytes: 65536
          },
        });
      };

      const provider = createOpenAiCompanionProvider(VALID_CONFIG, { fetch: mockFetch });
      await assert.rejects(
        () => provider({ content: 'Test size limit', history: [] }),
        (err: Error) => {
          assert.equal(err.message, 'COMPANION_PROVIDER_PAYLOAD_TOO_LARGE');
          return true;
        },
      );
    });

    it('enforces payload size limits while consuming stream chunks', async () => {
      const mockFetch: typeof fetch = async () => {
        const stream = new ReadableStream({
          start(controller) {
            // Push a chunk larger than maxBytes
            controller.enqueue(new Uint8Array(100));
            controller.close();
          },
        });

        return new Response(stream, {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      const provider = createOpenAiCompanionProvider(
        { ...VALID_CONFIG, maxBytes: 50 },
        { fetch: mockFetch },
      );

      await assert.rejects(
        () => provider({ content: 'Test stream size', history: [] }),
        (err: Error) => {
          assert.equal(err.message, 'COMPANION_PROVIDER_PAYLOAD_TOO_LARGE');
          return true;
        },
      );
    });

    it('redacts sensitive API keys from error messages and logs', async () => {
      const secret = 'super-secret-production-key-999';
      const mockFetch: typeof fetch = async () => {
        throw new Error(`Failed to reach upstream with authorization Bearer ${secret}`);
      };

      const provider = createOpenAiCompanionProvider(
        { ...VALID_CONFIG, apiKey: secret },
        { fetch: mockFetch },
      );

      await assert.rejects(
        () => provider({ content: 'Secret leakage test', history: [] }),
        (err: Error) => {
          assert.ok(!err.message.includes(secret), 'Secret key must NEVER appear in error messages');
          assert.ok(err.message.includes('[REDACTED]'), 'Secret should be redacted with [REDACTED]');
          return true;
        },
      );
    });

    it('aggregates text/event-stream chunks (delta and message) into the final reply', async () => {
      const sse = [
        'data: {"choices":[{"delta":{"role":"assistant"}}]}',
        '',
        'data: {"choices":[{"delta":{"content":"Hello"}}]}',
        '',
        'data: {"choices":[{"delta":{"content":" from"}}]}',
        '',
        'data: {"choices":[{"message":{"content":" the stream."}}]}',
        '',
        'data: [DONE]',
        '',
        'data: {"choices":[{"delta":{"content":"ignored after done"}}]}',
      ].join('\n');

      const mockFetch: typeof fetch = async () => new Response(sse, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      });

      const provider = createOpenAiCompanionProvider(VALID_CONFIG, { fetch: mockFetch });
      assert.equal(await provider({ content: 'Hi', history: [] }), 'Hello from the stream.');
    });

    it('detects an event stream from the body when the content-type is generic', async () => {
      const sse = 'data: {"choices":[{"delta":{"content":"Streamed "}}]}\ndata: {"choices":[{"delta":{"content":"reply"}}]}\ndata: [DONE]\n';
      const mockFetch: typeof fetch = async () => new Response(sse, { status: 200 });

      const provider = createOpenAiCompanionProvider(VALID_CONFIG, { fetch: mockFetch });
      assert.equal(await provider({ content: 'Hi', history: [] }), 'Streamed reply');
    });

    it('retries the same model once when a 200 response is empty, then succeeds', async () => {
      let attempts = 0;
      const mockFetch: typeof fetch = async () => {
        attempts += 1;
        if (attempts === 1) {
          return Response.json({ choices: [{ message: { content: '' }, finish_reason: 'in_progress' }] });
        }
        return Response.json({ choices: [{ message: { content: 'Recovered reply' } }] });
      };

      const provider = createOpenAiCompanionProvider(
        { ...VALID_CONFIG, model: 'free', models: ['free'], retriesPerModel: 1, maxAttempts: 2 },
        { fetch: mockFetch },
      );

      assert.equal(await provider({ content: 'Hi', history: [] }), 'Recovered reply');
      assert.equal(attempts, 2);
    });

    it('fails over to the next model when a model keeps returning empty content', async () => {
      const attemptedModels: string[] = [];
      const mockFetch: typeof fetch = async (_input, init) => {
        const body = JSON.parse(String(init?.body)) as { model: string };
        attemptedModels.push(body.model);
        if (body.model === 'free') {
          return Response.json({ choices: [{ message: { content: '   ' }, finish_reason: 'in_progress' }] });
        }
        return Response.json({ choices: [{ message: { content: 'Fallback reply' } }] });
      };

      const provider = createOpenAiCompanionProvider(
        { ...VALID_CONFIG, model: 'free', models: ['free', 'opencode'], maxAttempts: 2 },
        { fetch: mockFetch },
      );

      assert.equal(await provider({ content: 'Hi', history: [] }), 'Fallback reply');
      assert.deepEqual(attemptedModels, ['free', 'opencode']);
    });

    it('treats an event stream with no usable text as empty without fabricating content', async () => {
      const mockFetch: typeof fetch = async () => new Response('data: {"choices":[{"delta":{"role":"assistant"}}]}\ndata: [DONE]\n', {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      });

      const provider = createOpenAiCompanionProvider(VALID_CONFIG, { fetch: mockFetch });
      await assert.rejects(
        () => provider({ content: 'Test prompt', history: [] }),
        (err: Error) => {
          assert.equal(err.message, 'COMPANION_PROVIDER_EMPTY_REPLY');
          return true;
        },
      );
    });
  });

  describe('generateReply contracts integration', () => {
    it('throws COMPANION_PROVIDER_UNAVAILABLE when no testProvider and no env config is set', async () => {
      setTestCompanionProvider(null);
      const originalKey = process.env.OPENAI_API_KEY;
      const originalCompanionKey = process.env.COMPANION_OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;
      delete process.env.COMPANION_OPENAI_API_KEY;

      try {
        await assert.rejects(
          () => generateReply({ content: 'Hello', history: [] }),
          (err: Error) => {
            assert.equal(err.message, 'COMPANION_PROVIDER_UNAVAILABLE');
            return true;
          },
        );
      } finally {
        if (originalKey !== undefined) process.env.OPENAI_API_KEY = originalKey;
        if (originalCompanionKey !== undefined) process.env.COMPANION_OPENAI_API_KEY = originalCompanionKey;
      }
    });

    it('uses injected test provider when set via setTestCompanionProvider', async () => {
      setTestCompanionProvider(async ({ content }) => `Injected echo: ${content}`);
      try {
        const reply = await generateReply({ content: 'Testing injection', history: [] });
        assert.equal(reply, 'Injected echo: Testing injection');
      } finally {
        setTestCompanionProvider(null);
      }
    });

    it('persists round-robin rotation across generateReply calls on one config', async () => {
      setTestCompanionProvider(null);
      const envKeys = [
        'COMPANION_OPENAI_API_KEY',
        'COMPANION_PROVIDER_MODELS',
        'COMPANION_PROVIDER_ROUTING',
      ] as const;
      const savedEnv = envKeys.map((key) => [key, process.env[key]] as const);
      process.env.COMPANION_OPENAI_API_KEY = 'sk-round-robin-key';
      process.env.COMPANION_PROVIDER_MODELS = 'model-a,model-b';
      process.env.COMPANION_PROVIDER_ROUTING = 'round-robin';

      const globalRecord = globalThis as unknown as Record<string, unknown>;
      const originalFetch = globalRecord['fetch'];
      const attemptedModels: string[] = [];
      globalRecord['fetch'] = async (_input: RequestInfo | URL, init?: RequestInit) => {
        const body = JSON.parse(String(init?.body)) as { model: string };
        attemptedModels.push(body.model);
        return Response.json({ choices: [{ message: { content: 'ok' } }] });
      };

      try {
        assert.equal(await generateReply({ content: 'one', history: [] }), 'ok');
        assert.equal(await generateReply({ content: 'two', history: [] }), 'ok');
      } finally {
        globalRecord['fetch'] = originalFetch;
        for (const [key, value] of savedEnv) {
          if (value === undefined) delete process.env[key];
          else process.env[key] = value;
        }
      }

      assert.deepEqual(attemptedModels, ['model-a', 'model-b']);
    });
  });
});
