import { createHash } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { companionSessions, type NewCompanionSession } from '@/db/schema/companion';
import { ERRORS } from '@/lib/api/errors';
import { requireChildSession } from '@/server/auth';
import { secureWebSocketRequest } from '@/server/companion/contracts';

const TICKET_PATH = '/api/companion/ws';
const digest = (token: string) => createHash('sha256').update(token).digest('hex');

export async function POST(request: NextRequest): Promise<NextResponse> {
  const actor = await requireChildSession();
  if (actor instanceof Response) return actor as NextResponse;
  if (!secureWebSocketRequest(request.url, process.env.NODE_ENV === 'production')) {
    return ERRORS.forbidden('A secure HTTPS connection is required to consume a websocket ticket.');
  }
  let body: unknown;
  try { body = await request.json(); } catch { return ERRORS.validationFailed({ body: 'Invalid JSON.' }); }
  const values = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  if (typeof values.sessionId !== 'string' || typeof values.ticket !== 'string') {
    return ERRORS.validationFailed({ ticket: 'sessionId and ticket are required.' });
  }

  const requestOrigin = request.nextUrl.origin;
  try {
    const [session] = await db.select().from(companionSessions).where(and(
      eq(companionSessions.id, values.sessionId),
      eq(companionSessions.childId, actor.sub),
    )).limit(1);
    if (!session) return ERRORS.forbidden();
    let metadata: Record<string, unknown> = {};
    try { metadata = JSON.parse(session.metadata ?? '{}') as Record<string, unknown>; }
    catch { return ERRORS.unauthorized('Ticket is invalid or expired.'); }
    const ticket = metadata.companionWsTicket as { hash?: string; childId?: string; origin?: string; expiresAt?: number; path?: string } | undefined;
    if (!ticket || ticket.hash !== digest(values.ticket) || ticket.childId !== actor.sub || ticket.origin !== requestOrigin || ticket.path !== TICKET_PATH || !ticket.expiresAt || ticket.expiresAt <= Date.now()) {
      return ERRORS.unauthorized('Ticket is invalid or expired.');
    }

    delete metadata.companionWsTicket;
    const updateValue = { metadata: JSON.stringify(metadata) } as unknown as Partial<NewCompanionSession>;
    const [consumed] = await db.update(companionSessions).set(updateValue).where(and(
      eq(companionSessions.id, session.id),
      eq(companionSessions.childId, actor.sub),
      eq(companionSessions.metadata, session.metadata),
    )).returning({ id: companionSessions.id });
    if (!consumed) return ERRORS.unauthorized('Ticket is invalid or expired.');
    return NextResponse.json({ valid: true });
  } catch {
    return ERRORS.internal('Could not validate websocket ticket.');
  }
}
