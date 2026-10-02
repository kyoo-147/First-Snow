import { db } from '@/db/client';
import { users, households } from '@/db/schema';
import { hashPassword } from '@/lib/auth/parent-auth';
import { createParentSession, PARENT_COOKIE_OPTIONS } from '@/lib/auth/session';
import { RegisterParentSchema } from '@/server/contracts/auth';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const parsed = RegisterParentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { email, password, displayName, householdName } = parsed.data;

    // Check for duplicate email (fail early, before hashing)
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);

    const [user] = await db
      .insert(users)
      .values({
        email,
        displayName,
        passwordHash,
        role: 'parent',
      })
      .returning({ id: users.id, role: users.role });

    if (!user) {
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 },
      );
    }

    await db.insert(households).values({
      name: householdName,
      ownerId: user.id,
    });

    const token = await createParentSession(user.id, user.role);
    const cookieStore = await cookies();
    cookieStore.set(PARENT_COOKIE_OPTIONS.name, token, PARENT_COOKIE_OPTIONS);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error('[auth/parent/register] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
