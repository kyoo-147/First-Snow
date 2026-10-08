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

export async function generateReply(input: ProviderInput): Promise<string> {
  const provider = testProvider;
  if (provider) return provider(input);
  const { readOpenAiProviderConfig, createOpenAiCompanionProvider } = await import('./openai-provider');
  const config = readOpenAiProviderConfig();
  if (config) {
    const key = JSON.stringify(config);
    if (!cachedProvider || cachedProvider.key !== key) {
      cachedProvider = { key, provider: createOpenAiCompanionProvider(config) };
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

