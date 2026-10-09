import { type Provider, type ProviderInput, isDiscordCredential } from './contracts';

export type GeminiProviderConfig = {
  apiKeys: string[];
  baseUrl: string;
  model: string;
  models: string[];
  routing: 'round-robin';
  retriesPerKey: number;
  maxAttempts: number;
  timeoutMs: number;
  maxBytes: number;
  cooldownMs: number;
};

export const DEFAULT_GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com';
export const DEFAULT_GEMINI_MODEL = 'gemini-1.5-flash';
export const DEFAULT_PROVIDER_TIMEOUT_MS = 15_000;
export const DEFAULT_PROVIDER_MAX_BYTES = 65_536;
export const DEFAULT_PROVIDER_MAX_ATTEMPTS = 3;
export const DEFAULT_GEMINI_COOLDOWN_MS = 60_000;

const SYSTEM_PROMPT =
  'You are Snow, a warm, friendly, encouraging, and age-appropriate companion for children. ' +
  'You must always respond in natural, age-appropriate Vietnamese. ' +
  'Keep responses supportive, engaging, concise, and safe. Never ask for or encourage sharing sensitive personal details. ' +
  'Never claim that you contacted a parent, emergency service, or another person. If a child may be in danger, encourage them to tell a trusted adult nearby.';

const MAX_HISTORY_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 8_000;
const MAX_CONFIGURED_KEYS = 16;
const MAX_CONFIGURED_MODELS = 8;

function boundedInteger(value: string | undefined, fallback: number, min: number, max: number): number {
  if (value === undefined || value === '') return fallback;
  if (!/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) return fallback;
  return parsed;
}

function parseKeys(rawKeys: string | undefined, env?: Readonly<Record<string, string | undefined>>): string[] | null {
  if (!rawKeys || typeof rawKeys !== 'string') return null;
  const trimmed = rawKeys.trim();
  if (!trimmed) return null;

  // Support JSON array format e.g. ["key1", "key2"] or comma-separated
  let candidates: string[] = [];
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        candidates = parsed.map((k) => (typeof k === 'string' ? k.trim() : ''));
      }
    } catch {
      return null;
    }
  } else {
    candidates = trimmed.split(',').map((k) => k.trim());
  }

  // Fail closed if any candidate is a Discord credential
  if (candidates.some((k) => isDiscordCredential(k, env))) {
    return null;
  }

  const valid = candidates.filter((k) => k.length > 0 && !/[\u0000-\u001f\u007f]/.test(k));
  const unique = [...new Set(valid)];
  if (unique.length === 0 || unique.length > MAX_CONFIGURED_KEYS) return null;
  return unique;
}

function parseModels(rawModels: string | undefined, fallback: string): string[] | null {
  if (rawModels === undefined || rawModels.trim() === '') return [fallback];
  const candidates = rawModels.split(',').map((value) => value.trim());
  if (candidates.some((value) => !value || value.length > 200 || /[\u0000-\u001f\u007f]/.test(value))) return null;
  const unique = [...new Set(candidates)];
  if (unique.length === 0 || unique.length > MAX_CONFIGURED_MODELS) return null;
  return unique;
}

