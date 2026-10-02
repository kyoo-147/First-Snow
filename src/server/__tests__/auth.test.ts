import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock server-only and next/headers for unit tests
vi.mock('server-only', () => ({}));

describe('RBAC helpers — unit tests (no DB)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('getParentSession', () => {
    it('returns null when no session cookie exists', async () => {
      vi.doMock('next/headers', () => ({
        cookies: async () => ({
          get: (_name: string) => undefined,
        }),
      }));
      const { getParentSession } = await import('../auth');
      const result = await getParentSession();
      expect(result).toBeNull();
    });

    it('returns null for an invalid JWT token in cookie', async () => {
      vi.doMock('next/headers', () => ({
        cookies: async () => ({
          get: (_name: string) => ({ value: 'invalid.jwt.token' }),
        }),
      }));
      const { getParentSession } = await import('../auth');
      const result = await getParentSession();
      expect(result).toBeNull();
    });
  });

  describe('getChildSession', () => {
    it('returns null when no child session cookie exists', async () => {
      vi.doMock('next/headers', () => ({
        cookies: async () => ({
          get: (_name: string) => undefined,
        }),
      }));
      const { getChildSession } = await import('../auth');
      const result = await getChildSession();
      expect(result).toBeNull();
    });
  });

  describe('requireAdminSession', () => {
    it('is a function (exists and is callable)', async () => {
      vi.doMock('next/headers', () => ({
        cookies: async () => ({
          get: (_name: string) => undefined,
        }),
      }));
      const { requireAdminSession } = await import('../auth');
      expect(typeof requireAdminSession).toBe('function');
    });

    it('returns 401 Response when no session', async () => {
      vi.doMock('next/headers', () => ({
        cookies: async () => ({
          get: (_name: string) => undefined,
        }),
      }));
      const { requireAdminSession } = await import('../auth');
      const result = await requireAdminSession();
      expect(result).toBeInstanceOf(Response);
      expect((result as Response).status).toBe(401);
    });
  });

  describe('forbiddenResponse / unauthorizedResponse', () => {
    it('unauthorizedResponse returns 401', async () => {
      vi.doMock('next/headers', () => ({
        cookies: async () => ({ get: () => undefined }),
      }));
      const { unauthorizedResponse } = await import('../auth');
      const resp = unauthorizedResponse();
      expect(resp.status).toBe(401);
    });

    it('forbiddenResponse returns 403', async () => {
      vi.doMock('next/headers', () => ({
        cookies: async () => ({ get: () => undefined }),
      }));
      const { forbiddenResponse } = await import('../auth');
      const resp = forbiddenResponse();
      expect(resp.status).toBe(403);
    });
  });
});
