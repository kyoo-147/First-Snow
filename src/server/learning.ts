import 'server-only';

import { db } from '@/db/client';
import {
  auditEvents,
  children,
  lessonAttempts,
  lessonProgress,
  lessons,
  lessonStepAnswers,
  lessonSteps,
  rewards,
} from '@/db/schema';
import { and, asc, desc, eq, isNotNull, sql } from 'drizzle-orm';

export const childFields = {
  id: children.id,
  displayName: children.displayName,
  age: children.age,
  gradeLevel: children.gradeLevel,
  avatarUrl: children.avatarUrl,
  isActive: children.isActive,
  createdAt: children.createdAt,
  updatedAt: children.updatedAt,
};

export function presentChild<T extends { displayName: string; gradeLevel?: string | null }>(child: T) {
  return { ...child, name: child.displayName, grade: child.gradeLevel ?? null };
}

const LESSON_ACCENTS = ['primary', 'aqua', 'peach', 'pink', 'ice'] as const;
type LessonAccent = (typeof LESSON_ACCENTS)[number];

function parseLessonContent(content: unknown): Record<string, unknown> | null {
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
  return content && typeof content === 'object' && !Array.isArray(content) ? (content as Record<string, unknown>) : null;
}

function toLessonAccent(value: unknown): LessonAccent | undefined {
  return typeof value === 'string' && (LESSON_ACCENTS as readonly string[]).includes(value)
    ? (value as LessonAccent)
    : undefined;
}

// Card fields are authored inside the lesson `content` JSON. Only surface values
// that actually exist; never invent a rating/subtitle for a lesson.
function lessonCardFields(content: unknown): {
  subtitle?: string;
  description?: string;
  image?: string;
  rating?: string;
  accent?: LessonAccent;
} {
  const parsed = parseLessonContent(content);
  return {
    ...(typeof parsed?.subtitle === 'string' ? { subtitle: parsed.subtitle } : {}),
    ...(typeof parsed?.description === 'string' ? { description: parsed.description } : {}),
    ...(typeof parsed?.image === 'string' ? { image: parsed.image } : {}),
    ...(typeof parsed?.rating === 'string' ? { rating: parsed.rating } : {}),
    ...(toLessonAccent(parsed?.accent) ? { accent: toLessonAccent(parsed?.accent) } : {}),
  };
}

const lessonCatalogColumns = {
  id: lessons.id,
  title: lessons.title,
  subject: lessons.subject,
  gradeLevel: lessons.gradeLevel,
  content: lessons.content,
  estimatedMinutes: lessons.estimatedMinutes,
  isPublished: lessons.isPublished,
  createdAt: lessons.createdAt,
  updatedAt: lessons.updatedAt,
};

type CatalogLessonRow = {
  content: unknown;
  progressStatus?: string | null;
  bestScore?: number | null;
  [key: string]: unknown;
};

function presentCatalogLesson(row: CatalogLessonRow, withProgress: boolean) {
  const { content, progressStatus, bestScore, ...rest } = row;
  const progress = withProgress
    ? {
        status: progressStatus ?? 'not_started',
        progress: progressStatus === 'completed' ? 100 : 0,
        bestScore: bestScore ?? null,
      }
    : {};
  return { ...rest, ...lessonCardFields(content), ...progress };
}

// Resolve the signed-in child, if any, so the catalog can report real per-child
// progress without an explicit childId from callers.
async function resolveChildSessionId(): Promise<string | null> {
  try {
    const { getChildSession } = await import('@/server/auth');
    const session = await getChildSession();
    return session?.sub ?? null;
  } catch {
    return null;
  }
}

export async function listPublishedLessons(childId?: string) {
  const resolvedChildId = childId ?? (await resolveChildSessionId());

  if (!resolvedChildId) {
    const rows = await db
      .select(lessonCatalogColumns)
      .from(lessons)
      .where(eq(lessons.isPublished, true))
      .orderBy(asc(lessons.createdAt));
    return rows.map((row) => presentCatalogLesson(row, false));
  }

  const rows = await db
    .select({
      ...lessonCatalogColumns,
      progressStatus: lessonProgress.status,
      bestScore: lessonProgress.bestScore,
    })
    .from(lessons)
    .leftJoin(
      lessonProgress,
      and(eq(lessonProgress.lessonId, lessons.id), eq(lessonProgress.childId, resolvedChildId)),
    )
    .where(eq(lessons.isPublished, true))
    .orderBy(asc(lessons.createdAt));
  return rows.map((row) => presentCatalogLesson(row, true));
}

