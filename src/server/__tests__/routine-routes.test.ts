import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireParentSession: vi.fn(), getParentHousehold: vi.fn(), getChildSession: vi.fn(), getParentSession: vi.fn(),
  select: vi.fn(), listRoutines: vi.fn(), createRoutine: vi.fn(), updateRoutine: vi.fn(), deleteRoutine: vi.fn(),
  setRoutineStepCompletion: vi.fn(),
}));
vi.mock('@/server/auth', () => ({
  requireParentSession: mocks.requireParentSession,
  getParentHousehold: mocks.getParentHousehold,
  getChildSession: mocks.getChildSession,
  getParentSession: mocks.getParentSession,
}));
vi.mock('@/db/client', () => ({ db: { select: mocks.select } }));
vi.mock('@/server/routines', () => ({
  listRoutines: mocks.listRoutines, createRoutine: mocks.createRoutine, updateRoutine: mocks.updateRoutine,
  deleteRoutine: mocks.deleteRoutine, setRoutineStepCompletion: mocks.setRoutineStepCompletion,
}));

const childId = '11111111-1111-4111-8111-111111111111';
const otherChildId = '22222222-2222-4222-8222-222222222222';
const stepId = '33333333-3333-4333-8333-333333333333';
const date = '2026-10-03';

describe('routine API authorization and persistence contract', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.requireParentSession.mockResolvedValue({ sub: 'parent-id' });
    mocks.getParentHousehold.mockResolvedValue({ id: 'household-id' });
    mocks.getParentSession.mockResolvedValue({ sub: 'parent-id' });
    mocks.getChildSession.mockResolvedValue(null);
    mocks.select.mockImplementation(() => {
      const query = { from: () => query, where: () => query, limit: async () => [{ id: childId }] };
      return query;
    });
    mocks.listRoutines.mockResolvedValue([]);
    mocks.createRoutine.mockResolvedValue('routine-id');
    mocks.setRoutineStepCompletion.mockResolvedValue({ stepId, completed: true, completionDate: date });
  });

  it('denies anonymous access and prevents a child from reading another child routine', async () => {
    const route = await import('@/app/api/children/[childId]/routines/route');
    mocks.getParentSession.mockResolvedValue(null);
    const anonymous = await route.GET(new Request(`http://local/api/children/${childId}/routines`), { params: Promise.resolve({ childId }) });
    expect(anonymous.status).toBe(401);

    mocks.getChildSession.mockResolvedValue({ sub: otherChildId });
    const childDenied = await route.GET(new Request(`http://local/api/children/${childId}/routines`), { params: Promise.resolve({ childId }) });
    expect(childDenied.status).toBe(403);
    expect(mocks.listRoutines).not.toHaveBeenCalled();
  });

  it('denies parent CRUD across households and creates routines only after ownership check', async () => {
    const route = await import('@/app/api/children/[childId]/routines/route');
    const payload = { title: 'Morning', timeOfDay: 'morning', steps: [{ title: 'Stretch', durationMinutes: 5 }] };
    mocks.select.mockImplementation(() => {
      const query = { from: () => query, where: () => query, limit: async () => [] };
      return query;
    });
    const denied = await route.POST(new Request('http://local', { method: 'POST', body: JSON.stringify(payload) }), { params: Promise.resolve({ childId }) });
    expect(denied.status).toBe(404);
    expect(mocks.createRoutine).not.toHaveBeenCalled();

    mocks.select.mockImplementation(() => {
      const query = { from: () => query, where: () => query, limit: async () => [{ id: childId }] };
      return query;
    });
    const created = await route.POST(new Request('http://local', { method: 'POST', body: JSON.stringify(payload) }), { params: Promise.resolve({ childId }) });
    expect(created.status).toBe(201);
    expect(mocks.createRoutine).toHaveBeenCalledWith(childId, 'parent-id', expect.objectContaining(payload));
  });

  it('allows child completion only for its own route child and validates the local date', async () => {
    const route = await import('@/app/api/children/[childId]/routines/completions/route');
    const makeRequest = (day: string) => new Request('http://local', {
      method: 'PUT', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ stepId, date: day, completed: true }),
    });
    mocks.getChildSession.mockResolvedValue({ sub: otherChildId });
    expect((await route.PUT(makeRequest(date), { params: Promise.resolve({ childId }) })).status).toBe(403);

    mocks.getChildSession.mockResolvedValue({ sub: childId });
    expect((await route.PUT(makeRequest('2026-02-30'), { params: Promise.resolve({ childId }) })).status).toBe(400);
    const result = await route.PUT(makeRequest(date), { params: Promise.resolve({ childId }) });
    expect(result.status).toBe(200);
    expect(mocks.setRoutineStepCompletion).toHaveBeenCalledWith(childId, stepId, date, true);
  });

  it('returns truthful database errors from routine reads', async () => {
    const route = await import('@/app/api/children/[childId]/routines/route');
    mocks.listRoutines.mockRejectedValue(new Error('database unavailable'));
    const response = await route.GET(new Request(`http://local/api/children/${childId}/routines`), { params: Promise.resolve({ childId }) });
    expect(response.status).toBe(500);
  });
});
