import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  lessonAttempts,
  lessonSteps,
  lessons,
  lessonStepAnswers,
  lessonProgress,
  rewards,
  auditEvents,
} from '@/db/schema';

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

  describe('Defect 1: getPublishedLesson and recursive grading key sanitization', () => {
    it('recursively removes canonicalAnswer, acceptedVariants, correctAnswer, and explanation from content and steps', async () => {
      const lessonId = '00000000-0000-4000-a000-000000000100';
      const stepId1 = '11111111-1111-4000-a000-111111111111';
      const stepId2 = '22222222-2222-4000-a000-222222222222';

      const authoredContent = {
        title: 'Secret Geometry',
        nestedQuiz: {
          subSection: {
            canonicalAnswer: 'secret-nested-canonical',
            acceptedVariants: ['secret1', 'secret2'],
            correctAnswer: 'secret-nested-correct',
            explanation: 'Revealing secret explanation',
            safeField: 'This should stay',
          },
        },
        steps: [
          {
            id: stepId1,
            title: 'Step 1',
            prompt: 'Question 1',
            canonicalAnswer: 'opt-a',
            acceptedVariants: ['a', 'A'],
            correctAnswer: 'opt-a',
            explanation: 'The answer is definitely A because of secret reasons.',
            hint: 'Think about round shapes.',
            options: [
              { id: 'opt-a', label: 'Circle' },
              { id: 'opt-b', label: 'Square' },
            ],
          },
          {
            id: stepId2,
            title: 'Step 2',
            prompt: 'Question 2',
            canonicalAnswer: 'opt-c',
            correctAnswer: 'opt-c',
            explanation: 'C is correct.',
            hint: 'Look closely.',
          },
        ],
      };

      const mockDbLesson = {
        id: lessonId,
        title: 'Secret Geometry',
        isPublished: true,
        content: JSON.stringify(authoredContent),
      };

      const mockDbSteps = [
        { id: stepId1, prompt: 'Question 1', stepType: 'single_choice', stepOrder: 1 },
        { id: stepId2, prompt: 'Question 2', stepType: 'single_choice', stepOrder: 2 },
      ];

      mocks.select.mockImplementation(() => {
        let selectedTable: unknown = null;
        const builder = {
          from: vi.fn((table: unknown) => {
            selectedTable = table;
            return builder;
          }),
          where: vi.fn(() => builder),
          orderBy: vi.fn(() => builder),
          limit: vi.fn(() => {
            if (selectedTable === lessons) return Promise.resolve([mockDbLesson]);
            return Promise.resolve([]);
          }),
        };
        // For storedSteps where db.select(...).from(lessonSteps).where(...).orderBy(...) is called directly without limit
        (builder as any).then = (resolve: any) => {
          if (selectedTable === lessonSteps) resolve(mockDbSteps);
          else resolve([]);
        };
        return builder;
      });

      const { getPublishedLesson, stripAnswerKeys } = await import('@/server/learning');

      // Test stripAnswerKeys standalone
      const rawObj = {
        level1: {
          level2: {
            canonicalAnswer: 'secret',
            acceptedVariants: ['v1'],
            correctAnswer: 'correct',
            explanation: 'secret explanation',
            validKey: 'keep-me',
            list: [
              { canonicalAnswer: 'hide', keep: 123 },
              { deeper: { explanation: 'hide-too', note: 'safe' } },
            ],
          },
        },
      };

      const stripped: any = stripAnswerKeys(rawObj);
      expect(stripped.level1.level2.canonicalAnswer).toBeUndefined();
      expect(stripped.level1.level2.acceptedVariants).toBeUndefined();
      expect(stripped.level1.level2.correctAnswer).toBeUndefined();
      expect(stripped.level1.level2.explanation).toBeUndefined();
      expect(stripped.level1.level2.validKey).toBe('keep-me');
      expect(stripped.level1.level2.list[0].canonicalAnswer).toBeUndefined();
      expect(stripped.level1.level2.list[0].keep).toBe(123);
      expect(stripped.level1.level2.list[1].deeper.explanation).toBeUndefined();
      expect(stripped.level1.level2.list[1].deeper.note).toBe('safe');

      const published = await getPublishedLesson(lessonId);
      expect(published).not.toBeNull();
      const serialized = JSON.stringify(published);
      expect(serialized).not.toContain('canonicalAnswer');
      expect(serialized).not.toContain('acceptedVariants');
      expect(serialized).not.toContain('correctAnswer');
      expect(serialized).not.toContain('secret-nested-canonical');
      expect(serialized).not.toContain('secret-nested-correct');
      expect(serialized).not.toContain('Revealing secret explanation');
      expect(serialized).not.toContain('The answer is definitely A because of secret reasons');

      // UI receives prompt, options, hint
      expect(published?.steps[0]?.prompt).toBe('Question 1');
      expect((published?.steps[0] as any)?.hint).toBe('Think about round shapes.');
      expect((published?.steps[0] as any)?.options).toHaveLength(2);
      expect((published?.steps[0] as any)?.canonicalAnswer).toBeUndefined();
      expect((published?.steps[0] as any)?.correctAnswer).toBeUndefined();
      expect((published?.steps[0] as any)?.explanation).toBeUndefined();
    });

    it('strips all secret grading keys from the entire 30-lesson catalog when publishing', async () => {
      const { LESSON_CATALOG } = await import('@/db/seed-lessons');
      const { stripAnswerKeys } = await import('@/server/learning');

      for (const entry of LESSON_CATALOG) {
        const parsed = JSON.parse(entry.lesson.content as string);
        const stripped = stripAnswerKeys(parsed) as any;
        const serialized = JSON.stringify(stripped);

        expect(serialized).not.toContain('"canonicalAnswer"');
        expect(serialized).not.toContain('"acceptedVariants"');
        expect(serialized).not.toContain('"correctAnswer"');
        expect(serialized).not.toContain('"explanation"');

        // Verify steps retain student-facing properties
        expect(stripped.steps).toBeDefined();
        for (const step of stripped.steps) {
          expect(step.canonicalAnswer).toBeUndefined();
          expect(step.acceptedVariants).toBeUndefined();
          expect(step.correctAnswer).toBeUndefined();
          expect(step.explanation).toBeUndefined();
          expect(step.prompt).toBeDefined();
        }
      }
    });
  });

  describe('Defect 2: completeLessonAttempt fail-closed and score denominator', () => {
    const lessonId = '00000000-0000-4000-a000-000000000100';
    const childId = '22222222-2222-4000-a000-222222222222';
    const attemptId = '11111111-1111-4000-a000-111111111111';

    const fiveSteps = [
      { id: 'step-1' },
      { id: 'step-2' },
      { id: 'step-3' },
      { id: 'step-4' },
      { id: 'step-5' },
    ];

    function setupCompleteAttemptDb(options: {
      attemptStatus?: string;
      requiredSteps?: { id: string }[];
      gradedAnswers?: { stepId: string; isCorrect: boolean | null }[];
    }) {
      const attempt = {
        id: attemptId,
        childId,
        lessonId,
        status: options.attemptStatus ?? 'in_progress',
        score: null,
      };

      const stepsList = options.requiredSteps ?? fiveSteps;
      const answersList = options.gradedAnswers ?? [];

      let updatedAttempt: any = null;
      let insertedProgress: any = null;
      let insertedReward: any = null;
      let insertedAudit: any = null;

      mocks.transaction.mockImplementation(async (callback: (tx: any) => Promise<any>) => {
        const tx = {
          select: vi.fn(() => {
            let selectedTable: any = null;
            const builder = {
              from: vi.fn((table: any) => {
                selectedTable = table;
                return builder;
              }),
              where: vi.fn(() => builder),
              for: vi.fn(() => builder),
              limit: vi.fn(() => {
                const res = selectedTable === lessonAttempts ? Promise.resolve([attempt]) : Promise.resolve([]);
                return Object.assign(res, {
                  for: vi.fn(() => res),
                });
              }),
            };
            (builder as any).then = (resolve: any) => {
              if (selectedTable === lessonSteps) resolve(stepsList);
              else if (selectedTable === lessonStepAnswers) resolve(answersList.filter((a) => a.isCorrect !== null));
              else resolve([]);
            };
            return builder;
          }),
          update: vi.fn((table: any) => ({
            set: vi.fn((vals: any) => ({
              where: vi.fn(() => ({
                returning: vi.fn(() => {
                  updatedAttempt = { ...attempt, ...vals };
                  return Promise.resolve([updatedAttempt]);
                }),
              })),
            })),
          })),
          insert: vi.fn((table: any) => ({
            values: vi.fn((val: any) => {
              if (table === lessonProgress) insertedProgress = val;
              if (table === rewards) insertedReward = val;
              if (table === auditEvents) insertedAudit = val;
              return {
                onConflictDoUpdate: vi.fn(() => Promise.resolve()),
                then: (res: any) => res(Promise.resolve()),
              };
            }),
          })),
        };
        return callback(tx);
      });

      return {
        getUpdatedAttempt: () => updatedAttempt,
        getInsertedProgress: () => insertedProgress,
        getInsertedReward: () => insertedReward,
        getInsertedAudit: () => insertedAudit,
      };
    }

    it('fails closed when there are zero answers for required steps', async () => {
      const tracker = setupCompleteAttemptDb({
        gradedAnswers: [],
      });
      const { completeLessonAttempt, IncompleteLessonAttemptError } = await import('@/server/learning');

      await expect(completeLessonAttempt(childId, attemptId)).rejects.toThrow(IncompleteLessonAttemptError);
      expect(tracker.getUpdatedAttempt()).toBeNull();
      expect(tracker.getInsertedProgress()).toBeNull();
      expect(tracker.getInsertedReward()).toBeNull();
      expect(tracker.getInsertedAudit()).toBeNull();
    });

    it('fails closed when only 1 of 5 required steps is answered', async () => {
      const tracker = setupCompleteAttemptDb({
        gradedAnswers: [{ stepId: 'step-1', isCorrect: true }],
      });
      const { completeLessonAttempt, IncompleteLessonAttemptError } = await import('@/server/learning');

      await expect(completeLessonAttempt(childId, attemptId)).rejects.toThrow(IncompleteLessonAttemptError);
      expect(tracker.getUpdatedAttempt()).toBeNull();
      expect(tracker.getInsertedProgress()).toBeNull();
      expect(tracker.getInsertedReward()).toBeNull();
      expect(tracker.getInsertedAudit()).toBeNull();
    });

    it('fails closed when a step answer is missing or null/ungraded', async () => {
      const tracker = setupCompleteAttemptDb({
        gradedAnswers: [
          { stepId: 'step-1', isCorrect: true },
          { stepId: 'step-2', isCorrect: true },
          { stepId: 'step-3', isCorrect: false },
          { stepId: 'step-4', isCorrect: null }, // ungraded / null
        ],
      });
      const { completeLessonAttempt, IncompleteLessonAttemptError } = await import('@/server/learning');

      await expect(completeLessonAttempt(childId, attemptId)).rejects.toThrow(IncompleteLessonAttemptError);
      expect(tracker.getUpdatedAttempt()).toBeNull();
      expect(tracker.getInsertedProgress()).toBeNull();
      expect(tracker.getInsertedReward()).toBeNull();
      expect(tracker.getInsertedAudit()).toBeNull();
    });

    it('completes successfully when all 5 steps are answered, correctly calculating 1-of-5 as 20%', async () => {
      const tracker = setupCompleteAttemptDb({
        gradedAnswers: [
          { stepId: 'step-1', isCorrect: true },
          { stepId: 'step-2', isCorrect: false },
          { stepId: 'step-3', isCorrect: false },
          { stepId: 'step-4', isCorrect: false },
          { stepId: 'step-5', isCorrect: false },
        ],
      });
      const { completeLessonAttempt } = await import('@/server/learning');

      const result = await completeLessonAttempt(childId, attemptId);
      expect(result).toBeDefined();
      expect(result?.status).toBe('completed');
      expect(result?.score).toBe(20); // 1 / 5 * 100 = 20%

      expect(tracker.getUpdatedAttempt()?.score).toBe(20);
      expect(tracker.getInsertedProgress()?.bestScore).toBe(20);
      expect(tracker.getInsertedProgress()?.status).toBe('completed');
      expect(tracker.getInsertedReward()?.rewardType).toBe('star');
      expect(tracker.getInsertedAudit()?.eventType).toBe('lesson_attempt.completed');
      expect(tracker.getInsertedAudit()?.metadata?.score).toBe(20);
    });

    it('calculates score using the full required step count denominator on complete mixed correctness (3-of-5 = 60%)', async () => {
      const tracker = setupCompleteAttemptDb({
        gradedAnswers: [
          { stepId: 'step-1', isCorrect: true },
          { stepId: 'step-2', isCorrect: true },
          { stepId: 'step-3', isCorrect: true },
          { stepId: 'step-4', isCorrect: false },
          { stepId: 'step-5', isCorrect: false },
        ],
      });
      const { completeLessonAttempt } = await import('@/server/learning');

      const result = await completeLessonAttempt(childId, attemptId);
      expect(result?.status).toBe('completed');
      expect(result?.score).toBe(60); // 3 / 5 * 100 = 60%
      expect(tracker.getUpdatedAttempt()?.score).toBe(60);
    });

    it('handles repeated completion idempotently without false extra rewards or progress', async () => {
      const tracker = setupCompleteAttemptDb({
        attemptStatus: 'completed',
      });
      const { completeLessonAttempt } = await import('@/server/learning');

      const result = await completeLessonAttempt(childId, attemptId);
      expect(result?.status).toBe('completed');
      expect(tracker.getUpdatedAttempt()).toBeNull();
      expect(tracker.getInsertedProgress()).toBeNull();
      expect(tracker.getInsertedReward()).toBeNull();
      expect(tracker.getInsertedAudit()).toBeNull();
    });
  });
});
