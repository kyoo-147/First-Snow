import { afterEach, describe, expect, it, vi } from 'vitest';
import { AccountApiError, changePassword, getAccount, updateAccount } from '../account-client';

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
