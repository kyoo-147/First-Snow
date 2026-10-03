import { and, eq, isNull, ne } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db/client';
import { auditEvents, sessions, users } from '@/db/schema';
import { ERRORS } from '@/lib/api/errors';
import { hashPassword, verifyPassword } from '@/lib/auth/parent-auth';
import { hashToken, PARENT_COOKIE_NAME } from '@/lib/auth/session';
import { requireParentSession } from '@/server/auth';

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
}).strict().refine((data) => data.currentPassword !== data.newPassword, {
  path: ['newPassword'],
  message: 'New password must be different from the current password.',
});

export async function POST(request: Request): Promise<NextResponse> {
  const session = await requireParentSession();
  if (session instanceof Response) return session as NextResponse;

  try {
    const parsed = passwordSchema.safeParse(await request.json());
    if (!parsed.success) {
      return ERRORS.validationFailed(parsed.error.flatten().fieldErrors as Record<string, string[]>);
    }

    const [user] = await db
      .select({ passwordHash: users.passwordHash, isActive: users.isActive })
      .from(users)
      .where(eq(users.id, session.sub))
      .limit(1);

    if (!user?.isActive || !(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
      return NextResponse.json(
        { error: { code: 'INVALID_PASSWORD', message: 'Current password is incorrect.' } },
        { status: 403 },
      );
    }

    const newPasswordHash = await hashPassword(parsed.data.newPassword);
    const cookieStore = await cookies();
    const token = cookieStore.get(PARENT_COOKIE_NAME)?.value;
    if (!token || !session.sessionId) return ERRORS.unauthorized();
    const currentTokenHash = hashToken(session.sessionId);

    const revokedSessionIds = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(users)
        .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
        .where(and(eq(users.id, session.sub), eq(users.isActive, true)))
        .returning({ id: users.id });

      if (!updated) throw new Error('Authenticated user became unavailable.');

      const revoked = await tx
        .update(sessions)
        .set({ revokedAt: new Date() })
        .where(and(
          eq(sessions.userId, session.sub),
          isNull(sessions.revokedAt),
          ne(sessions.tokenHash, currentTokenHash),
        ))
        .returning({ id: sessions.id });

      await tx.insert(auditEvents).values({
        actorId: session.sub,
        actorType: session.role,
        eventType: 'account.password_changed',
        resourceType: 'user',
        resourceId: session.sub,
        metadata: { otherSessionsRevoked: revoked.length },
      } as typeof auditEvents.$inferInsert);

      return revoked;
    });

    return NextResponse.json({
      message: 'Password changed. Other signed-in sessions were revoked.',
      otherSessionsRevoked: revokedSessionIds.length,
    });
  } catch (error) {
    console.error('[account/password] Failed to change password:', error);
    return ERRORS.internal('Password could not be changed.');
  }
}
