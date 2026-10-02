import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock server-only to prevent it from throwing in test environment
vi.mock('server-only', () => ({}));

describe('env validation', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    // Start with valid values
    process.env.DATABASE_URL =
      'postgresql://test:test@localhost:5432/agentkid_test';
    process.env.SESSION_SECRET =
      'test-session-secret-do-not-use-in-production-32ch';
    process.env.CHILD_SESSION_SECRET =
      'test-child-session-secret-do-not-use-prod-32c';
    (process.env as Record<string, string | undefined>).NODE_ENV = 'test';
  });

  afterEach(() => {
    // Restore original env
    Object.keys(process.env).forEach((key) => {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    });
    Object.assign(process.env, originalEnv);
  });

  it('throws when DATABASE_URL is missing', async () => {
    delete process.env.DATABASE_URL;
    await expect(import('../env')).rejects.toThrow(/DATABASE_URL/);
  });

  it('throws when SESSION_SECRET is missing', async () => {
    delete process.env.SESSION_SECRET;
    await expect(import('../env')).rejects.toThrow(/SESSION_SECRET/);
  });

  it('throws when CHILD_SESSION_SECRET is missing', async () => {
    delete process.env.CHILD_SESSION_SECRET;
    await expect(import('../env')).rejects.toThrow(/CHILD_SESSION_SECRET/);
  });

  it('throws when SESSION_SECRET is too short (< 32 chars)', async () => {
    process.env.SESSION_SECRET = 'short';
    await expect(import('../env')).rejects.toThrow(/SESSION_SECRET/);
  });

  it('exports validated env when all vars present', async () => {
    const { env } = await import('../env');
    expect(env.DATABASE_URL).toBeDefined();
    expect(env.SESSION_SECRET).toBeDefined();
    expect(env.CHILD_SESSION_SECRET).toBeDefined();
    expect(env.NODE_ENV).toBe('test');
  });
});
