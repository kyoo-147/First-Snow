import { and, desc, eq, gt, isNull, ne } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db/client';
import { auditEvents, sessions } from '@/db/schema';
import { ERRORS } from '@/lib/api/errors';
import { hashToken } from '@/lib/auth/session';
import { requireParentSession } from '@/server/auth';

/**
 * Session/device management for the signed-in parent.
 *
 * GET    /api/account/sessions           → list this user's active sessions (opaque, secret-free)
 * DELETE /api/account/sessions           → revoke every other session for this user
 * DELETE /api/account/sessions {id}      → revoke one other session owned by this user
 *
 * Scoped to the authenticated user only. Never returns the session token hash and
 * never touches another user's rows. Fails closed when the caller session is unverifiable.
 */

type SessionRow = {
  id: string;
  createdAt: Date;
  expiresAt: Date;
  userAgent: string | null;
  tokenHash: string;
};

function presentSession(row: SessionRow, currentTokenHash: string | null) {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    userAgent: row.userAgent,
    current: currentTokenHash !== null && row.tokenHash === currentTokenHash,
  };
}

const revokeSchema = z.object({ sessionId: z.string().uuid().optional() }).strict();

const activeOwnerScope = (userId: string) => and(
  eq(sessions.userId, userId),
  isNull(sessions.revokedAt),
  gt(sessions.expiresAt, new Date()),
);

export async function GET(): Promise<NextResponse> {
  const session = await requireParentSession();
  if (session instanceof Response) return session as NextResponse;

  try {
    const currentTokenHash = session.sessionId ? hashToken(session.sessionId) : null;
    const rows = await db
      .select({
        id: sessions.id,
        createdAt: sessions.createdAt,
        expiresAt: sessions.expiresAt,
        userAgent: sessions.userAgent,
        tokenHash: sessions.tokenHash,
      })
      .from(sessions)
      .where(activeOwnerScope(session.sub))
      .orderBy(desc(sessions.createdAt));

    return NextResponse.json({ sessions: rows.map((row) => presentSession(row, currentTokenHash)) });
  } catch (error) {
    console.error('[account/sessions] Failed to list sessions:', error);
    return ERRORS.internal('Active sessions are temporarily unavailable.');
  }
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const session = await requireParentSession();
  if (session instanceof Response) return session as NextResponse;

  try {
    let body: unknown = {};
    try { body = await request.json(); } catch { body = {}; }
    const parsed = revokeSchema.safeParse(body);
    if (!parsed.success) return ERRORS.validationFailed(parsed.error.flatten().fieldErrors as Record<string, string[]>);

    // The caller's own session must be identifiable so it can be preserved.
    if (!session.sessionId) return ERRORS.unauthorized();
    const currentTokenHash = hashToken(session.sessionId);
    const now = new Date();

    if (parsed.data.sessionId) {
      const [target] = await db
        .select({ id: sessions.id, tokenHash: sessions.tokenHash })
        .from(sessions)
        .where(and(eq(sessions.id, parsed.data.sessionId), eq(sessions.userId, session.sub), isNull(sessions.revokedAt)))
        .limit(1);
      if (!target) return ERRORS.notFound('Session not found.');
      if (target.tokenHash === currentTokenHash) {
        return ERRORS.validationFailed({ sessionId: ['You cannot revoke the session you are currently using. Sign out instead.'] });
      }

      const [revoked] = await db
        .update(sessions)
        .set({ revokedAt: now })
        .where(and(eq(sessions.id, target.id), eq(sessions.userId, session.sub), isNull(sessions.revokedAt)))
        .returning({ id: sessions.id });
      if (!revoked) return ERRORS.notFound('Session not found.');

      await db.insert(auditEvents).values({
        actorId: session.sub,
        actorType: session.role,
        eventType: 'account.session_revoked',
        resourceType: 'session',
        resourceId: revoked.id,
        metadata: { scope: 'single' },
      } as typeof auditEvents.$inferInsert);

      return NextResponse.json({ revoked: 1, message: 'Session revoked.' });
    }

    const revoked = await db
      .update(sessions)
      .set({ revokedAt: now })
      .where(and(eq(sessions.userId, session.sub), isNull(sessions.revokedAt), ne(sessions.tokenHash, currentTokenHash)))
      .returning({ id: sessions.id });

    await db.insert(auditEvents).values({
      actorId: session.sub,
      actorType: session.role,
      eventType: 'account.sessions_revoked',
      resourceType: 'user',
      resourceId: session.sub,
      metadata: { scope: 'others', revoked: revoked.length },
    } as typeof auditEvents.$inferInsert);

    return NextResponse.json({
      revoked: revoked.length,
      message: revoked.length ? 'Other sessions were revoked.' : 'No other active sessions were found.',
    });
  } catch (error) {
    console.error('[account/sessions] Failed to revoke sessions:', error);
    return ERRORS.internal('Sessions could not be revoked.');
  }
}
