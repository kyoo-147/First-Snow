import { describe, it, expect, vi } from 'vitest';

// Mock server-only to prevent it from throwing in test environment
vi.mock('server-only', () => ({}));

import { hashPassword, verifyPassword } from '../parent-auth';
import { createParentSession, verifyParentSession } from '../session';

describe('parent auth — password hashing', () => {
  it('hashes password with bcrypt (identifies as bcrypt hash)', async () => {
    const hash = await hashPassword('MyP@ssword1!');
    expect(hash).toMatch(/^\$2[ab]\$/);
    expect(hash).not.toContain('MyP@ssword1!');
  });

  it('hashes with salt rounds = 12 (cost factor in hash)', async () => {
    const hash = await hashPassword('MyP@ssword1!');
    // bcrypt hash format: $2b$12$... — cost factor is the second segment
    expect(hash.split('$')[2]).toBe('12');
  });

  it('verifies correct password', async () => {
    const hash = await hashPassword('MyP@ssword1!');
    expect(await verifyPassword('MyP@ssword1!', hash)).toBe(true);
  });

  it('rejects wrong password', async () => {
    const hash = await hashPassword('MyP@ssword1!');
    expect(await verifyPassword('WrongPassword!1', hash)).toBe(false);
  });

  it('each hash is unique (salted)', async () => {
    const hash1 = await hashPassword('same-password');
    const hash2 = await hashPassword('same-password');
    expect(hash1).not.toBe(hash2);
  });
});

describe('parent auth — JWT sessions', () => {
  it('creates and verifies parent session JWT', async () => {
    const token = await createParentSession('user-uuid-123', 'parent');
    const payload = await verifyParentSession(token);
    expect(payload?.sub).toBe('user-uuid-123');
    expect(payload?.role).toBe('parent');
    expect(payload?.actorType).toBe('parent');
  });

  it('creates and verifies admin session JWT', async () => {
    const token = await createParentSession('admin-uuid-456', 'admin');
    const payload = await verifyParentSession(token);
    expect(payload?.sub).toBe('admin-uuid-456');
    expect(payload?.role).toBe('admin');
    expect(payload?.actorType).toBe('admin');
  });

  it('returns null for tampered JWT signature', async () => {
    const token = await createParentSession('user-uuid-123', 'parent');
    // Corrupt the signature portion (last segment)
    const parts = token.split('.');
    parts[2] = 'XXXXXXXXXXXXXXXXXXXXXXXX';
    const tampered = parts.join('.');
    const payload = await verifyParentSession(tampered);
    expect(payload).toBeNull();
  });

  it('returns null for completely invalid token string', async () => {
    const payload = await verifyParentSession('not.a.jwt.token');
    expect(payload).toBeNull();
  });

  it('returns null for empty string token', async () => {
    const payload = await verifyParentSession('');
    expect(payload).toBeNull();
  });

  it('admin token has correct role, cannot be confused with parent', async () => {
    const parentToken = await createParentSession('p-uuid', 'parent');
    const adminToken = await createParentSession('a-uuid', 'admin');

    const parentPayload = await verifyParentSession(parentToken);
    const adminPayload = await verifyParentSession(adminToken);

    // Cross-check: roles must not be confused
    expect(parentPayload?.role).toBe('parent');
    expect(adminPayload?.role).toBe('admin');
    expect(parentPayload?.role).not.toBe(adminPayload?.role);
  });
});
