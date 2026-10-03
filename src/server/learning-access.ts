import 'server-only';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { children } from '@/db/schema';
import { ERRORS } from '@/lib/api/errors';
import { getChildSession, getParentSession, getParentHousehold } from '@/server/auth';

export async function authorizeLessonCatalog(): Promise<Response | null> {
  try {
    const childSession = await getChildSession();
    if (childSession) return null;
    const parentSession = await getParentSession();
    return parentSession ? null : ERRORS.unauthorized();
  } catch {
    return ERRORS.unauthorized();
  }
}

export async function authorizeChildLearning(childId: string): Promise<Response | null> {
  const childSession = await getChildSession();
  if (childSession) {
    if (childSession.sub !== childId) return ERRORS.forbidden('Child can only access own learning data.');
    return null;
  }
  const parentSession = await getParentSession();
  if (!parentSession) return ERRORS.unauthorized();
  const household = await getParentHousehold(parentSession.sub);
  if (!household) return ERRORS.notFound('Household not found.');
  try {
    const [child] = await db.select({ id: children.id }).from(children)
      .where(and(eq(children.id, childId), eq(children.householdId, household.id))).limit(1);
    return child ? null : ERRORS.forbidden('Access to child learning data denied.');
  } catch {
    return ERRORS.forbidden('Access to child learning data denied.');
  }
}
