import { and, asc, desc, eq, gt, or } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db/client';
import { companionMessages, companionSessions, type NewCompanionMessage } from '@/db/schema/companion';
import { ERRORS } from '@/lib/api/errors';
import { requireChildSession } from '@/server/auth';
import { checkSafety, generateReply } from '@/server/companion/contracts';
import { messageDto } from '@/server/companion/format';
import {
  createCompanionCorrelationId,
  markCompanionPhase,
  recordCompanionPhase,
  withCompanionCorrelation,
} from '@/server/companion/telemetry';

type Context = { params: Promise<{ sessionId: string }> };
const MAX_PROVIDER_HISTORY = 20;

async function ownedSession(sessionId: string, childId: string) {
  const [session] = await db.select().from(companionSessions).where(eq(companionSessions.id, sessionId)).limit(1);
  return session?.childId === childId ? session : null;
}

export async function GET(request: NextRequest, context: Context): Promise<NextResponse> {
  const correlationId = createCompanionCorrelationId();
  const authStarted = markCompanionPhase();
  const actor = await requireChildSession();
  recordCompanionPhase(correlationId, 'session_auth', authStarted, actor instanceof Response ? 'blocked' : 'ok');
  if (actor instanceof Response) return withCompanionCorrelation(actor as NextResponse, correlationId);
  const { sessionId } = await context.params;
  try {
    const sessionStarted = markCompanionPhase();
    if (!await ownedSession(sessionId, actor.sub)) {
      recordCompanionPhase(correlationId, 'db_history', sessionStarted, 'blocked');
      return withCompanionCorrelation(ERRORS.forbidden(), correlationId);
    }
    const afterId = request.nextUrl.searchParams.get('afterId');
    if (!afterId) {
      const rows = await db.select().from(companionMessages).where(eq(companionMessages.sessionId, sessionId)).orderBy(asc(companionMessages.createdAt), asc(companionMessages.id));
      recordCompanionPhase(correlationId, 'db_history', sessionStarted, 'ok');
      return withCompanionCorrelation(NextResponse.json(rows.map(messageDto)), correlationId);
    }
    if (!z.string().uuid().safeParse(afterId).success) {
      recordCompanionPhase(correlationId, 'db_history', sessionStarted, 'ok');
      return withCompanionCorrelation(NextResponse.json([]), correlationId);
    }
    const [cursor] = await db.select({ createdAt: companionMessages.createdAt, id: companionMessages.id }).from(companionMessages).where(and(eq(companionMessages.sessionId, sessionId), eq(companionMessages.id, afterId))).limit(1);
    if (!cursor) {
      recordCompanionPhase(correlationId, 'db_history', sessionStarted, 'ok');
      return withCompanionCorrelation(NextResponse.json([]), correlationId);
    }
    const rows = await db.select().from(companionMessages).where(and(eq(companionMessages.sessionId, sessionId), or(gt(companionMessages.createdAt, cursor.createdAt), and(eq(companionMessages.createdAt, cursor.createdAt), gt(companionMessages.id, cursor.id))))).orderBy(asc(companionMessages.createdAt), asc(companionMessages.id));
    recordCompanionPhase(correlationId, 'db_history', sessionStarted, 'ok');
    return withCompanionCorrelation(NextResponse.json(rows.map(messageDto)), correlationId);
  } catch {
    recordCompanionPhase(correlationId, 'db_history', markCompanionPhase(), 'error');
    return withCompanionCorrelation(ERRORS.internal('Could not load messages.'), correlationId);
  }
}

