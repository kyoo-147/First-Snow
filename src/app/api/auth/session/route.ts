import { db } from '@/db/client';
import { users, children, households, householdMembers, sessions } from '@/db/schema';
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

// GET /api/auth/session
// Returns current authenticated session details or { session: null }
export async function GET(): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    const parentToken = cookieStore.get(PARENT_COOKIE_NAME)?.value;
    const childToken = cookieStore.get(CHILD_COOKIE_NAME)?.value;

    // ── 1. Check parent session ───────────────────────────────────────────────
    if (parentToken) {
      const payload = await verifyParentSession(parentToken);
      if (payload) {
        let isRevoked = false;
        let userDetails = {
          id: payload.sub,
          email: '',
          name: '',
          role: payload.role,
          householdId: null as string | null,
        };

        try {
          if (payload.sessionId) {
            const [sessionRow] = await db
              .select({
                revokedAt: sessions.revokedAt,
                expiresAt: sessions.expiresAt,
              })
              .from(sessions)
              .where(eq(sessions.id, payload.sessionId))
              .limit(1);

            if (
              sessionRow?.revokedAt ||
              (sessionRow?.expiresAt && new Date(sessionRow.expiresAt) < new Date())
            ) {
              isRevoked = true;
            }
          }

          if (!isRevoked) {
            const [user] = await db
              .select({
                id: users.id,
                email: users.email,
                displayName: users.displayName,
                role: users.role,
                isActive: users.isActive,
              })
              .from(users)
              .where(eq(users.id, payload.sub))
              .limit(1);

            if (user && user.isActive) {
              userDetails.email = user.email;
              userDetails.name = user.displayName;
              userDetails.role = user.role;

              // Find household
              const [owned] = await db
                .select({ id: households.id })
                .from(households)
                .where(eq(households.ownerId, user.id))
                .limit(1);

              if (owned) {
                userDetails.householdId = owned.id;
              } else {
                const [membership] = await db
                  .select({ householdId: householdMembers.householdId })
                  .from(householdMembers)
                  .where(eq(householdMembers.userId, user.id))
                  .limit(1);
                userDetails.householdId = membership?.householdId ?? null;
              }
            } else if (user && !user.isActive) {
              isRevoked = true;
            }
          }
        } catch {
          // DB offline fallback: allow verified JWT
        }

        if (isRevoked) {
          cookieStore.delete(PARENT_COOKIE_OPTIONS.name);
        } else {
          return NextResponse.json({
            session: {
              actorType: payload.role,
              user: userDetails,
            },
          });
        }
      }
    }

    // ── 2. Check child session ────────────────────────────────────────────────
    if (childToken) {
      const payload = await verifyChildSession(childToken);
      if (payload) {
        let isRevoked = false;
        let childDetails = {
          id: payload.sub,
          name: '',
          householdId: payload.householdId,
        };

        try {
          if (payload.sessionId) {
            const [sessionRow] = await db
              .select({
                revokedAt: sessions.revokedAt,
                expiresAt: sessions.expiresAt,
              })
              .from(sessions)
              .where(eq(sessions.id, payload.sessionId))
              .limit(1);

            if (
              sessionRow?.revokedAt ||
              (sessionRow?.expiresAt && new Date(sessionRow.expiresAt) < new Date())
            ) {
              isRevoked = true;
            }
          }

          if (!isRevoked) {
            const [child] = await db
              .select({
                id: children.id,
                displayName: children.displayName,
                householdId: children.householdId,
                isActive: children.isActive,
              })
              .from(children)
              .where(eq(children.id, payload.sub))
              .limit(1);

            if (child && child.isActive) {
              childDetails.name = child.displayName;
              childDetails.householdId = child.householdId;
            } else if (child && !child.isActive) {
              isRevoked = true;
            }
          }
        } catch {
          // DB offline fallback
        }

        if (isRevoked) {
          cookieStore.delete(CHILD_COOKIE_OPTIONS.name);
        } else {
          return NextResponse.json({
            session: {
              actorType: 'child',
              child: childDetails,
            },
          });
        }
      }
    }

    return NextResponse.json({ session: null });
  } catch (err) {
    console.error('[auth/session] Error:', err);
    return NextResponse.json({ session: null });
  }
}
