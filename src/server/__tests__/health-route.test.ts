import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ execute: vi.fn() }));
vi.mock('@/db/client', () => ({ db: { execute: mocks.execute } }));

describe('health endpoint', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('reports ok with 200 only after a successful database round-trip', async () => {
    mocks.execute.mockResolvedValue([{ '?column?': 1 }]);
    const { GET } = await import('@/app/api/health/route');
    const response = await GET();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.checks.database).toBe('ok');
    expect(body.checks.ai_provider).toBeDefined();
    expect(typeof body.checks.ai_provider.configured).toBe('boolean');
    expect(body.checks.discord_boundary).toBeDefined();
    expect(typeof body.checks.discord_boundary.configured).toBe('boolean');
    expect(body.checks.discord_boundary.connected).toBe(false);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(mocks.execute).toHaveBeenCalledTimes(1);
  });

  it('reports unavailable with 503 when the database round-trip fails', async () => {
    mocks.execute.mockRejectedValue(new Error('connection refused'));
    const { GET } = await import('@/app/api/health/route');
    const response = await GET();

    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.status).toBe('unavailable');
    expect(body.checks.database).toBe('error');
    expect(body.checks.ai_provider).toBeDefined();
  });
});
