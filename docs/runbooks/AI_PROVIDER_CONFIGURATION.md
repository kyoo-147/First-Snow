# AI Provider Configuration Runbook

This guide documents how to safely configure server-side AI provider credentials for the Snow/Mia companion in local development and production environments.

> **CRITICAL SECURITY RULES:**
> - Never commit API keys or credentials to Git repositories, PRs, or public issue trackers.
> - Never pass API keys into client-side code (`NEXT_PUBLIC_*`). All AI completions are strictly server-side.
> - Never use Discord tokens (`DISCORD_BOT_TOKEN` or webhook URLs) as AI provider keys. Discord tokens are for Discord bots only.
> - Diagnostics (`/api/health`) and logs never leak secrets or key substrings; only provider status and model names are reported.

---

## 1. Provider Options Overview

The companion system supports three server-side providers:
1. **DeepSeek** (via its OpenAI-compatible endpoint)
2. **Google Gemini** (with deterministic multi-key round-robin pool & transient cooldown)
3. **OpenAI / OpenAI-compatible**

If no provider credentials are configured, the server fails closed with `503 PROVIDER_UNAVAILABLE` while preserving the child's message history in PostgreSQL.

---

## 2. DeepSeek Configuration
## 2. DeepSeek Configuration

### Production default and latency knobs

For production, set `COMPANION_PROVIDER=deepseek` explicitly so provider choice is deterministic and auditable. The supported explicit values are `deepseek`, `gemini`, and `openai`; without an explicit value, auto-detection remains DeepSeek-first, then Gemini, then OpenAI. Configure `COMPANION_PROVIDER_TIMEOUT_MS`, `COMPANION_PROVIDER_MAX_ATTEMPTS`, `COMPANION_PROVIDER_RETRIES_PER_MODEL`, and the provider-specific model variables in `.env.example`. Never place credentials in source, logs, tests, or chat.

DeepSeek provides an OpenAI-compatible API at `https://api.deepseek.com`.

### Environment Variables
| Variable | Required | Default | Description |
|---|---|---|---|
| `COMPANION_DEEPSEEK_API_KEY` or `DEEPSEEK_API_KEY` | Yes (for DeepSeek) | None | Secret DeepSeek API key (`sk-...`). |
| `COMPANION_DEEPSEEK_BASE_URL` | No | `https://api.deepseek.com` | Base URL. Remote URLs must use HTTPS. |
| `COMPANION_DEEPSEEK_MODEL` | No | `deepseek-chat` | Default model identifier. |
| `COMPANION_DEEPSEEK_MODELS` | No | None | Comma-separated model failover/round-robin pool. |

### Safe Local Setup
In your local `.env.local` (git-ignored):
```env
COMPANION_DEEPSEEK_API_KEY="sk-placeholder-deepseek-api-key"
COMPANION_DEEPSEEK_MODEL="deepseek-chat"
```

---

## 3. Google Gemini Configuration

The Gemini adapter supports a server-only comma-separated pool or JSON array of API keys. It deterministically round-robins keys and applies transient cooldowns (default 60 seconds) if a key experiences rate limits (429) or transient 5xx errors, failing over to remaining available keys without service interruption.

### Environment Variables
| Variable | Required | Default | Description |
|---|---|---|---|
| `GOOGLE_AI_API_KEYS` | Yes (for Gemini pool) | None | Comma-separated list or JSON array of Gemini API keys. |
| `COMPANION_GEMINI_API_KEY` | No (single fallback) | None | Single Gemini API key. |
| `COMPANION_GEMINI_BASE_URL` | No | `https://generativelanguage.googleapis.com` | Base URL (HTTPS required for remote). |
| `COMPANION_GEMINI_MODEL` | No | `gemini-1.5-flash` | Gemini model name (e.g., `gemini-1.5-flash`). |
| `COMPANION_GEMINI_COOLDOWN_MS`| No | `60000` (1 min) | Duration to quarantine keys returning 429. |

### Safe Local Setup
In your local `.env.local` (git-ignored):
```env
GOOGLE_AI_API_KEYS="placeholder-gemini-key-1,placeholder-gemini-key-2"
COMPANION_GEMINI_MODEL="gemini-1.5-flash"
COMPANION_GEMINI_COOLDOWN_MS="60000"
```

---

## 4. Production Secret Entry

In cloud or container production environments (e.g., Kubernetes secrets, AWS Secrets Manager, Vercel/Fly environment variables):

1. Set `NODE_ENV=production`.
2. Provide the production secret directly via environment variables:
   - For DeepSeek: `COMPANION_DEEPSEEK_API_KEY="<actual-secret-from-secret-vault>"`
   - For Gemini: `GOOGLE_AI_API_KEYS="<key1>,<key2>,<key3>"`
3. Verify that `NEXT_PUBLIC_*` prefixes are never used for provider keys.
4. Verify provider health and configuration by querying the redacted health probe:
   ```bash
   curl -s https://<your-service-host>/api/health
   ```
   Expected response:
   ```json
   {
     "status": "ok",
     "checks": {
       "database": "ok",
       "ai_provider": {
         "configured": true,
         "provider": "gemini",
         "model": "gemini-1.5-flash",
         "models": ["gemini-1.5-flash"]
       }
     }
   }
   ```
   Notice that secrets are completely omitted from the health response.

---

## 5. Discord Clarification

- Snow is an AI companion for kids in the Snow app.
- Any Discord integration (such as alert notifications or community bots) must use `DISCORD_BOT_TOKEN` or explicit Discord webhook URLs.
- **Never use a Discord token or webhook URL as an AI provider key.** Discord tokens cannot generate AI completions and will fail authentication.