export async function getPublishedLesson(lessonId: string) {
  const [lesson] = await db
    .select()
    .from(lessons)
    .where(and(eq(lessons.id, lessonId), eq(lessons.isPublished, true)))
    .limit(1);
  if (!lesson) return null;

  const storedSteps = await db
    .select({
      id: lessonSteps.id,
      title: lessonSteps.prompt,
      prompt: lessonSteps.prompt,
      stepType: lessonSteps.stepType,
      stepOrder: lessonSteps.stepOrder,
    })
    .from(lessonSteps)
    .where(eq(lessonSteps.lessonId, lessonId))
    .orderBy(asc(lessonSteps.stepOrder));

  let content: unknown = lesson.content;
  if (typeof content === 'string') {
    try { content = JSON.parse(content); } catch { /* Keep plain text content unchanged. */ }
  }
  const publicContent = stripAnswerKeys(content);
  const contentSteps = publicContent && typeof publicContent === 'object' && Array.isArray((publicContent as { steps?: unknown }).steps)
    ? (publicContent as { steps: Record<string, unknown>[] }).steps
    : [];
  const steps = storedSteps.map((stored, index) => {
    const authored = contentSteps[index] ?? {};
    return stripAnswerKeys({
      ...authored,
      id: stored.id,
      title: typeof authored.title === 'string' ? authored.title : stored.prompt,
      prompt: typeof authored.prompt === 'string' ? authored.prompt : stored.prompt,
      stepType: stored.stepType,
      stepOrder: stored.stepOrder,
    }) as Record<string, unknown>;
  });

  return { ...lesson, content: publicContent, steps };
}

const STRIPPED_GRADING_KEYS = new Set([
  'correctAnswer',
  'canonicalAnswer',
  'acceptedVariants',
  'explanation',
]);

export function stripAnswerKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripAnswerKeys);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !STRIPPED_GRADING_KEYS.has(key))
      .map(([key, entry]) => [key, stripAnswerKeys(entry)]),
  );
}

export async function createOrResumeLessonAttempt(childId: string, lessonId: string) {
  return db.transaction(async (tx) => {
    const [lesson] = await tx
      .select({ id: lessons.id })
      .from(lessons)
      .where(and(eq(lessons.id, lessonId), eq(lessons.isPublished, true)))
      .limit(1);
    if (!lesson) return null;

    const [existing] = await tx
      .select()
      .from(lessonAttempts)
      .where(
        and(
          eq(lessonAttempts.childId, childId),
          eq(lessonAttempts.lessonId, lessonId),
          eq(lessonAttempts.status, 'in_progress'),
        ),
      )
      .orderBy(desc(lessonAttempts.updatedAt))
      .limit(1);
    if (existing) return existing;

    const now = new Date();
    const [attempt] = await tx
      .insert(lessonAttempts)
      .values({ childId, lessonId, status: 'in_progress', answers: {}, startedAt: now, updatedAt: now } as typeof lessonAttempts.$inferInsert)
      .returning();
    return attempt;
  });
}

