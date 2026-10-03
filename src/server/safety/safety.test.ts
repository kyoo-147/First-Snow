import { beforeEach, describe, expect, it, vi } from 'vitest';

const selectResults: unknown[][] = [];
const select = vi.fn(() => ({
  from: vi.fn(() => ({
    where: vi.fn(() => ({
      limit: vi.fn(async () => selectResults.shift() ?? []),
    })),
    innerJoin: vi.fn(() => ({
      where: vi.fn(() => ({ limit: vi.fn(async () => selectResults.shift() ?? []) })),
    })),
  })),
}));
vi.mock('@/db/client', () => ({ db: { select } }));
vi.mock('@/lib/auth/parent-auth', () => ({ verifyPassword: vi.fn(async (password: string, hash: string) => password === 'valid' && hash === 'hash') }));
vi.mock('@/server/auth', () => ({ requireParentSession: vi.fn(async () => ({ sub: 'user-a', role: 'parent' })) }));
vi.mock('server-only', () => ({}));

describe('safety service', () => {
  beforeEach(() => { selectResults.length = 0; vi.clearAllMocks(); });

  it('isolates household context and denies users without ownership or membership', async () => {
    selectResults.push([], []);
    const { context, SafetyError } = await import('./index');
    await expect(context({ sub: 'user-a' } as never)).rejects.toBeInstanceOf(SafetyError);
  });

  it('rejects a child that belongs to another household', async () => {
    selectResults.push([{ id: 'household-a', ownerId: 'user-a', name: 'A' }], []);
    const { context, assertChildOwned } = await import('./index');
    const { household } = await context({ sub: 'user-a' } as never);
    await expect(assertChildOwned(household.id, 'child-b')).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
  });

  it('does not hide database errors during household resolution', async () => {
    select.mockImplementationOnce(() => { throw new Error('database unavailable'); });
    const { context } = await import('./index');
    await expect(context({ sub: 'user-a' } as never)).rejects.toThrow('database unavailable');
  });

  it('requires password confirmation and rejects invalid reauthentication', async () => {
    selectResults.push([{ passwordHash: 'hash', isActive: true }], [{ passwordHash: 'hash', isActive: true }]);
    const { reauthenticate, SafetyError } = await import('./index');
    await expect(reauthenticate('user-a', undefined)).rejects.toMatchObject({ code: 'REAUTH_REQUIRED' });
    await expect(reauthenticate('user-a', 'invalid')).rejects.toMatchObject({ code: 'INVALID_PASSWORD' });
    await expect(reauthenticate('user-a', 'valid')).resolves.toBeUndefined();
    expect(SafetyError).toBeDefined();
  });

  it('maps persisted export states without inventing an artifact or download URL', async () => {
    const { mapExport } = await import('./index');
    const job = { id: 'job', status: 'pending', createdAt: new Date('2026-01-01T00:00:00Z'), archiveUrl: null, archiveExpiresAt: null, errorMessage: null };
    expect(mapExport(job as never)).toMatchObject({ id: 'job', status: 'requested', format: 'zip', progressPercent: 0 });
    expect(mapExport(job as never)).not.toHaveProperty('downloadUrl');
  });

  it('preserves deletion stage failures without marking the overall job complete', async () => {
    const { mapDeletion } = await import('./index');
    const job = { id: 'job', status: 'processing', createdAt: new Date('2026-01-01T00:00:00Z'), errorMessage: null, stagesReport: { request: { scope: 'all_child_data', childId: 'child-a' }, stages: [{ stage: 'transcripts', status: 'completed' }, { stage: 'emotion_timeline', status: 'failed', detail: 'storage unavailable' }] } };
    expect(mapDeletion(job as never)).toMatchObject({ status: 'running', scope: 'all_child_data', childId: 'child-a', stages: [{ stage: 'transcripts', status: 'completed' }, { stage: 'emotion_timeline', status: 'failed', detail: 'storage unavailable' }] });
  });

  it('reports unavailable SMS delivery instead of claiming it was sent', async () => {
    selectResults.push([{ id: 'household-a', ownerId: 'user-a', name: 'A' }]);
    const { PATCH } = await import('@/app/api/notification-preferences/route');
    const response = await PATCH(new Request('http://localhost/api/notification-preferences', { method: 'PATCH', body: JSON.stringify({ emergencySmsAlerts: true }) }));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: { code: 'PROVIDER_UNAVAILABLE' } });
  });
});