export function readGeminiProviderConfig(
  env: Readonly<Record<string, string | undefined>> = process.env,
): GeminiProviderConfig | null {
  const rawKeys =
    env.GOOGLE_AI_API_KEYS ||
    env.COMPANION_GEMINI_API_KEYS ||
    env.COMPANION_GOOGLE_AI_API_KEYS ||
    (env.COMPANION_PROVIDER === 'gemini' || env.COMPANION_PROVIDER === 'google'
      ? env.GEMINI_API_KEY || env.GOOGLE_AI_API_KEY
      : undefined) ||
    env.COMPANION_GEMINI_API_KEY;

  const apiKeys = parseKeys(rawKeys, env);
  if (!apiKeys || apiKeys.length === 0) return null;

  const rawBaseUrl =
    env.COMPANION_GEMINI_BASE_URL ||
    env.GOOGLE_AI_BASE_URL ||
    DEFAULT_GEMINI_BASE_URL;

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawBaseUrl);
  } catch {
    return null;
  }
  const isLoopback =
    parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1' || parsedUrl.hostname === '::1';
  if (parsedUrl.username || parsedUrl.password || parsedUrl.search || parsedUrl.hash) return null;
  if (parsedUrl.protocol !== 'https:' && !(parsedUrl.protocol === 'http:' && isLoopback)) return null;
  const baseUrl = parsedUrl.origin + parsedUrl.pathname.replace(/\/+$/, '');

  const rawModel =
    env.COMPANION_GEMINI_MODEL ||
    env.GOOGLE_AI_MODEL ||
    DEFAULT_GEMINI_MODEL;
  const model = typeof rawModel === 'string' && rawModel.trim() ? rawModel.trim() : DEFAULT_GEMINI_MODEL;

  const models = parseModels(
    env.COMPANION_GEMINI_MODELS || env.GOOGLE_AI_MODELS,
    model,
  );
  if (!models) return null;

  const retriesPerKey = boundedInteger(env.COMPANION_PROVIDER_RETRIES_PER_KEY, 0, 0, 2);
  const maxAttempts = boundedInteger(
    env.COMPANION_PROVIDER_MAX_ATTEMPTS,
    Math.min(DEFAULT_PROVIDER_MAX_ATTEMPTS, apiKeys.length * (retriesPerKey + 1)),
    1,
    8,
  );
  const timeoutMs = boundedInteger(env.COMPANION_PROVIDER_TIMEOUT_MS, DEFAULT_PROVIDER_TIMEOUT_MS, 500, 120_000);
  const maxBytes = boundedInteger(env.COMPANION_PROVIDER_MAX_BYTES, DEFAULT_PROVIDER_MAX_BYTES, 1024, 10_485_760);
  const cooldownMs = boundedInteger(env.COMPANION_GEMINI_COOLDOWN_MS, DEFAULT_GEMINI_COOLDOWN_MS, 1_000, 300_000);

  return {
    apiKeys,
    baseUrl,
    model: models[0],
    models,
    routing: 'round-robin',
    retriesPerKey,
    maxAttempts,
    timeoutMs,
    maxBytes,
    cooldownMs,
  };
}

export type GeminiProviderOptions = {
  fetch?: typeof fetch;
  now?: () => number;
};

type AttemptError = Error & { retrySameKey?: boolean; retryNextKey?: boolean; quotaOrTransient?: boolean };

function providerError(
  message: string,
  retrySameKey: boolean,
  retryNextKey: boolean,
  quotaOrTransient: boolean = false,
): AttemptError {
  const error = new Error(message) as AttemptError;
  error.retrySameKey = retrySameKey;
  error.retryNextKey = retryNextKey;
  error.quotaOrTransient = quotaOrTransient;
  return error;
}

function redactSecrets(message: string, secrets: string[]): string {
  let redacted = message;
  for (const secret of secrets) {
    if (secret) {
      redacted = redacted.split(secret).join('[REDACTED]');
    }
  }
  return redacted;
}

async function readBoundedResponse(response: Response, maxBytes: number): Promise<string> {
  const contentLengthHeader = response.headers?.get('content-length');
  if (contentLengthHeader) {
    const contentLength = Number(contentLengthHeader);
    if (Number.isSafeInteger(contentLength) && contentLength > maxBytes) {
      throw providerError('COMPANION_PROVIDER_PAYLOAD_TOO_LARGE', false, true);
    }
  }

  const body = response.body;
  if (!body || typeof body.getReader !== 'function') {
    const responseText = await response.text();
    if (Buffer.byteLength(responseText, 'utf8') > maxBytes) {
      throw providerError('COMPANION_PROVIDER_PAYLOAD_TOO_LARGE', false, true);
    }
    return responseText;
  }

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      receivedBytes += value.byteLength;
      if (receivedBytes > maxBytes) {
        await reader.cancel().catch(() => {});
        throw providerError('COMPANION_PROVIDER_PAYLOAD_TOO_LARGE', false, true);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock?.();
  }
  const combined = new Uint8Array(receivedBytes);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder('utf-8').decode(combined);
}

function parseGeminiReply(body: string): string | null {
  let data: unknown;
  try {
    data = JSON.parse(body);
  } catch {
    throw providerError('COMPANION_PROVIDER_MALFORMED_JSON', false, true);
  }
  const payload = data as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: unknown }>;
      };
    }>;
  };
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return null;
  const texts = parts.map((p) => (typeof p.text === 'string' ? p.text : '')).filter(Boolean);
  return texts.join('');
}

