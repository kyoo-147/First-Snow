import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireChildSession: vi.fn(),
  listPublishedLessons: vi.fn(),
  getPublishedLesson: vi.fn(),
  createOrResumeLessonAttempt: vi.fn(),
  saveLessonAnswer: vi.fn(),
  completeLessonAttempt: vi.fn(),
  authorizeChildLearning: vi.fn(),
  getChildProgress: vi.fn(),
  getChildAttempts: vi.fn(),
}));

vi.mock('@/server/auth', () => ({ requireChildSession: mocks.requireChildSession }));
vi.mock('@/server/learning', () => ({
  listPublishedLessons: mocks.listPublishedLessons,
  getPublishedLesson: mocks.getPublishedLesson,
  createOrResumeLessonAttempt: mocks.createOrResumeLessonAttempt,
  saveLessonAnswer: mocks.saveLessonAnswer,
  completeLessonAttempt: mocks.completeLessonAttempt,
  getChildProgress: mocks.getChildProgress,
  getChildAttempts: mocks.getChildAttempts,
}));
vi.mock('@/server/learning-access', () => ({ authorizeChildLearning: mocks.authorizeChildLearning }));

const childId = '11111111-1111-4111-8111-111111111111';
const lessonId = '22222222-2222-4222-8222-222222222222';
const attemptId = '33333333-3333-4333-8333-333333333333';
const stepId = '44444444-4444-4444-8444-444444444444';

describe('learning API routes', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.requireChildSession.mockResolvedValue({ sub: childId });
    mocks.authorizeChildLearning.mockResolvedValue(null);
  });

  it('returns published lesson catalog and detail', async () => {
    mocks.listPublishedLessons.mockResolvedValue([{ id: lessonId, title: 'Shapes' }]);
    mocks.getPublishedLesson.mockResolvedValue({ id: lessonId, title: 'Shapes', steps: [] });
    const catalog = await import('@/app/api/lessons/route');
    const detail = await import('@/app/api/lessons/[lessonId]/route');
    expect((await (await catalog.GET()).json()).lessons).toHaveLength(1);
    const response = await detail.GET(new Request('http://local'), { params: Promise.resolve({ lessonId }) });
    expect((await response.json()).lesson.id).toBe(lessonId);
  });

  it('creates or resumes an attempt for the authenticated child and persists answers', async () => {
    const attempt = { id: attemptId, childId, lessonId, status: 'in_progress', answers: {} };
    mocks.createOrResumeLessonAttempt.mockResolvedValue(attempt);
    mocks.saveLessonAnswer.mockResolvedValue({ ...attempt, answers: { [stepId]: 'yes' } });
    const attempts = await import('@/app/api/lesson-attempts/route');
    const answerRoute = await import('@/app/api/lesson-attempts/[attemptId]/answers/route');

    const created = await attempts.POST(new Request('http://local', {
      method: 'POST', body: JSON.stringify({ lessonId }), headers: { 'content-type': 'application/json' },
    }));
    expect(created.status).toBe(201);
    expect(mocks.createOrResumeLessonAttempt).toHaveBeenCalledWith(childId, lessonId);

    const saved = await answerRoute.PUT(new Request('http://local', {
      method: 'PUT', body: JSON.stringify({ stepId, answer: 'yes' }), headers: { 'content-type': 'application/json' },
    }), { params: Promise.resolve({ attemptId }) });
    expect((await saved.json()).attempt.answers[stepId]).toBe('yes');
    expect(mocks.saveLessonAnswer).toHaveBeenCalledWith(childId, attemptId, stepId, 'yes');
  });

  it('rejects wrong actors and malformed identifiers before persistence', async () => {
    const attempts = await import('@/app/api/lesson-attempts/route');
    const detail = await import('@/app/api/lessons/[lessonId]/route');
    mocks.requireChildSession.mockResolvedValue(new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 }));
    const denied = await attempts.POST(new Request('http://local', {
      method: 'POST', body: JSON.stringify({ lessonId }), headers: { 'content-type': 'application/json' },
    }));
    expect(denied.status).toBe(401);
    const invalid = await detail.GET(new Request('http://local'), { params: Promise.resolve({ lessonId: 'not-a-uuid' }) });
    expect(invalid.status).toBe(400);
    expect(mocks.createOrResumeLessonAttempt).not.toHaveBeenCalled();
  });

  it('returns fail-closed cross-household denial for parent progress and attempts', async () => {
    mocks.authorizeChildLearning.mockResolvedValue(new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 }));
    const progress = await import('@/app/api/children/[childId]/progress/route');
    const attempts = await import('@/app/api/children/[childId]/attempts/route');
    const params = { params: Promise.resolve({ childId }) };
    expect((await progress.GET(new Request('http://local'), params)).status).toBe(403);
    expect((await attempts.GET(new Request('http://local'), params)).status).toBe(403);
    expect(mocks.getChildProgress).not.toHaveBeenCalled();
    expect(mocks.getChildAttempts).not.toHaveBeenCalled();
  });

  it('serves persisted progress and attempt summaries to an authorized actor', async () => {
    mocks.getChildProgress.mockResolvedValue({ childId, lessonsCompleted: 1, totalLessons: 1 });
    mocks.getChildAttempts.mockResolvedValue([{ id: attemptId, childId, lessonId, status: 'completed' }]);
    const progress = await import('@/app/api/children/[childId]/progress/route');
    const attempts = await import('@/app/api/children/[childId]/attempts/route');
    const params = { params: Promise.resolve({ childId }) };
    expect((await (await progress.GET(new Request('http://local'), params)).json()).progress.lessonsCompleted).toBe(1);
    expect((await (await attempts.GET(new Request('http://local'), params)).json()).attempts).toHaveLength(1);
  });

  it('returns a server error when the database operation fails', async () => {
    mocks.listPublishedLessons.mockRejectedValue(new Error('database unavailable'));
    const catalog = await import('@/app/api/lessons/route');
    expect((await catalog.GET()).status).toBe(500);
  });

  it('returns the stored completed result for duplicate completion requests', async () => {
    const completed = { id: attemptId, childId, lessonId, status: 'completed', score: null };
    mocks.completeLessonAttempt.mockResolvedValue(completed);
    const route = await import('@/app/api/lesson-attempts/[attemptId]/complete/route');
    const params = { params: Promise.resolve({ attemptId }) };
    const request = () => new Request('http://local', { method: 'POST', body: '{}' });
    expect((await (await route.POST(request(), params)).json()).attempt).toEqual(completed);
    expect((await (await route.POST(request(), params)).json()).attempt).toEqual(completed);
    expect(mocks.completeLessonAttempt).toHaveBeenCalledTimes(2);
    expect(mocks.completeLessonAttempt).toHaveBeenCalledWith(childId, attemptId);
  });
});
