import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ select: vi.fn() }));
vi.mock('@/db/client', () => ({ db: { select: mocks.select } }));

describe('child progress totals', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('counts published catalog lessons independently of child progress rows', async () => {
    const { lessons, lessonAttempts, lessonProgress } = await import('@/db/schema');
    mocks.select.mockImplementation(() => {
      let table: unknown;
      const builder = {
        from: (value: unknown) => { table = value; return builder; },
        innerJoin: () => builder,
        where: () => Promise.resolve(
          table === lessonProgress
            ? [{ lessonsCompleted: 0, totalLessons: 0 }]
            : table === lessonAttempts
              ? [{ practiceTimeMinutes: 0 }]
              : table === lessons
                ? [{ totalLessons: 6 }]
                : [],
        ),
      };
      return builder;
    });

    const { getChildProgress } = await import('@/server/learning');
    const progress = await getChildProgress('child-id');
    expect(progress.lessonsCompleted).toBe(0);
    expect(progress.totalLessons).toBe(6);
  });
});
