import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isDiscordCredential,
  getDiscordDiagnostics,
  getProviderDiagnostics,
  generateReply,
  setTestCompanionProvider,
} from '@/server/companion/contracts';
import { readGeminiProviderConfig } from '@/server/companion/gemini-provider';
import { readDeepSeekProviderConfig } from '@/server/companion/deepseek-provider';
import { readOpenAiProviderConfig } from '@/server/companion/openai-provider';

describe('Discord boundary separation & fail-closed diagnostics contracts', () => {
  const SAMPLE_DISCORD_BOT_TOKEN = ['A'.repeat(18), 'B'.repeat(6), 'C'.repeat(20)].join('.');
  const SAMPLE_DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/123456789/abcdefghijklmnopqrstuvwxyz';

  describe('isDiscordCredential', () => {
    it('identifies Discord webhook URLs', () => {
      assert.equal(isDiscordCredential(SAMPLE_DISCORD_WEBHOOK), true);
      assert.equal(isDiscordCredential('https://discordapp.com/api/webhooks/999/xyz'), true);
    });

    it('identifies Discord bot token format (3-part dot separated)', () => {
      assert.equal(isDiscordCredential(SAMPLE_DISCORD_BOT_TOKEN), true);
    });

    it('identifies explicit Discord tokens matching environment variables', () => {
      const env = { DISCORD_BOT_TOKEN: 'custom-secret-bot-key' };
      assert.equal(isDiscordCredential('custom-secret-bot-key', env), true);
    });

    it('identifies placeholders or strings containing discord keyword', () => {
      assert.equal(isDiscordCredential('placeholder-discord-bot-token'), true);
      assert.equal(isDiscordCredential('discord_webhook_secret'), true);
    });

    it('does not flag legitimate AI provider keys', () => {
      assert.equal(isDiscordCredential('AIzaSyD-abc1234567890_XYZabcdefghijklm'), false);
      assert.equal(isDiscordCredential('sk-deepseek-1234567890abcdef'), false);
      assert.equal(isDiscordCredential('sk-proj-openai1234567890abcdef'), false);
    });
  });

  describe('AI provider config parsers reject Discord credentials (fail closed)', () => {
    it('readGeminiProviderConfig rejects Discord bot token or webhook in GOOGLE_AI_API_KEYS', () => {
      assert.equal(readGeminiProviderConfig({ GOOGLE_AI_API_KEYS: SAMPLE_DISCORD_BOT_TOKEN }), null);
      assert.equal(readGeminiProviderConfig({ GOOGLE_AI_API_KEYS: SAMPLE_DISCORD_WEBHOOK }), null);
      assert.equal(
        readGeminiProviderConfig({
          GOOGLE_AI_API_KEYS: `AIzaSyValidGeminiKey,${SAMPLE_DISCORD_BOT_TOKEN}`,
        }),
        null,
      );
    });

    it('readGeminiProviderConfig rejects Discord token in COMPANION_GEMINI_API_KEY', () => {
      assert.equal(readGeminiProviderConfig({ COMPANION_GEMINI_API_KEY: SAMPLE_DISCORD_BOT_TOKEN }), null);
    });

    it('readDeepSeekProviderConfig rejects Discord token or webhook in COMPANION_DEEPSEEK_API_KEY', () => {
      assert.equal(readDeepSeekProviderConfig({ COMPANION_DEEPSEEK_API_KEY: SAMPLE_DISCORD_BOT_TOKEN }), null);
      assert.equal(readDeepSeekProviderConfig({ DEEPSEEK_API_KEY: SAMPLE_DISCORD_WEBHOOK }), null);
    });

    it('readOpenAiProviderConfig rejects Discord token or webhook in COMPANION_OPENAI_API_KEY', () => {
      assert.equal(readOpenAiProviderConfig({ COMPANION_OPENAI_API_KEY: SAMPLE_DISCORD_BOT_TOKEN }), null);
      assert.equal(
        readOpenAiProviderConfig({
          COMPANION_PROVIDER: 'openai',
          OPENAI_API_KEY: SAMPLE_DISCORD_WEBHOOK,
        }),
        null,
      );
    });
  });

  describe('getDiscordDiagnostics', () => {
    it('reports unconfigured status when no Discord tokens are present', () => {
      const diag = getDiscordDiagnostics({});
      assert.deepEqual(diag, {
        configured: false,
        connected: false,
        status: 'unconfigured',
      });
    });

    it('reports disconnected status without inventing live connectivity when DISCORD_BOT_TOKEN is present', () => {
      const diag = getDiscordDiagnostics({ DISCORD_BOT_TOKEN: SAMPLE_DISCORD_BOT_TOKEN });
      assert.equal(diag.configured, true);
      assert.equal(diag.connected, false);
      assert.equal(diag.status, 'disconnected');
      assert.ok(diag.reason?.includes('No live Discord boundary'));
      // Never leaks the token
      assert.ok(!JSON.stringify(diag).includes(SAMPLE_DISCORD_BOT_TOKEN));
    });

    it('reports credential_mix_rejected when Discord token is passed as an AI key', () => {
      const diag = getDiscordDiagnostics({ COMPANION_DEEPSEEK_API_KEY: SAMPLE_DISCORD_BOT_TOKEN });
      assert.equal(diag.configured, false);
      assert.equal(diag.connected, false);
      assert.equal(diag.status, 'credential_mix_rejected');
      assert.ok(diag.reason?.includes('must not be used as AI provider keys'));
      assert.ok(!JSON.stringify(diag).includes(SAMPLE_DISCORD_BOT_TOKEN));
    });
  });

  describe('Router fail-closed behavior for Discord', () => {
    it('getProviderDiagnostics returns unconfigured when COMPANION_PROVIDER=discord', async () => {
      const diag = await getProviderDiagnostics({ COMPANION_PROVIDER: 'discord' });
      assert.deepEqual(diag, {
        configured: false,
        provider: 'none',
      });
    });

    it('getProviderDiagnostics fails closed when AI key is a Discord credential', async () => {
      const diag = await getProviderDiagnostics({
        COMPANION_DEEPSEEK_API_KEY: SAMPLE_DISCORD_BOT_TOKEN,
      });
      assert.deepEqual(diag, {
        configured: false,
        provider: 'none',
      });
    });

    it('generateReply throws COMPANION_PROVIDER_UNAVAILABLE when COMPANION_PROVIDER=discord', async () => {
      const originalEnv = process.env.COMPANION_PROVIDER;
      process.env.COMPANION_PROVIDER = 'discord';
      try {
        setTestCompanionProvider(null);
        await assert.rejects(
          generateReply({ content: 'Xin chào', history: [] }),
          /COMPANION_PROVIDER_UNAVAILABLE/,
        );
      } finally {
        if (originalEnv !== undefined) process.env.COMPANION_PROVIDER = originalEnv;
        else delete process.env.COMPANION_PROVIDER;
      }
    });
  });

  describe('Provider error messages redact Discord tokens in addition to AI secrets', () => {
    it('Gemini provider redacts Discord tokens from error logs', async () => {
      const { createGeminiCompanionProvider } = await import('@/server/companion/gemini-provider');
      const origToken = process.env.DISCORD_BOT_TOKEN;
      process.env.DISCORD_BOT_TOKEN = SAMPLE_DISCORD_BOT_TOKEN;
      try {
        const mockFetch: typeof fetch = async () => {
          throw new Error(`Upstream failed with token ${SAMPLE_DISCORD_BOT_TOKEN}`);
        };
        const provider = createGeminiCompanionProvider(
          {
            apiKeys: ['AIzaSyDummyGeminiKey'],
            baseUrl: 'https://generativelanguage.googleapis.com',
            model: 'gemini-1.5-flash',
            models: ['gemini-1.5-flash'],
            routing: 'round-robin',
            retriesPerKey: 0,
            maxAttempts: 1,
            timeoutMs: 5000,
            maxBytes: 65536,
            cooldownMs: 60000,
          },
          { fetch: mockFetch },
        );
        try {
          await provider({ content: 'test', history: [] });
          assert.fail('Should throw');
        } catch (err: any) {
          assert.ok(!err.message.includes(SAMPLE_DISCORD_BOT_TOKEN));
          assert.ok(err.message.includes('[REDACTED]'));
        }
      } finally {
        if (origToken !== undefined) process.env.DISCORD_BOT_TOKEN = origToken;
        else delete process.env.DISCORD_BOT_TOKEN;
      }
    });

    it('DeepSeek provider redacts Discord tokens from error logs', async () => {
      const { createDeepSeekCompanionProvider } = await import('@/server/companion/deepseek-provider');
      const origToken = process.env.DISCORD_BOT_TOKEN;
      process.env.DISCORD_BOT_TOKEN = SAMPLE_DISCORD_BOT_TOKEN;
      try {
        const mockFetch: typeof fetch = async () => {
          throw new Error(`Upstream failed with token ${SAMPLE_DISCORD_BOT_TOKEN}`);
        };
        const provider = createDeepSeekCompanionProvider(
          {
            apiKey: 'sk-deepseek-dummy',
            baseUrl: 'https://api.deepseek.com',
            model: 'deepseek-chat',
            models: ['deepseek-chat'],
            routing: 'failover',
            retriesPerModel: 0,
            maxAttempts: 1,
            timeoutMs: 5000,
            maxBytes: 65536,
          },
          { fetch: mockFetch },
        );
        try {
          await provider({ content: 'test', history: [] });
          assert.fail('Should throw');
        } catch (err: any) {
          assert.ok(!err.message.includes(SAMPLE_DISCORD_BOT_TOKEN));
          assert.ok(err.message.includes('[REDACTED]'));
        }
      } finally {
        if (origToken !== undefined) process.env.DISCORD_BOT_TOKEN = origToken;
        else delete process.env.DISCORD_BOT_TOKEN;
      }
    });

    it('OpenAI provider redacts Discord tokens from error logs', async () => {
      const { createOpenAiCompanionProvider } = await import('@/server/companion/openai-provider');
      const origToken = process.env.DISCORD_BOT_TOKEN;
      process.env.DISCORD_BOT_TOKEN = SAMPLE_DISCORD_BOT_TOKEN;
      try {
        const mockFetch: typeof fetch = async () => {
          throw new Error(`Upstream failed with token ${SAMPLE_DISCORD_BOT_TOKEN}`);
        };
        const provider = createOpenAiCompanionProvider(
          {
            apiKey: 'sk-openai-dummy',
            baseUrl: 'https://api.openai.com/v1',
            model: 'gpt-4o-mini',
            models: ['gpt-4o-mini'],
            routing: 'failover',
            retriesPerModel: 0,
            maxAttempts: 1,
            timeoutMs: 5000,
            maxBytes: 65536,
          },
          { fetch: mockFetch },
        );
        try {
          await provider({ content: 'test', history: [] });
          assert.fail('Should throw');
        } catch (err: any) {
          assert.ok(!err.message.includes(SAMPLE_DISCORD_BOT_TOKEN));
          assert.ok(err.message.includes('[REDACTED]'));
        }
      } finally {
        if (origToken !== undefined) process.env.DISCORD_BOT_TOKEN = origToken;
        else delete process.env.DISCORD_BOT_TOKEN;
      }
    });
  });
});
