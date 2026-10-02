import { db } from '@/db/client';
import { users } from '@/db/schema';
import { verifyPassword } from '@/lib/auth/parent-auth';
import { createParentSession, PARENT_COOKIE_OPTIONS } from '@/lib/auth/session';
import { LoginParentSchema } from '@/server/contracts/auth';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const parsed = LoginParentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }

    const { email, password } = parsed.data;

    const [user] = await db
      .select({
        id: users.id,
        role: users.role,
        passwordHash: users.passwordHash,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Fail closed: use the SAME error message whether user doesn't exist or password is wrong
    // This prevents user enumeration attacks
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await createParentSession(user.id, user.role);
    const cookieStore = await cookies();
    cookieStore.set(PARENT_COOKIE_OPTIONS.name, token, PARENT_COOKIE_OPTIONS);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[auth/parent/login] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
