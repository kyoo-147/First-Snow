import assert from 'node:assert/strict';
import { describe, it, beforeEach, afterEach } from 'node:test';
import { generateReply, getProviderDiagnostics, setTestCompanionProvider } from '@/server/companion/contracts';

describe('Provider router & diagnostics contracts', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    setTestCompanionProvider(null);
    for (const key of Object.keys(process.env)) {
      if (
        key.includes('OPENAI') ||
        key.includes('DEEPSEEK') ||
        key.includes('GEMINI') ||
        key.includes('GOOGLE') ||
        key.startsWith('COMPANION_')
      ) {
        delete process.env[key];
      }
    }
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('getProviderDiagnostics', () => {
    it('returns unconfigured diagnostics when no keys are provided', async () => {
      const diag = await getProviderDiagnostics({});
      assert.deepEqual(diag, {
        configured: false,
        provider: 'none',
      });
    });

    it('reports DeepSeek provider diagnostics with model and models identifiers', async () => {
      const diag = await getProviderDiagnostics({
        DEEPSEEK_API_KEY: 'sk-deepseek-sample',
        DEEPSEEK_MODEL: 'deepseek-chat',
      });
      assert.deepEqual(diag, {
        configured: true,
        provider: 'deepseek',
        model: 'deepseek-chat',
        models: ['deepseek-chat'],
      });
    });

    it('reports Gemini provider diagnostics with model and models identifiers', async () => {
      const diag = await getProviderDiagnostics({
        GOOGLE_AI_API_KEYS: 'key1,key2',
        GOOGLE_AI_MODEL: 'gemini-1.5-flash',
      });
      assert.deepEqual(diag, {
        configured: true,
        provider: 'gemini',
        model: 'gemini-1.5-flash',
        models: ['gemini-1.5-flash'],
      });
    });

    it('reports OpenAI provider diagnostics with model identifiers', async () => {
      const diag = await getProviderDiagnostics({
        COMPANION_OPENAI_API_KEY: 'sk-openai-sample',
        COMPANION_OPENAI_MODEL: 'gpt-4o-mini',
      });
      assert.deepEqual(diag, {
        configured: true,
        provider: 'openai',
        model: 'gpt-4o-mini',
        models: ['gpt-4o-mini'],
      });
    });

    it('never leaks secret keys in diagnostics output', async () => {
      const secret = 'ultra-secret-key-999';
      const diag = await getProviderDiagnostics({
        COMPANION_DEEPSEEK_API_KEY: secret,
      });
      const serialized = JSON.stringify(diag);
      assert.ok(!serialized.includes(secret));
    });
  });

  describe('generateReply router', () => {
    it('throws COMPANION_PROVIDER_UNAVAILABLE when no provider is configured', async () => {
      await assert.rejects(
        generateReply({ content: 'Xin chào', history: [] }),
        /COMPANION_PROVIDER_UNAVAILABLE/,
      );
    });

    it('honors setTestCompanionProvider override', async () => {
      setTestCompanionProvider(async () => 'mock response');
      const res = await generateReply({ content: 'Xin chào', history: [] });
      assert.equal(res, 'mock response');
    });
  });
});