export function createGeminiCompanionProvider(
  config: GeminiProviderConfig,
  options: GeminiProviderOptions = {},
): Provider {
  const fetchFn = options.fetch ?? globalThis.fetch;
  const nowFn = options.now ?? Date.now;
  const configuredKeys = [...config.apiKeys];
  const cooldowns = new Map<string, number>(); // apiKey -> cooldown expiration timestamp
  let keyCursor = 0;

  return async function geminiCompanionProvider(input: ProviderInput): Promise<string> {
    const now = nowFn();
    // Filter available keys not in cooldown
    // If all keys are in cooldown, pool is exhausted
    const availableKeys = configuredKeys.filter((key) => {
      const exp = cooldowns.get(key);
      return !exp || exp <= now;
    });

    if (availableKeys.length === 0) {
      throw new Error('COMPANION_PROVIDER_POOL_EXHAUSTED');
    }

    // Deterministic round-robin starting position among available keys
    const startIdx = keyCursor % availableKeys.length;
    keyCursor = (keyCursor + 1) % availableKeys.length;
    const orderedKeys = availableKeys.map((_, i) => availableKeys[(startIdx + i) % availableKeys.length]);

    // Build Gemini content payload
    // Gemini supports system_instruction and contents array
    const contents = [
      ...input.history.slice(-MAX_HISTORY_MESSAGES).map((item) => ({
        role: item.role === 'child' ? 'user' : 'model',
        parts: [{ text: item.content.slice(0, MAX_MESSAGE_CHARS) }],
      })),
      {
        role: 'user',
        parts: [{ text: input.content.slice(0, MAX_MESSAGE_CHARS) }],
      },
    ];

    const bodyPayload = JSON.stringify({
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents,
    });

    let attempts = 0;
    let lastError: AttemptError = providerError('COMPANION_PROVIDER_UNAVAILABLE', false, false);

    for (const key of orderedKeys) {
      for (let keyAttempt = 0; keyAttempt <= config.retriesPerKey && attempts < config.maxAttempts; keyAttempt += 1) {
        attempts += 1;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);
        timeoutId.unref?.();

        const endpoint = `${config.baseUrl}/v1beta/models/${encodeURIComponent(config.model)}:generateContent?key=${encodeURIComponent(key)}`;

        try {
          const response = await fetchFn(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Connection: 'keep-alive',
            },
            body: bodyPayload,
            signal: controller.signal,
          });

          if (!response.ok) {
            const status = response.status;
            // Auth failure: 401 or 403 (invalid key) -> fail-closed, do not retry same key, do not cooldown as transient
            if (status === 401 || status === 403) {
              throw providerError(`COMPANION_PROVIDER_HTTP_${status}`, false, false, false);
            }
            // Quota (429) or transient server errors (500, 502, 503, 504, 408): mark cooldown for this key, failover to next key
            if (status === 429 || status >= 500 || status === 408) {
              cooldowns.set(key, nowFn() + config.cooldownMs);
              throw providerError(`COMPANION_PROVIDER_HTTP_${status}`, false, true, true);
            }
            throw providerError(`COMPANION_PROVIDER_HTTP_${status}`, false, false, false);
          }

          const responseText = await readBoundedResponse(response, config.maxBytes);
          const reply = parseGeminiReply(responseText);

          if (typeof reply !== 'string' || !reply.trim()) {
            throw providerError('COMPANION_PROVIDER_EMPTY_REPLY', false, true);
          }
          if (reply.length > MAX_MESSAGE_CHARS) {
            throw providerError('COMPANION_PROVIDER_REPLY_TOO_LARGE', false, true);
          }
          return reply.trim();
        } catch (rawError) {
          if (controller.signal.aborted) {
            lastError = providerError('COMPANION_PROVIDER_TIMEOUT', true, true);
          } else if (rawError instanceof Error) {
            const attemptError = rawError as AttemptError;
            const secretsToRedact = [...config.apiKeys];
            if (process.env.DISCORD_BOT_TOKEN) secretsToRedact.push(process.env.DISCORD_BOT_TOKEN);
            if (process.env.DISCORD_WEBHOOK_URL) secretsToRedact.push(process.env.DISCORD_WEBHOOK_URL);
            lastError = providerError(
              redactSecrets(attemptError.message, secretsToRedact),
              attemptError.retrySameKey ?? false,
              attemptError.retryNextKey ?? true,
              attemptError.quotaOrTransient ?? false,
            );
          } else {
            lastError = providerError('COMPANION_PROVIDER_NETWORK_ERROR', true, true);
          }
        } finally {
          clearTimeout(timeoutId);
        }

        if (!lastError.retrySameKey || attempts >= config.maxAttempts) break;
      }

      if (!lastError.retryNextKey || attempts >= config.maxAttempts) break;
    }

    throw new Error(lastError.message);
  };
}
