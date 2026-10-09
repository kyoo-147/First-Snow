import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { config, proxy } from '../proxy';
import {
  createParentSession,
  createChildSession,
  generateOpaqueToken,
  PARENT_COOKIE_NAME,
  CHILD_COOKIE_NAME,
} from '@/lib/auth/session';

// Controllable in-memory stand-in for the two-query DB session check.
const state = vi.hoisted(() => ({
  queryResults: [] as unknown[][],
  dbShouldThrow: false,
  selectCalls: 0,
}));

vi.mock('server-only', () => ({}));

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => undefined, delete: vi.fn(), set: vi.fn() }),
}));

vi.mock('@/db/client', () => ({
  db: {
    select: () => {
      state.selectCalls++;
      return {
        from: () => ({
          where: () => ({
            limit: () => {
              if (state.dbShouldThrow) {
                throw new Error('Database connection failed (simulated)');
              }
              return state.queryResults.shift() ?? [];
            },
          }),
        }),
      };
    },
  },
}));

const future = () => new Date(Date.now() + 86_400_000);

function parentSessionRow(
  role: 'parent' | 'admin',
  userId: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    id: 'sess-parent',
    actorType: role,
    userId,
    childId: null,
    revokedAt: null,
    expiresAt: future(),
    ...overrides,
  };
}

function childSessionRow(childId: string, overrides: Record<string, unknown> = {}) {
  return {
    id: 'sess-child',
    actorType: 'child',
    userId: null,
    childId,
    revokedAt: null,
    expiresAt: future(),
    ...overrides,
  };
}

