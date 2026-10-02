import { describe, it, expect } from 'vitest';
import {
  RegisterParentSchema,
  LoginParentSchema,
  CreateChildSchema,
  ChildLoginSchema,
  ApiErrorSchema,
} from '../contracts/auth';
import { ERRORS } from '@/lib/api/errors';
import {
  generateOpaqueToken,
  hashToken,
  createParentSession,
  verifyParentSession,
  createChildSession,
  verifyChildSession,
} from '@/lib/auth/session';

describe('Canonical Auth Contracts & Opaque Session Architecture', () => {
  describe('Zod Contracts', () => {
    it('validates RegisterParentSchema with name/email/password', () => {
      const valid = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'ValidPassword123!',
      };
      const result = RegisterParentSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('validates RegisterParentSchema with displayName and householdName', () => {
      const valid = {
        displayName: 'John Doe',
        householdName: 'The Does',
        email: 'john@example.com',
        password: 'ValidPassword123!',
      };
      const result = RegisterParentSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects weak password (< 8 chars, no digits, or no letters)', () => {
      expect(
        RegisterParentSchema.safeParse({
          name: 'Jane',
          email: 'jane@example.com',
          password: 'short',
        }).success,
      ).toBe(false);

      expect(
        RegisterParentSchema.safeParse({
          name: 'Jane',
          email: 'jane@example.com',
          password: 'onlylettersnopassword',
        }).success,
      ).toBe(false);

      expect(
        RegisterParentSchema.safeParse({
          name: 'Jane',
          email: 'jane@example.com',
          password: '123456789012345',
        }).success,
      ).toBe(false);
    });

    it('validates CreateChildSchema with 4-digit PIN', () => {
      const valid = {
        name: 'Alice',
        pin: '1234',
        age: 8,
        grade: '3rd',
      };
      const result = CreateChildSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects invalid PIN in CreateChildSchema (not 4 digits)', () => {
      expect(
        CreateChildSchema.safeParse({
          name: 'Alice',
          pin: '123', // 3 digits
        }).success,
      ).toBe(false);

      expect(
        CreateChildSchema.safeParse({
          name: 'Alice',
          pin: 'abcd', // letters
        }).success,
      ).toBe(false);

      expect(
        CreateChildSchema.safeParse({
          name: 'Alice',
          pin: '12345', // 5 digits
        }).success,
      ).toBe(false);
    });

    it('validates ChildLoginSchema requiring UUID childId and 4-digit PIN', () => {
      const valid = {
        childId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
        pin: '4321',
      };
      expect(ChildLoginSchema.safeParse(valid).success).toBe(true);

      const invalid = {
        childId: 'not-a-uuid',
        pin: '4321',
      };
      expect(ChildLoginSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe('Nested Error Contract Conformity', () => {
    it('ERRORS.validationFailed produces { error: { code, message, details } } with 400', async () => {
      const res = ERRORS.validationFailed({ email: ['Invalid email'] });
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(ApiErrorSchema.safeParse(json).success).toBe(true);
      expect(json.error.code).toBe('VALIDATION_FAILED');
      expect(json.error.details).toBeDefined();
    });

    it('ERRORS.invalidCredentials produces 401 nested error', async () => {
      const res = ERRORS.invalidCredentials();
      expect(res.status).toBe(401);

      const json = await res.json();
      expect(ApiErrorSchema.safeParse(json).success).toBe(true);
      expect(json.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('ERRORS.parentSessionRequired produces 401 PARENT_SESSION_REQUIRED', async () => {
      const res = ERRORS.parentSessionRequired();
      expect(res.status).toBe(401);

      const json = await res.json();
      expect(ApiErrorSchema.safeParse(json).success).toBe(true);
      expect(json.error.code).toBe('PARENT_SESSION_REQUIRED');
    });

    it('ERRORS.forbidden produces 403 FORBIDDEN', async () => {
      const res = ERRORS.forbidden();
      expect(res.status).toBe(403);

      const json = await res.json();
      expect(ApiErrorSchema.safeParse(json).success).toBe(true);
      expect(json.error.code).toBe('FORBIDDEN');
    });

    it('ERRORS.conflict produces 409 CONFLICT', async () => {
      const res = ERRORS.conflict('Account exists');
      expect(res.status).toBe(409);

      const json = await res.json();
      expect(ApiErrorSchema.safeParse(json).success).toBe(true);
      expect(json.error.code).toBe('CONFLICT');
    });

    it('ERRORS.notFound produces 404 NOT_FOUND', async () => {
      const res = ERRORS.notFound();
      expect(res.status).toBe(404);

      const json = await res.json();
      expect(ApiErrorSchema.safeParse(json).success).toBe(true);
      expect(json.error.code).toBe('NOT_FOUND');
    });
  });

  describe('DB-backed Opaque Session Helpers', () => {
    it('generateOpaqueToken returns a 64-char hex cryptographically random token', () => {
      const token1 = generateOpaqueToken();
      const token2 = generateOpaqueToken();
      expect(token1).toHaveLength(64);
      expect(token2).toHaveLength(64);
      expect(token1).toMatch(/^[0-9a-f]{64}$/);
      expect(token1).not.toBe(token2);
    });

    it('hashToken hashes token using SHA-256 to 64-char hex string', () => {
      const token = generateOpaqueToken();
      const hash1 = hashToken(token);
      const hash2 = hashToken(token);
      expect(hash1).toHaveLength(64);
      expect(hash1).toMatch(/^[0-9a-f]{64}$/);
      expect(hash1).toBe(hash2); // Deterministic
    });

    it('embeds sessionId into parent JWT claims and verifies successfully', async () => {
      const sessionId = 'session-uuid-12345';
      const token = await createParentSession('user-uuid-1', 'parent', sessionId);
      const payload = await verifyParentSession(token);
      expect(payload?.sub).toBe('user-uuid-1');
      expect(payload?.role).toBe('parent');
      expect(payload?.sessionId).toBe(sessionId);
    });

    it('embeds sessionId into child JWT claims and verifies successfully', async () => {
      const sessionId = 'child-session-uuid-67890';
      const token = await createChildSession('child-uuid-1', 'hh-uuid-1', sessionId);
      const payload = await verifyChildSession(token);
      expect(payload?.sub).toBe('child-uuid-1');
      expect(payload?.householdId).toBe('hh-uuid-1');
      expect(payload?.sessionId).toBe(sessionId);
    });
  });

  describe('Legacy Auth Route Equivalence (Zero Insecure Bypass)', () => {
    it('legacy parent/register re-exports canonical register POST handler', async () => {
      const canonical = await import('@/app/api/auth/register/route');
      const legacy = await import('@/app/api/auth/parent/register/route');
      expect(legacy.POST).toBe(canonical.POST);
    });

    it('legacy parent/login re-exports canonical login POST handler', async () => {
      const canonical = await import('@/app/api/auth/login/route');
      const legacy = await import('@/app/api/auth/parent/login/route');
      expect(legacy.POST).toBe(canonical.POST);
    });

    it('legacy parent/logout re-exports canonical logout POST handler', async () => {
      const canonical = await import('@/app/api/auth/logout/route');
      const legacy = await import('@/app/api/auth/parent/logout/route');
      expect(legacy.POST).toBe(canonical.POST);
    });

    it('legacy child/login re-exports canonical child-login POST handler', async () => {
      const canonical = await import('@/app/api/auth/child-login/route');
      const legacy = await import('@/app/api/auth/child/login/route');
      expect(legacy.POST).toBe(canonical.POST);
    });

    it('legacy child/logout re-exports canonical logout POST handler', async () => {
      const canonical = await import('@/app/api/auth/logout/route');
      const legacy = await import('@/app/api/auth/child/logout/route');
      expect(legacy.POST).toBe(canonical.POST);
    });
  });
});
