import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireParentSession = vi.fn();
const selectResults: unknown[][] = [];
const updateResults: unknown[][] = [];
const auditValues: unknown[] = [];
let lastSelectWhere: unknown = null;
let lastUpdateWhere: unknown = null;

type SelectQuery = {
  from: () => SelectQuery;
  where: (clause: unknown) => SelectQuery;
  orderBy: () => Promise<unknown[]>;
  limit: () => Promise<unknown[]>;
};

const db = {
  select: vi.fn(() => {
    const query: SelectQuery = {
      from: () => query,
      where: (clause: unknown) => { lastSelectWhere = clause; return query; },
      orderBy: async () => selectResults.shift() ?? [],
      limit: async () => selectResults.shift() ?? [],
    };
    return query;
  }),
  update: vi.fn(() => ({
    set: vi.fn(() => ({
      where: vi.fn((clause: unknown) => {
        lastUpdateWhere = clause;
        return { returning: vi.fn(async () => updateResults.shift() ?? []) };
      }),
    })),
  })),
  insert: vi.fn(() => ({ values: vi.fn((value: unknown) => { auditValues.push(value); return Promise.resolve(); }) })),
};

vi.mock('server-only', () => ({}));
vi.mock('@/server/auth', () => ({ requireParentSession }));
vi.mock('@/db/client', () => ({ db }));
vi.mock('@/lib/auth/session', () => ({ hashToken: (token: string) => `hash:${token}` }));

function collectParams(node: unknown, out: unknown[] = []): unknown[] {
  if (!node || typeof node !== 'object') return out;
  const candidate = node as { value?: unknown; queryChunks?: unknown[] };
  if ('value' in candidate) out.push(candidate.value);
  if (Array.isArray(candidate.queryChunks)) for (const chunk of candidate.queryChunks) collectParams(chunk, out);
  return out;
}

const currentSession = {
  id: 's-current',
  createdAt: new Date('2026-05-01T00:00:00Z'),
  expiresAt: new Date('2026-05-08T00:00:00Z'),
  userAgent: 'Mozilla/5.0 (Macintosh) Chrome/120',
  tokenHash: 'hash:current-token',
};
const otherSession = {
  id: 's-other',
  createdAt: new Date('2026-04-30T00:00:00Z'),
  expiresAt: new Date('2026-05-07T00:00:00Z'),
  userAgent: 'Mozilla/5.0 (Windows) Firefox/121',
  tokenHash: 'hash:other-token',
};

function deleteRequest(body: unknown) {
  return new Request('http://localhost/api/account/sessions', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('account sessions API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectResults.length = 0;
    updateResults.length = 0;
    auditValues.length = 0;
    lastSelectWhere = null;
    lastUpdateWhere = null;
    requireParentSession.mockResolvedValue({ sub: 'parent-a', role: 'parent', actorType: 'parent', sessionId: 'current-token' });
  });

  it('lists only the current user sessions, marks the caller, and never leaks token hashes', async () => {
    selectResults.push([currentSession, otherSession]);
    const { GET } = await import('./route');
    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.sessions).toHaveLength(2);
    expect(body.sessions[0]).toMatchObject({ id: 's-current', current: true });
    expect(body.sessions[1]).toMatchObject({ id: 's-other', current: false });
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain('tokenHash');
    expect(serialized).not.toContain('hash:');
    expect(collectParams(lastSelectWhere)).toContain('parent-a');
  });

  it('denies unauthenticated listing', async () => {
    requireParentSession.mockResolvedValue(Response.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 }));
    const { GET } = await import('./route');
    const response = await GET();
    expect(response.status).toBe(401);
    expect(db.select).not.toHaveBeenCalled();
  });

  it('revokes every other session and preserves the caller session', async () => {
    updateResults.push([{ id: 's-other' }]);
    const { DELETE } = await import('./route');
    const response = await DELETE(deleteRequest({}));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ revoked: 1 });
    const params = collectParams(lastUpdateWhere);
    expect(params).toContain('parent-a');
    expect(params).toContain('hash:current-token');
    expect(params).not.toContain('hash:other-token');
    expect(JSON.stringify(auditValues)).toContain('account.sessions_revoked');
  });

  it('rejects revoking the caller session', async () => {
    selectResults.push([{ id: 's-current', tokenHash: 'hash:current-token' }]);
    const { DELETE } = await import('./route');
    const response = await DELETE(deleteRequest({ sessionId: '11111111-1111-4111-8111-111111111111' }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: 'VALIDATION_FAILED' } });
    expect(db.update).not.toHaveBeenCalled();
  });

  it('revokes a single owned session and writes an audit event', async () => {
    selectResults.push([{ id: 's-other', tokenHash: 'hash:other-token' }]);
    updateResults.push([{ id: 's-other' }]);
    const { DELETE } = await import('./route');
    const response = await DELETE(deleteRequest({ sessionId: '22222222-2222-4222-8222-222222222222' }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ revoked: 1 });
    expect(collectParams(lastSelectWhere)).toContain('parent-a');
    expect(JSON.stringify(auditValues)).toContain('account.session_revoked');
  });

  it('denies unauthenticated revocation', async () => {
    requireParentSession.mockResolvedValue(Response.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 }));
    const { DELETE } = await import('./route');
    const response = await DELETE(deleteRequest({}));
    expect(response.status).toBe(401);
    expect(db.update).not.toHaveBeenCalled();
  });

  it('fails closed when the caller session cannot be identified', async () => {
    requireParentSession.mockResolvedValue({ sub: 'parent-a', role: 'parent', actorType: 'parent' });
    const { DELETE } = await import('./route');
    const response = await DELETE(deleteRequest({}));
    expect(response.status).toBe(401);
    expect(db.update).not.toHaveBeenCalled();
  });
});