export async function POST(request: NextRequest, context: Context): Promise<NextResponse> {
  const correlationId = createCompanionCorrelationId();
  const authStarted = markCompanionPhase();
  const actor = await requireChildSession();
  recordCompanionPhase(correlationId, 'session_auth', authStarted, actor instanceof Response ? 'blocked' : 'ok');
  if (actor instanceof Response) return withCompanionCorrelation(actor as NextResponse, correlationId);
  const { sessionId } = await context.params;
  let body: unknown;
  try { body = await request.json(); } catch { return withCompanionCorrelation(ERRORS.validationFailed({ body: 'Invalid JSON.' }), correlationId); }
  const values = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const { clientMessageId, content } = values;
  if (typeof clientMessageId !== 'string' || !clientMessageId.trim() || clientMessageId.length > 128 || typeof content !== 'string' || !content.trim() || content.length > 8000) return withCompanionCorrelation(ERRORS.validationFailed({ content: 'A message and clientMessageId are required.' }), correlationId);
  const normalizedContent = content.trim();
  try {
    const sessionStarted = markCompanionPhase();
    const session = await ownedSession(sessionId, actor.sub);
    if (!session) { recordCompanionPhase(correlationId, 'session_auth', sessionStarted, 'blocked'); return withCompanionCorrelation(ERRORS.forbidden(), correlationId); }
    if (session.endedAt) { recordCompanionPhase(correlationId, 'session_auth', sessionStarted, 'blocked'); return withCompanionCorrelation(ERRORS.conflict('Session is closed.'), correlationId); }

    const lookupStarted = markCompanionPhase();
    let [userMessage] = await db.select().from(companionMessages).where(and(eq(companionMessages.sessionId, sessionId), eq(companionMessages.clientMessageId, clientMessageId))).limit(1);
    if (userMessage && userMessage.text !== normalizedContent) return withCompanionCorrelation(ERRORS.conflict('clientMessageId was already used for different content.'), correlationId);
    if (!userMessage) {
      const safetyStarted = markCompanionPhase();
      const safety = checkSafety(normalizedContent);
      recordCompanionPhase(correlationId, 'safety_precheck', safetyStarted, safety.flagged ? 'blocked' : 'ok');
      const newMessage = { sessionId, childId: actor.sub, clientMessageId, speaker: 'child' as const, text: normalizedContent, isFlagged: safety.flagged, flagReason: safety.reason, safetyScore: safety.flagged ? 25 : 0, safetyAlerts: safety.flagged ? JSON.stringify({ codes: safety.codes, readAt: null }) : null } as unknown as NewCompanionMessage;
      const persistenceStarted = markCompanionPhase();
      [userMessage] = await db.insert(companionMessages).values(newMessage).onConflictDoNothing().returning();
      recordCompanionPhase(correlationId, 'persistence', persistenceStarted, userMessage ? 'ok' : 'error');
      if (!userMessage) {
        [userMessage] = await db.select().from(companionMessages).where(and(eq(companionMessages.sessionId, sessionId), eq(companionMessages.clientMessageId, clientMessageId))).limit(1);
        if (!userMessage || userMessage.text !== normalizedContent) return withCompanionCorrelation(ERRORS.conflict('clientMessageId conflict.'), correlationId);
      }
    }
    recordCompanionPhase(correlationId, 'db_history', lookupStarted, 'ok');

    if (userMessage.isFlagged) return withCompanionCorrelation(NextResponse.json(messageDto(userMessage), { status: 202 }), correlationId);

    // Retry idempotency check is narrow and only runs for an already persisted input.
    // The normal path performs one bounded history read for the provider.
    if (userMessage.createdAt) {
      const retryRows = await db.select().from(companionMessages).where(and(eq(companionMessages.sessionId, sessionId), eq(companionMessages.speaker, 'snow'), gt(companionMessages.createdAt, userMessage.createdAt))).orderBy(asc(companionMessages.createdAt), asc(companionMessages.id)).limit(1);
      const assistantAfterRetry = (retryRows as Array<typeof userMessage>).find((row) => row.speaker === 'snow');
      if (assistantAfterRetry) return withCompanionCorrelation(NextResponse.json(messageDto(userMessage)), correlationId);
    }

    const historyStarted = markCompanionPhase();
    const history = await db.select({ speaker: companionMessages.speaker, text: companionMessages.text }).from(companionMessages).where(eq(companionMessages.sessionId, sessionId)).orderBy(desc(companionMessages.createdAt), desc(companionMessages.id)).limit(MAX_PROVIDER_HISTORY + 1);
    const boundedHistory = history.reverse();
    recordCompanionPhase(correlationId, 'db_history', historyStarted, 'ok');

    const providerStarted = markCompanionPhase();
    let reply: string;
    try {
      reply = (await generateReply({ content: userMessage.text, history: boundedHistory.filter((m) => m.speaker === 'child' || m.speaker === 'snow').map((m) => ({ role: m.speaker === 'snow' ? 'assistant' as const : 'child' as const, content: m.text })) })).trim();
      recordCompanionPhase(correlationId, 'provider', providerStarted, 'ok');
    } catch (error) {
      recordCompanionPhase(correlationId, 'provider', providerStarted, 'error');
      if (error instanceof Error && error.message === 'COMPANION_PROVIDER_UNAVAILABLE') return withCompanionCorrelation(NextResponse.json({ error: { code: 'PROVIDER_UNAVAILABLE', message: 'Companion responses are temporarily unavailable.' } }, { status: 503 }), correlationId);
      return withCompanionCorrelation(NextResponse.json({ error: { code: 'PROVIDER_ERROR', message: 'Companion could not respond. Please retry.' } }, { status: 502 }), correlationId);
    }
    if (!reply) return withCompanionCorrelation(NextResponse.json({ error: { code: 'PROVIDER_ERROR', message: 'Companion returned an empty response.' } }, { status: 502 }), correlationId);

    const outputSafetyStarted = markCompanionPhase();
    const replySafety = checkSafety(reply);
    recordCompanionPhase(correlationId, 'output_safety', outputSafetyStarted, replySafety.flagged ? 'blocked' : 'ok');
    if (replySafety.flagged) return withCompanionCorrelation(NextResponse.json({ error: { code: 'PROVIDER_UNSAFE_OUTPUT', message: 'Companion could not provide a safe response. Please try a different question.' } }, { status: 502 }), correlationId);

    const persistenceStarted = markCompanionPhase();
    const assistantMessage = { sessionId, childId: actor.sub, speaker: 'snow' as const, text: reply, isFlagged: false, safetyScore: 0 } as unknown as NewCompanionMessage;
    const [assistant] = await db.insert(companionMessages).values(assistantMessage).returning();
    recordCompanionPhase(correlationId, 'persistence', persistenceStarted, assistant ? 'ok' : 'error');
    if (!assistant) return withCompanionCorrelation(ERRORS.internal('Could not save companion response.'), correlationId);
    recordCompanionPhase(correlationId, 'render', markCompanionPhase(), 'ok');
    return withCompanionCorrelation(NextResponse.json(messageDto(userMessage), { status: 201 }), correlationId);
  } catch { return withCompanionCorrelation(ERRORS.internal('Could not save message.'), correlationId); }
}
