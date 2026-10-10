import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { children } from '@/db/schema/children';
import { companionMessages, type NewCompanionMessage } from '@/db/schema/companion';
import { ERRORS } from '@/lib/api/errors';
import { requireParentSession, getParentHousehold, assertChildBelongsToHousehold } from '@/server/auth';
import { alertDto } from '@/server/companion/format';


type Context = { params: Promise<{ alertId: string }> };
export async function GET(_request: Request, context: Context): Promise<NextResponse> {
  const actor = await requireParentSession();
  if (actor instanceof Response) return actor as NextResponse;
  const { alertId } = await context.params;
  try {
    const household = await getParentHousehold(actor.sub);
    if (!household) return ERRORS.forbidden();
    const [row] = await db.select({ message: companionMessages, householdId: children.householdId }).from(companionMessages).innerJoin(children, eq(companionMessages.childId, children.id)).where(eq(companionMessages.id, alertId)).limit(1);
    if (!row || row.householdId !== household.id || !row.message.isFlagged) return ERRORS.forbidden();
    const denied = await assertChildBelongsToHousehold(row.message.childId, household.id);
    if (denied) return denied as NextResponse;
    return NextResponse.json(alertDto(row.message), { headers: { 'Cache-Control': 'no-store' } });
  } catch { return ERRORS.internal('Could not load alert.'); }
}
export async function PATCH(_request: Request, context: Context): Promise<NextResponse> {
  const actor = await requireParentSession();
  if (actor instanceof Response) return actor as NextResponse;
  const { alertId } = await context.params;
  try {
    const household = await getParentHousehold(actor.sub);
    if (!household) return ERRORS.forbidden();
    const [row] = await db.select({ message: companionMessages, householdId: children.householdId }).from(companionMessages).innerJoin(children, eq(companionMessages.childId, children.id)).where(eq(companionMessages.id, alertId)).limit(1);
    if (!row || row.householdId !== household.id || !row.message.isFlagged) return ERRORS.forbidden();
    const denied = await assertChildBelongsToHousehold(row.message.childId, household.id);
    if (denied) return denied as NextResponse;
    let state: { codes?: string[]; readAt?: string | null } = {};
    try { state = JSON.parse(row.message.safetyAlerts ?? '{}') as typeof state; } catch { /* legacy alert */ }
    if (!state.readAt) state.readAt = new Date().toISOString();
    const alertState = { safetyAlerts: JSON.stringify(state) } as unknown as Partial<NewCompanionMessage>;
    const [updated] = await db.update(companionMessages).set(alertState).where(eq(companionMessages.id, alertId)).returning();
    if (!updated) return ERRORS.forbidden();
    return NextResponse.json(alertDto(updated), { headers: { 'Cache-Control': 'no-store' } });
  } catch { return ERRORS.internal('Could not update alert.'); }
}
