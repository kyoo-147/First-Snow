import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminApiError, fetchAdminDashboard, type AdminDashboard } from '@/lib/admin-client';

const mocks = vi.hoisted(() => ({
  requireAdminSession: vi.fn(),
  select: vi.fn(),
}));

vi.mock('@/server/auth', () => ({
  requireAdminSession: mocks.requireAdminSession,
}));

vi.mock('@/db/client', () => ({
  db: {
    select: mocks.select,
  },
}));

describe('Admin dashboard route and RBAC contracts', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('Strict Admin RBAC', () => {
    it('returns 401 Unauthorized when request is unauthenticated', async () => {
      const { GET } = await import('@/app/api/admin/dashboard/route');
      mocks.requireAdminSession.mockResolvedValue(
        new Response(
          JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } }),
          { status: 401, headers: { 'content-type': 'application/json' } },
        ),
      );

      const response = await GET();
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error.code).toBe('UNAUTHORIZED');
      expect(mocks.select).not.toHaveBeenCalled();
    });

    it('returns 403 Forbidden when authenticated user is a parent, not an admin', async () => {
      const { GET } = await import('@/app/api/admin/dashboard/route');
      mocks.requireAdminSession.mockResolvedValue(
        new Response(
          JSON.stringify({ error: { code: 'FORBIDDEN', message: 'Admin access required' } }),
          { status: 403, headers: { 'content-type': 'application/json' } },
        ),
      );

      const response = await GET();
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error.code).toBe('FORBIDDEN');
      expect(mocks.select).not.toHaveBeenCalled();
    });

    it('allows access when user has valid admin session', async () => {
      const { GET } = await import('@/app/api/admin/dashboard/route');
      mocks.requireAdminSession.mockResolvedValue({
        sub: 'admin-user-id',
        role: 'admin',
        actorType: 'admin',
      });

      let callCount = 0;
      mocks.select.mockImplementation(() => {
        callCount++;
        const currentCall = callCount;
        const getResult = () => {
          if (currentCall === 7) {
            return [
              {
                id: 'audit-1',
                eventType: 'user.login',
                actorType: 'admin',
                resourceType: 'session',
                createdAt: new Date('2026-10-03T01:00:00Z'),
              },
            ];
          }
          if (currentCall === 8) {
            return [
              {
                id: 'exp-1',
                status: 'completed',
                createdAt: new Date('2026-10-03T00:30:00Z'),
                updatedAt: new Date('2026-10-03T00:35:00Z'),
              },
            ];
          }
          if (currentCall === 9) {
            return [
              {
                id: 'del-1',
                status: 'pending',
                createdAt: new Date('2026-10-03T01:10:00Z'),
                updatedAt: new Date('2026-10-03T01:15:00Z'),
              },
            ];
          }
          return [{ count: currentCall * 10 }];
        };

        const builder: {
          from: () => typeof builder;
          where: () => typeof builder;
          orderBy: () => typeof builder;
          limit: () => typeof builder;
          then: <TResult1 = unknown, TResult2 = never>(
            onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null,
            onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
          ) => Promise<TResult1 | TResult2>;
        } = {
          from: () => builder,
          where: () => builder,
          orderBy: () => builder,
          limit: () => builder,
          then: (onfulfilled, onrejected) => Promise.resolve(getResult()).then(onfulfilled, onrejected),
        };
        return builder;
      });

      const response = await GET();
      expect(response.status).toBe(200);
      const body = await response.json();

      // Truthful DB metrics verification
      expect(body.counts).toEqual({
        users: 10,
        children: 20,
        households: 30,
        activeSessions: 40,
        lessonAttempts: 50,
        companionSessions: 60,
      });

      // Recent audit events
      expect(body.recentAudit).toHaveLength(1);
      expect(body.recentAudit[0]).toEqual({
        id: 'audit-1',
        eventType: 'user.login',
        actorType: 'admin',
        resourceType: 'session',
        createdAt: '2026-10-03T01:00:00.000Z',
      });

      // Recent jobs merged and sorted descending by updatedAt
      expect(body.recentJobs).toHaveLength(2);
      expect(body.recentJobs[0].id).toBe('del-1');
      expect(body.recentJobs[0].kind).toBe('deletion');
      expect(body.recentJobs[1].id).toBe('exp-1');
      expect(body.recentJobs[1].kind).toBe('export');

      // Provider health is strictly unrecorded (no fabricated health)
      expect(body.providerHealth).toEqual({
        status: 'not_recorded',
        providers: [],
      });
    });

    it('fails closed with 500 ADMIN_DATA_UNAVAILABLE when database query throws', async () => {
      const { GET } = await import('@/app/api/admin/dashboard/route');
      mocks.requireAdminSession.mockResolvedValue({
        sub: 'admin-user-id',
        role: 'admin',
        actorType: 'admin',
      });

      mocks.select.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const response = await GET();
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toEqual({
        code: 'ADMIN_DATA_UNAVAILABLE',
        message: 'Admin data is temporarily unavailable.',
      });
    });
  });

  describe('fetchAdminDashboard client contract', () => {
    const mockDashboardData: AdminDashboard = {
      counts: {
        users: 5,
        children: 3,
        households: 2,
        activeSessions: 1,
        lessonAttempts: 12,
        companionSessions: 4,
      },
      recentAudit: [
        {
          id: 'audit-100',
          eventType: 'auth.parent_login',
          actorType: 'parent',
          resourceType: 'household',
          createdAt: '2026-10-03T07:00:00.000Z',
        },
      ],
      recentJobs: [
        {
          id: 'job-100',
          kind: 'export',
          status: 'completed',
          createdAt: '2026-10-03T06:00:00.000Z',
          updatedAt: '2026-10-03T06:05:00.000Z',
        },
      ],
      providerHealth: {
        status: 'not_recorded',
        providers: [],
      },
    };

    it('fetches dashboard data successfully from /api/admin/dashboard', async () => {
      const mockFetcher = vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response(JSON.stringify(mockDashboardData), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
        ),
      );

      const result = await fetchAdminDashboard(mockFetcher);
      expect(result).toEqual(mockDashboardData);
      expect(mockFetcher).toHaveBeenCalledWith('/api/admin/dashboard', {
        method: 'GET',
        headers: { accept: 'application/json' },
        cache: 'no-store',
      });
    });

    it('throws AdminApiError with status and custom message on 401 Unauthorized', async () => {
      const mockFetcher = vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
            }),
            { status: 401, headers: { 'content-type': 'application/json' } },
          ),
        ),
      );

      await expect(fetchAdminDashboard(mockFetcher)).rejects.toThrow(AdminApiError);
      await expect(fetchAdminDashboard(mockFetcher)).rejects.toMatchObject({
        message: 'Authentication required.',
        status: 401,
        code: 'UNAUTHORIZED',
      });
    });

    it('throws AdminApiError on 403 Forbidden with admin access requirement message', async () => {
      const mockFetcher = vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              error: { code: 'FORBIDDEN', message: 'Admin access required' },
            }),
            { status: 403, headers: { 'content-type': 'application/json' } },
          ),
        ),
      );

      await expect(fetchAdminDashboard(mockFetcher)).rejects.toThrow(AdminApiError);
      await expect(fetchAdminDashboard(mockFetcher)).rejects.toMatchObject({
        message: 'Admin access required',
        status: 403,
        code: 'FORBIDDEN',
      });
    });

    it('falls back safely to generic message when server returns non-JSON error', async () => {
      const mockFetcher = vi.fn().mockImplementation(() =>
        Promise.resolve(
          new Response('<html><body>Bad Gateway</body></html>', {
            status: 502,
            headers: { 'content-type': 'text/html' },
          }),
        ),
      );

      await expect(fetchAdminDashboard(mockFetcher)).rejects.toThrow(AdminApiError);
      await expect(fetchAdminDashboard(mockFetcher)).rejects.toMatchObject({
        message: 'Admin data is temporarily unavailable.',
        status: 502,
        code: 'ADMIN_REQUEST_FAILED',
      });
    });
  });
});
