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
    expect(await response.json()).toEqual({ status: 'ok', checks: { database: 'ok' } });
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(mocks.execute).toHaveBeenCalledTimes(1);
  });

  it('reports unavailable with 503 when the database round-trip fails', async () => {
    mocks.execute.mockRejectedValue(new Error('connection refused'));
    const { GET } = await import('@/app/api/health/route');
    const response = await GET();

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: 'unavailable', checks: { database: 'error' } });
  });
});
