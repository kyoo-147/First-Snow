import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ select: vi.fn(), getChildSession: vi.fn() }));
vi.mock('@/db/client', () => ({ db: { select: mocks.select } }));
vi.mock('@/server/auth', () => ({ getChildSession: mocks.getChildSession }));

function mockLessonRows(rows: unknown[]) {
  mocks.select.mockImplementation(() => {
    const builder: Record<string, unknown> = {
      from: () => builder,
      leftJoin: () => builder,
      where: () => builder,
      orderBy: () => Promise.resolve(rows),
    };
    return builder;
  });
}

const lessonRow = {
  id: 'lesson-1',
  title: 'Letters',
  subject: 'English',
  gradeLevel: 'K-1st',
  content: JSON.stringify({
    subtitle: 'Letters and sounds',
    description: 'Explore letter sounds.',
    image: '/images/lesson-abc.png',
    accent: 'primary',
    rating: '4.9',
  }),
  estimatedMinutes: 12,
  isPublished: true,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  progressStatus: 'completed',
  bestScore: 90,
};

describe('published lesson catalog card fields', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getChildSession.mockResolvedValue(null);
    mockLessonRows([lessonRow]);
  });

  it('serves authored card fields and real per-child progress', async () => {
    const { listPublishedLessons } = await import('@/server/learning');
    const lessons = await listPublishedLessons('child-1');

    expect(lessons).toHaveLength(1);
    expect(lessons[0]).toMatchObject({
      id: 'lesson-1',
      subtitle: 'Letters and sounds',
      description: 'Explore letter sounds.',
      image: '/images/lesson-abc.png',
      accent: 'primary',
      rating: '4.9',
      status: 'completed',
      progress: 100,
      bestScore: 90,
    });
    expect(mocks.getChildSession).not.toHaveBeenCalled();
  });

  it('marks an in-progress lesson without a fake completion percentage', async () => {
    mockLessonRows([{ ...lessonRow, progressStatus: 'in_progress', bestScore: null }]);
    const { listPublishedLessons } = await import('@/server/learning');
    const lessons = await listPublishedLessons('child-1');
    expect(lessons[0]).toMatchObject({ status: 'in_progress', progress: 0 });
  });

  it('falls back to the signed-in child session when no childId is supplied', async () => {
    mocks.getChildSession.mockResolvedValue({ sub: 'child-from-session' });
    const { listPublishedLessons } = await import('@/server/learning');
    const lessons = await listPublishedLessons();
    expect(mocks.getChildSession).toHaveBeenCalled();
    expect(lessons[0]).toMatchObject({ status: 'completed' });
  });

  it('omits per-child progress for a parent catalog request', async () => {
    mocks.getChildSession.mockResolvedValue(null);
    mockLessonRows([{ ...lessonRow, progressStatus: null, bestScore: null }]);
    const { listPublishedLessons } = await import('@/server/learning');
    const lessons = await listPublishedLessons();
    expect(lessons[0]).not.toHaveProperty('status');
    expect(lessons[0]).not.toHaveProperty('progress');
    expect(lessons[0]).toMatchObject({ subtitle: 'Letters and sounds' });
  });
});