export async function saveLessonAnswer(
  childId: string,
  attemptId: string,
  stepId: string,
  answer: unknown,
) {
  return db.transaction(async (tx) => {
    const [attempt] = await tx
      .select()
      .from(lessonAttempts)
      .where(and(eq(lessonAttempts.id, attemptId), eq(lessonAttempts.childId, childId)))
      .limit(1)
      .for('update');
    if (!attempt || attempt.status === 'completed') return null;

    const [step] = await tx
      .select({ id: lessonSteps.id, correctAnswer: lessonSteps.correctAnswer })
      .from(lessonSteps)
      .where(and(eq(lessonSteps.id, stepId), eq(lessonSteps.lessonId, attempt.lessonId)))
      .limit(1);
    if (!step) return null;

    const [lesson] = await tx
      .select({ id: lessons.id, content: lessons.content })
      .from(lessons)
      .where(eq(lessons.id, attempt.lessonId))
      .limit(1);

    let parsedContent: Record<string, unknown> | null = null;
    if (lesson?.content) {
      if (typeof lesson.content === 'string') {
        try { parsedContent = JSON.parse(lesson.content); } catch { parsedContent = null; }
      } else if (typeof lesson.content === 'object') {
        parsedContent = lesson.content as Record<string, unknown>;
      }
    }

    const contentSteps = (parsedContent && Array.isArray(parsedContent.steps))
      ? (parsedContent.steps as Record<string, unknown>[])
      : [];

    const authoredStep = contentSteps.find((s) => s.id === stepId);

    const { gradeStepAnswer } = await import('@/lib/lesson-engine/grader');

    let isCorrect: boolean | null = null;
    let gradingResult: ReturnType<typeof gradeStepAnswer> | undefined;

    if (authoredStep && authoredStep.questionType) {
      gradingResult = gradeStepAnswer(authoredStep as any, answer);
      isCorrect = gradingResult.isCorrect;
    } else {
      const serialized = typeof answer === 'string' ? answer : JSON.stringify(answer);
      isCorrect = step.correctAnswer === null ? null : serialized === step.correctAnswer;
      gradingResult = {
        isCorrect: isCorrect ?? false,
        score: isCorrect ? 10 : 0,
        maxScore: 10,
      };
    }

    const serialized = typeof answer === 'string' ? answer : JSON.stringify(answer);
    const now = new Date();
    const updatedAnswers = {
      ...((attempt.answers && typeof attempt.answers === 'object' ? attempt.answers : {}) as Record<string, unknown>),
      [stepId]: answer,
    };

    const [existingAnswer] = await tx
      .select({ id: lessonStepAnswers.id })
      .from(lessonStepAnswers)
      .where(and(eq(lessonStepAnswers.attemptId, attemptId), eq(lessonStepAnswers.stepId, stepId)))
      .limit(1);
    if (existingAnswer) {
      await tx
        .update(lessonStepAnswers)
        .set({ answer: serialized, isCorrect, answeredAt: now } as Partial<typeof lessonStepAnswers.$inferInsert>)
        .where(eq(lessonStepAnswers.id, existingAnswer.id));
    } else {
      await tx.insert(lessonStepAnswers).values({ attemptId, stepId, answer: serialized, isCorrect, answeredAt: now } as typeof lessonStepAnswers.$inferInsert);
    }

    const [updated] = await tx
      .update(lessonAttempts)
      .set({ answers: updatedAnswers, updatedAt: now } as Partial<typeof lessonAttempts.$inferInsert>)
      .where(eq(lessonAttempts.id, attemptId))
      .returning();

    return {
      ...updated,
      grading: gradingResult,
    };
  });
}

export class IncompleteLessonAttemptError extends Error {
  code = 'INCOMPLETE_ATTEMPT';
  totalSteps: number;
  answeredSteps: number;

  constructor(totalSteps: number, answeredSteps: number) {
    super(`Cannot complete lesson attempt: ${answeredSteps} of ${totalSteps} required steps answered.`);
    this.name = 'IncompleteLessonAttemptError';
    this.totalSteps = totalSteps;
    this.answeredSteps = answeredSteps;
  }
}

export async function completeLessonAttempt(childId: string, attemptId: string) {
  return db.transaction(async (tx) => {
    const [attempt] = await tx
      .select()
      .from(lessonAttempts)
      .where(and(eq(lessonAttempts.id, attemptId), eq(lessonAttempts.childId, childId)))
      .limit(1)
      .for('update');
    if (!attempt) return null;
    if (attempt.status === 'completed') return attempt;

    const requiredSteps = await tx
      .select({ id: lessonSteps.id })
      .from(lessonSteps)
      .where(eq(lessonSteps.lessonId, attempt.lessonId));

    const totalRequired = requiredSteps.length;

    const gradedAnswers = await tx
      .select({ stepId: lessonStepAnswers.stepId, isCorrect: lessonStepAnswers.isCorrect })
      .from(lessonStepAnswers)
      .where(and(eq(lessonStepAnswers.attemptId, attemptId), isNotNull(lessonStepAnswers.isCorrect)));

    const answeredStepIds = new Set(gradedAnswers.map((a) => a.stepId));
    const allAnswered = totalRequired > 0 && requiredSteps.every((s) => answeredStepIds.has(s.id));

    if (!allAnswered) {
      throw new IncompleteLessonAttemptError(totalRequired, answeredStepIds.size);
    }

    const correctCount = gradedAnswers.filter((a) => a.isCorrect).length;
    const score = Math.round((correctCount / totalRequired) * 100);
    const now = new Date();
    const [completed] = await tx
      .update(lessonAttempts)
      .set({ status: 'completed', score, completedAt: now, updatedAt: now } as Partial<typeof lessonAttempts.$inferInsert>)
      .where(eq(lessonAttempts.id, attemptId))
      .returning();

    await tx
      .insert(lessonProgress)
      .values({
        childId,
        lessonId: attempt.lessonId,
        status: 'completed',
        bestScore: score,
        completionCount: 1,
        lastAttemptAt: now,
        updatedAt: now,
      } as typeof lessonProgress.$inferInsert)
      .onConflictDoUpdate({
        target: [lessonProgress.childId, lessonProgress.lessonId],
        set: {
          status: 'completed',
          bestScore: score === null
            ? sql`${lessonProgress.bestScore}`
            : sql`greatest(coalesce(${lessonProgress.bestScore}, ${score}), ${score})`,
          completionCount: sql`${lessonProgress.completionCount} + 1`,
          lastAttemptAt: now,
          updatedAt: now,
        },
      });
    await tx.insert(rewards).values({
      childId,
      rewardType: 'star',
      label: 'Lesson completed',
      sourceAttemptId: attemptId,
    } as typeof rewards.$inferInsert);
    await tx.insert(auditEvents).values({
      eventType: 'lesson_attempt.completed',
      actorId: childId,
      actorType: 'child',
      resourceType: 'lesson_attempt',
      resourceId: attemptId,
      metadata: { lessonId: attempt.lessonId, score },
    } as typeof auditEvents.$inferInsert);
    return completed;
  });
}

