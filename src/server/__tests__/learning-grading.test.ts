import { beforeEach, describe, expect, it, vi } from 'vitest';
import { lessonAttempts, lessonSteps, lessons, lessonStepAnswers } from '@/db/schema';

const mocks = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('@/db/client', () => ({
  db: {
    select: mocks.select,
    insert: mocks.insert,
    update: mocks.update,
    transaction: mocks.transaction,
  },
}));

describe('Server-side deterministic grading and persistence', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('rejects arbitrary answer inputs and grades according to step schema', async () => {
    const stepId = '00000000-0000-4000-a000-000000000102';
    const attemptId = '11111111-1111-4000-a000-111111111111';
    const childId = '22222222-2222-4000-a000-222222222222';
    const lessonId = '00000000-0000-4000-a000-000000000100';

    const mockAttempt = {
      id: attemptId,
      childId,
      lessonId,
      status: 'in_progress',
      answers: {},
    };

    const mockStep = {
      id: stepId,
      lessonId,
      stepOrder: 2,
      stepType: 'question',
      prompt: 'Thủ đô của Việt Nam là gì?',
      correctAnswer: 'opt-hn',
    };

    const mockLesson = {
      id: lessonId,
      content: JSON.stringify({
        steps: [
          {},
          {
            id: stepId,
            questionType: 'single_choice',
            prompt: 'Thủ đô của Việt Nam là gì?',
            canonicalAnswer: 'opt-hn',
            options: [
              { id: 'opt-hn', label: 'Hà Nội' },
              { id: 'opt-sg', label: 'Sài Gòn' },
            ],
            points: 10,
            explanation: 'Hà Nội là thủ đô của Việt Nam.',
          },
        ],
      }),
    };

    let insertedAnswer: unknown = null;
    let updatedAttemptAnswers: unknown = null;

    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        select: vi.fn((fields?: unknown) => {
          let selectedTable: unknown = null;
          const builder = {
            from: vi.fn((table: unknown) => {
              selectedTable = table;
              return builder;
            }),
            where: vi.fn(() => builder),
            orderBy: vi.fn(() => builder),
            limit: vi.fn(() => {
              const res = (() => {
                if (selectedTable === lessonAttempts) return Promise.resolve([mockAttempt]);
                if (selectedTable === lessonSteps) return Promise.resolve([mockStep]);
                if (selectedTable === lessons) return Promise.resolve([mockLesson]);
                if (selectedTable === lessonStepAnswers) return Promise.resolve([]);
                return Promise.resolve([]);
              })();
              return Object.assign(res, {
                for: vi.fn(() => res),
              });
            }),
            for: vi.fn(() => builder),
          };
          return builder;
        }),
        insert: vi.fn((table: unknown) => ({
          values: vi.fn((val: unknown) => {
            insertedAnswer = val;
            return Promise.resolve();
          }),
        })),
        update: vi.fn((table: unknown) => ({
          set: vi.fn((val: { answers?: unknown }) => {
            updatedAttemptAnswers = val.answers;
            return {
              where: vi.fn(() => ({
                returning: vi.fn(() => Promise.resolve([{ ...mockAttempt, answers: val.answers }])),
              })),
            };
          }),
        })),
      };
      return callback(tx);
    });

    const { saveLessonAnswer } = await import('@/server/learning');

    // 1. Send wrong option ID
    const wrongResult = await saveLessonAnswer(childId, attemptId, stepId, 'opt-sg');
    expect(wrongResult).toBeDefined();
    expect(wrongResult?.grading?.isCorrect).toBe(false);
    expect(wrongResult?.grading?.score).toBe(0);
    expect((insertedAnswer as { isCorrect: boolean }).isCorrect).toBe(false);

    // 2. Send correct option ID
    const correctResult = await saveLessonAnswer(childId, attemptId, stepId, 'opt-hn');
    expect(correctResult).toBeDefined();
    expect(correctResult?.grading?.isCorrect).toBe(true);
    expect(correctResult?.grading?.score).toBe(10);
    expect((insertedAnswer as { isCorrect: boolean }).isCorrect).toBe(true);

    // 3. Send arbitrary string that is NOT a valid option ID
    const arbitraryResult = await saveLessonAnswer(childId, attemptId, stepId, 'Hà Nội');
    expect(arbitraryResult?.grading?.isCorrect).toBe(false);
    expect(arbitraryResult?.grading?.validationError).toBeDefined();
    expect((insertedAnswer as { isCorrect: boolean }).isCorrect).toBe(false);
  });
});
