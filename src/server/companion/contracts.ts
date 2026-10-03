export type Provider = (input: { content: string; history: Array<{ role: 'child' | 'assistant'; content: string }> }) => Promise<string>;

let testProvider: Provider | null = null;

export function setTestCompanionProvider(provider: Provider | null): void {
  testProvider = provider;
}

export async function generateReply(input: Parameters<Provider>[0]): Promise<string> {
  const provider = testProvider;
  if (provider) return provider(input);
  throw new Error('COMPANION_PROVIDER_UNAVAILABLE');
}

export function checkSafety(content: string): { flagged: boolean; reason: string | null; codes: string[] } {
  const text = content.toLowerCase();
  const checks: Array<[string, RegExp]> = [
    ['self_harm', /\b(kill myself|hurt myself|suicid|self[- ]harm)\b/],
    ['abuse_disclosure', /\b(hitting me|touching me|abusing me|hurt me at home)\b/],
    ['immediate_danger', /\b(in danger|someone is hurting me|unsafe right now)\b/],
  ];
  const codes = checks.filter(([, pattern]) => pattern.test(text)).map(([code]) => code);
  return { flagged: codes.length > 0, reason: codes.length ? 'Potential safety concern detected.' : null, codes };
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
