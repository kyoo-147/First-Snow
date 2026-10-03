export type AdminDashboard = {
  counts: {
    users: number;
    children: number;
    households: number;
    activeSessions: number;
    lessonAttempts: number;
    companionSessions: number;
  };
  recentAudit: Array<{
    id: string;
    eventType: string;
    actorType: string | null;
    resourceType: string | null;
    createdAt: string;
  }>;
  recentJobs: Array<{
    id: string;
    kind: 'export' | 'deletion';
    status: string;
    createdAt: string;
    updatedAt: string;
  }>;
  providerHealth: {
    status: 'not_recorded';
    providers: [];
  };
};

export class AdminApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code = 'ADMIN_REQUEST_FAILED') {
    super(message);
    this.name = 'AdminApiError';
    this.status = status;
    this.code = code;
  }
}

export async function fetchAdminDashboard(
  fetcher: typeof fetch = fetch,
): Promise<AdminDashboard> {
  const response = await fetcher('/api/admin/dashboard', {
    method: 'GET',
    headers: { accept: 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    let message = 'Admin data is temporarily unavailable.';
    let code = 'ADMIN_REQUEST_FAILED';
    try {
      const body = (await response.json()) as { error?: { message?: string; code?: string } };
      message = body.error?.message || message;
      code = body.error?.code || code;
    } catch {
      // Keep the generic fail-closed message when the response is not JSON.
    }
    throw new AdminApiError(message, response.status, code);
  }

  return (await response.json()) as AdminDashboard;
}
