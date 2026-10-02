import { db } from '@/db/client';
import { users, children, households, householdMembers } from '@/db/schema';
import {
  PARENT_COOKIE_NAME,
  PARENT_COOKIE_OPTIONS,
  CHILD_COOKIE_NAME,
  CHILD_COOKIE_OPTIONS,
} from '@/lib/auth/session';
import { getParentSession, getChildSession } from '@/server/auth';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

// GET /api/auth/session
// Returns current authenticated session details or { session: null }
// FAIL CLOSED: Validates DB-backed session row via getParentSession / getChildSession.
// If DB fails, row is missing, revoked, or expired, returns { session: null }. Never falls back to raw JWT.
export async function GET(): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    const parentToken = cookieStore.get(PARENT_COOKIE_NAME)?.value;
    const childToken = cookieStore.get(CHILD_COOKIE_NAME)?.value;

    // ── 1. Check parent session (strictly DB-backed) ──────────────────────────
    if (parentToken) {
      const parentSession = await getParentSession();
      if (parentSession) {
        const [user] = await db
          .select({
            id: users.id,
            email: users.email,
            displayName: users.displayName,
            role: users.role,
          })
          .from(users)
          .where(eq(users.id, parentSession.sub))
          .limit(1);

        if (user) {
          const [owned] = await db
            .select({ id: households.id })
            .from(households)
            .where(eq(households.ownerId, user.id))
            .limit(1);

          let householdId = owned?.id ?? null;
          if (!householdId) {
            const [membership] = await db
              .select({ householdId: householdMembers.householdId })
              .from(householdMembers)
              .where(eq(householdMembers.userId, user.id))
              .limit(1);
            householdId = membership?.householdId ?? null;
          }

          return NextResponse.json({
            session: {
              actorType: parentSession.role,
              user: {
                id: user.id,
                email: user.email,
                name: user.displayName,
                role: user.role,
                householdId,
              },
            },
          });
        }
      } else {
        // Cookie existed but session is revoked/expired/invalid in DB -> clear cookie
        cookieStore.delete(PARENT_COOKIE_OPTIONS.name);
      }
    }

    // ── 2. Check child session (strictly DB-backed) ───────────────────────────
    if (childToken) {
      const childSession = await getChildSession();
      if (childSession) {
        const [child] = await db
          .select({
            id: children.id,
            displayName: children.displayName,
            householdId: children.householdId,
          })
          .from(children)
          .where(eq(children.id, childSession.sub))
          .limit(1);

        if (child) {
          return NextResponse.json({
            session: {
              actorType: 'child',
              child: {
                id: child.id,
                name: child.displayName,
                householdId: child.householdId,
              },
            },
          });
        }
      } else {
        // Cookie existed but session is revoked/expired/invalid in DB -> clear cookie
        cookieStore.delete(CHILD_COOKIE_OPTIONS.name);
      }
    }

    return NextResponse.json({ session: null });
  } catch (err) {
    console.error('[auth/session] Error:', err);
    return NextResponse.json({ session: null });
  }
}
