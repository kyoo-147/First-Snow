import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from '../proxy';
import {
  createParentSession,
  createChildSession,
  PARENT_COOKIE_NAME,
  CHILD_COOKIE_NAME,
} from '@/lib/auth/session';

describe('src/proxy.ts Route Guards', () => {
  let parentToken: string;
  let adminToken: string;
  let childToken: string;

  beforeEach(async () => {
    parentToken = await createParentSession('parent-user-uuid', 'parent');
    adminToken = await createParentSession('admin-user-uuid', 'admin');
    childToken = await createChildSession('child-user-uuid', 'household-uuid');
  });

  function createMockRequest(url: string, cookies: Record<string, string> = {}): NextRequest {
    const req = new NextRequest(new URL(url, 'http://localhost:3000'));
    for (const [name, val] of Object.entries(cookies)) {
      req.cookies.set(name, val);
    }
    return req;
  }

  describe('Admin route guard (/admin/*)', () => {
    it('redirects unauthenticated user to /login', async () => {
      const req = createMockRequest('/admin/users');
      const res = await proxy(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/login');
    });

    it('redirects non-admin parent to /login', async () => {
      const req = createMockRequest('/admin/users', {
        [PARENT_COOKIE_NAME]: parentToken,
      });
      const res = await proxy(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/login');
    });

    it('allows admin access with valid admin session', async () => {
      const req = createMockRequest('/admin/users', {
        [PARENT_COOKIE_NAME]: adminToken,
      });
      const res = await proxy(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('location')).toBeNull();
    });
  });

  describe('Parent route guard (/parent/*)', () => {
    it('redirects unauthenticated request to /login', async () => {
      const req = createMockRequest('/parent/dashboard');
      const res = await proxy(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/login');
    });

    it('allows authenticated parent access', async () => {
      const req = createMockRequest('/parent/dashboard', {
        [PARENT_COOKIE_NAME]: parentToken,
      });
      const res = await proxy(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('location')).toBeNull();
    });

    it('redirects when parent token is tampered/invalid', async () => {
      const req = createMockRequest('/parent/dashboard', {
        [PARENT_COOKIE_NAME]: 'invalid.token.signature',
      });
      const res = await proxy(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/login');
    });
  });

  describe('Child route guard (/session, /companion, /lessons, etc.)', () => {
    it('redirects unauthenticated request on /session to /child-login', async () => {
      const req = createMockRequest('/session/active');
      const res = await proxy(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/child-login');
    });

    it('redirects unauthenticated request on /companion to /child-login', async () => {
      const req = createMockRequest('/companion/snow');
      const res = await proxy(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/child-login');
    });

    it('redirects unauthenticated request on /lessons to /child-login', async () => {
      const req = createMockRequest('/lessons/math-1');
      const res = await proxy(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/child-login');
    });

    it('allows authenticated child access to /session', async () => {
      const req = createMockRequest('/session/active', {
        [CHILD_COOKIE_NAME]: childToken,
      });
      const res = await proxy(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('location')).toBeNull();
    });

    it('rejects child accessing /session with parent token (separate secret key)', async () => {
      const req = createMockRequest('/session/active', {
        [CHILD_COOKIE_NAME]: parentToken,
      });
      const res = await proxy(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/child-login');
    });
  });

  describe('Public routes', () => {
    it('allows access to public home page without authentication', async () => {
      const req = createMockRequest('/');
      const res = await proxy(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('location')).toBeNull();
    });

    it('allows access to public login page without authentication', async () => {
      const req = createMockRequest('/login');
      const res = await proxy(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('location')).toBeNull();
    });
  });
});
