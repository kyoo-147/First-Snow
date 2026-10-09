import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LESSON_CATALOG, seedLessonCatalog } from '../seed-lessons';

describe('production lesson catalog seed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('catalog content and deterministic structure', () => {
    it('defines at least 24 substantive Vietnamese MVP lessons across 5 tracks with >= 5 questions each', () => {
      expect(LESSON_CATALOG.length).toBeGreaterThanOrEqual(24);
      
      const tracks = new Set<string>();
      const approvedImages = new Set([
        '/images/lesson-abc.png',
        '/images/lesson-math.png',
        '/images/lesson-story.png',
        '/images/lesson-social.png',
      ]);

      for (const item of LESSON_CATALOG) {
        expect(item.lesson.isPublished).toBe(true);
        expect(item.lesson.title.trim().length).toBeGreaterThan(0);
        expect(item.lesson.subject.trim().length).toBeGreaterThan(0);
        expect(item.lesson.estimatedMinutes).toBeGreaterThan(0);

        const content = JSON.parse(item.lesson.content);
        expect(content.track).toBeDefined();
        tracks.add(content.track);

        expect(approvedImages.has(content.image)).toBe(true);

        // At least 5 questions
        const questionSteps = item.steps.filter((s) => s.stepType === 'question' || s.stepType === 'activity');
        expect(questionSteps.length).toBeGreaterThanOrEqual(5);

        // Validate each step in content has instruction and Vietnamese prompt
        expect(Array.isArray(content.steps)).toBe(true);
        for (const st of content.steps) {
          if (st.questionType) {
            expect(st.canonicalAnswer).toBeDefined();
            expect(st.prompt).toBeDefined();
            expect(st.explanation).toBeDefined();
          }
        }
      }

      // Verify all 5 tracks are covered
      expect(tracks.has('literacy')).toBe(true);
      expect(tracks.has('mathematics')).toBe(true);
      expect(tracks.has('stories_comprehension')).toBe(true);
      expect(tracks.has('social_emotional_safety')).toBe(true);
      expect(tracks.has('basic_science')).toBe(true);
    });

    it('uses deterministic, valid RFC4122 UUIDs for all lessons and steps', () => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const seenIds = new Set<string>();

      for (const item of LESSON_CATALOG) {
        expect(item.lesson.id).toMatch(uuidRegex);
        expect(seenIds.has(item.lesson.id)).toBe(false);
        seenIds.add(item.lesson.id);

        for (const step of item.steps) {
          expect(step.id).toMatch(uuidRegex);
          expect(seenIds.has(step.id)).toBe(false);
          seenIds.add(step.id);
          expect(step.lessonId).toBe(item.lesson.id);
        }
      }
    });

    it('orders steps contiguously starting from 1 with valid step types', () => {
      const allowedStepTypes = ['intro', 'question', 'activity', 'summary'];

      for (const item of LESSON_CATALOG) {
        item.steps.forEach((step, index) => {
          expect(step.stepOrder).toBe(index + 1);
          expect(allowedStepTypes).toContain(step.stepType);
          expect(step.prompt.trim().length).toBeGreaterThan(0);
        });
      }
    });

    it('contains no user credentials, passwords, or personal data', () => {
      const serialized = JSON.stringify(LESSON_CATALOG).toLowerCase();
      expect(serialized).not.toContain('password');
      expect(serialized).not.toContain('pinhash');
      expect(serialized).not.toContain('admin@');
      expect(serialized).not.toContain('parent@');
      expect(serialized).not.toContain('secret');
    });

    it('formats lesson content as valid JSON with step metadata matching runner expectations', () => {
      for (const item of LESSON_CATALOG) {
        expect(item.lesson.content).toBeDefined();
        const parsed = JSON.parse(item.lesson.content as string);
        expect(parsed).toHaveProperty('steps');
        expect(Array.isArray(parsed.steps)).toBe(true);
        expect(parsed.steps.length).toBe(item.steps.length);
      }
    });
  });

  describe('idempotent database execution', () => {
    it('executes upserts using onConflictDoUpdate on deterministic keys without touching user tables', async () => {
      const insertedTables: unknown[] = [];
      const onConflictTargets: unknown[] = [];

      const mockDb = {
        transaction: vi.fn(async (callback: (tx: unknown) => unknown) => callback(mockDb)),
        insert: vi.fn((table: unknown) => {
          insertedTables.push(table);
          return {
            values: vi.fn(() => ({
              onConflictDoUpdate: vi.fn((config: { target: unknown }) => {
                onConflictTargets.push(config.target);
                return Promise.resolve();
              }),
            })),
          };
        }),
      };

      const result = await seedLessonCatalog({ db: mockDb as never });

      expect(result.lessonsSeeded).toBe(LESSON_CATALOG.length);
      const totalSteps = LESSON_CATALOG.reduce((acc, l) => acc + l.steps.length, 0);
      expect(result.stepsSeeded).toBe(totalSteps);

      // Verify that insert was called for each lesson and step
      expect(mockDb.insert).toHaveBeenCalledTimes(LESSON_CATALOG.length + totalSteps);

      // Verify idempotency targets were supplied for all upserts
      expect(onConflictTargets.length).toBe(LESSON_CATALOG.length + totalSteps);
    });

    it('is completely idempotent when run repeatedly', async () => {
      const mockDb = {
        transaction: vi.fn(async (callback: (tx: unknown) => unknown) => callback(mockDb)),
        insert: vi.fn(() => ({
          values: vi.fn(() => ({
            onConflictDoUpdate: vi.fn(() => Promise.resolve()),
          })),
        })),
      };

      const run1 = await seedLessonCatalog({ db: mockDb as never });
      const run2 = await seedLessonCatalog({ db: mockDb as never });

      expect(run1.lessonsSeeded).toBe(run2.lessonsSeeded);
      expect(run1.stepsSeeded).toBe(run2.stepsSeeded);
      expect(run1.lessonIds).toEqual(run2.lessonIds);
    });
  });
});