describe('src/proxy.ts Route Guards (DB-backed revocation)', () => {
  function createMockRequest(url: string, cookies: Record<string, string> = {}): NextRequest {
    const req = new NextRequest(new URL(url, 'http://localhost:3000'));
    for (const [name, val] of Object.entries(cookies)) {
      req.cookies.set(name, val);
    }
    return req;
  }

  async function parentToken(role: 'parent' | 'admin' = 'parent') {
    return createParentSession('parent-user-uuid', role, generateOpaqueToken());
  }

  async function childToken() {
    return createChildSession('child-user-uuid', 'household-uuid', generateOpaqueToken());
  }

  beforeEach(() => {
    state.queryResults = [];
    state.dbShouldThrow = false;
    state.selectCalls = 0;
  });

  describe('Admin route guard (/admin/*)', () => {
    it('redirects unauthenticated user to /login without touching the DB', async () => {
      const res = await proxy(createMockRequest('/admin/users'));
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/login');
      expect(state.selectCalls).toBe(0);
    });

    it('redirects non-admin parent to /login', async () => {
      const res = await proxy(
        createMockRequest('/admin/users', {
          [PARENT_COOKIE_NAME]: await parentToken('parent'),
        }),
      );
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/login');
    });

    it('redirects admin whose DB session is revoked', async () => {
      const token = await parentToken('admin');
      state.queryResults = [
        [parentSessionRow('admin', 'parent-user-uuid', { revokedAt: new Date() })],
      ];

      const res = await proxy(createMockRequest('/admin/users', { [PARENT_COOKIE_NAME]: token }));
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/login');
    });

    it('redirects admin whose user is deactivated', async () => {
      const token = await parentToken('admin');
      state.queryResults = [
        [parentSessionRow('admin', 'parent-user-uuid')],
        [{ id: 'parent-user-uuid', isActive: false }],
      ];

      const res = await proxy(createMockRequest('/admin/users', { [PARENT_COOKIE_NAME]: token }));
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/login');
    });

    it('allows admin access with an active DB session', async () => {
      const token = await parentToken('admin');
      state.queryResults = [
        [parentSessionRow('admin', 'parent-user-uuid')],
        [{ id: 'parent-user-uuid', isActive: true }],
      ];

      const res = await proxy(createMockRequest('/admin/users', { [PARENT_COOKIE_NAME]: token }));
      expect(res.status).toBe(200);
      expect(res.headers.get('location')).toBeNull();
    });
  });

  describe('Parent route guard (/parent/*)', () => {
    it('redirects unauthenticated request to /login', async () => {
      const res = await proxy(createMockRequest('/parent/dashboard'));
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/login');
    });

    it('allows authenticated parent with an active DB session', async () => {
      const token = await parentToken('parent');
      state.queryResults = [
        [parentSessionRow('parent', 'parent-user-uuid')],
        [{ id: 'parent-user-uuid', isActive: true }],
      ];

      const res = await proxy(
        createMockRequest('/parent/dashboard', { [PARENT_COOKIE_NAME]: token }),
      );
      expect(res.status).toBe(200);
      expect(res.headers.get('location')).toBeNull();
    });

    it('redirects when parent token is tampered/invalid', async () => {
      const res = await proxy(
        createMockRequest('/parent/dashboard', {
          [PARENT_COOKIE_NAME]: 'invalid.token.signature',
        }),
      );
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/login');
    });

    it('redirects when the parent session was revoked after login', async () => {
      const token = await parentToken('parent');
      state.queryResults = [
        [parentSessionRow('parent', 'parent-user-uuid', { revokedAt: new Date() })],
      ];

      const res = await proxy(
        createMockRequest('/parent/dashboard', { [PARENT_COOKIE_NAME]: token }),
      );
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/login');
    });

    it('redirects when the parent user was deactivated after login', async () => {
      const token = await parentToken('parent');
      state.queryResults = [
        [parentSessionRow('parent', 'parent-user-uuid')],
        [{ id: 'parent-user-uuid', isActive: false }],
      ];

      const res = await proxy(
        createMockRequest('/parent/dashboard', { [PARENT_COOKIE_NAME]: token }),
      );
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/login');
    });

    it('FAILS CLOSED: redirects when the database errors', async () => {
      const token = await parentToken('parent');
      state.dbShouldThrow = true;

      const res = await proxy(
        createMockRequest('/parent/dashboard', { [PARENT_COOKIE_NAME]: token }),
      );
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/login');
    });
  });

  describe('Child route guard (/session, /companion, /lessons, etc.)', () => {
    it('redirects unauthenticated request on /session to /child-login', async () => {
      const res = await proxy(createMockRequest('/session/active'));
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/child-login');
    });

    it('redirects unauthenticated request on /companion to /child-login', async () => {
      const res = await proxy(createMockRequest('/companion/snow'));
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/child-login');
    });
    it('redirects unauthenticated request on /mia to /child-login', async () => {
      const res = await proxy(createMockRequest('/mia/chat'));
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/child-login');
    });

    it('redirects unauthenticated request on /lessons to /child-login', async () => {
      const res = await proxy(createMockRequest('/lessons/math-1'));
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/child-login');
    });

    it('allows authenticated child with an active DB session', async () => {
      const token = await childToken();
      state.queryResults = [
        [childSessionRow('child-user-uuid')],
        [{ id: 'child-user-uuid', isActive: true }],
      ];

      const res = await proxy(createMockRequest('/session/active', { [CHILD_COOKIE_NAME]: token }));
      expect(res.status).toBe(200);
      expect(res.headers.get('location')).toBeNull();
    });

    it('applies the same active child-session guard to /mia as /companion', async () => {
      const token = await childToken();
      const activeRows = [
        [childSessionRow('child-user-uuid')],
        [{ id: 'child-user-uuid', isActive: true }],
      ];

      state.queryResults = [...activeRows];
      const miaRes = await proxy(createMockRequest('/mia/chat', { [CHILD_COOKIE_NAME]: token }));

      state.queryResults = [...activeRows];
      const companionRes = await proxy(createMockRequest('/companion/snow', { [CHILD_COOKIE_NAME]: token }));

      expect(miaRes.status).toBe(companionRes.status);
      expect(miaRes.status).toBe(200);
      expect(miaRes.headers.get('location')).toBe(companionRes.headers.get('location'));
    });

    it('redirects when the child session was revoked after login', async () => {
      const token = await childToken();
      state.queryResults = [[childSessionRow('child-user-uuid', { revokedAt: new Date() })]];

      const res = await proxy(createMockRequest('/session/active', { [CHILD_COOKIE_NAME]: token }));
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/child-login');
    });

    it('redirects when the child was deactivated after login', async () => {
      const token = await childToken();
      state.queryResults = [
        [childSessionRow('child-user-uuid')],
        [{ id: 'child-user-uuid', isActive: false }],
      ];

      const res = await proxy(createMockRequest('/session/active', { [CHILD_COOKIE_NAME]: token }));
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/child-login');
    });

    it('rejects child accessing /session with parent token (separate secret key)', async () => {
      const res = await proxy(
        createMockRequest('/session/active', {
          [CHILD_COOKIE_NAME]: await parentToken('parent'),
        }),
      );
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/child-login');
    });
    it('rejects parent-only credentials on /mia', async () => {
      const res = await proxy(
        createMockRequest('/mia/chat', {
          [PARENT_COOKIE_NAME]: await parentToken('parent'),
        }),
      );
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/child-login');
    });

    it('keeps /mia in the protected matcher without changing public or unrelated routes', () => {
      expect(config.matcher).toContain('/mia/:path*');
      expect(config.matcher).toContain('/companion/:path*');
      expect(config.matcher).not.toContain('/child-login/:path*');
      expect(config.matcher).not.toContain('/api/:path*');
    });
  });

  describe('Public routes', () => {
    it('allows access to public home page without authentication or DB queries', async () => {
      const res = await proxy(createMockRequest('/'));
      expect(res.status).toBe(200);
      expect(res.headers.get('location')).toBeNull();
      expect(state.selectCalls).toBe(0);
    });

    it('allows access to public login page without authentication or DB queries', async () => {
      const res = await proxy(createMockRequest('/login'));
      expect(res.status).toBe(200);
      expect(res.headers.get('location')).toBeNull();
      expect(state.selectCalls).toBe(0);
    });
  });
});
