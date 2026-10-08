import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createParentSession,
  createChildSession,
  generateOpaqueToken,
  PARENT_COOKIE_NAME,
  PARENT_COOKIE_OPTIONS,
  CHILD_COOKIE_OPTIONS,
} from '@/lib/auth/session';
import { NextRequest } from 'next/server';

vi.mock('server-only', () => ({}));

let mockCookies: Record<string, string | undefined> = {};
const deletedCookies: string[] = [];

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      const val = mockCookies[name];
      return val !== undefined ? { value: val } : undefined;
    },
    set: vi.fn(),
    delete: (name: string) => {
      deletedCookies.push(name);
      delete mockCookies[name];
    },
  }),
}));

let dbShouldThrow = false;
let updateShouldThrow = false;
let mockQueryQueue: unknown[][] = [];

vi.mock('@/db/client', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => {
            if (dbShouldThrow) throw new Error('DB select error (simulated)');
            return mockQueryQueue.shift() ?? [];
          }),
        })),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => {
          if (updateShouldThrow) throw new Error('DB update error (simulated)');
          return Promise.resolve();
        }),
      })),
    })),
  },
}));

describe('Auth Route Handlers — Fail-Closed DB Session Guarantees', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookies = {};
    deletedCookies.length = 0;
    dbShouldThrow = false;
    updateShouldThrow = false;
    mockQueryQueue = [];
  });

  describe('POST /api/auth/child-login (Parent authentication enforcement)', () => {
    it('rejects with 401 PARENT_SESSION_REQUIRED when parent cookie is absent', async () => {
      const { POST } = await import('@/app/api/auth/child-login/route');
      const req = new NextRequest('http://localhost:3000/api/auth/child-login', {
        method: 'POST',
        body: JSON.stringify({
          childId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
          pin: '1234',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error.code).toBe('PARENT_SESSION_REQUIRED');
    });

    it('rejects with 401 PARENT_SESSION_REQUIRED when parent cookie has invalid JWT', async () => {
      mockCookies[PARENT_COOKIE_NAME] = 'tampered.or.invalid.jwt';
      const { POST } = await import('@/app/api/auth/child-login/route');
      const req = new NextRequest('http://localhost:3000/api/auth/child-login', {
        method: 'POST',
        body: JSON.stringify({
          childId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
          pin: '1234',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error.code).toBe('PARENT_SESSION_REQUIRED');
    });

    it('rejects with 401 PARENT_SESSION_REQUIRED when parent session in DB is revoked or missing (fail closed)', async () => {
      const opaque = generateOpaqueToken();
      const parentJwt = await createParentSession('user-1', 'parent', opaque);
      mockCookies[PARENT_COOKIE_NAME] = parentJwt;

      // DB returns empty (session row not found or revoked)
      mockQueryQueue = [[]];

      const { POST } = await import('@/app/api/auth/child-login/route');
      const req = new NextRequest('http://localhost:3000/api/auth/child-login', {
        method: 'POST',
        body: JSON.stringify({
          childId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
          pin: '1234',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error.code).toBe('PARENT_SESSION_REQUIRED');
    });

    it('rejects with 401 PARENT_SESSION_REQUIRED when DB errors during parent session validation', async () => {
      const opaque = generateOpaqueToken();
      const parentJwt = await createParentSession('user-1', 'parent', opaque);
      mockCookies[PARENT_COOKIE_NAME] = parentJwt;

      dbShouldThrow = true;

      const { POST } = await import('@/app/api/auth/child-login/route');
      const req = new NextRequest('http://localhost:3000/api/auth/child-login', {
        method: 'POST',
        body: JSON.stringify({
          childId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
          pin: '1234',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error.code).toBe('PARENT_SESSION_REQUIRED');
    });
  });

  describe('POST /api/auth/logout (Revocation by tokenHash and truthful reporting)', () => {
    it('deletes cookies and returns 200 success when revocation succeeds', async () => {
      const opaque = generateOpaqueToken();
      const parentJwt = await createParentSession('user-1', 'parent', opaque);
      mockCookies[PARENT_COOKIE_NAME] = parentJwt;

      const { POST } = await import('@/app/api/auth/logout/route');
      const res = await POST();

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);

      // Verifies cookies were deleted
      expect(deletedCookies).toContain(PARENT_COOKIE_OPTIONS.name);
      expect(deletedCookies).toContain(CHILD_COOKIE_OPTIONS.name);
    });

    it('clears cookies but returns 500 error when DB revocation fails (truthful error)', async () => {
      const opaque = generateOpaqueToken();
      const parentJwt = await createParentSession('user-1', 'parent', opaque);
      mockCookies[PARENT_COOKIE_NAME] = parentJwt;

      updateShouldThrow = true; // DB update failure

      const { POST } = await import('@/app/api/auth/logout/route');
      const res = await POST();

      // Cookies MUST still be cleared
      expect(deletedCookies).toContain(PARENT_COOKIE_OPTIONS.name);
      expect(deletedCookies).toContain(CHILD_COOKIE_OPTIONS.name);

      // But response must NOT claim full success
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error.code).toBe('INTERNAL');
    });
  });

  describe('GET /api/auth/session (DB-backed, fail-closed, no JWT offline fallback)', () => {
    it('returns the child session when actor=child even if a parent cookie is also present', async () => {
      const childOpaque = generateOpaqueToken();
      const childJwt = await createChildSession('child-1', 'house-1', childOpaque);
      mockCookies[PARENT_COOKIE_NAME] = 'parent-cookie-present';
      mockCookies['snow_child_session'] = childJwt;
      mockQueryQueue = [
        [{ id: 'session-1', actorType: 'child', childId: 'child-1', expiresAt: new Date(Date.now() + 60_000), revokedAt: null }],
        [{ id: 'child-1', isActive: true }],
        [{ id: 'child-1', displayName: 'Alice', householdId: 'house-1' }],
      ];

      const { GET } = await import('@/app/api/auth/session/route');
      const res = await GET(new NextRequest('http://localhost:3000/api/auth/session?actor=child'));

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.session.actorType).toBe('child');
      expect(json.session.child.id).toBe('child-1');
    });

    it('returns { session: null } when no cookies exist', async () => {
      const { GET } = await import('@/app/api/auth/session/route');
      const res = await GET();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.session).toBeNull();
    });

    it('returns { session: null } and deletes cookie when DB session check fails or throws', async () => {
      const opaque = generateOpaqueToken();
      const parentJwt = await createParentSession('user-1', 'parent', opaque);
      mockCookies[PARENT_COOKIE_NAME] = parentJwt;

      dbShouldThrow = true; // DB failure

      const { GET } = await import('@/app/api/auth/session/route');
      const res = await GET();

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.session).toBeNull(); // Fail closed: NEVER accepts raw JWT on DB error!
      expect(deletedCookies).toContain(PARENT_COOKIE_OPTIONS.name);
    });
  });
});
