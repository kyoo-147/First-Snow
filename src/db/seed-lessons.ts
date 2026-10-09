import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { lessons, lessonSteps } from './schema/learning';

// Load .env in local CLI execution if available
try {
  process.loadEnvFile?.();
} catch {
  // Ignore if no .env file
}

export type CatalogLessonStep = {
  id: string;
  lessonId: string;
  stepOrder: number;
  stepType: 'intro' | 'question' | 'activity' | 'summary';
  prompt: string;
  correctAnswer: string | null;
  title?: string;
  instruction?: string;
  helper?: string;
  image?: string;
  options?: Array<{
    id: string;
    label: string;
    helper?: string;
    tone?: string;
    icon?: string;
  }>;
};

export type CatalogLessonEntry = {
  lesson: {
    id: string;
    title: string;
    subject: string;
    gradeLevel: string;
    estimatedMinutes: number;
    isPublished: boolean;
    content: string;
  };
  steps: CatalogLessonStep[];
};

import { LITERACY_LESSONS } from './lessons-data/literacy';
import { MATHEMATICS_LESSONS } from './lessons-data/mathematics';
import { STORIES_LESSONS } from './lessons-data/stories';
import { SOCIAL_SAFETY_LESSONS } from './lessons-data/social';
import { SCIENCE_LESSONS } from './lessons-data/science';

export const LESSON_CATALOG: CatalogLessonEntry[] = [
  ...LITERACY_LESSONS,
  ...MATHEMATICS_LESSONS,
  ...STORIES_LESSONS,
  ...SOCIAL_SAFETY_LESSONS,
  ...SCIENCE_LESSONS,
];

export type SeedResult = {
  lessonsSeeded: number;
  stepsSeeded: number;
  lessonIds: string[];
};

export async function seedLessonCatalog(options?: {
  db?: unknown;
  databaseUrl?: string;
  client?: postgres.Sql;
}): Promise<SeedResult> {
  const customDb = options?.db;
  let client: postgres.Sql | null = null;
  let targetDb = customDb;

  if (!targetDb) {
    const connectionString = options?.databaseUrl || process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required to seed lesson catalog.');
    }
    client = options?.client || postgres(connectionString, { max: 1 });
    targetDb = drizzle(client, { schema });
  }

  try {
    const dbInstance = targetDb as {
      transaction: (callback: (tx: unknown) => Promise<unknown>) => Promise<unknown>;
      insert: (table: unknown) => {
        values: (data: unknown) => {
          onConflictDoUpdate: (config: { target: unknown; set: unknown }) => Promise<unknown>;
        };
      };
    };

    const seededIds: string[] = [];
    let stepsCount = 0;

    await dbInstance.transaction(async (txInstance) => {
      const tx = txInstance as typeof dbInstance;

      for (const entry of LESSON_CATALOG) {
        await tx
          .insert(lessons)
          .values({
            id: entry.lesson.id,
            title: entry.lesson.title,
            subject: entry.lesson.subject,
            gradeLevel: entry.lesson.gradeLevel,
            estimatedMinutes: entry.lesson.estimatedMinutes,
            isPublished: entry.lesson.isPublished,
            content: entry.lesson.content,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: lessons.id,
            set: {
              title: entry.lesson.title,
              subject: entry.lesson.subject,
              gradeLevel: entry.lesson.gradeLevel,
              estimatedMinutes: entry.lesson.estimatedMinutes,
              isPublished: entry.lesson.isPublished,
              content: entry.lesson.content,
              updatedAt: new Date(),
            },
          });

        seededIds.push(entry.lesson.id);

        for (const step of entry.steps) {
          await tx
            .insert(lessonSteps)
            .values({
              id: step.id,
              lessonId: step.lessonId,
              stepOrder: step.stepOrder,
              stepType: step.stepType,
              prompt: step.prompt,
              correctAnswer: step.correctAnswer,
            })
            .onConflictDoUpdate({
              target: lessonSteps.id,
              set: {
                lessonId: step.lessonId,
                stepOrder: step.stepOrder,
                stepType: step.stepType,
                prompt: step.prompt,
                correctAnswer: step.correctAnswer,
              },
            });
          stepsCount++;
        }
      }
    });

    return {
      lessonsSeeded: seededIds.length,
      stepsSeeded: stepsCount,
      lessonIds: seededIds,
    };
  } finally {
    if (client) {
      await client.end();
    }
  }
}

// ── Direct CLI Execution ───────────────────────────────────────────────────────
if (
  process.argv[1]?.endsWith('seed-lessons.ts') ||
  process.argv[1]?.endsWith('seed-lessons.js')
) {
  seedLessonCatalog()
    .then((result) => {
      console.log(
        `[seed-lessons] Successfully seeded ${result.lessonsSeeded} lessons and ${result.stepsSeeded} steps idempotently.`,
      );
    })
    .catch((err) => {
      console.error('[seed-lessons] Failed to seed lesson catalog:', err);
      process.exit(1);
    });
}
