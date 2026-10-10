export type ProviderInput = { content: string; history: Array<{ role: 'child' | 'assistant'; content: string }>; systemPrompt?: string };
export type Provider = (input: ProviderInput) => Promise<string>;

let testProvider: Provider | null = null;

export function setTestCompanionProvider(provider: Provider | null): void {
  testProvider = provider;
}

// Cache the configured provider so its per-instance round-robin cursor persists
// across requests. The config is re-read on every call; when it changes (for
// example after an env update) the provider is rebuilt, resetting routing state.
let cachedProvider: { key: string; provider: Provider } | null = null;

export function isDiscordCredential(
  value: string | undefined,
  env?: Readonly<Record<string, string | undefined>>,
): boolean {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;

  // 1. Check if it matches known Discord env vars if provided
  if (env) {
    if (env.DISCORD_BOT_TOKEN && trimmed === env.DISCORD_BOT_TOKEN.trim()) return true;
    if (env.DISCORD_WEBHOOK_URL && trimmed === env.DISCORD_WEBHOOK_URL.trim()) return true;
  }

  // 2. Check for Discord Webhook URLs or Discord domains
  if (/discord(?:app)?\.com\/api\/webhooks/i.test(trimmed)) return true;
  if (/^https?:\/\/(?:[a-zA-Z0-9-]+\.)*discord(?:app)?\.com/i.test(trimmed)) return true;

  // 3. Check for Discord token keywords / placeholders
  if (/(?:discord[_-]?bot|discord[_-]?token|discord[_-]?webhook)/i.test(trimmed)) return true;

  // 4. Check for Discord bot token pattern: 3 base64/url-safe segments separated by dots
  const parts = trimmed.split('.');
  if (parts.length === 3 && parts.every((p) => /^[A-Za-z0-9_-]+$/.test(p))) {
    if (parts[0].length >= 18 && parts[1].length >= 6 && parts[2].length >= 20) {
      return true;
    }
  }

  return false;
}

export type DiscordDiagnostics = {
  configured: boolean;
  connected: false;
  status: 'unconfigured' | 'disconnected' | 'credential_mix_rejected';
  reason?: string;
};

export function getDiscordDiagnostics(
  env: Readonly<Record<string, string | undefined>> = process.env,
): DiscordDiagnostics {
  // Check for credential mixing in AI key environment variables
  const aiKeyVars = [
    'COMPANION_DEEPSEEK_API_KEY',
    'DEEPSEEK_API_KEY',
    'GOOGLE_AI_API_KEYS',
    'COMPANION_GEMINI_API_KEYS',
    'COMPANION_GOOGLE_AI_API_KEYS',
    'COMPANION_GEMINI_API_KEY',
    'GEMINI_API_KEY',
    'GOOGLE_AI_API_KEY',
    'COMPANION_OPENAI_API_KEY',
    'COMPANION_PROVIDER_API_KEY',
    'OPENAI_API_KEY',
  ];

  for (const varName of aiKeyVars) {
    const val = env[varName];
    if (val && isDiscordCredential(val, env)) {
      return {
        configured: false,
        connected: false,
        status: 'credential_mix_rejected',
        reason: 'Discord credentials must not be used as AI provider keys.',
      };
    }
  }

  const hasBotToken = Boolean(env.DISCORD_BOT_TOKEN?.trim());
  const hasWebhook = Boolean(env.DISCORD_WEBHOOK_URL?.trim());

  if (hasBotToken || hasWebhook) {
    return {
      configured: true,
      connected: false,
      status: 'disconnected',
      reason: 'No live Discord boundary is configured in this runtime. Connectivity remains disabled.',
    };
  }

  return {
    configured: false,
    connected: false,
    status: 'unconfigured',
  };
}

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

  if (explicitProvider === 'discord') {
    return {
      configured: false,
      provider: 'none',
    };
  }

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

  if (explicitProvider === 'discord') {
    throw new Error('COMPANION_PROVIDER_UNAVAILABLE');
  }

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

export type SafetyIntentAssessment = { flagged: boolean; confidence: 'high' | 'medium' | 'low' | 'unknown'; rationale: string };

const SAFETY_INTENT_PROMPT = `You are AgentKid's safety intent classifier. Analyze only the child's latest message. Detect implied intent, not just exact keywords. Return JSON only, with no markdown: {"risk":"high"|"medium"|"none"|"unknown","confidence":"high"|"medium"|"low","rationale":"brief redacted reason"}. Use high when the child expresses or strongly implies wanting to die, suicide, self-harm, hurt themselves, or immediate danger, including indirect, euphemistic, misspelled, Vietnamese, or English statements. Use medium for ambiguous distress without a self-harm or immediate-danger intent. Never provide advice or a conversational response.`;

export async function classifySafetyIntent(content: string): Promise<SafetyIntentAssessment> {
  try {
    const raw = await Promise.race([
      generateReply({ content, history: [], systemPrompt: SAFETY_INTENT_PROMPT }),
      new Promise<string>((_, reject) => setTimeout(() => reject(new Error('SAFETY_INTENT_TIMEOUT')), 2500)),
    ]);
    const parsed = JSON.parse(raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim()) as { risk?: unknown; confidence?: unknown; rationale?: unknown };
    const risk = parsed.risk === 'high' || parsed.risk === 'medium' || parsed.risk === 'none' || parsed.risk === 'unknown' ? parsed.risk : 'unknown';
    const confidence = parsed.confidence === 'high' || parsed.confidence === 'medium' || parsed.confidence === 'low' ? parsed.confidence : 'unknown';
    return { flagged: risk === 'high', confidence, rationale: typeof parsed.rationale === 'string' ? parsed.rationale.slice(0, 240) : 'AI safety classifier result' };
  } catch {
    return { flagged: false, confidence: 'unknown', rationale: 'AI safety classifier unavailable; deterministic safety checks remain active.' };
  }
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
