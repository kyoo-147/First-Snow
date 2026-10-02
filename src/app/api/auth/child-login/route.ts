import { db } from '@/db/client';
import { children, sessions, households, householdMembers } from '@/db/schema';
import { verifyPin } from '@/lib/auth/child-auth';
import {
  createChildSession,
  generateOpaqueToken,
  hashToken,
  CHILD_COOKIE_OPTIONS,
} from '@/lib/auth/session';
import { getParentSession } from '@/server/auth';
import { ChildLoginSchema } from '@/server/contracts/auth';
import { ERRORS } from '@/lib/api/errors';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { eq, or } from 'drizzle-orm';

// POST /api/auth/child-login
// Body: { childId, pin }
// SECURITY: requires active authenticated parent/guardian session cookie (DB-backed, fail-closed).
// Child must belong to parent's household. Returns: { child: { id, name } }
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // ── 1. Require DB-backed active parent session ────────────────────────────
    const parentSession = await getParentSession();
    if (!parentSession) {
      return ERRORS.parentSessionRequired();
    }

    // ── 2. Validate body ──────────────────────────────────────────────────────
    const body = await req.json();
    const parsed = ChildLoginSchema.safeParse(body);

    if (!parsed.success) {
      return ERRORS.validationFailed(parsed.error.flatten().fieldErrors as Record<string, string[]>);
    }

    const { childId, pin } = parsed.data;

    // ── 3. Look up child ──────────────────────────────────────────────────────
    const [child] = await db
      .select({
        id: children.id,
        displayName: children.displayName,
        pinHash: children.pinHash,
        householdId: children.householdId,
        isActive: children.isActive,
      })
      .from(children)
      .where(eq(children.id, childId))
      .limit(1);

    // Same error whether child doesn't exist or PIN is wrong — prevents enumeration
    if (!child || !child.isActive) {
      return ERRORS.invalidCredentials();
    }

    // ── 4. Verify child belongs to parent's household ─────────────────────────
    // Check: parent owns the household OR parent is a member
    const parentUserId = parentSession.sub;

    const [householdOwner] = await db
      .select({ id: households.id })
      .from(households)
      .where(eq(households.ownerId, parentUserId))
      .limit(1);

    const parentHouseholdId = householdOwner?.id;

    // Also check household_members in case parent is a non-owner guardian
    let authorizedHouseholdId = parentHouseholdId;
    if (!authorizedHouseholdId) {
      const [membership] = await db
        .select({ householdId: householdMembers.householdId })
        .from(householdMembers)
        .where(eq(householdMembers.userId, parentUserId))
        .limit(1);
      authorizedHouseholdId = membership?.householdId;
    }

    if (!authorizedHouseholdId || child.householdId !== authorizedHouseholdId) {
      // Return same INVALID_CREDENTIALS error to prevent cross-household child enumeration
      return ERRORS.invalidCredentials();
    }

    // ── 5. Verify PIN ─────────────────────────────────────────────────────────
    const valid = await verifyPin(pin, child.pinHash);
    if (!valid) {
      return ERRORS.invalidCredentials();
    }

    // ── 6. Issue child session ────────────────────────────────────────────────
    const opaqueToken = generateOpaqueToken();
    const tokenHash = hashToken(opaqueToken);
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);

    const [dbSession] = await db
      .insert(sessions)
      .values({
        actorType: 'child',
        childId: child.id,
        tokenHash,
        expiresAt,
      } as unknown as typeof sessions.$inferInsert)
      .returning({ id: sessions.id });

    if (!dbSession) {
      return ERRORS.internal('Failed to create session.');
    }

    const token = await createChildSession(child.id, child.householdId, opaqueToken);
    const cookieStore = await cookies();
    cookieStore.set(CHILD_COOKIE_OPTIONS.name, token, CHILD_COOKIE_OPTIONS);

    return NextResponse.json({
      child: {
        id: child.id,
        name: child.displayName,
      },
    });
  } catch (err) {
    console.error('[auth/child-login] Error:', err);
    return ERRORS.internal();
  }
}
