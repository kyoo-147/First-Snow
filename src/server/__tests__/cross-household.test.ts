import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ChildSessionPayload } from '@/lib/auth/session';

// Mock server-only
vi.mock('server-only', () => ({}));

// Configurable mock query results
let queryResults: any[][] = [];

vi.mock('@/db/client', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => {
            return queryResults.shift() ?? [];
          }),
        })),
        innerJoin: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => {
              return queryResults.shift() ?? [];
            }),
          })),
        })),
      })),
    })),
  },
}));

describe('Cross-household Authorization Boundaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryResults = [];
  });

  describe('assertChildBelongsToHousehold', () => {
    it('returns null (access granted) when child belongs to the requesting household', async () => {
      queryResults = [[{ id: 'child-1-a', householdId: 'hh-1' }]];

      const { assertChildBelongsToHousehold } = await import('../auth');
      const result = await assertChildBelongsToHousehold('child-1-a', 'hh-1');
      expect(result).toBeNull();
    });

    it('returns 403 Response when child belongs to a different household (cross-household isolation)', async () => {
      queryResults = [[{ id: 'child-1-a', householdId: 'hh-1' }]];

      const { assertChildBelongsToHousehold } = await import('../auth');
      // hh-2 tries to access hh-1's child
      const result = await assertChildBelongsToHousehold('child-1-a', 'hh-2');
      expect(result).toBeInstanceOf(Response);
      expect(result?.status).toBe(403);

      const json = await result?.json();
      expect(json.error.code).toBe('FORBIDDEN');
    });

    it('returns 403 Response (NOT 404) for non-existent child to prevent ID enumeration', async () => {
      queryResults = [[]]; // Child not found

      const { assertChildBelongsToHousehold } = await import('../auth');
      const result = await assertChildBelongsToHousehold('non-existent-id', 'hh-1');
      expect(result).toBeInstanceOf(Response);
      expect(result?.status).toBe(403);

      const json = await result?.json();
      expect(json.error.code).toBe('FORBIDDEN');
    });
  });

  describe('assertChildSessionOwnsChild', () => {
    const childSession: ChildSessionPayload = {
      sub: 'child-1-a',
      householdId: 'hh-1',
      actorType: 'child',
    };

    it('allows child to access their own data', async () => {
      const { assertChildSessionOwnsChild } = await import('../auth');
      const result = await assertChildSessionOwnsChild(childSession, 'child-1-a');
      expect(result).toBeNull();
    });

    it('rejects child attempting to access sibling data with 403', async () => {
      const { assertChildSessionOwnsChild } = await import('../auth');
      const result = await assertChildSessionOwnsChild(childSession, 'child-1-b');
      expect(result).toBeInstanceOf(Response);
      expect(result?.status).toBe(403);

      const json = await result?.json();
      expect(json.error.code).toBe('FORBIDDEN');
    });

    it('rejects child attempting to access external child data with 403', async () => {
      const { assertChildSessionOwnsChild } = await import('../auth');
      const result = await assertChildSessionOwnsChild(childSession, 'child-2-a');
      expect(result).toBeInstanceOf(Response);
      expect(result?.status).toBe(403);
    });
  });

  describe('assertUserBelongsToHousehold', () => {
    it('grants access when user is the household owner', async () => {
      queryResults = [[{ id: 'hh-1' }]]; // Owner found

      const { assertUserBelongsToHousehold } = await import('../auth');
      const result = await assertUserBelongsToHousehold('parent-1', 'hh-1');
      expect(result).toBeNull();
    });

    it('grants access when user is a guardian member of the household', async () => {
      queryResults = [
        [], // Not owner
        [{ householdId: 'hh-1' }], // Found in householdMembers
      ];

      const { assertUserBelongsToHousehold } = await import('../auth');
      const result = await assertUserBelongsToHousehold('guardian-3', 'hh-1');
      expect(result).toBeNull();
    });

    it('rejects user with 403 when they have no affiliation with the household', async () => {
      queryResults = [
        [], // Not owner
        [], // Not member
      ];

      const { assertUserBelongsToHousehold } = await import('../auth');
      const result = await assertUserBelongsToHousehold('parent-2', 'hh-1');
      expect(result).toBeInstanceOf(Response);
      expect(result?.status).toBe(403);

      const json = await result?.json();
      expect(json.error.code).toBe('FORBIDDEN');
    });
  });

  describe('getParentHousehold', () => {
    it('returns household when user is the owner', async () => {
      queryResults = [[{ id: 'hh-1', ownerId: 'parent-1', name: 'Household 1' }]];

      const { getParentHousehold } = await import('../auth');
      const result = await getParentHousehold('parent-1');
      expect(result?.id).toBe('hh-1');
      expect(result?.ownerId).toBe('parent-1');
    });

    it('returns household when user is a member', async () => {
      queryResults = [
        [], // Not owner
        [{ id: 'hh-1', ownerId: 'parent-1', name: 'Household 1' }], // Member in householdMembers
      ];

      const { getParentHousehold } = await import('../auth');
      const result = await getParentHousehold('guardian-3');
      expect(result?.id).toBe('hh-1');
    });

    it('returns null when user has no household', async () => {
      queryResults = [[], []];

      const { getParentHousehold } = await import('../auth');
      const result = await getParentHousehold('unaffiliated-user');
      expect(result).toBeNull();
    });
  });
});
