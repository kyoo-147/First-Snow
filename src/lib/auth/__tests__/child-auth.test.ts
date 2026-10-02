import { describe, it, expect, vi } from 'vitest';

// Mock server-only to prevent it from throwing in test environment
vi.mock('server-only', () => ({}));

import { hashPin, verifyPin } from '../child-auth';
import {
  createChildSession,
  verifyChildSession,
  createParentSession,
  verifyParentSession,
} from '../session';

describe('child auth — PIN hashing', () => {
  it('hashes PIN with bcrypt (identifies as bcrypt hash)', async () => {
    const hash = await hashPin('1234');
    expect(hash).toMatch(/^\$2[ab]\$/);
    expect(hash).not.toContain('1234');
  });

  it('hashes with salt rounds = 12', async () => {
    const hash = await hashPin('5678');
    expect(hash.split('$')[2]).toBe('12');
  });

  it('verifies correct PIN', async () => {
    const hash = await hashPin('5678');
    expect(await verifyPin('5678', hash)).toBe(true);
  });

  it('rejects wrong PIN', async () => {
    const hash = await hashPin('1234');
    expect(await verifyPin('9999', hash)).toBe(false);
  });

  it('each PIN hash is unique (salted)', async () => {
    const hash1 = await hashPin('1234');
    const hash2 = await hashPin('1234');
    expect(hash1).not.toBe(hash2);
  });
});

describe('child auth — JWT sessions', () => {
  it('creates and verifies child session JWT', async () => {
    const token = await createChildSession(
      'child-uuid-123',
      'household-uuid-456',
    );
    const payload = await verifyChildSession(token);
    expect(payload?.sub).toBe('child-uuid-123');
    expect(payload?.householdId).toBe('household-uuid-456');
    expect(payload?.actorType).toBe('child');
  });

  it('returns null for tampered child JWT', async () => {
    const token = await createChildSession('child-uuid', 'household-uuid');
    const parts = token.split('.');
    parts[2] = 'CORRUPTED_SIGNATURE_XXXXX';
    const tampered = parts.join('.');
    const payload = await verifyChildSession(tampered);
    expect(payload).toBeNull();
  });

  it('child session CANNOT be verified by parent key (key separation)', async () => {
    // This is a critical security test: child tokens use CHILD_SESSION_SECRET,
    // parent tokens use SESSION_SECRET. Cross-verification must fail.
    const childToken = await createChildSession('child-uuid', 'household-uuid');
    const result = await verifyParentSession(childToken);
    expect(result).toBeNull();
  });

  it('parent session CANNOT be verified by child key (key separation)', async () => {
    const parentToken = await createParentSession('parent-uuid', 'parent');
    const result = await verifyChildSession(parentToken);
    expect(result).toBeNull();
  });

  it('child token has actorType=child (not parent)', async () => {
    const token = await createChildSession('child-uuid', 'household-uuid');
    const payload = await verifyChildSession(token);
    expect(payload?.actorType).toBe('child');
    expect(payload?.actorType).not.toBe('parent');
    expect(payload?.actorType).not.toBe('admin');
  });
});
