import { and, asc, desc, eq, gt, or } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db/client';
import { companionMessages, companionSessions, type NewCompanionMessage } from '@/db/schema/companion';
import { ERRORS } from '@/lib/api/errors';
import { requireChildSession } from '@/server/auth';
import { checkSafety, checkSemanticSafety, classifySafetyIntent, generateReply, isClearlySafe } from '@/server/companion/contracts';
import { messageDto } from '@/server/companion/format';
import {
  CompanionTelemetryCollector,
  markCompanionPhase,
  withCompanionCorrelation,
} from '@/server/companion/telemetry';

type Context = { params: Promise<{ sessionId: string }> };
const MAX_PROVIDER_HISTORY = 20;

async function ownedSession(sessionId: string, childId: string) {
  const [session] = await db.select().from(companionSessions).where(eq(companionSessions.id, sessionId)).limit(1);
  return session?.childId === childId ? session : null;
}

export async function GET(request: NextRequest, context: Context): Promise<NextResponse> {
  const collector = new CompanionTelemetryCollector();
  const correlationId = collector.getCorrelationId();
  const authStarted = markCompanionPhase();
  const actor = await requireChildSession();
  collector.recordPhase('session_auth', authStarted, actor instanceof Response ? 'blocked' : 'ok');
  if (actor instanceof Response) {
    collector.flush(actor.status >= 500 ? 'error' : actor.status >= 400 ? 'blocked' : 'ok');
    return withCompanionCorrelation(actor as NextResponse, correlationId);
  }
  const { sessionId } = await context.params;
  const historyStarted = markCompanionPhase();
  try {
    if (!await ownedSession(sessionId, actor.sub)) {
      collector.recordPhase('db_history', historyStarted, 'blocked');
      collector.flush('blocked');
      return withCompanionCorrelation(ERRORS.forbidden(), correlationId);
    }
    const afterId = request.nextUrl.searchParams.get('afterId');
    if (!afterId) {
      const rows = await db.select().from(companionMessages).where(eq(companionMessages.sessionId, sessionId)).orderBy(asc(companionMessages.createdAt), asc(companionMessages.id));
      collector.recordPhase('db_history', historyStarted, 'ok');
      collector.flush('ok');
      return withCompanionCorrelation(NextResponse.json(rows.map(messageDto)), correlationId);
    }
    if (!z.string().uuid().safeParse(afterId).success) {
      collector.recordPhase('db_history', historyStarted, 'ok');
      collector.flush('ok');
      return withCompanionCorrelation(NextResponse.json([]), correlationId);
    }
    const [cursor] = await db.select({ createdAt: companionMessages.createdAt, id: companionMessages.id }).from(companionMessages).where(and(eq(companionMessages.sessionId, sessionId), eq(companionMessages.id, afterId))).limit(1);
    if (!cursor) {
      collector.recordPhase('db_history', historyStarted, 'ok');
      collector.flush('ok');
      return withCompanionCorrelation(NextResponse.json([]), correlationId);
    }
    const rows = await db.select().from(companionMessages).where(and(eq(companionMessages.sessionId, sessionId), or(gt(companionMessages.createdAt, cursor.createdAt), and(eq(companionMessages.createdAt, cursor.createdAt), gt(companionMessages.id, cursor.id))))).orderBy(asc(companionMessages.createdAt), asc(companionMessages.id));
    collector.recordPhase('db_history', historyStarted, 'ok');
    collector.flush('ok');
    return withCompanionCorrelation(NextResponse.json(rows.map(messageDto)), correlationId);
  } catch {
    collector.recordPhase('db_history', historyStarted, 'error');
    collector.flush('error');
    return withCompanionCorrelation(ERRORS.internal('Could not load messages.'), correlationId);
  }
}

