import { eq, and } from "drizzle-orm";
import type { DatabaseClient } from "./connection";
import { users, children, sessions, lessons, alerts } from "./schema";

/**
 * Verify that a parent (userId) owns the given child.
 * Throws if ownership check fails.
 */
export async function verifyChildOwnership(
  db: DatabaseClient,
  userId: string,
  childId: string
): Promise<void> {
  const result = await db
    .select({ id: children.id })
    .from(children)
    .where(and(eq(children.id, childId), eq(children.userId, userId)))
    .limit(1);

  if (result.length === 0) {
    throw new OwnershipError(
      `Child ${childId} does not belong to user ${userId}`
    );
  }
}

/**
 * Verify that a parent (userId) owns the session through the child chain.
 * sessions.child_id -> children.user_id must match userId.
 */
export async function verifySessionOwnership(
  db: DatabaseClient,
  userId: string,
  sessionId: string
): Promise<void> {
  const result = await db
    .select({ id: sessions.id })
    .from(sessions)
    .innerJoin(children, eq(sessions.childId, children.id))
    .where(and(eq(sessions.id, sessionId), eq(children.userId, userId)))
    .limit(1);

  if (result.length === 0) {
    throw new OwnershipError(
      `Session ${sessionId} is not accessible by user ${userId}`
    );
  }
}

/**
 * Verify that a parent (userId) owns the lesson through the child chain.
 * lessons.child_id -> children.user_id must match userId.
 */
export async function verifyLessonOwnership(
  db: DatabaseClient,
  userId: string,
  lessonId: string
): Promise<void> {
  const result = await db
    .select({ id: lessons.id })
    .from(lessons)
    .innerJoin(children, eq(lessons.childId, children.id))
    .where(and(eq(lessons.id, lessonId), eq(children.userId, userId)))
    .limit(1);

  if (result.length === 0) {
    throw new OwnershipError(
      `Lesson ${lessonId} is not accessible by user ${userId}`
    );
  }
}

/**
 * Verify that a parent (userId) owns the alert through session -> child chain.
 * alerts.session_id -> sessions.child_id -> children.user_id must match userId.
 */
export async function verifyAlertOwnership(
  db: DatabaseClient,
  userId: string,
  alertId: string
): Promise<void> {
  const result = await db
    .select({ id: alerts.id })
    .from(alerts)
    .innerJoin(sessions, eq(alerts.sessionId, sessions.id))
    .innerJoin(children, eq(sessions.childId, children.id))
    .where(and(eq(alerts.id, alertId), eq(children.userId, userId)))
    .limit(1);

  if (result.length === 0) {
    throw new OwnershipError(
      `Alert ${alertId} is not accessible by user ${userId}`
    );
  }
}

/**
 * Error thrown when an ownership verification fails.
 */
export class OwnershipError extends Error {
  public readonly code = "authorization_error" as const;

  constructor(message: string) {
    super(message);
    this.name = "OwnershipError";
  }
}
