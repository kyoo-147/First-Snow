import { beforeEach, describe, expect, it, vi } from 'vitest';

const select = vi.fn();
vi.mock('@/db/client', () => ({ db: { select } }));

const requireParentSession = vi.fn();
const getParentHousehold = vi.fn();
const assertChildBelongsToHousehold = vi.fn(async () => null);
vi.mock('@/server/auth', () => ({ requireParentSession, getParentHousehold, assertChildBelongsToHousehold }));
vi.mock('server-only', () => ({}));

function rowsOnce(row: unknown) {
  const limit = vi.fn(async () => (row === null ? [] : [row]));
  const where = vi.fn(() => ({ limit }));
  const innerJoin = vi.fn(() => ({ where }));
  const from = vi.fn(() => ({ innerJoin }));
  select.mockImplementation(() => ({ from }));
}

const message = {
  id: 'alert-1',
  childId: 'child-1',
  sessionId: 'session-1',
  clientMessageId: null,
  speaker: 'child' as const,
  text: 'hello',
  isFlagged: true,
  flagReason: 'review',
  safetyScore: 40,
  safetyAlerts: JSON.stringify({ codes: ['self_harm'] }),
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

async function callGet(alertId = 'alert-1') {
  const { GET } = await import('@/app/api/alerts/[alertId]/route');
  return GET(new Request(`http://localhost/api/alerts/${alertId}`), { params: Promise.resolve({ alertId }) });
}

describe('GET /api/alerts/[alertId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireParentSession.mockResolvedValue({ sub: 'user-a' });
    getParentHousehold.mockResolvedValue({ id: 'household-a' });
    assertChildBelongsToHousehold.mockResolvedValue(null);
  });

  it('returns the household-scoped alert as a dto', async () => {
    rowsOnce({ message, householdId: 'household-a' });
    const response = await callGet();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ id: 'alert-1', childId: 'child-1', severity: 'high', readAt: null, linkedSessionId: 'session-1' });
  });

  it('denies an alert owned by another household', async () => {
    rowsOnce({ message, householdId: 'household-b' });
    const response = await callGet();
    expect(response.status).toBe(403);
    expect((await response.json()).error.code).toBe('FORBIDDEN');
  });

  it('denies a missing or unknown alert identifier', async () => {
    rowsOnce(null);
    const response = await callGet('missing');
    expect(response.status).toBe(403);
  });

  it('requires a parent session', async () => {
    requireParentSession.mockResolvedValue(new Response(null, { status: 401 }));
    const response = await callGet();
    expect(response.status).toBe(401);
  });
});
