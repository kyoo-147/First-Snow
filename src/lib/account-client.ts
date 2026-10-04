export type AccountProfile = {
  id: string;
  email: string;
  displayName: string;
  role: 'parent' | 'admin';
  createdAt: string;
  household: { id: string; name: string; role: 'owner' | 'guardian' | 'viewer' };
};

export type AccountCapabilities = {
  emailChange: false;
  emailVerification: false;
  mfa: false;
  sessionManagement: boolean;
};

export type AccountSession = {
  id: string;
  createdAt: string;
  expiresAt: string;
  userAgent: string | null;
  current: boolean;
};

export class AccountApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: Record<string, string[] | string>,
  ) {
    super(message);
    this.name = 'AccountApiError';
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null) as {
    error?: { code?: string; message?: string; details?: Record<string, string[] | string> };
  } | null;
  if (!response.ok) {
    throw new AccountApiError(
      payload?.error?.message ?? 'The account request could not be completed.',
      response.status,
      payload?.error?.code,
      payload?.error?.details,
    );
  }
  return payload as T;
}

export async function getAccount(): Promise<{ account: AccountProfile; capabilities: AccountCapabilities }> {
  return parseResponse(await fetch('/api/account', { cache: 'no-store' }));
}

export async function updateAccount(displayName: string): Promise<{ account: AccountProfile; message: string }> {
  return parseResponse(await fetch('/api/account', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName }),
  }));
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ message: string; otherSessionsRevoked: number }> {
  return parseResponse(await fetch('/api/account/password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword }),
  }));
}

export async function getAccountSessions(): Promise<AccountSession[]> {
  const data = await parseResponse<{ sessions?: AccountSession[] }>(
    await fetch('/api/account/sessions', { cache: 'no-store' }),
  );
  return Array.isArray(data.sessions) ? data.sessions : [];
}

export async function revokeOtherSessions(): Promise<{ revoked: number; message: string }> {
  return parseResponse(await fetch('/api/account/sessions', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  }));
}

export async function revokeAccountSession(sessionId: string): Promise<{ revoked: number; message: string }> {
  return parseResponse(await fetch('/api/account/sessions', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  }));
}
