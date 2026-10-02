import { db } from '@/db/client';
import { users, sessions } from '@/db/schema';
import { verifyPassword } from '@/lib/auth/parent-auth';
import {
  createParentSession,
  generateOpaqueToken,
  hashToken,
  PARENT_COOKIE_OPTIONS,
} from '@/lib/auth/session';
import { LoginParentSchema } from '@/server/contracts/auth';
import { ERRORS } from '@/lib/api/errors';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

// POST /api/auth/login
// Body: { email, password }
// Returns: { user: { id, email, name, role } }
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const parsed = LoginParentSchema.safeParse(body);

    if (!parsed.success) {
      return ERRORS.validationFailed();
    }

    const { email, password } = parsed.data;

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        role: users.role,
        passwordHash: users.passwordHash,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Same error whether user doesn't exist or password is wrong — prevents enumeration
    if (!user || !user.isActive) {
      return ERRORS.invalidCredentials();
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return ERRORS.invalidCredentials();
    }

    // DB-backed session
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

    const token = await createParentSession(user.id, user.role, sessionId);
    const cookieStore = await cookies();
    cookieStore.set(PARENT_COOKIE_OPTIONS.name, token, PARENT_COOKIE_OPTIONS);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.displayName,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('[auth/login] Error:', err);
    return ERRORS.internal();
  }
}