export async function POST(request: NextRequest, context: Context): Promise<NextResponse> {
  const collector = new CompanionTelemetryCollector();
  const correlationId = collector.getCorrelationId();
  const authStarted = markCompanionPhase();
  const actor = await requireChildSession();
  collector.recordPhase('session_auth', authStarted, actor instanceof Response ? 'blocked' : 'ok');
  if (actor instanceof Response) {
    collector.flush(actor.status >= 500 ? 'error' : actor.status >= 400 ? 'blocked' : 'ok');
    return withCompanionCorrelation(actor as NextResponse, correlationId);
  }
  const { sessionId } = await context.params;
  let body: unknown;
  try { body = await request.json(); } catch {
    collector.flush('error');
    return withCompanionCorrelation(ERRORS.validationFailed({ body: 'Invalid JSON.' }), correlationId);
  }
  const values = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const { clientMessageId, content } = values;
  if (typeof clientMessageId !== 'string' || !clientMessageId.trim() || clientMessageId.length > 128 || typeof content !== 'string' || !content.trim() || content.length > 8000) {
    collector.flush('error');
    return withCompanionCorrelation(ERRORS.validationFailed({ content: 'A message and clientMessageId are required.' }), correlationId);
  }
  const normalizedContent = content.trim();

  let phaseStarted = markCompanionPhase();
  try {
    const session = await ownedSession(sessionId, actor.sub);
    if (!session) {
      collector.recordPhase('session_auth', phaseStarted, 'blocked');
      collector.flush('blocked');
      return withCompanionCorrelation(ERRORS.forbidden(), correlationId);
    }
    if (session.endedAt) {
      collector.recordPhase('session_auth', phaseStarted, 'blocked');
      collector.flush('blocked');
      return withCompanionCorrelation(ERRORS.conflict('Session is closed.'), correlationId);
    }

    const precheckStarted = markCompanionPhase();
    const [existingMessage] = await db.select().from(companionMessages).where(and(eq(companionMessages.sessionId, sessionId), eq(companionMessages.clientMessageId, clientMessageId))).limit(1);
    const existedBeforeInsertion = Boolean(existingMessage);
    let userMessage = existingMessage;

    if (existedBeforeInsertion) {
      if (userMessage.text !== normalizedContent) {
        collector.recordPhase('persistence', precheckStarted, 'blocked');
        collector.flush('blocked');
        return withCompanionCorrelation(ERRORS.conflict('clientMessageId was already used for different content.'), correlationId);
      }
      collector.recordPhase('persistence', precheckStarted, 'ok');

      if (userMessage.isFlagged) {
        collector.flush('ok');
        return withCompanionCorrelation(NextResponse.json(messageDto(userMessage), { status: 202 }), correlationId);
      }

      // Retry idempotency lookup is executed ONLY for the pre-existing replay path.
      if (userMessage.createdAt) {
        const retryLookupStarted = markCompanionPhase();
        const retryRows = await db.select().from(companionMessages).where(and(eq(companionMessages.sessionId, sessionId), eq(companionMessages.speaker, 'snow'), or(gt(companionMessages.createdAt, userMessage.createdAt), and(eq(companionMessages.createdAt, userMessage.createdAt), gt(companionMessages.id, userMessage.id))))).orderBy(asc(companionMessages.createdAt), asc(companionMessages.id)).limit(1);
        collector.recordPhase('db_history', retryLookupStarted, 'ok');
        const assistantAfterRetry = (retryRows as Array<typeof userMessage>).find((row) => row.speaker === 'snow');
        if (assistantAfterRetry) {
          collector.flush('ok');
          const assistantDto = messageDto(assistantAfterRetry);
          return withCompanionCorrelation(NextResponse.json({ ...messageDto(userMessage), reply: assistantDto, assistant: assistantDto }), correlationId);
        }
      }
    } else {
      phaseStarted = markCompanionPhase();
      const deterministicSafety = checkSafety(normalizedContent);
      collector.recordPhase('safety_precheck', phaseStarted, deterministicSafety.flagged ? 'blocked' : 'ok');
      const intentStarted = markCompanionPhase();
      const intent = deterministicSafety.flagged ? { flagged: false, confidence: 'high' as const, rationale: 'Deterministic safety rule already flagged this message.' } : await classifySafetyIntent(normalizedContent);
      const safety = deterministicSafety.flagged ? deterministicSafety : { flagged: intent.flagged, reason: intent.flagged ? 'Potential self-harm or immediate-danger intent detected.' : null, codes: intent.flagged ? ['self_harm'] : [] };
      collector.recordPhase('safety_intent', intentStarted, safety.flagged ? 'blocked' : 'ok');
      const newMessage = { sessionId, childId: actor.sub, clientMessageId, speaker: 'child' as const, text: normalizedContent, isFlagged: safety.flagged, flagReason: safety.reason, safetyScore: safety.flagged ? 25 : 0, safetyAlerts: safety.flagged ? JSON.stringify({ codes: safety.codes, readAt: null }) : null } as unknown as NewCompanionMessage;
      phaseStarted = markCompanionPhase();
      [userMessage] = await db.insert(companionMessages).values(newMessage).onConflictDoNothing().returning();
      if (!userMessage) {
        [userMessage] = await db.select().from(companionMessages).where(and(eq(companionMessages.sessionId, sessionId), eq(companionMessages.clientMessageId, clientMessageId))).limit(1);
        if (!userMessage || userMessage.text !== normalizedContent) {
          collector.recordPhase('persistence', phaseStarted, 'blocked');
          collector.flush('blocked');
          return withCompanionCorrelation(ERRORS.conflict('clientMessageId conflict.'), correlationId);
        }
      }
      collector.recordPhase('persistence', phaseStarted, 'ok');

      if (userMessage.isFlagged) {
        collector.flush('ok');
        return withCompanionCorrelation(NextResponse.json(messageDto(userMessage), { status: 202 }), correlationId);
      }
    }

    phaseStarted = markCompanionPhase();
    const history = await db.select({ speaker: companionMessages.speaker, text: companionMessages.text }).from(companionMessages).where(eq(companionMessages.sessionId, sessionId)).orderBy(desc(companionMessages.createdAt), desc(companionMessages.id)).limit(MAX_PROVIDER_HISTORY + 1);
    const boundedHistory = history.reverse();
    collector.recordPhase('db_history', phaseStarted, 'ok');

    phaseStarted = markCompanionPhase();
    const clearlySafe = isClearlySafe(userMessage.text);
    collector.recordPhase('safety_precheck', phaseStarted, 'ok');

    let reply: string;
    let semanticSafety = { flagged: false, reason: null as string | null, codes: [] as string[] };

    phaseStarted = markCompanionPhase();
    try {
      const historyContext = boundedHistory
        .filter((m) => m.speaker === 'child' || m.speaker === 'snow')
        .map((m) => ({ role: m.speaker === 'snow' ? ('assistant' as const) : ('child' as const), content: m.text }));

      if (clearlySafe) {
        reply = (await generateReply({ content: userMessage.text, history: historyContext })).trim();
      } else {
        const [generated, evaluatedSafety] = await Promise.all([
          generateReply({ content: userMessage.text, history: historyContext }),
          checkSemanticSafety(userMessage.text),
        ]);
        reply = generated.trim();
        semanticSafety = evaluatedSafety;
      }
      collector.recordPhase('provider', phaseStarted, 'ok');
    } catch (error) {
      collector.recordPhase('provider', phaseStarted, 'error');
      collector.flush('error');
      if (error instanceof Error && error.message === 'COMPANION_PROVIDER_UNAVAILABLE') return withCompanionCorrelation(NextResponse.json({ error: { code: 'PROVIDER_UNAVAILABLE', message: 'Companion responses are temporarily unavailable.' } }, { status: 503 }), correlationId);
      return withCompanionCorrelation(NextResponse.json({ error: { code: 'PROVIDER_ERROR', message: 'Companion could not respond. Please retry.' } }, { status: 502 }), correlationId);
    }
    if (semanticSafety.flagged) {
      collector.recordPhase('safety_precheck', markCompanionPhase(), 'blocked');
      collector.flush('blocked');
      return withCompanionCorrelation(
        NextResponse.json({ ...messageDto(userMessage), isFlagged: true, flagReason: semanticSafety.reason }, { status: 202 }),
        correlationId,
      );
    }

    if (!reply) {
      collector.recordPhase('provider', phaseStarted, 'error');
      collector.flush('error');
      return withCompanionCorrelation(NextResponse.json({ error: { code: 'PROVIDER_ERROR', message: 'Companion returned an empty response.' } }, { status: 502 }), correlationId);
    }

    phaseStarted = markCompanionPhase();
    const replySafety = checkSafety(reply);
    collector.recordPhase('output_safety', phaseStarted, replySafety.flagged ? 'blocked' : 'ok');
    if (replySafety.flagged) {
      collector.flush('blocked');
      return withCompanionCorrelation(NextResponse.json({ error: { code: 'PROVIDER_UNSAFE_OUTPUT', message: 'Companion could not provide a safe response. Please try a different question.' } }, { status: 502 }), correlationId);
    }

    phaseStarted = markCompanionPhase();
    const assistantMessage = { sessionId, childId: actor.sub, speaker: 'snow' as const, text: reply, isFlagged: false, safetyScore: 0 } as unknown as NewCompanionMessage;
    const [assistant] = await db.insert(companionMessages).values(assistantMessage).returning();
    if (!assistant) {
      collector.recordPhase('persistence', phaseStarted, 'error');
      collector.flush('error');
      return withCompanionCorrelation(ERRORS.internal('Could not save companion response.'), correlationId);
    }
    collector.recordPhase('persistence', phaseStarted, 'ok');
    collector.recordPhase('render', markCompanionPhase(), 'ok');
    collector.flush('ok');
    const assistantDto = messageDto(assistant);
    return withCompanionCorrelation(NextResponse.json({ ...messageDto(userMessage), reply: assistantDto, assistant: assistantDto }, { status: 201 }), correlationId);
  } catch {
    collector.recordPhase('persistence', phaseStarted, 'error');
    collector.flush('error');
    return withCompanionCorrelation(ERRORS.internal('Could not save message.'), correlationId);
  }
}
