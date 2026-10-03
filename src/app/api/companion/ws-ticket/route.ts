import { createHash, randomBytes } from 'node:crypto';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { children } from '@/db/schema/children';
import { companionSessions, type NewCompanionSession } from '@/db/schema/companion';
import { ERRORS } from '@/lib/api/errors';
import { requireChildSession } from '@/server/auth';
import { resolveCompanionPublicOrigin } from '@/server/companion/contracts';

const TICKET_TTL_SECONDS = 60;
const TICKET_PATH = '/api/companion/ws';
const digest = (token: string) => createHash('sha256').update(token).digest('hex');

export async function POST(request: NextRequest): Promise<NextResponse> {
  const actor = await requireChildSession();
  if (actor instanceof Response) return actor as NextResponse;
  const production = process.env.NODE_ENV === 'production';
  const requestOrigin = resolveCompanionPublicOrigin(request.url, process.env.COMPANION_PUBLIC_ORIGIN, production);
  if (!requestOrigin) return ERRORS.internal('Companion public origin is not configured safely.');
  const browserOrigin = request.headers.get('origin');
  if ((production && browserOrigin !== requestOrigin) || (browserOrigin && browserOrigin !== requestOrigin)) return ERRORS.forbidden('Request origin does not match the companion origin.');
  const token = randomBytes(32).toString('base64url');
  const expiresAt = Date.now() + TICKET_TTL_SECONDS * 1000;

  try {
    const sessionId = await db.transaction(async (tx) => {
      const [activeChild] = await tx.select({ id: children.id }).from(children)
        .where(and(eq(children.id, actor.sub), eq(children.householdId, actor.householdId), eq(children.isActive, true)))
        .for('update').limit(1);
      if (!activeChild) return null;
      let [session] = await tx.select().from(companionSessions)
        .where(and(eq(companionSessions.childId, actor.sub), isNull(companionSessions.endedAt)))
        .orderBy(desc(companionSessions.startedAt)).limit(1);
      if (!session) [session] = await tx.insert(companionSessions).values({ childId: actor.sub }).returning();
      if (!session) throw new Error('Could not create companion session.');

      let metadata: Record<string, unknown> = {};
      try { metadata = JSON.parse(session.metadata ?? '{}') as Record<string, unknown>; }
      catch { throw new Error('Session metadata is invalid.'); }
      const nextMetadata = JSON.stringify({
        ...metadata,
        companionWsTicket: { hash: digest(token), childId: actor.sub, origin: requestOrigin, expiresAt, path: TICKET_PATH },
      });
      const updateValue = { metadata: nextMetadata } as unknown as Partial<NewCompanionSession>;
      const [updated] = await tx.update(companionSessions).set(updateValue)
        .where(and(
          eq(companionSessions.id, session.id),
          session.metadata === null ? isNull(companionSessions.metadata) : eq(companionSessions.metadata, session.metadata),
        ))
        .returning({ id: companionSessions.id });
      if (!updated) throw new Error('Could not persist websocket ticket.');
      return session.id;
    });
    if (!sessionId) return ERRORS.forbidden();

    return NextResponse.json({ ticket: token, wsUrl: TICKET_PATH, expiresIn: TICKET_TTL_SECONDS, sessionId }, { status: 201 });
  } catch {
    return ERRORS.internal('Could not issue websocket ticket.');
  }
}
