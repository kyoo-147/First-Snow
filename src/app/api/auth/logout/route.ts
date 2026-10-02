import { db } from '@/db/client';
import { sessions } from '@/db/schema';
import {
  PARENT_COOKIE_NAME,
  PARENT_COOKIE_OPTIONS,
  CHILD_COOKIE_NAME,
  CHILD_COOKIE_OPTIONS,
  verifyParentSession,
  verifyChildSession,
} from '@/lib/auth/session';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

// POST /api/auth/logout
// Clears parent and child session cookies and revokes active DB sessions
export async function POST(): Promise<NextResponse> {
  const cookieStore = await cookies();
  const parentToken = cookieStore.get(PARENT_COOKIE_NAME)?.value;
  const childToken = cookieStore.get(CHILD_COOKIE_NAME)?.value;

  if (parentToken) {
    const payload = await verifyParentSession(parentToken);
    if (payload?.sessionId) {
      try {
        await db
          .update(sessions)
          .set({ revokedAt: new Date() } as any)
          .where(eq(sessions.id, payload.sessionId));
      } catch (err) {
        console.error('[auth/logout] Failed to revoke parent session in DB:', err);
      }
    }
  }

  if (childToken) {
    const payload = await verifyChildSession(childToken);
    if (payload?.sessionId) {
      try {
        await db
          .update(sessions)
          .set({ revokedAt: new Date() } as any)
          .where(eq(sessions.id, payload.sessionId));
      } catch (err) {
        console.error('[auth/logout] Failed to revoke child session in DB:', err);
      }
    }
  }

  cookieStore.delete(PARENT_COOKIE_OPTIONS.name);
  cookieStore.delete(CHILD_COOKIE_OPTIONS.name);

  return NextResponse.json({ success: true });
}
