import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createParentSession,
  createChildSession,
  generateOpaqueToken,
  hashToken,
  PARENT_COOKIE_NAME,
  CHILD_COOKIE_NAME,
} from '@/lib/auth/session';

// Mock server-only and next/headers for unit tests
vi.mock('server-only', () => ({}));

let mockCookieValues: Record<string, string | undefined> = {};

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      const val = mockCookieValues[name];
      return val !== undefined ? { value: val } : undefined;
    },
    delete: vi.fn(),
    set: vi.fn(),
  }),
}));

let queryResults: any[][] = [];
let dbShouldThrow = false;

vi.mock('@/db/client', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => {
            if (dbShouldThrow) {
              throw new Error('Database connection failed (simulated)');
            }
            return queryResults.shift() ?? [];
          }),
        })),
      })),
    })),
  },
}));

describe('Fail-Closed DB-Backed Session Authentication & Server Guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookieValues = {};
    queryResults = [];
    dbShouldThrow = false;
  });

  describe('verifyParentSessionTokenWithDb', () => {
    it('returns null when token is empty or invalid', async () => {
      const { verifyParentSessionTokenWithDb } = await import('../auth');
      expect(await verifyParentSessionTokenWithDb('')).toBeNull();
      expect(await verifyParentSessionTokenWithDb('invalid.jwt.token')).toBeNull();
    });

    it('returns null when JWT has no sessionId claim', async () => {
      const { verifyParentSessionTokenWithDb } = await import('../auth');
      // Create token without sessionId
      const token = await createParentSession('user-1', 'parent');
      const result = await verifyParentSessionTokenWithDb(token);
      expect(result).toBeNull();
    });

    it('returns null when DB has no matching session row for tokenHash', async () => {
      const { verifyParentSessionTokenWithDb } = await import('../auth');
      const opaqueToken = generateOpaqueToken();
      const token = await createParentSession('user-1', 'parent', opaqueToken);

      queryResults = [[]]; // No session row
      const result = await verifyParentSessionTokenWithDb(token);
      expect(result).toBeNull();
    });

    it('returns null when session is revoked in DB (revokedAt is not null)', async () => {
      const { verifyParentSessionTokenWithDb } = await import('../auth');
      const opaqueToken = generateOpaqueToken();
      const token = await createParentSession('user-1', 'parent', opaqueToken);

      queryResults = [
        [
          {
            id: 'sess-1',
            actorType: 'parent',
            userId: 'user-1',
            expiresAt: new Date(Date.now() + 86400000),
            revokedAt: new Date(Date.now() - 1000), // Revoked
          },
        ],
      ];

      const result = await verifyParentSessionTokenWithDb(token);
      expect(result).toBeNull();
    });

    it('returns null when session is expired in DB', async () => {
      const { verifyParentSessionTokenWithDb } = await import('../auth');
      const opaqueToken = generateOpaqueToken();
      const token = await createParentSession('user-1', 'parent', opaqueToken);

      queryResults = [
        [
          {
            id: 'sess-1',
            actorType: 'parent',
            userId: 'user-1',
            expiresAt: new Date(Date.now() - 1000), // Expired
            revokedAt: null,
          },
        ],
      ];

      const result = await verifyParentSessionTokenWithDb(token);
      expect(result).toBeNull();
    });

    it('returns null when session userId in DB does not match token subject', async () => {
      const { verifyParentSessionTokenWithDb } = await import('../auth');
      const opaqueToken = generateOpaqueToken();
      const token = await createParentSession('user-1', 'parent', opaqueToken);

      queryResults = [
        [
          {
            id: 'sess-1',
            actorType: 'parent',
            userId: 'different-user-999',
            expiresAt: new Date(Date.now() + 86400000),
            revokedAt: null,
          },
        ],
      ];

      const result = await verifyParentSessionTokenWithDb(token);
      expect(result).toBeNull();
    });

    it('returns null when session actorType in DB does not match token role', async () => {
      const { verifyParentSessionTokenWithDb } = await import('../auth');
      const opaqueToken = generateOpaqueToken();
      const token = await createParentSession('user-1', 'parent', opaqueToken);

      queryResults = [
        [
          {
            id: 'sess-1',
            actorType: 'child', // Mismatch: child instead of parent
            userId: 'user-1',
            expiresAt: new Date(Date.now() + 86400000),
            revokedAt: null,
          },
        ],
      ];

      const result = await verifyParentSessionTokenWithDb(token);
      expect(result).toBeNull();
    });

    it('returns null when user is deactivated in users table', async () => {
      const { verifyParentSessionTokenWithDb } = await import('../auth');
      const opaqueToken = generateOpaqueToken();
      const token = await createParentSession('user-1', 'parent', opaqueToken);

      queryResults = [
        [
          {
            id: 'sess-1',
            actorType: 'parent',
            userId: 'user-1',
            expiresAt: new Date(Date.now() + 86400000),
            revokedAt: null,
          },
        ],
        [
          {
            id: 'user-1',
            isActive: false, // Inactive user
          },
        ],
      ];

      const result = await verifyParentSessionTokenWithDb(token);
      expect(result).toBeNull();
    });

    it('FAILS CLOSED: returns null when database query throws error (DB unreachable/down)', async () => {
      const { verifyParentSessionTokenWithDb } = await import('../auth');
      const opaqueToken = generateOpaqueToken();
      const token = await createParentSession('user-1', 'parent', opaqueToken);

      dbShouldThrow = true; // DB failure simulation

      const result = await verifyParentSessionTokenWithDb(token);
      expect(result).toBeNull();
    });

    it('returns session payload when session and user are active and valid in DB', async () => {
      const { verifyParentSessionTokenWithDb } = await import('../auth');
      const opaqueToken = generateOpaqueToken();
      const token = await createParentSession('user-1', 'parent', opaqueToken);

      queryResults = [
        [
          {
            id: 'sess-1',
            actorType: 'parent',
            userId: 'user-1',
            expiresAt: new Date(Date.now() + 86400000),
            revokedAt: null,
          },
        ],
        [
          {
            id: 'user-1',
            isActive: true,
          },
        ],
      ];

      const result = await verifyParentSessionTokenWithDb(token);
      expect(result).not.toBeNull();
      expect(result?.sub).toBe('user-1');
      expect(result?.role).toBe('parent');
      expect(result?.sessionId).toBe(opaqueToken);
    });
  });

  describe('verifyChildSessionTokenWithDb', () => {
    it('returns null when child token has no sessionId claim', async () => {
      const { verifyChildSessionTokenWithDb } = await import('../auth');
      const token = await createChildSession('child-1', 'hh-1');
      const result = await verifyChildSessionTokenWithDb(token);
      expect(result).toBeNull();
    });

    it('returns null when child session is revoked or missing in DB', async () => {
      const { verifyChildSessionTokenWithDb } = await import('../auth');
      const opaqueToken = generateOpaqueToken();
      const token = await createChildSession('child-1', 'hh-1', opaqueToken);

      queryResults = [[]]; // Missing row
      expect(await verifyChildSessionTokenWithDb(token)).toBeNull();

      queryResults = [
        [
          {
            id: 'sess-c1',
            actorType: 'child',
            childId: 'child-1',
            expiresAt: new Date(Date.now() + 86400000),
            revokedAt: new Date(), // Revoked
          },
        ],
      ];
      expect(await verifyChildSessionTokenWithDb(token)).toBeNull();
    });

    it('returns null when child session row childId does not match token subject', async () => {
      const { verifyChildSessionTokenWithDb } = await import('../auth');
      const opaqueToken = generateOpaqueToken();
      const token = await createChildSession('child-1', 'hh-1', opaqueToken);

      queryResults = [
        [
          {
            id: 'sess-c1',
            actorType: 'child',
            childId: 'other-child-2', // Mismatch
            expiresAt: new Date(Date.now() + 86400000),
            revokedAt: null,
          },
        ],
      ];
      expect(await verifyChildSessionTokenWithDb(token)).toBeNull();
    });

    it('CROSS-ACTOR PREVENTION: returns null if session row actorType is not child', async () => {
      const { verifyChildSessionTokenWithDb } = await import('../auth');
      const opaqueToken = generateOpaqueToken();
      const token = await createChildSession('child-1', 'hh-1', opaqueToken);

      queryResults = [
        [
          {
            id: 'sess-c1',
            actorType: 'parent', // Cross-actor spoof attempt
            childId: 'child-1',
            expiresAt: new Date(Date.now() + 86400000),
            revokedAt: null,
          },
        ],
      ];
      expect(await verifyChildSessionTokenWithDb(token)).toBeNull();
    });

    it('FAILS CLOSED: returns null on database error for child session', async () => {
      const { verifyChildSessionTokenWithDb } = await import('../auth');
      const opaqueToken = generateOpaqueToken();
      const token = await createChildSession('child-1', 'hh-1', opaqueToken);

      dbShouldThrow = true;
      expect(await verifyChildSessionTokenWithDb(token)).toBeNull();
    });

    it('returns payload when child session and child record are valid and active', async () => {
      const { verifyChildSessionTokenWithDb } = await import('../auth');
      const opaqueToken = generateOpaqueToken();
      const token = await createChildSession('child-1', 'hh-1', opaqueToken);

      queryResults = [
        [
          {
            id: 'sess-c1',
            actorType: 'child',
            childId: 'child-1',
            expiresAt: new Date(Date.now() + 86400000),
            revokedAt: null,
          },
        ],
        [
          {
            id: 'child-1',
            isActive: true,
          },
        ],
      ];

      const result = await verifyChildSessionTokenWithDb(token);
      expect(result).not.toBeNull();
      expect(result?.sub).toBe('child-1');
      expect(result?.actorType).toBe('child');
      expect(result?.sessionId).toBe(opaqueToken);
    });
  });

  describe('isDbSessionValid', () => {
    it('returns false on empty string or null', async () => {
      const { isDbSessionValid } = await import('../auth');
      expect(await isDbSessionValid('')).toBe(false);
    });

    it('returns false when session not found in DB', async () => {
      const { isDbSessionValid } = await import('../auth');
      queryResults = [[]];
      expect(await isDbSessionValid('non-existent-token')).toBe(false);
    });

    it('returns false when session is revoked', async () => {
      const { isDbSessionValid } = await import('../auth');
      queryResults = [
        [
          {
            id: 'sess-1',
            revokedAt: new Date(),
            expiresAt: new Date(Date.now() + 86400000),
          },
        ],
      ];
      expect(await isDbSessionValid('valid-token')).toBe(false);
    });

    it('returns false when session is expired', async () => {
      const { isDbSessionValid } = await import('../auth');
      queryResults = [
        [
          {
            id: 'sess-1',
            revokedAt: null,
            expiresAt: new Date(Date.now() - 1000),
          },
        ],
      ];
      expect(await isDbSessionValid('valid-token')).toBe(false);
    });

    it('FAILS CLOSED: returns false on DB query error', async () => {
      const { isDbSessionValid } = await import('../auth');
      dbShouldThrow = true;
      expect(await isDbSessionValid('any-token')).toBe(false);
    });

    it('returns true when session is active, unrevoked, and unexpired', async () => {
      const { isDbSessionValid } = await import('../auth');
      queryResults = [
        [
          {
            id: 'sess-1',
            revokedAt: null,
            expiresAt: new Date(Date.now() + 86400000),
          },
        ],
      ];
      expect(await isDbSessionValid('valid-token')).toBe(true);
    });
  });

  describe('Cookie-based getParentSession & getChildSession', () => {
    it('returns null when cookie is missing', async () => {
      mockCookieValues = {};
      const { getParentSession, getChildSession } = await import('../auth');
      expect(await getParentSession()).toBeNull();
      expect(await getChildSession()).toBeNull();
    });

    it('returns payload when parent cookie is present and DB session is valid', async () => {
      const opaqueToken = generateOpaqueToken();
      const token = await createParentSession('user-1', 'parent', opaqueToken);
      mockCookieValues[PARENT_COOKIE_NAME] = token;

      queryResults = [
        [
          {
            id: 'sess-1',
            actorType: 'parent',
            userId: 'user-1',
            expiresAt: new Date(Date.now() + 86400000),
            revokedAt: null,
          },
        ],
        [
          {
            id: 'user-1',
            isActive: true,
          },
        ],
      ];

      const { getParentSession } = await import('../auth');
      const session = await getParentSession();
      expect(session).not.toBeNull();
      expect(session?.sub).toBe('user-1');
    });
  });

  describe('Server Route Guards (requireParentSession, requireAdminSession, requireChildSession)', () => {
    it('requireParentSession returns 401 Response when session is missing or DB check fails', async () => {
      mockCookieValues = {};
      const { requireParentSession } = await import('../auth');
      const result = await requireParentSession();
      expect(result).toBeInstanceOf(Response);
      expect((result as Response).status).toBe(401);
    });

    it('requireAdminSession returns 403 Response when user is parent, not admin', async () => {
      const opaqueToken = generateOpaqueToken();
      const token = await createParentSession('user-1', 'parent', opaqueToken);
      mockCookieValues[PARENT_COOKIE_NAME] = token;

      queryResults = [
        [
          {
            id: 'sess-1',
            actorType: 'parent',
            userId: 'user-1',
            expiresAt: new Date(Date.now() + 86400000),
            revokedAt: null,
          },
        ],
        [
          {
            id: 'user-1',
            isActive: true,
          },
        ],
      ];

      const { requireAdminSession } = await import('../auth');
      const result = await requireAdminSession();
      expect(result).toBeInstanceOf(Response);
      expect((result as Response).status).toBe(403);
    });

    it('requireChildSession returns 401 Response when child cookie is missing or invalid', async () => {
      mockCookieValues = {};
      const { requireChildSession } = await import('../auth');
      const result = await requireChildSession();
      expect(result).toBeInstanceOf(Response);
      expect((result as Response).status).toBe(401);
    });
  });
});
