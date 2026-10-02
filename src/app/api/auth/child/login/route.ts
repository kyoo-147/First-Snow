import { db } from '@/db/client';
import { children } from '@/db/schema';
import { verifyPin } from '@/lib/auth/child-auth';
import { createChildSession, CHILD_COOKIE_OPTIONS } from '@/lib/auth/session';
import { ChildLoginSchema } from '@/server/contracts/auth';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const parsed = ChildLoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }

    const { childId, pin } = parsed.data;

    const [child] = await db
      .select({
        id: children.id,
        pinHash: children.pinHash,
        householdId: children.householdId,
        isActive: children.isActive,
      })
      .from(children)
      .where(eq(children.id, childId))
      .limit(1);

    // Fail closed: use same error whether child doesn't exist or PIN is wrong
    // This prevents child ID enumeration attacks
    if (!child || !child.isActive) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await verifyPin(pin, child.pinHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await createChildSession(child.id, child.householdId);
    const cookieStore = await cookies();
    cookieStore.set(CHILD_COOKIE_OPTIONS.name, token, CHILD_COOKIE_OPTIONS);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[auth/child/login] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
