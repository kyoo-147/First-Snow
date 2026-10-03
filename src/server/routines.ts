import 'server-only';

import { and, asc, eq, inArray } from 'drizzle-orm';
import { db } from '@/db/client';
import { auditEvents, routineStepCompletions, routineSteps, routines } from '@/db/schema';

export type RoutineInput = {
  title: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'anytime';
  scheduledTime?: string | null;
  isActive?: boolean;
  steps: Array<{ title: string; durationMinutes: number }>;
};

export async function listRoutines(childId: string, completionDate: string, activeOnly = false) {
  const rows = await db.select().from(routines)
    .where(activeOnly
      ? and(eq(routines.childId, childId), eq(routines.isActive, true))
      : eq(routines.childId, childId))
    .orderBy(asc(routines.createdAt));
  if (!rows.length) return [];
  const stepRows = await db.select().from(routineSteps)
    .where(inArray(routineSteps.routineId, rows.map((routine) => routine.id)))
    .orderBy(asc(routineSteps.stepOrder));
  const stepIds = stepRows.map((step) => step.id);
  const completed = stepIds.length
    ? await db.select({ routineStepId: routineStepCompletions.routineStepId })
        .from(routineStepCompletions)
        .where(and(
          inArray(routineStepCompletions.routineStepId, stepIds),
          eq(routineStepCompletions.completionDate, completionDate),
          eq(routineStepCompletions.childId, childId),
        ))
    : [];
  const completedIds = new Set(completed.map((entry) => entry.routineStepId));
  const byRoutine = new Map<string, typeof stepRows>();
  for (const step of stepRows) {
    const list = byRoutine.get(step.routineId) ?? [];
    list.push(step);
    byRoutine.set(step.routineId, list);
  }
  return rows.map((routine) => ({
    ...routine,
    steps: (byRoutine.get(routine.id) ?? []).map((step) => ({
      id: step.id,
      title: step.title,
      durationMinutes: step.durationMinutes,
      isCompleted: completedIds.has(step.id),
    })),
  }));
}

export async function createRoutine(childId: string, actorId: string, input: RoutineInput) {
  return db.transaction(async (tx) => {
    const now = new Date();
    const [routine] = await tx.insert(routines).values({
      childId,
      title: input.title,
      timeOfDay: input.timeOfDay,
      scheduledTime: input.scheduledTime ?? null,
      isActive: input.isActive ?? true,
      updatedAt: now,
    } as typeof routines.$inferInsert).returning();
    if (input.steps.length) {
      await tx.insert(routineSteps).values(input.steps.map((step, index) => ({
        routineId: routine.id,
        title: step.title,
        durationMinutes: step.durationMinutes,
        stepOrder: index + 1,
        updatedAt: now,
      })) as typeof routineSteps.$inferInsert[]);
    }
    await tx.insert(auditEvents).values({
      eventType: 'routine.created', actorId, actorType: 'parent',
      resourceType: 'routine', resourceId: routine.id,
      metadata: { childId, stepCount: input.steps.length },
    } as typeof auditEvents.$inferInsert);
    return routine.id;
  });
}

export async function updateRoutine(
  childId: string,
  routineId: string,
  actorId: string,
  patch: Partial<RoutineInput>,
) {
  return db.transaction(async (tx) => {
    const [existing] = await tx.select({ id: routines.id }).from(routines)
      .where(and(eq(routines.id, routineId), eq(routines.childId, childId))).limit(1).for('update');
    if (!existing) return false;

    const { steps, ...fields } = patch;
    await tx.update(routines).set({ ...fields, updatedAt: new Date() } as Partial<typeof routines.$inferInsert>)
      .where(and(eq(routines.id, routineId), eq(routines.childId, childId)));
    if (steps) {
      await tx.delete(routineSteps).where(eq(routineSteps.routineId, routineId));
      if (steps.length) {
        const now = new Date();
        await tx.insert(routineSteps).values(steps.map((step, index) => ({
          routineId, title: step.title, durationMinutes: step.durationMinutes,
          stepOrder: index + 1, updatedAt: now,
        })) as typeof routineSteps.$inferInsert[]);
      }
    }
    await tx.insert(auditEvents).values({
      eventType: 'routine.updated', actorId, actorType: 'parent',
      resourceType: 'routine', resourceId: routineId,
      metadata: { fields: Object.keys(patch) },
    } as typeof auditEvents.$inferInsert);
    return true;
  });
}

export async function deleteRoutine(childId: string, routineId: string, actorId: string) {
  return db.transaction(async (tx) => {
    const [existing] = await tx.select({ id: routines.id }).from(routines)
      .where(and(eq(routines.id, routineId), eq(routines.childId, childId))).limit(1).for('update');
    if (!existing) return false;
    await tx.insert(auditEvents).values({
      eventType: 'routine.deleted', actorId, actorType: 'parent',
      resourceType: 'routine', resourceId: routineId, metadata: { childId },
    } as typeof auditEvents.$inferInsert);
    await tx.delete(routines).where(and(eq(routines.id, routineId), eq(routines.childId, childId)));
    return true;
  });
}

export async function setRoutineStepCompletion(
  childId: string,
  stepId: string,
  completionDate: string,
  completed: boolean,
) {
  return db.transaction(async (tx) => {
    const [step] = await tx.select({ id: routineSteps.id, routineId: routines.id })
      .from(routineSteps)
      .innerJoin(routines, eq(routineSteps.routineId, routines.id))
      .where(and(
        eq(routineSteps.id, stepId),
        eq(routines.childId, childId),
        eq(routines.isActive, true),
      ))
      .limit(1);
    if (!step) return null;

    if (completed) {
      const [inserted] = await tx.insert(routineStepCompletions).values({
        routineStepId: stepId,
        childId,
        completionDate,
      } as typeof routineStepCompletions.$inferInsert)
        .onConflictDoNothing({
          target: [routineStepCompletions.routineStepId, routineStepCompletions.completionDate],
        })
        .returning({ id: routineStepCompletions.id });
      if (inserted) {
        await tx.insert(auditEvents).values({
          eventType: 'routine_step.completed', actorId: childId, actorType: 'child',
          resourceType: 'routine_step', resourceId: stepId,
          metadata: { routineId: step.routineId, completionDate },
        } as typeof auditEvents.$inferInsert);
      }
    } else {
      const [deleted] = await tx.delete(routineStepCompletions)
        .where(and(
          eq(routineStepCompletions.routineStepId, stepId),
          eq(routineStepCompletions.childId, childId),
          eq(routineStepCompletions.completionDate, completionDate),
        ))
        .returning({ id: routineStepCompletions.id });
      if (deleted) {
        await tx.insert(auditEvents).values({
          eventType: 'routine_step.uncompleted', actorId: childId, actorType: 'child',
          resourceType: 'routine_step', resourceId: stepId,
          metadata: { routineId: step.routineId, completionDate },
        } as typeof auditEvents.$inferInsert);
      }
    }
    return { stepId, completed, completionDate };
  });
}
