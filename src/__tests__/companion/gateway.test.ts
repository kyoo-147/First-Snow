import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { AddressInfo } from 'node:net';
import WebSocket from 'ws';
import {
  CAPABILITIES,
  COMPANION_WS_PATH,
  createCompanionGateway,
  type GatewayConfig,
  type GatewayProviderAdapter,
  type GatewayTicketAdapter,
  type TicketBinding,
  type ConsumedTicket,
  readGatewayConfig,
} from '@/server/companion/gateway';
import { resolveCompanionPublicOrigin } from '@/server/companion/contracts';

const ORIGIN = 'http://app.example';
const SESSION = '11111111-1111-4111-8111-111111111111';

class InjectedTicketAdapter implements GatewayTicketAdapter {
  private readonly tickets = new Map<string, ConsumedTicket & { origin: string; expiresAt: number; path: string }>();
  consumeCount = 0;
  async health(): Promise<boolean> { return true; }
  issue(token: string, sessionId = SESSION, expiresAt = Date.now() + 60_000): void {
    this.tickets.set(token, { childId: 'child-1', sessionId, origin: ORIGIN, path: COMPANION_WS_PATH, expiresAt });
  }
  async consume(binding: TicketBinding): Promise<ConsumedTicket | null> {
    this.consumeCount += 1;
    const ticket = this.tickets.get(binding.token);
    if (!ticket || (binding.sessionId && ticket.sessionId !== binding.sessionId) || ticket.origin !== binding.origin || ticket.path !== binding.path || ticket.expiresAt <= Date.now()) return null;
    this.tickets.delete(binding.token);
    return { childId: ticket.childId, sessionId: ticket.sessionId };
  }
}

const providers: GatewayProviderAdapter = { unavailableProviders: () => ['asr', 'tts', 'llm'] };

function config(overrides: Partial<GatewayConfig> = {}): GatewayConfig {
  return {
    databaseUrl: 'postgres://test:test@localhost/test',
    publicOrigin: ORIGIN,
    production: false,
    host: '127.0.0.1',
    port: 0,
    trustedProxyAddress: '127.0.0.1',
    maxConnections: 8,
    maxFrameBytes: 128,
    heartbeatIntervalMs: 20,
    idleTimeoutMs: 2_000,
    authTimeoutMs: 1_000,
    ...overrides,
  };
}

async function launch(ticketAdapter = new InjectedTicketAdapter(), overrides: Partial<GatewayConfig> = {}) {
  const gateway = createCompanionGateway(config(overrides), { tickets: ticketAdapter, providers, log: () => undefined });
  await new Promise<void>((resolve) => gateway.server.listen(0, '127.0.0.1', resolve));
  const address = gateway.server.address() as AddressInfo;
  return { gateway, tickets: ticketAdapter, url: `ws://127.0.0.1:${address.port}${COMPANION_WS_PATH}` };
}

function connect(url: string, origin = ORIGIN): Promise<WebSocket> {
  const websocket = new WebSocket(url, { headers: { Origin: origin } });
  return new Promise((resolve, reject) => {
    websocket.once('open', () => resolve(websocket));
    websocket.once('error', reject);
  });
}

function connectWithInbox(url: string, origin = ORIGIN): { websocket: WebSocket; messages: ReturnType<typeof inbox>; opened: Promise<WebSocket> } {
  const websocket = new WebSocket(url, { headers: { Origin: origin } });
  const messages = inbox(websocket);
  const opened = new Promise<WebSocket>((resolve, reject) => {
    websocket.once('open', () => resolve(websocket));
    websocket.once('error', reject);
  });
  return { websocket, messages, opened };
}

function inbox(websocket: WebSocket): { waitFor(type: string): Promise<Record<string, unknown>>; all: Record<string, unknown>[] } {
  const all: Record<string, unknown>[] = [];
  const waiters = new Map<string, Array<(message: Record<string, unknown>) => void>>();
  websocket.on('message', (data) => {
    let message: Record<string, unknown>;
    try { message = JSON.parse(data.toString()) as Record<string, unknown>; } catch { return; }
    all.push(message);
    const pending = waiters.get(String(message.type));
    pending?.shift()?.(message);
  });
  return {
    all,
    waitFor(type) {
      const existing = all.find((message) => message.type === type);
      if (existing) return Promise.resolve(existing);
      return new Promise((resolve) => {
        const pending = waiters.get(type) ?? [];
        pending.push(resolve);
        waiters.set(type, pending);
      });
    },
  };
}

