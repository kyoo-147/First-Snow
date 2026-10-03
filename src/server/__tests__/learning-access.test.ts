import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getChildSession: vi.fn(), getParentSession: vi.fn() }));
vi.mock('@/server/auth', () => mocks);

describe('lesson catalog actor authorization', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getChildSession.mockResolvedValue(null);
    mocks.getParentSession.mockResolvedValue(null);
  });

  it('allows an active child or parent session', async () => {
    const { authorizeLessonCatalog } = await import('@/server/learning-access');
    mocks.getChildSession.mockResolvedValue({ sub: 'child-id' });
    expect(await authorizeLessonCatalog()).toBeNull();

    mocks.getChildSession.mockResolvedValue(null);
    mocks.getParentSession.mockResolvedValue({ sub: 'parent-id' });
    expect(await authorizeLessonCatalog()).toBeNull();
  });

  it('denies anonymous access and fails closed when session checks throw', async () => {
    const { authorizeLessonCatalog } = await import('@/server/learning-access');
    expect((await authorizeLessonCatalog())?.status).toBe(401);

    mocks.getChildSession.mockRejectedValue(new Error('database unavailable'));
    expect((await authorizeLessonCatalog())?.status).toBe(401);
  });
});
