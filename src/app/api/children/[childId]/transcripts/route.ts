import { asc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { children } from '@/db/schema/children';
import { companionMessages } from '@/db/schema/companion';
import { ERRORS } from '@/lib/api/errors';
import { requireParentSession, getParentHousehold, assertChildBelongsToHousehold } from '@/server/auth';
import { transcriptDto } from '@/server/companion/format';

type Context = { params: Promise<{ childId: string }> };
export async function GET(_request: Request, context: Context): Promise<NextResponse> {
  const actor = await requireParentSession();
  if (actor instanceof Response) return actor as NextResponse;
  const { childId } = await context.params;
  try {
    const household = await getParentHousehold(actor.sub);
    if (!household) return ERRORS.forbidden();
    const denied = await assertChildBelongsToHousehold(childId, household.id);
    if (denied) return denied as NextResponse;
    const [child] = await db.select({ id: children.id, householdId: children.householdId, isActive: children.isActive }).from(children).where(eq(children.id, childId)).limit(1);
    if (!child || child.householdId !== household.id) return ERRORS.forbidden();
    const rows = await db.select().from(companionMessages).where(eq(companionMessages.childId, childId)).orderBy(asc(companionMessages.createdAt), asc(companionMessages.id));
    return NextResponse.json({ transcripts: rows.map(transcriptDto) });
  } catch { return ERRORS.internal('Could not load transcripts.'); }
}
