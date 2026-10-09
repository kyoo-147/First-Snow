import { type Provider, type ProviderInput, isDiscordCredential } from './contracts';

export type ProviderRouting = 'failover' | 'round-robin';

export type OpenAiProviderConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
  models: string[];
  routing: ProviderRouting;
  retriesPerModel: number;
  maxAttempts: number;
  timeoutMs: number;
  maxBytes: number;
};

export const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1';
export const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';
export const DEFAULT_PROVIDER_TIMEOUT_MS = 15_000;
export const DEFAULT_PROVIDER_MAX_BYTES = 65_536;
export const DEFAULT_PROVIDER_MAX_ATTEMPTS = 3;

const SYSTEM_PROMPT =
  'You are Snow, a warm, friendly, encouraging, and age-appropriate companion for children. ' +
  'You must always respond in natural, age-appropriate Vietnamese. ' +
  'Keep responses supportive, engaging, concise, and safe. Never ask for or encourage sharing sensitive personal details. ' +
  'Never claim that you contacted a parent, emergency service, or another person. If a child may be in danger, encourage them to tell a trusted adult nearby.';

const MAX_HISTORY_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 8_000;
const MAX_CONFIGURED_MODELS = 8;

function boundedInteger(value: string | undefined, fallback: number, min: number, max: number): number {
  if (value === undefined || value === '') return fallback;
  if (!/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) return fallback;
  return parsed;
}

function parseModels(rawModels: string | undefined, fallback: string): string[] | null {
  if (rawModels === undefined || rawModels.trim() === '') return [fallback];
  const candidates = rawModels.split(',').map((value) => value.trim());
  if (candidates.some((value) => !value || value.length > 200 || /[\u0000-\u001f\u007f]/.test(value))) return null;
  const unique = [...new Set(candidates)];
  if (unique.length === 0 || unique.length > MAX_CONFIGURED_MODELS) return null;
  return unique;
}

export function readOpenAiProviderConfig(env: Readonly<Record<string, string | undefined>> = process.env): OpenAiProviderConfig | null {
  const apiKey =
    env.COMPANION_OPENAI_API_KEY ||
    env.COMPANION_PROVIDER_API_KEY ||
    (env.COMPANION_PROVIDER === 'openai' ? env.OPENAI_API_KEY : undefined);
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim() || isDiscordCredential(apiKey, env)) return null;

  const rawBaseUrl =
    env.COMPANION_OPENAI_BASE_URL ||
    env.COMPANION_PROVIDER_BASE_URL ||
    (env.COMPANION_PROVIDER === 'openai' ? env.OPENAI_BASE_URL : undefined) ||
    DEFAULT_OPENAI_BASE_URL;
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawBaseUrl);
  } catch {
    return null;
  }
  const isLoopback = parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1' || parsedUrl.hostname === '::1';
  if (parsedUrl.username || parsedUrl.password || parsedUrl.search || parsedUrl.hash) return null;
  if (parsedUrl.protocol !== 'https:' && !(parsedUrl.protocol === 'http:' && isLoopback)) return null;
  const baseUrl = parsedUrl.origin + parsedUrl.pathname.replace(/\/+$/, '');

  const rawModel =
    env.COMPANION_OPENAI_MODEL ||
    env.COMPANION_PROVIDER_MODEL ||
    (env.COMPANION_PROVIDER === 'openai' ? env.OPENAI_MODEL : undefined) ||
    DEFAULT_OPENAI_MODEL;
  const model = typeof rawModel === 'string' && rawModel.trim() ? rawModel.trim() : DEFAULT_OPENAI_MODEL;
  const models = parseModels(env.COMPANION_OPENAI_MODELS || env.COMPANION_PROVIDER_MODELS, model);
  if (!models) return null;

  const routingValue = env.COMPANION_PROVIDER_ROUTING?.trim().toLowerCase();
  if (routingValue && routingValue !== 'failover' && routingValue !== 'round-robin') return null;
  const routing: ProviderRouting = routingValue === 'round-robin' ? 'round-robin' : 'failover';
  const retriesPerModel = boundedInteger(env.COMPANION_PROVIDER_RETRIES_PER_MODEL, 0, 0, 2);
  const maxAttempts = boundedInteger(
    env.COMPANION_PROVIDER_MAX_ATTEMPTS,
    Math.min(DEFAULT_PROVIDER_MAX_ATTEMPTS, models.length * (retriesPerModel + 1)),
    1,
    8,
  );
  const timeoutMs = boundedInteger(env.COMPANION_PROVIDER_TIMEOUT_MS, DEFAULT_PROVIDER_TIMEOUT_MS, 500, 120_000);
  const maxBytes = boundedInteger(env.COMPANION_PROVIDER_MAX_BYTES, DEFAULT_PROVIDER_MAX_BYTES, 1024, 10_485_760);

  return {
    apiKey: apiKey.trim(),
    baseUrl,
    model: models[0],
    models,
    routing,
    retriesPerModel,
    maxAttempts,
    timeoutMs,
    maxBytes,
  };
}

export type OpenAiProviderOptions = { fetch?: typeof fetch };

type AttemptError = Error & { retrySameModel?: boolean; retryNextModel?: boolean };

