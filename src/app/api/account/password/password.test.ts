import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireParentSession = vi.fn();
const verifyPassword = vi.fn();
const hashPassword = vi.fn();
const auditValues: unknown[] = [];
const selectResults: unknown[][] = [];
const updateResults: unknown[][] = [];

function resultQuery(result: unknown[]) { return { limit: vi.fn(async () => result) }; }
const db = {
  select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => resultQuery(selectResults.shift() ?? [])) })) })),
  transaction: vi.fn(async (callback: (tx: unknown) => unknown) => callback({
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn(async () => updateResults.shift() ?? []) })) })) })),
    insert: vi.fn(() => ({ values: vi.fn((value: unknown) => { auditValues.push(value); return Promise.resolve(); }) })),
  })),
};

vi.mock('server-only', () => ({}));
vi.mock('@/server/auth', () => ({ requireParentSession }));
vi.mock('@/db/client', () => ({ db }));
vi.mock('@/lib/auth/parent-auth', () => ({ verifyPassword, hashPassword }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => ({ value: 'signed-parent-cookie' }) }) }));

describe('password change API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectResults.length = 0;
    updateResults.length = 0;
    auditValues.length = 0;
    requireParentSession.mockResolvedValue({ sub: 'parent-a', role: 'parent', sessionId: 'opaque-current-session' });
    hashPassword.mockResolvedValue('bcrypt-result');
  });

  it('rejects the wrong current password without changing state', async () => {
    selectResults.push([{ passwordHash: 'stored-bcrypt-hash', isActive: true }]);
    verifyPassword.mockResolvedValue(false);
    const { POST } = await import('./route');
    const response = await POST(requestWith({ currentPassword: 'wrong-password', newPassword: 'new-password-123' }));
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: { code: 'INVALID_PASSWORD' } });
    expect(hashPassword).not.toHaveBeenCalled();
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it('rehashes the password, revokes other sessions, and leaks no secrets', async () => {
    selectResults.push([{ passwordHash: 'stored-bcrypt-hash', isActive: true }]);
    verifyPassword.mockResolvedValue(true);
    updateResults.push([{ id: 'parent-a' }], [{ id: 'old-session' }]);
    const { POST } = await import('./route');
    const response = await POST(requestWith({ currentPassword: 'current-password', newPassword: 'new-password-123' }));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.otherSessionsRevoked).toBe(1);
    expect(verifyPassword).toHaveBeenCalledWith('current-password', 'stored-bcrypt-hash');
    expect(hashPassword).toHaveBeenCalledWith('new-password-123');
    const serialized = JSON.stringify({ body, auditValues });
    expect(serialized).not.toContain('current-password');
    expect(serialized).not.toContain('new-password-123');
    expect(serialized).not.toContain('stored-bcrypt-hash');
    expect(serialized).not.toContain('bcrypt-result');
  });
  it('denies unauthenticated requests', async () => {
    requireParentSession.mockResolvedValue(Response.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 }));
    const { POST } = await import('./route');
    const response = await POST(requestWith({ currentPassword: 'password1', newPassword: 'password2' }));
    expect(response.status).toBe(401);
  });

  it('rejects identical current and new password', async () => {
    const { POST } = await import('./route');
    const response = await POST(requestWith({ currentPassword: 'same-password-123', newPassword: 'same-password-123' }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: 'VALIDATION_FAILED' } });
  });

  it('rejects password shorter than 8 characters', async () => {
    const { POST } = await import('./route');
    const response = await POST(requestWith({ currentPassword: 'current-pass', newPassword: 'short' }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: 'VALIDATION_FAILED' } });
  });
});

function requestWith(body: unknown) {
  return new Request('http://localhost/api/account/password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}
