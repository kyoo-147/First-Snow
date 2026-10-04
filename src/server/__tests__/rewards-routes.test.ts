import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getChildRewards: vi.fn(),
  authorizeChildLearning: vi.fn(),
  getChildSession: vi.fn(),
}));

vi.mock('@/server/learning', () => ({ getChildRewards: mocks.getChildRewards }));
vi.mock('@/server/learning-access', () => ({ authorizeChildLearning: mocks.authorizeChildLearning }));
vi.mock('@/server/auth', () => ({ getChildSession: mocks.getChildSession }));

const childId = '11111111-1111-4111-8111-111111111111';

describe('rewards read endpoint', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.authorizeChildLearning.mockResolvedValue(null);
    mocks.getChildSession.mockResolvedValue(null);
    mocks.getChildRewards.mockResolvedValue([]);
  });

  it('returns the rewards shape for an authorized childId', async () => {
    const reward = { id: 'r-1', type: 'star', label: 'Lesson completed', awardedAt: '2026-01-01T00:00:00.000Z', sourceAttemptId: null };
    mocks.getChildRewards.mockResolvedValue([reward]);
    const route = await import('@/app/api/rewards/route');
    const response = await route.GET(new Request(`http://local/api/rewards?childId=${childId}`));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ rewards: [reward] });
    expect(mocks.authorizeChildLearning).toHaveBeenCalledWith(childId);
    expect(mocks.getChildRewards).toHaveBeenCalledWith(childId);
  });

  it('defaults to the signed-in child session when childId is omitted', async () => {
    mocks.getChildSession.mockResolvedValue({ sub: childId });
    const route = await import('@/app/api/rewards/route');
    const response = await route.GET(new Request('http://local/api/rewards'));

    expect(response.status).toBe(200);
    expect(mocks.getChildRewards).toHaveBeenCalledWith(childId);
  });

  it('rejects a missing childId when there is no child session', async () => {
    mocks.getChildSession.mockResolvedValue(null);
    const route = await import('@/app/api/rewards/route');
    const response = await route.GET(new Request('http://local/api/rewards'));

    expect(response.status).toBe(400);
    expect(mocks.getChildRewards).not.toHaveBeenCalled();
  });

  it('rejects an invalid childId before authorization', async () => {
    const route = await import('@/app/api/rewards/route');
    const response = await route.GET(new Request('http://local/api/rewards?childId=not-a-uuid'));

    expect(response.status).toBe(400);
    expect(mocks.authorizeChildLearning).not.toHaveBeenCalled();
  });

  it('denies cross-household access and does not read rewards', async () => {
    mocks.authorizeChildLearning.mockResolvedValue(
      new Response(JSON.stringify({ error: { code: 'FORBIDDEN' } }), { status: 403 }),
    );
    const route = await import('@/app/api/rewards/route');
    const response = await route.GET(new Request(`http://local/api/rewards?childId=${childId}`));

    expect(response.status).toBe(403);
    expect(mocks.getChildRewards).not.toHaveBeenCalled();
  });

  it('returns a server error when the rewards query fails', async () => {
    mocks.getChildRewards.mockRejectedValue(new Error('database unavailable'));
    const route = await import('@/app/api/rewards/route');
    const response = await route.GET(new Request(`http://local/api/rewards?childId=${childId}`));

    expect(response.status).toBe(500);
  });
});
