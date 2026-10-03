import type { Provider, ProviderInput } from './contracts';

export type OpenAiProviderConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
  maxBytes: number;
};

export const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1';
export const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';
export const DEFAULT_PROVIDER_TIMEOUT_MS = 15_000;
export const DEFAULT_PROVIDER_MAX_BYTES = 65_536; // 64 KB

const SYSTEM_PROMPT =
  'You are Snow, a warm, friendly, encouraging, and age-appropriate companion for children. ' +
  'Keep responses supportive, engaging, concise, and safe. Never ask for or encourage sharing sensitive personal details. ' +
  'Never claim that you contacted a parent, emergency service, or another person. If a child may be in danger, encourage them to tell a trusted adult nearby.';

const MAX_HISTORY_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 8_000;

function positiveInteger(value: string | undefined, fallback: number, min: number, max: number): number {
  if (value === undefined || value === '') return fallback;
  if (!/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) return fallback;
  return parsed;
}

export function readOpenAiProviderConfig(env: Readonly<Record<string, string | undefined>> = process.env): OpenAiProviderConfig | null {
  const apiKey =
    env.COMPANION_OPENAI_API_KEY ||
    env.COMPANION_PROVIDER_API_KEY ||
    (env.COMPANION_PROVIDER === 'openai' ? env.OPENAI_API_KEY : undefined);
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
    return null;
  }

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
  if (parsedUrl.username || parsedUrl.password || parsedUrl.search || parsedUrl.hash) {
    return null;
  }
  if (parsedUrl.protocol !== 'https:' && !(parsedUrl.protocol === 'http:' && isLoopback)) {
    return null;
  }

  // Strip trailing slashes for canonical base URL
  const baseUrl = parsedUrl.origin + parsedUrl.pathname.replace(/\/+$/, '');

  const rawModel =
    env.COMPANION_OPENAI_MODEL ||
    env.COMPANION_PROVIDER_MODEL ||
    (env.COMPANION_PROVIDER === 'openai' ? env.OPENAI_MODEL : undefined) ||
    DEFAULT_OPENAI_MODEL;
  const model = typeof rawModel === 'string' && rawModel.trim() ? rawModel.trim() : DEFAULT_OPENAI_MODEL;

  const timeoutMs = positiveInteger(env.COMPANION_PROVIDER_TIMEOUT_MS, DEFAULT_PROVIDER_TIMEOUT_MS, 500, 120_000);
  const maxBytes = positiveInteger(env.COMPANION_PROVIDER_MAX_BYTES, DEFAULT_PROVIDER_MAX_BYTES, 1024, 10_485_760);

  return {
    apiKey: apiKey.trim(),
    baseUrl,
    model,
    timeoutMs,
    maxBytes,
  };
}

export type OpenAiProviderOptions = {
  fetch?: typeof fetch;
};

function redactSecret(message: string, secret: string): string {
  if (!secret) return message;
  return message.split(secret).join('[REDACTED]');
}

export function createOpenAiCompanionProvider(
  config: OpenAiProviderConfig,
  options: OpenAiProviderOptions = {},
): Provider {
  const fetchFn = options.fetch ?? globalThis.fetch;

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

    const controller = new AbortController();
    let timeoutId: NodeJS.Timeout | null = setTimeout(() => {
      controller.abort(new Error('COMPANION_PROVIDER_TIMEOUT'));
    }, config.timeoutMs);
    timeoutId.unref?.();

    try {
      const response = await fetchFn(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`COMPANION_PROVIDER_HTTP_${response.status}`);
      }

      // Check Content-Length upfront if supplied
      const contentLengthHeader = response.headers?.get('content-length');
      if (contentLengthHeader) {
        const contentLength = Number(contentLengthHeader);
        if (Number.isSafeInteger(contentLength) && contentLength > config.maxBytes) {
          throw new Error('COMPANION_PROVIDER_PAYLOAD_TOO_LARGE');
        }
      }

      let responseText: string;
      const body = response.body;

      if (body && typeof body.getReader === 'function') {
        const reader = body.getReader();
        const chunks: Uint8Array[] = [];
        let receivedBytes = 0;
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              receivedBytes += value.byteLength;
              if (receivedBytes > config.maxBytes) {
                await reader.cancel().catch(() => {});
                throw new Error('COMPANION_PROVIDER_PAYLOAD_TOO_LARGE');
              }
              chunks.push(value);
            }
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
        responseText = new TextDecoder('utf-8').decode(combined);
      } else {
        responseText = await response.text();
        if (Buffer.byteLength(responseText, 'utf8') > config.maxBytes) {
          throw new Error('COMPANION_PROVIDER_PAYLOAD_TOO_LARGE');
        }
      }

      let data: unknown;
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error('COMPANION_PROVIDER_MALFORMED_JSON');
      }

      const payload = data as { choices?: Array<{ message?: { content?: unknown } }> };
      const reply = payload?.choices?.[0]?.message?.content;
      if (typeof reply !== 'string' || !reply.trim()) {
        throw new Error('COMPANION_PROVIDER_EMPTY_REPLY');
      }

      if (reply.length > MAX_MESSAGE_CHARS) {
        throw new Error('COMPANION_PROVIDER_REPLY_TOO_LARGE');
      }

      return reply.trim();
    } catch (rawError) {
      if (controller.signal.aborted) {
        throw new Error('COMPANION_PROVIDER_TIMEOUT');
      }
      const rawMessage = rawError instanceof Error ? rawError.message : String(rawError);
      const safeMessage = redactSecret(rawMessage, config.apiKey);
      throw new Error(safeMessage);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    }
  };
}
