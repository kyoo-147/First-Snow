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

export async function listPublishedLessons() {
  return db
    .select()
    .from(lessons)
    .where(eq(lessons.isPublished, true))
    .orderBy(asc(lessons.createdAt));
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
    return {
      ...authored,
      id: stored.id,
      title: typeof authored.title === 'string' ? authored.title : stored.prompt,
      prompt: typeof authored.prompt === 'string' ? authored.prompt : stored.prompt,
      stepType: stored.stepType,
      stepOrder: stored.stepOrder,
    };
  });

  return { ...lesson, content: publicContent, steps };
}

function stripAnswerKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripAnswerKeys);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => key !== 'correctAnswer')
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

    const serialized = typeof answer === 'string' ? answer : JSON.stringify(answer);
    const isCorrect = step.correctAnswer === null ? null : serialized === step.correctAnswer;
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
    return updated;
  });
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

    const graded = await tx
      .select({ isCorrect: lessonStepAnswers.isCorrect })
      .from(lessonStepAnswers)
      .where(and(eq(lessonStepAnswers.attemptId, attemptId), isNotNull(lessonStepAnswers.isCorrect)));
    const score = graded.length
      ? Math.round((graded.filter((answer) => answer.isCorrect).length / graded.length) * 100)
      : null;
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
          bestScore: sql`case when ${score} is null then ${lessonProgress.bestScore} when ${lessonProgress.bestScore} is null then ${score} else greatest(${lessonProgress.bestScore}, ${score}) end`,
          completionCount: sql`${lessonProgress.completionCount} + 1`,
          lastAttemptAt: now,
          updatedAt: now,
        } as Partial<typeof lessonProgress.$inferInsert>,
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
  const [counts, catalog, time] = await Promise.all([
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
  ]);
  return {
    childId,
    lessonsCompleted: counts[0]?.lessonsCompleted ?? 0,
    totalLessons: catalog[0]?.totalLessons ?? 0,
    practiceTimeMinutes: time[0]?.practiceTimeMinutes ?? 0,
    skills: [],
  };
}
