import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ select: vi.fn() }));
vi.mock('@/db/client', () => ({ db: { select: mocks.select } }));

describe('child progress totals and skills', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('counts published catalog lessons and derives skills from real lesson coverage', async () => {
    const { lessons, lessonAttempts, lessonProgress } = await import('@/db/schema');

    mocks.select.mockImplementation(() => {
      let table: unknown;
      let grouped = false;

      const rows = () => {
        if (table === lessonProgress) return [{ lessonsCompleted: 0, totalLessons: 0 }];
        if (table === lessonAttempts) return [{ practiceTimeMinutes: 0 }];
        if (table === lessons) {
          if (grouped) {
            return [
              { subject: 'Math', total: 2, completed: 2 },
              { subject: 'Reading', total: 4, completed: 1 },
            ];
          }
          return [{ totalLessons: 6 }];
        }
        return [];
      };

      const builder: Record<string, unknown> = {
        from: (value: unknown) => { table = value; return builder; },
        innerJoin: () => builder,
        leftJoin: () => builder,
        where: () => builder,
        groupBy: () => { grouped = true; return Promise.resolve(rows()); },
        orderBy: () => Promise.resolve(rows()),
        then: (resolve: (value: unknown) => unknown) => resolve(rows()),
      };
      return builder;
    });

    const { getChildProgress } = await import('@/server/learning');
    const progress = await getChildProgress('child-id');

    expect(progress.lessonsCompleted).toBe(0);
    expect(progress.totalLessons).toBe(6);
    expect(progress.skills).toEqual([
      { label: 'Math', value: 100, note: '2 of 2 lessons' },
      { label: 'Reading', value: 25, note: '1 of 4 lessons' },
    ]);
    expect(progress.nextFocus).toBe('Reading');
  });

  it('omits the next focus when every subject is fully covered', async () => {
    const { lessons, lessonAttempts, lessonProgress } = await import('@/db/schema');

    mocks.select.mockImplementation(() => {
      let table: unknown;
      let grouped = false;
      const rows = () => {
        if (table === lessonProgress) return [{ lessonsCompleted: 2, totalLessons: 2 }];
        if (table === lessonAttempts) return [{ practiceTimeMinutes: 24 }];
        if (table === lessons) {
          if (grouped) return [{ subject: 'Math', total: 2, completed: 2 }];
          return [{ totalLessons: 2 }];
        }
        return [];
      };
      const builder: Record<string, unknown> = {
        from: (value: unknown) => { table = value; return builder; },
        innerJoin: () => builder,
        leftJoin: () => builder,
        where: () => builder,
        groupBy: () => { grouped = true; return Promise.resolve(rows()); },
        orderBy: () => Promise.resolve(rows()),
        then: (resolve: (value: unknown) => unknown) => resolve(rows()),
      };
      return builder;
    });

    const { getChildProgress } = await import('@/server/learning');
    const progress = await getChildProgress('child-id');

    expect(progress.skills).toEqual([{ label: 'Math', value: 100, note: '2 of 2 lessons' }]);
    expect(progress).not.toHaveProperty('nextFocus');
  });
});
