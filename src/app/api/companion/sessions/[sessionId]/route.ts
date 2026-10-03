import { db } from '@/db/client';
import { companionSessions } from '@/db/schema/companion';
import { requireChildSession } from '@/server/auth';
import { ERRORS } from '@/lib/api/errors';
import { sessionDto } from '@/server/companion/format';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

type Context = { params: Promise<{ sessionId: string }> };
export async function GET(_request: Request, context: Context): Promise<NextResponse> {
  const actor = await requireChildSession();
  if (actor instanceof Response) return actor as NextResponse;
  const { sessionId } = await context.params;
  try {
    const [row] = await db.select().from(companionSessions).where(eq(companionSessions.id, sessionId)).limit(1);
    if (!row) return ERRORS.notFound('Session not found.');
    if (row.childId !== actor.sub) return ERRORS.forbidden();
    return NextResponse.json(sessionDto(row));
  } catch { return ERRORS.internal('Could not load companion session.'); }
}
