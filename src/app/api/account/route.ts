import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db/client';
import { auditEvents, householdMembers, households, users } from '@/db/schema';
import { ERRORS } from '@/lib/api/errors';
import { requireParentSession } from '@/server/auth';

const updateProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(100),
}).strict();

async function householdForUser(userId: string) {
  const [owned] = await db
    .select({ id: households.id, name: households.name, role: householdMembers.role })
    .from(households)
    .leftJoin(
      householdMembers,
      and(eq(householdMembers.householdId, households.id), eq(householdMembers.userId, userId)),
    )
    .where(eq(households.ownerId, userId))
    .limit(1);

  if (owned) return { id: owned.id, name: owned.name, role: 'owner' as const };

  const [membership] = await db
    .select({ id: households.id, name: households.name, role: householdMembers.role })
    .from(householdMembers)
    .innerJoin(households, eq(householdMembers.householdId, households.id))
    .where(eq(householdMembers.userId, userId))
    .limit(1);

  return membership ?? null;
}

export async function GET(): Promise<NextResponse> {
  const session = await requireParentSession();
  if (session instanceof Response) return session as NextResponse;

  try {
    const [user, household] = await Promise.all([
      db
        .select({
          id: users.id,
          email: users.email,
          displayName: users.displayName,
          role: users.role,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(and(eq(users.id, session.sub), eq(users.isActive, true)))
        .limit(1)
        .then((rows) => rows[0]),
      householdForUser(session.sub),
    ]);

    if (!user) return ERRORS.unauthorized();
    if (!household) return ERRORS.notFound('Household not found.');

    return NextResponse.json({
      account: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        household,
      },
      capabilities: {
        emailChange: false,
        emailVerification: false,
        mfa: false,
        sessionManagement: true,
      },
    });
  } catch (error) {
    console.error('[account] Failed to read account:', error);
    return ERRORS.internal('Account details are temporarily unavailable.');
  }
}

export async function PATCH(request: Request): Promise<NextResponse> {
  const session = await requireParentSession();
  if (session instanceof Response) return session as NextResponse;

  try {
    const parsed = updateProfileSchema.safeParse(await request.json());
    if (!parsed.success) {
      return ERRORS.validationFailed(parsed.error.flatten().fieldErrors as Record<string, string[]>);
    }

    const account = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(users)
        .set({ displayName: parsed.data.displayName, updatedAt: new Date() })
        .where(and(eq(users.id, session.sub), eq(users.isActive, true)))
        .returning({
          id: users.id,
          email: users.email,
          displayName: users.displayName,
          role: users.role,
          createdAt: users.createdAt,
        });

      if (!updated) return null;

      await tx.insert(auditEvents).values({
        actorId: session.sub,
        actorType: session.role,
        eventType: 'account.profile_updated',
        resourceType: 'user',
        resourceId: session.sub,
        metadata: { changedFields: ['displayName'] },
      } as typeof auditEvents.$inferInsert);

      return updated;
    });

    if (!account) return ERRORS.unauthorized();
    const household = await householdForUser(session.sub);
    if (!household) return ERRORS.notFound('Household not found.');

    return NextResponse.json({
      account: {
        ...account,
        createdAt: account.createdAt.toISOString(),
        household,
      },
      message: 'Profile details saved.',
    });
  } catch (error) {
    console.error('[account] Failed to update account:', error);
    return ERRORS.internal('Profile changes could not be saved.');
  }
}
