import { db } from '@/db/client';
import { children } from '@/db/schema/children';
import { companionSessions } from '@/db/schema/companion';
import { requireChildSession, assertChildSessionOwnsChild } from '@/server/auth';
import { ERRORS } from '@/lib/api/errors';
import { sessionDto } from '@/server/companion/format';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const actor = await requireChildSession();
  if (actor instanceof Response) return actor as NextResponse;
  let body: unknown;
  try { body = await request.json(); } catch { return ERRORS.validationFailed({ body: 'Invalid JSON.' }); }
  const childId = body && typeof body === 'object' ? (body as Record<string, unknown>).childId : null;
  if (typeof childId !== 'string' || !childId) return ERRORS.validationFailed({ childId: 'Required.' });
  const owned = await assertChildSessionOwnsChild(actor, childId);
  if (owned) return owned as NextResponse;
  try {
    const [child] = await db.select({ id: children.id, householdId: children.householdId, isActive: children.isActive }).from(children).where(eq(children.id, childId)).limit(1);
    if (!child || !child.isActive || child.householdId !== actor.householdId) return ERRORS.forbidden();
    const [row] = await db.insert(companionSessions).values({ childId }).returning();
    if (!row) return ERRORS.internal('Could not create companion session.');
    return NextResponse.json(sessionDto(row), { status: 201 });
  } catch { return ERRORS.internal('Could not create companion session.'); }
}
