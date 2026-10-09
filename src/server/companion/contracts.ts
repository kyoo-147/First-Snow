export type ProviderInput = { content: string; history: Array<{ role: 'child' | 'assistant'; content: string }> };
export type Provider = (input: ProviderInput) => Promise<string>;

let testProvider: Provider | null = null;

export function setTestCompanionProvider(provider: Provider | null): void {
  testProvider = provider;
}

// Cache the configured provider so its per-instance round-robin cursor persists
// across requests. The config is re-read on every call; when it changes (for
// example after an env update) the provider is rebuilt, resetting routing state.
let cachedProvider: { key: string; provider: Provider } | null = null;

export type ProviderDiagnostics = {
  configured: boolean;
  provider: 'openai' | 'deepseek' | 'gemini' | 'none';
  model?: string;
  models?: string[];
};

export async function getProviderDiagnostics(
  env: Readonly<Record<string, string | undefined>> = process.env,
): Promise<ProviderDiagnostics> {
  const explicitProvider = env.COMPANION_PROVIDER?.trim().toLowerCase();

  if (explicitProvider === 'gemini' || explicitProvider === 'google') {
    const { readGeminiProviderConfig } = await import('./gemini-provider');
    const geminiConfig = readGeminiProviderConfig(env);
    if (geminiConfig) {
      return {
        configured: true,
        provider: 'gemini',
        model: geminiConfig.model,
        models: geminiConfig.models,
      };
    }
  }

  if (explicitProvider === 'deepseek') {
    const { readDeepSeekProviderConfig } = await import('./deepseek-provider');
    const deepseekConfig = readDeepSeekProviderConfig(env);
    if (deepseekConfig) {
      return {
        configured: true,
        provider: 'deepseek',
        model: deepseekConfig.model,
        models: deepseekConfig.models,
      };
    }
  }

  if (explicitProvider === 'openai') {
    const { readOpenAiProviderConfig } = await import('./openai-provider');
    const openaiConfig = readOpenAiProviderConfig(env);
    if (openaiConfig) {
      return {
        configured: true,
        provider: 'openai',
        model: openaiConfig.model,
        models: openaiConfig.models,
      };
    }
  }

  // Without explicit COMPANION_PROVIDER, auto-detect in prioritized order:
  // 1. DeepSeek
  const { readDeepSeekProviderConfig } = await import('./deepseek-provider');
  const deepseekConfig = readDeepSeekProviderConfig(env);
  if (deepseekConfig && (env.COMPANION_DEEPSEEK_API_KEY || env.DEEPSEEK_API_KEY)) {
    return {
      configured: true,
      provider: 'deepseek',
      model: deepseekConfig.model,
      models: deepseekConfig.models,
    };
  }

  // 2. Gemini
  const { readGeminiProviderConfig } = await import('./gemini-provider');
  const geminiConfig = readGeminiProviderConfig(env);
  if (geminiConfig && (env.GOOGLE_AI_API_KEYS || env.COMPANION_GEMINI_API_KEYS || env.COMPANION_GOOGLE_AI_API_KEYS || env.COMPANION_GEMINI_API_KEY)) {
    return {
      configured: true,
      provider: 'gemini',
      model: geminiConfig.model,
      models: geminiConfig.models,
    };
  }

  // 3. OpenAI / generic OpenAI-compatible
  const { readOpenAiProviderConfig } = await import('./openai-provider');
  const openaiConfig = readOpenAiProviderConfig(env);
  if (openaiConfig) {
    return {
      configured: true,
      provider: 'openai',
      model: openaiConfig.model,
      models: openaiConfig.models,
    };
  }

  return {
    configured: false,
    provider: 'none',
  };
}

export async function generateReply(input: ProviderInput): Promise<string> {
  const provider = testProvider;
  if (provider) return provider(input);

  const env = process.env;
  const explicitProvider = env.COMPANION_PROVIDER?.trim().toLowerCase();

  // Route based on explicit COMPANION_PROVIDER or auto-detection
  if (explicitProvider === 'gemini' || explicitProvider === 'google') {
    const { readGeminiProviderConfig, createGeminiCompanionProvider } = await import('./gemini-provider');
    const config = readGeminiProviderConfig(env);
    if (config) {
      const key = `gemini:${JSON.stringify(config)}`;
      if (!cachedProvider || cachedProvider.key !== key) {
        cachedProvider = { key, provider: createGeminiCompanionProvider(config) };
      }
      return cachedProvider.provider(input);
    }
    throw new Error('COMPANION_PROVIDER_UNAVAILABLE');
  }

  if (explicitProvider === 'deepseek') {
    const { readDeepSeekProviderConfig, createDeepSeekCompanionProvider } = await import('./deepseek-provider');
    const config = readDeepSeekProviderConfig(env);
    if (config) {
      const key = `deepseek:${JSON.stringify(config)}`;
      if (!cachedProvider || cachedProvider.key !== key) {
        cachedProvider = { key, provider: createDeepSeekCompanionProvider(config) };
      }
      return cachedProvider.provider(input);
    }
    throw new Error('COMPANION_PROVIDER_UNAVAILABLE');
  }

  if (explicitProvider === 'openai') {
    const { readOpenAiProviderConfig, createOpenAiCompanionProvider } = await import('./openai-provider');
    const config = readOpenAiProviderConfig(env);
    if (config) {
      const key = `openai:${JSON.stringify(config)}`;
      if (!cachedProvider || cachedProvider.key !== key) {
        cachedProvider = { key, provider: createOpenAiCompanionProvider(config) };
      }
      return cachedProvider.provider(input);
    }
    throw new Error('COMPANION_PROVIDER_UNAVAILABLE');
  }

  // Auto-detect: DeepSeek -> Gemini -> OpenAI
  const { readDeepSeekProviderConfig, createDeepSeekCompanionProvider } = await import('./deepseek-provider');
  const deepseekConfig = readDeepSeekProviderConfig(env);
  if (deepseekConfig && (env.COMPANION_DEEPSEEK_API_KEY || env.DEEPSEEK_API_KEY)) {
    const key = `deepseek:${JSON.stringify(deepseekConfig)}`;
    if (!cachedProvider || cachedProvider.key !== key) {
      cachedProvider = { key, provider: createDeepSeekCompanionProvider(deepseekConfig) };
    }
    return cachedProvider.provider(input);
  }

  const { readGeminiProviderConfig, createGeminiCompanionProvider } = await import('./gemini-provider');
  const geminiConfig = readGeminiProviderConfig(env);
  if (geminiConfig && (env.GOOGLE_AI_API_KEYS || env.COMPANION_GEMINI_API_KEYS || env.COMPANION_GOOGLE_AI_API_KEYS || env.COMPANION_GEMINI_API_KEY)) {
    const key = `gemini:${JSON.stringify(geminiConfig)}`;
    if (!cachedProvider || cachedProvider.key !== key) {
      cachedProvider = { key, provider: createGeminiCompanionProvider(geminiConfig) };
    }
    return cachedProvider.provider(input);
  }

  const { readOpenAiProviderConfig, createOpenAiCompanionProvider } = await import('./openai-provider');
  const openaiConfig = readOpenAiProviderConfig(env);
  if (openaiConfig) {
    const key = `openai:${JSON.stringify(openaiConfig)}`;
    if (!cachedProvider || cachedProvider.key !== key) {
      cachedProvider = { key, provider: createOpenAiCompanionProvider(openaiConfig) };
    }
    return cachedProvider.provider(input);
  }

  throw new Error('COMPANION_PROVIDER_UNAVAILABLE');
}

