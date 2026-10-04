import { afterEach, describe, expect, it, vi } from 'vitest';
import { AccountApiError, changePassword, getAccount, getAccountSessions, revokeAccountSession, revokeOtherSessions, updateAccount } from '../account-client';

describe('account client', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('uses server-backed account endpoints without client persistence', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ account: { id: 'p' }, capabilities: {} }))
      .mockResolvedValueOnce(Response.json({ account: { id: 'p', displayName: 'Parent' }, message: 'saved' }))
      .mockResolvedValueOnce(Response.json({ message: 'changed', otherSessionsRevoked: 2 }));
    vi.stubGlobal('fetch', fetchMock);
    await getAccount();
    await updateAccount('Parent');
    await changePassword('current', 'new-password');
    expect(fetchMock.mock.calls[0][0]).toBe('/api/account');
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'PATCH' });
    expect(fetchMock.mock.calls[2][1]).toMatchObject({ method: 'POST' });
  });

  it('lists sessions and revokes others or a single session through the account endpoints', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ sessions: [{ id: 's1', createdAt: 'x', expiresAt: 'y', userAgent: null, current: true }] }))
      .mockResolvedValueOnce(Response.json({ revoked: 2, message: 'Other sessions were revoked.' }))
      .mockResolvedValueOnce(Response.json({ revoked: 1, message: 'Session revoked.' }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(getAccountSessions()).resolves.toHaveLength(1);
    await expect(revokeOtherSessions()).resolves.toMatchObject({ revoked: 2 });
    await expect(revokeAccountSession('s2')).resolves.toMatchObject({ revoked: 1 });
    expect(fetchMock.mock.calls[0][0]).toBe('/api/account/sessions');
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'DELETE' });
    expect(JSON.parse(String(fetchMock.mock.calls[2][1]?.body))).toEqual({ sessionId: 's2' });
  });

  it('surfaces the nested safe API error contract', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          Response.json(
            { error: { code: 'INVALID_PASSWORD', message: 'Current password is incorrect.' } },
            { status: 403 },
          ),
        ),
      ),
    );
    await expect(changePassword('wrong', 'new-password')).rejects.toBeInstanceOf(AccountApiError);
    await expect(changePassword('wrong', 'new-password')).rejects.toMatchObject({
      status: 403,
      code: 'INVALID_PASSWORD',
      message: 'Current password is incorrect.',
    });
  });
});