export async function getChildAttempts(childId: string) {
  return db
    .select({
      id: lessonAttempts.id,
      childId: lessonAttempts.childId,
      lessonId: lessonAttempts.lessonId,
      lessonTitle: lessons.title,
      status: lessonAttempts.status,
      score: lessonAttempts.score,
      answers: lessonAttempts.answers,
      startedAt: lessonAttempts.startedAt,
      completedAt: lessonAttempts.completedAt,
      createdAt: lessonAttempts.createdAt,
      updatedAt: lessonAttempts.updatedAt,
    })
    .from(lessonAttempts)
    .innerJoin(lessons, eq(lessonAttempts.lessonId, lessons.id))
    .where(eq(lessonAttempts.childId, childId))
    .orderBy(desc(lessonAttempts.updatedAt));
}

export async function getChildProgress(childId: string) {
  const [counts, catalog, time, subjectCoverage] = await Promise.all([
    db
      .select({
        lessonsCompleted: sql<number>`count(*) filter (where ${lessonProgress.status} = 'completed')::int`,
        totalLessons: sql<number>`count(*)::int`,
      })
      .from(lessonProgress)
      .where(eq(lessonProgress.childId, childId)),
    db
      .select({ totalLessons: sql<number>`count(*)::int` })
      .from(lessons)
      .where(eq(lessons.isPublished, true)),
    db
      .select({
        practiceTimeMinutes: sql<number>`coalesce(sum(${lessons.estimatedMinutes}), 0)::int`,
      })
      .from(lessonAttempts)
      .innerJoin(lessons, eq(lessonAttempts.lessonId, lessons.id))
      .where(and(eq(lessonAttempts.childId, childId), eq(lessonAttempts.status, 'completed'))),
    db
      .select({
        subject: lessons.subject,
        total: sql<number>`count(*)::int`,
        completed: sql<number>`count(*) filter (where ${lessonProgress.status} = 'completed')::int`,
      })
      .from(lessons)
      .leftJoin(
        lessonProgress,
        and(eq(lessonProgress.lessonId, lessons.id), eq(lessonProgress.childId, childId)),
      )
      .where(eq(lessons.isPublished, true))
      .groupBy(lessons.subject),
  ]);

  const skills = subjectCoverage.map((row) => {
    const total = row.total ?? 0;
    const completed = row.completed ?? 0;
    return {
      label: row.subject,
      value: total > 0 ? Math.round((completed / total) * 100) : 0,
      note: `${completed} of ${total} lessons`,
    };
  });

  const nextFocus = skills
    .filter((skill) => skill.value < 100)
    .sort((a, b) => a.value - b.value)[0]?.label;

  return {
    childId,
    lessonsCompleted: counts[0]?.lessonsCompleted ?? 0,
    totalLessons: catalog[0]?.totalLessons ?? 0,
    practiceTimeMinutes: time[0]?.practiceTimeMinutes ?? 0,
    skills,
    ...(nextFocus ? { nextFocus } : {}),
  };
}

export async function getChildRewards(childId: string) {
  const rows = await db
    .select({
      id: rewards.id,
      rewardType: rewards.rewardType,
      label: rewards.label,
      awardedAt: rewards.awardedAt,
      sourceAttemptId: rewards.sourceAttemptId,
    })
    .from(rewards)
    .where(eq(rewards.childId, childId))
    .orderBy(desc(rewards.awardedAt));
  return rows.map((row) => ({
    id: row.id,
    type: row.rewardType,
    label: row.label,
    awardedAt: row.awardedAt,
    sourceAttemptId: row.sourceAttemptId,
  }));
}
