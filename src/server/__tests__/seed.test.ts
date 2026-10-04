import { describe, it, expect, vi, beforeEach } from 'vitest';

const hoisted = vi.hoisted(() => {
  const rows = [{ id: 'generated-id' }];
  const insertChain = Object.assign(Promise.resolve(rows), {
    returning: () => Promise.resolve(rows),
  });
  const client = { end: vi.fn(async () => {}) };
  const db = {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({ onConflictDoNothing: vi.fn(() => insertChain) })),
    })),
  };
  return { rows, insertChain, client, db };
});

vi.mock('server-only', () => ({}));
vi.mock('dotenv/config', () => ({}));
vi.mock('postgres', () => ({ default: vi.fn(() => hoisted.client) }));
vi.mock('drizzle-orm/postgres-js', () => ({ drizzle: vi.fn(() => hoisted.db) }));
vi.mock('@/lib/auth/parent-auth', () => ({ hashPassword: vi.fn(async () => 'hashed') }));
vi.mock('@/lib/auth/child-auth', () => ({ hashPin: vi.fn(async () => 'hashed') }));
vi.mock('@/db/seed-lessons', () => ({
  seedLessonCatalog: vi.fn(async () => ({
    lessonsSeeded: 4,
    stepsSeeded: 16,
    lessonIds: ['l1', 'l2', 'l3', 'l4'],
  })),
}));

import { runSeed } from '@/db/seed';
import { seedLessonCatalog } from '@/db/seed-lessons';

const TEST_URL = 'postgresql://test:test@127.0.0.1:5432/agentkid_test';

describe('runSeed wires the lesson catalog into the standard seed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('seeds the lesson catalog with the same database connection and closes the client', async () => {
    await runSeed(TEST_URL);

    expect(seedLessonCatalog).toHaveBeenCalledTimes(1);
    expect(vi.mocked(seedLessonCatalog)).toHaveBeenCalledWith({ db: hoisted.db });
    expect(hoisted.client.end).toHaveBeenCalledTimes(1);
  });

  it('invokes the idempotent catalog seeder on every run', async () => {
    await runSeed(TEST_URL);
    await runSeed(TEST_URL);

    expect(seedLessonCatalog).toHaveBeenCalledTimes(2);
  });

  it('requires DATABASE_URL when no connection string is given', async () => {
    const previous = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      await expect(runSeed()).rejects.toThrow(/DATABASE_URL/);
      expect(seedLessonCatalog).not.toHaveBeenCalled();
    } finally {
      process.env.DATABASE_URL = previous;
    }
  });
});