async function authenticate(websocket: WebSocket, ticket: string, sessionId = SESSION) {
  const messages = inbox(websocket);
  const connected = messages.waitFor('connected');
  const unavailable = messages.waitFor('provider_unavailable');
  websocket.send(JSON.stringify({ type: 'auth', ticket, sessionId }));
  return { connected: await connected, unavailable: await unavailable, messages };
}

function waitForClose(websocket: WebSocket): Promise<[number, Buffer]> {
  return new Promise((resolve) => websocket.once('close', (code, reason) => resolve([code, reason])));
}

async function rejectedUpgrade(url: string, origin: string, extraHeaders: Record<string, string> = {}): Promise<number> {
  const websocket = new WebSocket(url, { headers: { Origin: origin, ...extraHeaders } });
  return new Promise((resolve, reject) => {
    websocket.once('unexpected-response', (_request, response) => resolve(response.statusCode ?? 0));
    websocket.once('open', () => { websocket.close(); reject(new Error('Unexpected WebSocket connection.')); });
    websocket.once('error', (error) => {
      if (!websocket.listenerCount('unexpected-response')) reject(error);
    });
  });
}

describe('standalone companion WebSocket gateway', () => {
  it('validates gateway environment and canonical origin behind a proxy', () => {
    const parsed = readGatewayConfig({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgres://user:password@db.example/app',
      COMPANION_PUBLIC_ORIGIN: 'https://app.example',
      COMPANION_TRUSTED_PROXY_ADDRESS: '10.0.0.2',
    });
    assert.equal(parsed.publicOrigin, 'https://app.example');
    assert.equal(resolveCompanionPublicOrigin('http://internal:3000/api/companion/ws-ticket', parsed.publicOrigin, true), 'https://app.example');
    assert.throws(() => readGatewayConfig({ NODE_ENV: 'production', DATABASE_URL: 'postgres://x', COMPANION_PUBLIC_ORIGIN: 'http://app.example' }), /HTTPS/);
  });

  it('authenticates exact VoiceClient query parameter ticket transport at upgrade handshake', async (t) => {
    const ticketAdapter = new InjectedTicketAdapter();
    ticketAdapter.issue('ticket-voice-client');
    const running = await launch(ticketAdapter);
    t.after(() => running.gateway.close());

    // VoiceClient connects directly to wss://<host>/api/companion/ws?ticket=<ticket>
    const voiceClientUrl = `${running.url}?ticket=ticket-voice-client`;
    const client = connectWithInbox(voiceClientUrl);
    t.after(() => client.websocket.close());
    await client.opened;

    // Expect immediate capabilities and connected frames without sending an auth frame
    const connectedMsg = await client.messages.waitFor('connected');
    const capabilitiesMsg = await client.messages.waitFor('capabilities');
    const unavailableMsg = await client.messages.waitFor('provider_unavailable');

    assert.equal(ticketAdapter.consumeCount, 1);
    assert.deepEqual(connectedMsg.capabilities, CAPABILITIES);
    assert.deepEqual(capabilitiesMsg.capabilities, CAPABILITIES);
    assert.deepEqual(unavailableMsg.providers, ['asr', 'tts', 'llm']);

    // Replay of the same ticket in query param must be rejected at upgrade handshake (401)
    assert.equal(await rejectedUpgrade(voiceClientUrl, ORIGIN), 401);
  });

  it('rejects expired tickets transported via VoiceClient query parameter at upgrade', async (t) => {
    const ticketAdapter = new InjectedTicketAdapter();
    ticketAdapter.issue('ticket-voice-expired', SESSION, Date.now() - 1);
    const running = await launch(ticketAdapter);
    t.after(() => running.gateway.close());

    const expiredUrl = `${running.url}?ticket=ticket-voice-expired`;
    assert.equal(await rejectedUpgrade(expiredUrl, ORIGIN), 401);
  });

  it('authenticates with a one-time ticket and exposes no input capabilities or fake provider output', async (t) => {
    const ticketAdapter = new InjectedTicketAdapter();
    ticketAdapter.issue('ticket-connect');
    const running = await launch(ticketAdapter);
    t.after(() => running.gateway.close());
    const websocket = await connect(running.url);
    t.after(() => websocket.close());
    const { connected, unavailable } = await authenticate(websocket, 'ticket-connect');
    assert.deepEqual(connected.capabilities, CAPABILITIES);
    assert.deepEqual(unavailable.providers, ['asr', 'tts', 'llm']);

    const messages = inbox(websocket);
    const response = messages.waitFor('provider_unavailable');
    websocket.send(JSON.stringify({ type: 'audio_input', data: 'must-not-be-processed' }));
    assert.deepEqual((await response).providers, ['asr', 'tts', 'llm']);
    assert.equal(messages.all.some((message) => message.type === 'assistant_reply' || message.type === 'audio_output'), false);
  });

  it('rejects ticket replay and expiry after the upgrade handshake', async (t) => {
    const ticketAdapter = new InjectedTicketAdapter();
    ticketAdapter.issue('ticket-replay');
    ticketAdapter.issue('ticket-expired', SESSION, Date.now() - 1);
    const running = await launch(ticketAdapter);
    t.after(() => running.gateway.close());

    const first = await connect(running.url);
    await authenticate(first, 'ticket-replay');
    assert.equal(ticketAdapter.consumeCount, 1);
    first.close();

    const replay = await connect(running.url);
    const replayClosed = waitForClose(replay);
    replay.send(JSON.stringify({ type: 'auth', ticket: 'ticket-replay', sessionId: SESSION }));
    assert.equal((await replayClosed)[0], 1008);

    const expired = await connect(running.url);
    const expiredClosed = waitForClose(expired);
    expired.send(JSON.stringify({ type: 'auth', ticket: 'ticket-expired', sessionId: SESSION }));
    assert.equal((await expiredClosed)[0], 1008);
  });

  it('rejects cross-origin upgrades before consuming tickets', async (t) => {
    const ticketAdapter = new InjectedTicketAdapter();
    ticketAdapter.issue('ticket-origin');
    const running = await launch(ticketAdapter);
    t.after(() => running.gateway.close());
    assert.equal(await rejectedUpgrade(running.url, 'https://attacker.example'), 403);
    assert.equal(ticketAdapter.consumeCount, 0);
  });

  it('rejects insecure production proxy forwarding', async (t) => {
    const ticketAdapter = new InjectedTicketAdapter();
    const running = await launch(ticketAdapter, { production: true, publicOrigin: 'https://app.example' });
    t.after(() => running.gateway.close());
    assert.equal(await rejectedUpgrade(running.url, 'https://app.example', {
      'X-Forwarded-Proto': 'http',
      'X-Forwarded-Host': 'app.example',
    }), 403);
    assert.equal(ticketAdapter.consumeCount, 0);
  });

  it('rejects oversized frames and enforces connection limits', async (t) => {
    const ticketAdapter = new InjectedTicketAdapter();
    const running = await launch(ticketAdapter, { maxConnections: 1 });
    t.after(() => running.gateway.close());
    const first = await connect(running.url);
    assert.equal(await rejectedUpgrade(running.url, ORIGIN), 503);
    const firstClosed = waitForClose(first);
    first.close();
    await firstClosed;

    const second = await connect(running.url);
    t.after(() => second.close());
    const close = waitForClose(second);
    second.send(Buffer.alloc(512, 0x61));
    assert.equal((await close)[0], 1009);
  });

  it('closes idle connections, reports health, and shuts down gracefully', async (t) => {
    const running = await launch(new InjectedTicketAdapter(), { idleTimeoutMs: 100, heartbeatIntervalMs: 20 });
    const address = running.gateway.server.address() as AddressInfo;
    t.after(() => running.gateway.close());
    const health = await fetch(`http://127.0.0.1:${address.port}/health`);
    assert.equal(health.status, 200);
    const websocket = await connect(running.url);
    const closed = waitForClose(websocket);
    assert.equal((await closed)[0], 1001);

    const graceful = await connect(running.url);
    const gracefulClose = waitForClose(graceful);
    await running.gateway.close();
    assert.equal((await gracefulClose)[0], 1001);
  });
});
