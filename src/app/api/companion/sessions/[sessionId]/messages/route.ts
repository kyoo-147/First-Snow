import { and, asc, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/client';
import { companionMessages, companionSessions, type NewCompanionMessage } from '@/db/schema/companion';
import { ERRORS } from '@/lib/api/errors';
import { requireChildSession } from '@/server/auth';
import { checkSafety, generateReply } from '@/server/companion/contracts';
import { messageDto } from '@/server/companion/format';

type Context = { params: Promise<{ sessionId: string }> };
async function ownedSession(sessionId: string, childId: string) {
  const [session] = await db.select().from(companionSessions).where(eq(companionSessions.id, sessionId)).limit(1);
  return session?.childId === childId ? session : null;
}

export async function GET(request: NextRequest, context: Context): Promise<NextResponse> {
  const actor = await requireChildSession();
  if (actor instanceof Response) return actor as NextResponse;
  const { sessionId } = await context.params;
  try {
    if (!await ownedSession(sessionId, actor.sub)) return ERRORS.forbidden();
    const afterId = request.nextUrl.searchParams.get('afterId');
    const rows = await db.select().from(companionMessages).where(eq(companionMessages.sessionId, sessionId)).orderBy(asc(companionMessages.createdAt), asc(companionMessages.id));
    const cursor = afterId ? rows.findIndex((row) => row.id === afterId) : -1;
    return NextResponse.json(rows.slice(cursor >= 0 ? cursor + 1 : 0).map(messageDto));
  } catch { return ERRORS.internal('Could not load messages.'); }
}

export async function POST(request: NextRequest, context: Context): Promise<NextResponse> {
  const actor = await requireChildSession();
  if (actor instanceof Response) return actor as NextResponse;
  const { sessionId } = await context.params;
  let body: unknown;
  try { body = await request.json(); } catch { return ERRORS.validationFailed({ body: 'Invalid JSON.' }); }
  const values = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const { clientMessageId, content } = values;
  if (typeof clientMessageId !== 'string' || !clientMessageId.trim() || clientMessageId.length > 128 || typeof content !== 'string' || !content.trim() || content.length > 8000) return ERRORS.validationFailed({ content: 'A message and clientMessageId are required.' });
  try {
    const session = await ownedSession(sessionId, actor.sub);
    if (!session) return ERRORS.forbidden();
    if (session.endedAt) return ERRORS.conflict('Session is closed.');
    let [userMessage] = await db.select().from(companionMessages).where(and(eq(companionMessages.sessionId, sessionId), eq(companionMessages.clientMessageId, clientMessageId))).limit(1);
    if (userMessage && userMessage.text !== content.trim()) return ERRORS.conflict('clientMessageId was already used for different content.');
    if (!userMessage) {
      const safety = checkSafety(content);
      const newMessage = { sessionId, childId: actor.sub, clientMessageId, speaker: 'child' as const, text: content.trim(), isFlagged: safety.flagged, flagReason: safety.reason, safetyScore: safety.flagged ? 25 : 0, safetyAlerts: safety.flagged ? JSON.stringify({ codes: safety.codes, readAt: null }) : null } as unknown as NewCompanionMessage;
      [userMessage] = await db.insert(companionMessages).values(newMessage).onConflictDoNothing().returning();
      if (!userMessage) {
        [userMessage] = await db.select().from(companionMessages).where(and(eq(companionMessages.sessionId, sessionId), eq(companionMessages.clientMessageId, clientMessageId))).limit(1);
        if (!userMessage || userMessage.text !== content.trim()) return ERRORS.conflict('clientMessageId conflict.');
      }
    }
    const sessionMessages = await db.select().from(companionMessages).where(eq(companionMessages.sessionId, sessionId)).orderBy(asc(companionMessages.createdAt), asc(companionMessages.id));
    const userIndex = sessionMessages.findIndex((message) => message.id === userMessage.id);
    if (userIndex >= 0 && sessionMessages[userIndex + 1]?.speaker === 'snow') return NextResponse.json(messageDto(userMessage));
    if (userMessage.isFlagged) return NextResponse.json(messageDto(userMessage), { status: 202 });
    const history = await db.select({ speaker: companionMessages.speaker, text: companionMessages.text }).from(companionMessages).where(eq(companionMessages.sessionId, sessionId)).orderBy(asc(companionMessages.createdAt));
    let reply: string;
    try { reply = (await generateReply({ content: userMessage.text, history: history.filter((m) => m.speaker === 'child' || m.speaker === 'snow').map((m) => ({ role: m.speaker === 'snow' ? 'assistant' as const : 'child' as const, content: m.text })) })).trim(); }
    catch (error) {
      if (error instanceof Error && error.message === 'COMPANION_PROVIDER_UNAVAILABLE') return NextResponse.json({ error: { code: 'PROVIDER_UNAVAILABLE', message: 'Companion responses are temporarily unavailable.' } }, { status: 503 });
      return NextResponse.json({ error: { code: 'PROVIDER_ERROR', message: 'Companion could not respond. Please retry.' } }, { status: 502 });
    }
    if (!reply) return NextResponse.json({ error: { code: 'PROVIDER_ERROR', message: 'Companion returned an empty response.' } }, { status: 502 });
    const replySafety = checkSafety(reply);
    if (replySafety.flagged) {
      console.error('[companion/provider] Blocked unsafe provider output', { codes: replySafety.codes });
      return NextResponse.json({ error: { code: 'PROVIDER_UNSAFE_OUTPUT', message: 'Companion could not provide a safe response. Please try a different question.' } }, { status: 502 });
    }
    const assistantMessage = { sessionId, childId: actor.sub, speaker: 'snow' as const, text: reply, isFlagged: false, safetyScore: 0 } as unknown as NewCompanionMessage;
    const [assistant] = await db.insert(companionMessages).values(assistantMessage).returning();
    if (!assistant) return ERRORS.internal('Could not save companion response.');
    return NextResponse.json(messageDto(userMessage), { status: 201 });
  } catch { return ERRORS.internal('Could not save message.'); }
}
