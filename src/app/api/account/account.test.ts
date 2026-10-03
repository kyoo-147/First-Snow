import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireParentSession = vi.fn();
const verifyPassword = vi.fn();
const hashPassword = vi.fn();
const selectResults: unknown[][] = [];
const transactionUpdateResults: unknown[][] = [];
const auditValues: unknown[] = [];
let selectFailure: Error | null = null;

function resultQuery(result: unknown[]) {
  return Object.assign(Promise.resolve(result), {
    limit: vi.fn(() => Promise.resolve(result)),
  });
}

const db = {
  select: vi.fn(() => ({
    from: vi.fn(() => ({
      leftJoin: vi.fn(() => ({ where: vi.fn(() => resultQuery(selectResults.shift() ?? [])) })),
      innerJoin: vi.fn(() => ({ where: vi.fn(() => resultQuery(selectResults.shift() ?? [])) })),
      where: vi.fn(() => {
        if (selectFailure) throw selectFailure;
        return resultQuery(selectResults.shift() ?? []);
      }),
    })),
  })),
  transaction: vi.fn(async (callback: (tx: unknown) => unknown) => callback({
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn(async () => transactionUpdateResults.shift() ?? []) })) })) })),
    insert: vi.fn(() => ({ values: vi.fn((value: unknown) => { auditValues.push(value); return Promise.resolve(); }) })),
  })),
};

vi.mock('server-only', () => ({}));
vi.mock('@/server/auth', () => ({ requireParentSession }));
vi.mock('@/db/client', () => ({ db }));
vi.mock('@/lib/auth/parent-auth', () => ({ verifyPassword, hashPassword }));

describe('account API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectResults.length = 0;
    transactionUpdateResults.length = 0;
    auditValues.length = 0;
    selectFailure = null;
    requireParentSession.mockResolvedValue({ sub: 'parent-a', role: 'parent', sessionId: 'session-a' });
    verifyPassword.mockResolvedValue(true);
    hashPassword.mockResolvedValue('new-bcrypt-hash');
  });

  it('denies anonymous access', async () => {
    requireParentSession.mockResolvedValue(Response.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 }));
    const { GET } = await import('./route');
    const response = await GET();
    expect(response.status).toBe(401);
    expect(db.select).not.toHaveBeenCalled();
  });

  it('denies child-only access', async () => {
    requireParentSession.mockResolvedValue(Response.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 }));
    const { PATCH } = await import('./route');
    const response = await PATCH(new Request('http://localhost/api/account', { method: 'PATCH', body: JSON.stringify({ displayName: 'New Parent' }) }));
    expect(response.status).toBe(401);
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it('updates only the authenticated profile and writes a secret-free audit event', async () => {
    transactionUpdateResults.push([{ id: 'parent-a', email: 'parent@example.com', displayName: 'New Parent', role: 'parent', createdAt: new Date('2026-01-01') }]);
    selectResults.push([{ id: 'house-a', name: 'Family', role: 'owner' }]);
    const { PATCH } = await import('./route');
    const response = await PATCH(new Request('http://localhost/api/account', { method: 'PATCH', body: JSON.stringify({ displayName: 'New Parent' }) }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ account: { id: 'parent-a', displayName: 'New Parent', household: { id: 'house-a' } } });
    expect(JSON.stringify(auditValues)).not.toMatch(/password|secret|hash/i);
  });

  it('returns the authenticated profile and truthful capabilities on GET', async () => {
    selectResults.push([{ id: 'parent-a', email: 'parent@example.com', displayName: 'Parent A', role: 'parent', createdAt: new Date('2026-01-01') }]);
    selectResults.push([{ id: 'house-a', name: 'Family', role: 'owner' }]);
    const { GET } = await import('./route');
    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      account: { id: 'parent-a', email: 'parent@example.com', displayName: 'Parent A', role: 'parent', household: { id: 'house-a', name: 'Family', role: 'owner' } },
      capabilities: { emailChange: false, emailVerification: false, mfa: false, sessionManagement: false },
    });
  });

  it('rejects short displayName on PATCH', async () => {
    const { PATCH } = await import('./route');
    const response = await PATCH(new Request('http://localhost/api/account', { method: 'PATCH', body: JSON.stringify({ displayName: 'A' }) }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: 'VALIDATION_FAILED' } });
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it('rejects unexpected fields on PATCH due to strict schema', async () => {
    const { PATCH } = await import('./route');
    const response = await PATCH(new Request('http://localhost/api/account', { method: 'PATCH', body: JSON.stringify({ displayName: 'Valid Name', role: 'admin' }) }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: 'VALIDATION_FAILED' } });
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it('fails closed and returns a sanitized error when the database fails', async () => {
    selectFailure = new Error('postgres password=super-secret connection failed');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { GET } = await import('./route');
    const response = await GET();
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain('super-secret');
    consoleError.mockRestore();
  });
});
