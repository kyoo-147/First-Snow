import { and, asc, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { children } from '@/db/schema/children';
import { companionMessages } from '@/db/schema/companion';
import { ERRORS } from '@/lib/api/errors';
import { requireParentSession, getParentHousehold, assertChildBelongsToHousehold } from '@/server/auth';
import { alertDto } from '@/server/companion/format';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const actor = await requireParentSession();
  if (actor instanceof Response) return actor as NextResponse;
  try {
    const household = await getParentHousehold(actor.sub);
    if (!household) return ERRORS.forbidden();
    const requestedChild = request.nextUrl.searchParams.get('childId');
    if (requestedChild) {
      const denied = await assertChildBelongsToHousehold(requestedChild, household.id);
      if (denied) return denied as NextResponse;
    }
    const rows = await db.select({ message: companionMessages }).from(companionMessages).innerJoin(children, eq(companionMessages.childId, children.id)).where(requestedChild ? and(eq(children.householdId, household.id), eq(children.id, requestedChild), eq(companionMessages.isFlagged, true)) : and(eq(children.householdId, household.id), eq(companionMessages.isFlagged, true))).orderBy(asc(companionMessages.createdAt));
    return NextResponse.json({ alerts: rows.map(({ message }) => alertDto(message)) });
  } catch { return ERRORS.internal('Could not load alerts.'); }
}
