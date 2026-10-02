import { db } from '@/db/client';
import { users, households, householdMembers, sessions } from '@/db/schema';
import { hashPassword } from '@/lib/auth/parent-auth';
import {
  createParentSession,
  generateOpaqueToken,
  hashToken,
  PARENT_COOKIE_OPTIONS,
} from '@/lib/auth/session';
import { RegisterParentSchema } from '@/server/contracts/auth';
import { ERRORS } from '@/lib/api/errors';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

// POST /api/auth/register
// Body: { name, email, password } or { displayName, email, password, householdName }
// Returns: { user: { id, email, name, role, householdId } }
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const parsed = RegisterParentSchema.safeParse(body);

    if (!parsed.success) {
      return ERRORS.validationFailed(parsed.error.flatten().fieldErrors as Record<string, string[]>);
    }

    const resolvedName = (parsed.data.name ?? parsed.data.displayName)!.trim();
    const { email, password, householdName } = parsed.data;

    // Check for duplicate email before hashing (fail fast)
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      return ERRORS.conflict('An account with this email already exists.');
    }

    const passwordHash = await hashPassword(password);

    const [user] = await db
      .insert(users)
      .values({
        email,
        displayName: resolvedName,
        passwordHash,
        role: 'parent',
      } as any)
      .returning({ id: users.id, role: users.role });

    if (!user) {
      return ERRORS.internal('Failed to create account.');
    }

    // Create household named "{resolvedName}'s Family" or provided householdName
    const [household] = await db
      .insert(households)
      .values({
        name: householdName?.trim() || `${resolvedName}'s Family`,
        ownerId: user.id,
      })
      .returning({ id: households.id });

    if (household) {
      await db
        .insert(householdMembers)
        .values({
          householdId: household.id,
          userId: user.id,
          role: 'owner',
        } as any)
        .onConflictDoNothing();
    }

    // DB-backed session: opaque token → hash at rest
    const opaqueToken = generateOpaqueToken();
    const tokenHash = hashToken(opaqueToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const [dbSession] = await db
      .insert(sessions)
      .values({
        actorType: 'parent',
        userId: user.id,
        tokenHash,
        expiresAt,
      } as any)
      .returning({ id: sessions.id });

    const sessionId = dbSession?.id ?? opaqueToken;

    // JWT in cookie contains sessionId for revocation lookup
    const token = await createParentSession(user.id, user.role, sessionId);
    const cookieStore = await cookies();
    cookieStore.set(PARENT_COOKIE_OPTIONS.name, token, PARENT_COOKIE_OPTIONS);

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email,
          name: resolvedName,
          displayName: resolvedName,
          role: user.role,
          householdId: household?.id,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error('[auth/register] Error:', err);
    return ERRORS.internal();
  }
}