export function checkSafety(content: string): { flagged: boolean; reason: string | null; codes: string[] } {
  const text = content.toLowerCase();

  const codes = new Set<string>();

  const legacyChecks: Array<[string, RegExp]> = [
    ['self_harm', /\b(kill (?:my|your)self|hurt (?:my|your)self|suicid|self[- ]harm)\b/],
    ['abuse_disclosure', /\b(hitting me|touching me|abusing me|hurt me at home)\b/],
    ['immediate_danger', /\b(in danger|someone is hurting me|unsafe right now)\b/],
  ];
  for (const [code, pattern] of legacyChecks) {
    if (pattern.test(text)) codes.add(code);
  }

  const viChecks: Array<[string, RegExp]> = [
    ['self_harm', /(^|[^\p{L}])(tự tử|muon tu tu|dinh tu tu|tu sat|tự sát|giet minh|giết mình|lam hai ban than|làm hại bản thân|tu lam dau|tự làm đau|muon chet|muốn chết)([^\p{L}]|$)/u],
    ['abuse_disclosure', /(^|[^\p{L}])(đánh (con|em|mình)|(ba|bo|me|ong|nguoi|ho|anh|chi|chu|co) danh (con|em|mình|minh)|(con|em|mình|minh) bi (\p{L}+ )*danh|sờ soạng|so soang|đụng chạm|dung cham|bạo hành|bao hanh|lạm dụng|lam dung|đánh đập|danh dap)([^\p{L}]|$)/u],
    ['immediate_danger', /(^|[^\p{L}])(đang gặp nguy|dang gap nguy|gặp nguy hiểm|gap nguy hiem|cứu con|cuu con|cứu em|cuu em|có người đánh|co nguoi danh)([^\p{L}]|$)/u],
  ];
  for (const [code, pattern] of viChecks) {
    if (pattern.test(text)) codes.add(code);
  }

  const codesArr = Array.from(codes);
  return { flagged: codesArr.length > 0, reason: codesArr.length ? 'Potential safety concern detected.' : null, codes: codesArr };
}

export type Ticket = { token: string; childId: string; sessionId: string; origin: string; expiresAt: number };
export interface TicketStore { put(ticket: Ticket): Promise<void>; consume(token: string, origin: string, now?: number): Promise<Ticket | null> }

export class MemoryTicketStore implements TicketStore {
  private tickets = new Map<string, Ticket>();
  async put(ticket: Ticket): Promise<void> { this.tickets.set(ticket.token, ticket); }
  async consume(token: string, origin: string, now = Date.now()): Promise<Ticket | null> {
    const ticket = this.tickets.get(token);
    this.tickets.delete(token);
    if (!ticket || ticket.expiresAt <= now || ticket.origin !== origin) return null;
    return ticket;
  }
}

let testTicketStore: TicketStore | null = null;
export function setTestTicketStore(store: TicketStore | null): void {
  testTicketStore = store;
}
export function getTicketStore(): TicketStore | null {
  if (testTicketStore) return testTicketStore;
  return null;
}

export function secureWebSocketRequest(requestUrl: string, production: boolean): boolean {
  try {
    const protocol = new URL(requestUrl).protocol;
    return production ? protocol === 'https:' : protocol === 'https:' || protocol === 'http:';
  } catch { return false; }
}

export function resolveCompanionPublicOrigin(
  requestUrl: string,
  configuredOrigin: string | undefined,
  production: boolean,
): string | null {
  try {
    if (configuredOrigin) {
      const parsed = new URL(configuredOrigin);
      if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) return null;
      if (production && parsed.protocol !== 'https:') return null;
      return parsed.origin;
    }
    if (production) return null;
    const reqParsed = new URL(requestUrl);
    if (!['http:', 'https:'].includes(reqParsed.protocol) || reqParsed.username || reqParsed.password) return null;
    return reqParsed.origin;
  } catch { return null; }
}
