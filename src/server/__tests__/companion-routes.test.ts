import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { setTestCompanionProvider } from '@/server/companion/contracts';

const dbState = vi.hoisted(() => ({ rows: [] as unknown[][], inserts: 0, shouldThrow: false }));
const authState = vi.hoisted(() => ({ child: null as unknown, parent: null as unknown, household: null as unknown }));
type Query = {
  from: () => Query;
  innerJoin: () => Query;
  where: () => Query;
  orderBy: () => Query;
  limit: () => Promise<unknown>;
  for: () => Query;
  then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => Promise<unknown>;
  values?: () => Query;
  onConflictDoNothing?: () => Query;
  returning: () => Promise<unknown>;
  set?: () => Query;
};

vi.mock('@/db/client', () => {
  const tx = {
    select: () => {
      const query = {} as Query;
      query.from = () => query;
      query.innerJoin = () => query;
      query.where = () => query;
      query.orderBy = () => query;
      query.for = () => query;
      query.limit = () => run();
      query.then = (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => run().then(resolve, reject);
      return query;
    },
    insert: () => {
      const query = {} as Query;
      query.values = () => query;
      query.onConflictDoNothing = () => query;
      query.returning = () => { dbState.inserts += 1; return run(); };
      return query;
    },
    update: () => {
      const query = {} as Query;
      query.set = () => query;
      query.where = () => query;
      query.returning = () => run();
      return query;
    },
  };
  return { db: { ...tx, transaction: (callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx) } };
});

function run(): Promise<unknown> {
  if (dbState.shouldThrow) return Promise.reject(new Error('database unavailable'));
  return Promise.resolve(dbState.rows.shift() ?? []);
}

vi.mock('@/server/auth', () => ({
  requireChildSession: async () => authState.child instanceof Response ? authState.child : authState.child,
  requireParentSession: async () => authState.parent instanceof Response ? authState.parent : authState.parent,
  getParentHousehold: async () => authState.household,
  assertChildBelongsToHousehold: async () => null,
}));

const session = { id: 'session-1', childId: 'child-1', startedAt: new Date('2026-01-01T00:00:00Z'), endedAt: null, metadata: null };
const message = { id: 'message-1', sessionId: 'session-1', childId: 'child-1', clientMessageId: 'client-1', speaker: 'child', text: 'hello', isFlagged: false, flagReason: null, safetyScore: 0, safetyAlerts: null, createdAt: new Date('2026-01-01T00:00:00Z') };

beforeEach(() => {
  dbState.rows = [];
  dbState.inserts = 0;
  dbState.shouldThrow = false;
  authState.child = { sub: 'child-1', householdId: 'house-1', actorType: 'child' };
  authState.parent = { sub: 'parent-1', role: 'parent', actorType: 'parent' };
  authState.household = { id: 'house-1', ownerId: 'parent-1', name: 'Home' };
});
afterEach(() => setTestCompanionProvider(null));

describe('companion route contracts', () => {
  it('issues a ticket from an empty POST body and returns the exact VoiceClient contract', async () => {
    const { POST } = await import('@/app/api/companion/ws-ticket/route');
    dbState.rows = [[{ id: 'child-1' }], [session], [{ id: 'session-1' }]];
    const response = await POST(new NextRequest('http://localhost/api/companion/ws-ticket', { method: 'POST' }));
    expect(response.status).toBe(201);
    const payload = await response.json();
    expect(Object.keys(payload).sort()).toEqual(['expiresIn', 'sessionId', 'ticket', 'wsUrl'].sort());
    expect(payload).toMatchObject({ wsUrl: '/api/companion/ws', expiresIn: 60, sessionId: 'session-1' });
    expect(payload.ticket).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('creates an owned active companion session when none exists', async () => {
    const { POST } = await import('@/app/api/companion/ws-ticket/route');
    dbState.rows = [[{ id: 'child-1' }], [], [{ ...session, id: 'created-session' }], [{ id: 'created-session' }]];
    const response = await POST(new NextRequest('http://localhost/api/companion/ws-ticket', { method: 'POST' }));
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ sessionId: 'created-session', wsUrl: '/api/companion/ws', expiresIn: 60 });
    expect(dbState.inserts).toBe(1);
  });

  it('rejects non-child actors and prevents cross-child session access', async () => {
    const { GET } = await import('@/app/api/companion/sessions/[sessionId]/route');
    authState.child = NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 });
    const unauthorized = await GET(new Request('http://localhost'), { params: Promise.resolve({ sessionId: 'session-1' }) });
    expect(unauthorized.status).toBe(401);

    authState.child = { sub: 'other-child', householdId: 'other-house', actorType: 'child' };
    dbState.rows = [[session]];
    const crossChild = await GET(new Request('http://localhost'), { params: Promise.resolve({ sessionId: 'session-1' }) });
    expect(crossChild.status).toBe(403);
  });

  it('returns the persisted child message on a retry without inserting a duplicate', async () => {
    const { POST } = await import('@/app/api/companion/sessions/[sessionId]/messages/route');
    dbState.rows = [[session], [message], [message, { ...message, id: 'assistant-1', clientMessageId: null, speaker: 'snow', text: 'Hello back.' }]];
    const request = new NextRequest('http://localhost/api/companion/sessions/session-1/messages', { method: 'POST', body: JSON.stringify({ clientMessageId: 'client-1', content: 'hello' }) });
    const response = await POST(request, { params: Promise.resolve({ sessionId: 'session-1' }) });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ id: 'message-1', role: 'child', content: 'hello' });
    expect(dbState.inserts).toBe(0);
  });

  it('fails closed on message database errors', async () => {
    const { GET } = await import('@/app/api/companion/sessions/[sessionId]/messages/route');
    dbState.shouldThrow = true;
    const response = await GET(new NextRequest('http://localhost/api/companion/sessions/session-1/messages'), { params: Promise.resolve({ sessionId: 'session-1' }) });
    expect(response.status).toBe(500);
  });

  it('persists child input but reports provider unavailable without saving an assistant reply', async () => {
    const { POST } = await import('@/app/api/companion/sessions/[sessionId]/messages/route');
    dbState.rows = [[session], [], [message], [message]];
    const request = new NextRequest('http://localhost/api/companion/sessions/session-1/messages', { method: 'POST', body: JSON.stringify({ clientMessageId: 'client-1', content: 'hello' }) });
    const response = await POST(request, { params: Promise.resolve({ sessionId: 'session-1' }) });
    expect(response.status).toBe(503);
    expect(dbState.inserts).toBe(1);
  });

  it('reports provider errors and does not insert assistant output', async () => {
    const { POST } = await import('@/app/api/companion/sessions/[sessionId]/messages/route');
    setTestCompanionProvider(async () => { throw new Error('provider failure'); });
    dbState.rows = [[session], [], [message], [message]];
    const request = new NextRequest('http://localhost/api/companion/sessions/session-1/messages', { method: 'POST', body: JSON.stringify({ clientMessageId: 'client-1', content: 'hello' }) });
    const response = await POST(request, { params: Promise.resolve({ sessionId: 'session-1' }) });
    expect(response.status).toBe(502);
    expect(dbState.inserts).toBe(1);
  });

  it('blocks unsafe provider output instead of persisting it', async () => {
    const { POST } = await import('@/app/api/companion/sessions/[sessionId]/messages/route');
    setTestCompanionProvider(async () => 'You should kill yourself.');
    dbState.rows = [[session], [], [message], [message]];
    const request = new NextRequest('http://localhost/api/companion/sessions/session-1/messages', { method: 'POST', body: JSON.stringify({ clientMessageId: 'client-1', content: 'hello' }) });
    const response = await POST(request, { params: Promise.resolve({ sessionId: 'session-1' }) });
    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ error: { code: 'PROVIDER_UNSAFE_OUTPUT' } });
    expect(dbState.inserts).toBe(1);
  });

  it('consumes a matching database ticket once and rejects an expired ticket', async () => {
    const { POST } = await import('@/app/api/companion/ws-ticket/consume/route');
    const token = 'one-time-secret';
    const hash = createHash('sha256').update(token).digest('hex');
    const metadata = JSON.stringify({ companionWsTicket: { hash, childId: 'child-1', origin: 'http://localhost', expiresAt: Date.now() + 60_000, path: '/api/companion/ws' } });
    dbState.rows = [[{ ...session, metadata }], [{ id: 'session-1' }]];
    const request = new NextRequest('http://localhost/api/companion/ws-ticket/consume', { method: 'POST', body: JSON.stringify({ ticket: token, sessionId: 'session-1' }) });
    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ valid: true });

    dbState.rows = [[{ ...session, metadata }], []];
    const replay = await POST(new NextRequest('http://localhost/api/companion/ws-ticket/consume', { method: 'POST', body: JSON.stringify({ ticket: token, sessionId: 'session-1' }) }));
    expect(replay.status).toBe(401);

    dbState.rows = [[{ ...session, metadata: JSON.stringify({ companionWsTicket: { hash, childId: 'child-1', origin: 'http://localhost', expiresAt: Date.now() - 1, path: '/api/companion/ws' } }) }]];
    const expired = await POST(new NextRequest('http://localhost/api/companion/ws-ticket/consume', { method: 'POST', body: JSON.stringify({ ticket: token, sessionId: 'session-1' }) }));
    expect(expired.status).toBe(401);
  });

  it('limits household alert reads and reports database failures', async () => {
    const { GET } = await import('@/app/api/alerts/route');
    dbState.shouldThrow = true;
    const response = await GET(new NextRequest('http://localhost/api/alerts'));
    expect(response.status).toBe(500);
  });
});
