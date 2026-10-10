import { describe, it, expect, vi, afterEach } from 'vitest';
import { getAuthSession } from '@/components/auth/auth-api';
import { fetchDashboardSession } from '@/lib/dashboard-client';

describe('Child Learning & Conversation End-to-End Audit Tests', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('Session Switching & getAuthSession() Normalization', () => {
    it('normalizes child session response into AuthSessionData with isAuthenticated, child, and user', async () => {
      vi.stubGlobal('fetch', vi.fn(async (url: string) => {
        if (url.includes('actor=child')) {
          return new Response(JSON.stringify({
            session: {
              actorType: 'child',
              child: { id: 'child-123', name: 'Bé Bắp', householdId: 'house-1' },
            },
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({
          session: {
            actorType: 'parent',
            user: { id: 'user-1', name: 'Mẹ Lan', email: 'lan@test.com', role: 'parent', householdId: 'house-1' },
          },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }));

      const authSession = await getAuthSession();
      expect(authSession.isAuthenticated).toBe(true);
      expect(authSession.child).toEqual({ id: 'child-123', name: 'Bé Bắp', householdId: 'house-1' });
      expect(authSession.user?.name).toBe('Mẹ Lan');
    });

    it('returns parent details when only parent session is active', async () => {
      vi.stubGlobal('fetch', vi.fn(async (url: string) => {
        if (url.includes('actor=child')) {
          return new Response(JSON.stringify({ session: null }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response(JSON.stringify({
          session: {
            actorType: 'parent',
            user: { id: 'user-1', name: 'Ba Hùng', email: 'hung@test.com', role: 'parent', householdId: 'house-1' },
          },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }));

      const authSession = await getAuthSession();
      expect(authSession.isAuthenticated).toBe(true);
      expect(authSession.child).toBeNull();
      expect(authSession.user).toEqual({
        id: 'user-1',
        name: 'Ba Hùng',
        email: 'hung@test.com',
        role: 'parent',
        householdId: 'house-1',
      });
    });

    it('returns isAuthenticated=false when no session is present', async () => {
      vi.stubGlobal('fetch', vi.fn(async () => {
        return new Response(JSON.stringify({ session: null }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }));

      const authSession = await getAuthSession();
      expect(authSession.isAuthenticated).toBe(false);
      expect(authSession.child).toBeNull();
      expect(authSession.user).toBeNull();
    });
  });

  describe('fetchDashboardSession with Actor Isolation', () => {
    it('queries /api/auth/session?actor=child when actor=child is specified', async () => {
      const mockFetch = vi.fn(async () => {
        return new Response(JSON.stringify({
          session: {
            actorType: 'child',
            child: { id: 'child-abc', name: 'An', householdId: 'h-1' },
          },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      });
      vi.stubGlobal('fetch', mockFetch);

      const session = await fetchDashboardSession('child');
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/session?actor=child', { credentials: 'same-origin' });
      expect(session?.actorType).toBe('child');
      if (session?.actorType === 'child') {
        expect(session.child.name).toBe('An');
      }
    });

    it('preserves backwards compatibility when no actor is passed', async () => {
      const mockFetch = vi.fn(async () => {
        return new Response(JSON.stringify({
          session: {
            actorType: 'parent',
            user: { id: 'u-1', name: 'Ba', email: 'ba@test.com', role: 'parent', householdId: 'h-1' },
          },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      });
      vi.stubGlobal('fetch', mockFetch);

      const session = await fetchDashboardSession();
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/session', { credentials: 'same-origin' });
      expect(session?.actorType).toBe('parent');
    });
  });
});
