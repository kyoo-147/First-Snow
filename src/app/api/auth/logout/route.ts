import { db } from '@/db/client';
import { sessions } from '@/db/schema';
import {
  PARENT_COOKIE_NAME,
  PARENT_COOKIE_OPTIONS,
  CHILD_COOKIE_NAME,
  CHILD_COOKIE_OPTIONS,
  verifyParentSession,
  verifyChildSession,
  hashToken,
} from '@/lib/auth/session';
import { ERRORS } from '@/lib/api/errors';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

// POST /api/auth/logout
// Clears parent and child session cookies and revokes active DB sessions by tokenHash.
// If DB revocation fails, cookies are still cleared, but a truthful error is returned.
export async function POST(): Promise<NextResponse> {
  const cookieStore = await cookies();
  const parentToken = cookieStore.get(PARENT_COOKIE_NAME)?.value;
  const childToken = cookieStore.get(CHILD_COOKIE_NAME)?.value;

  // Always delete session cookies first (local logout guarantee)
  cookieStore.delete(PARENT_COOKIE_OPTIONS.name);
  cookieStore.delete(CHILD_COOKIE_OPTIONS.name);

  try {
    if (parentToken) {
      const payload = await verifyParentSession(parentToken);
      if (payload?.sessionId) {
        const tokenHash = hashToken(payload.sessionId);
        await db
          .update(sessions)
          .set({ revokedAt: new Date() } as unknown as Parameters<ReturnType<typeof db.update>['set']>[0])
          .where(eq(sessions.tokenHash, tokenHash));
      }
    }

    if (childToken) {
      const payload = await verifyChildSession(childToken);
      if (payload?.sessionId) {
        const tokenHash = hashToken(payload.sessionId);
        await db
          .update(sessions)
          .set({ revokedAt: new Date() } as unknown as Parameters<ReturnType<typeof db.update>['set']>[0])
          .where(eq(sessions.tokenHash, tokenHash));
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[auth/logout] Failed to revoke session in DB:', err);
    return ERRORS.internal('Logout succeeded locally, but failed to revoke session in database.');
  }
}