function providerError(message: string, retrySameModel: boolean, retryNextModel: boolean): AttemptError {
  const error = new Error(message) as AttemptError;
  error.retrySameModel = retrySameModel;
  error.retryNextModel = retryNextModel;
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

function retryPolicyForStatus(status: number): { same: boolean; next: boolean } {
  if (status === 401 || status === 403) return { same: false, next: false };
  if (status === 404) return { same: false, next: true };
  if ([408, 409, 425, 429].includes(status) || status >= 500) return { same: true, next: true };
  return { same: false, next: false };
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

function isEventStream(contentType: string, body: string): boolean {
  return contentType.toLowerCase().includes('text/event-stream') || body.trimStart().startsWith('data:');
}

function parseJsonReply(body: string): string | null {
  let data: unknown;
  try {
    data = JSON.parse(body);
  } catch {
    throw providerError('COMPANION_PROVIDER_MALFORMED_JSON', false, true);
  }
  const payload = data as { choices?: Array<{ message?: { content?: unknown } }> };
  const content = payload?.choices?.[0]?.message?.content;
  return typeof content === 'string' ? content : null;
}

// Aggregate OpenAI-compatible SSE chunks (`data: {...}` lines). Some upstreams
// stream even when `stream: true` was not requested. Never fabricates content:
// an aggregation with no text yields an empty string (caller fails over).
function aggregateEventStream(body: string): string {
  const parts: string[] = [];
  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line.startsWith('data:')) continue;
    const payload = line.slice('data:'.length).trim();
    if (payload === '[DONE]') break;
    if (!payload) continue;
    let event: unknown;
    try { event = JSON.parse(payload); } catch { continue; }
    const choices = (event as { choices?: Array<{ delta?: { content?: unknown }; message?: { content?: unknown } }> })?.choices;
    if (!Array.isArray(choices)) continue;
    for (const choice of choices) {
      const delta = choice?.delta?.content;
      const message = choice?.message?.content;
      if (typeof delta === 'string') parts.push(delta);
      if (typeof message === 'string') parts.push(message);
    }
  }
  return parts.join('');
}

export function createOpenAiCompanionProvider(
  config: OpenAiProviderConfig,
  options: OpenAiProviderOptions = {},
): Provider {
  const fetchFn = options.fetch ?? globalThis.fetch;
  const configuredModels = config.models?.length ? [...config.models] : [config.model];
  const routing = config.routing ?? 'failover';
  const retriesPerModel = config.retriesPerModel ?? 0;
  const maxAttempts = config.maxAttempts ?? Math.min(DEFAULT_PROVIDER_MAX_ATTEMPTS, configuredModels.length * (retriesPerModel + 1));
  let roundRobinCursor = 0;

  return async function openAiCompanionProvider(input: ProviderInput): Promise<string> {
    const endpoint = `${config.baseUrl}/chat/completions`;
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...input.history.slice(-MAX_HISTORY_MESSAGES).map((item) => ({
        role: item.role === 'child' ? 'user' : 'assistant',
        content: item.content.slice(0, MAX_MESSAGE_CHARS),
      })),
      { role: 'user', content: input.content.slice(0, MAX_MESSAGE_CHARS) },
    ];

    const startIndex = routing === 'round-robin' ? roundRobinCursor++ % configuredModels.length : 0;
    const models = configuredModels.map((_, index) => configuredModels[(startIndex + index) % configuredModels.length]);
    let attempts = 0;
    let lastError: AttemptError = providerError('COMPANION_PROVIDER_UNAVAILABLE', false, false);

    for (const model of models) {
      for (let modelAttempt = 0; modelAttempt <= retriesPerModel && attempts < maxAttempts; modelAttempt += 1) {
        attempts += 1;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);
        timeoutId.unref?.();
        try {
          const response = await fetchFn(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // Keep connections reusable without changing auth or retry semantics.
              Connection: 'keep-alive',
              Authorization: `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({ model, messages, stream: false }),
            signal: controller.signal,
          });
          if (!response.ok) {
            const policy = retryPolicyForStatus(response.status);
            throw providerError(`COMPANION_PROVIDER_HTTP_${response.status}`, policy.same, policy.next);
          }

          const responseText = await readBoundedResponse(response, config.maxBytes);
          const contentType = response.headers?.get('content-type') ?? '';
          const reply = isEventStream(contentType, responseText)
            ? aggregateEventStream(responseText)
            : parseJsonReply(responseText);
          if (typeof reply !== 'string' || !reply.trim()) {
            // An empty 200 (e.g. async `finish_reason: "in_progress"`) may
            // complete on a same-model retry, but still allows next-model failover.
            throw providerError('COMPANION_PROVIDER_EMPTY_REPLY', true, true);
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
            const secretsToRedact = [config.apiKey];
            if (process.env.DISCORD_BOT_TOKEN) secretsToRedact.push(process.env.DISCORD_BOT_TOKEN);
            if (process.env.DISCORD_WEBHOOK_URL) secretsToRedact.push(process.env.DISCORD_WEBHOOK_URL);
            lastError = providerError(
              redactSecrets(attemptError.message, secretsToRedact),
              attemptError.retrySameModel ?? true,
              attemptError.retryNextModel ?? true,
            );
          } else {
            lastError = providerError('COMPANION_PROVIDER_NETWORK_ERROR', true, true);
          }
        } finally {
          clearTimeout(timeoutId);
        }

        if (!lastError.retrySameModel || attempts >= maxAttempts) break;
      }
      if (!lastError.retryNextModel || attempts >= maxAttempts) break;
    }

    throw new Error(lastError.message);
  };
}
