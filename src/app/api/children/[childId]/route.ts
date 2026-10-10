import { and, eq, isNull } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db/client';
import { auditEvents, children, sessions } from '@/db/schema';
import { hashPin } from '@/lib/auth/child-auth';
import { ERRORS } from '@/lib/api/errors';
import { requireParentSession, getParentHousehold, assertChildBelongsToHousehold } from '@/server/auth';
import { UpdateChildSchema } from '@/server/contracts/auth';
import { childFields, presentChild } from '@/server/learning';

const uuid = z.string().uuid();

async function parentChild(childId: string) {
  const session = await requireParentSession();
  if (session instanceof Response) return { response: session };
  const household = await getParentHousehold(session.sub);
  if (!household) return { response: ERRORS.notFound('Household not found.') };
  const denied = await assertChildBelongsToHousehold(childId, household.id);
  if (denied) return { response: denied };
  const [child] = await db.select(childFields).from(children)
    .where(and(eq(children.id, childId), eq(children.householdId, household.id))).limit(1);
  if (!child) return { response: ERRORS.notFound('Child not found.') };
  return { session, household, child };
}

export async function GET(_request: Request, context: { params: Promise<{ childId: string }> }) {
  const { childId } = await context.params;
  if (!uuid.safeParse(childId).success) return ERRORS.validationFailed({ childId: 'Invalid child ID.' });
  try {
    const result = await parentChild(childId);
    return 'response' in result ? result.response : NextResponse.json({ child: presentChild(result.child) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[children/[childId]/GET]', error);
    return ERRORS.internal();
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ childId: string }> }) {
  const { childId } = await context.params;
  if (!uuid.safeParse(childId).success) return ERRORS.validationFailed({ childId: 'Invalid child ID.' });
  let body: unknown;
  try { body = await request.json(); } catch { return ERRORS.validationFailed({ body: 'Valid JSON is required.' }); }
  const parsed = UpdateChildSchema.safeParse(body);
  if (!parsed.success) return ERRORS.validationFailed(parsed.error.flatten().fieldErrors as Record<string, string[]>);
  try {
    const result = await parentChild(childId);
    if ('response' in result) return result.response;
    const data = parsed.data;

    if (data.pin) {
      await db.update(sessions).set({ revokedAt: new Date() }).where(and(eq(sessions.childId, childId), isNull(sessions.revokedAt)));
    }

    const newName = (data.name ?? data.displayName)?.trim();
    const [updated] = await db.update(children).set({
      ...(newName ? { displayName: newName } : {}),
      ...(data.age !== undefined ? { age: data.age } : {}),
      ...(data.grade !== undefined || data.gradeLevel !== undefined ? {
        gradeLevel: (() => {
          const g = (data.gradeLevel ?? data.grade)?.trim();
          return g && g.length > 0 ? g : null;
        })(),
      } : {}),
      ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
      ...(data.pin ? { pinHash: await hashPin(data.pin) } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      updatedAt: new Date(),
    } as Partial<typeof children.$inferInsert>).where(and(eq(children.id, childId), eq(children.householdId, result.household.id))).returning(childFields);
    if (!updated) return ERRORS.notFound('Child not found.');
    await db.insert(auditEvents).values({
      eventType: 'child.updated', actorId: result.session.sub, actorType: 'parent',
      resourceType: 'child', resourceId: childId,
      metadata: { fields: Object.keys(data).filter((key) => key !== 'pin') },
    } as typeof auditEvents.$inferInsert);
    return NextResponse.json({ child: presentChild(updated) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[children/[childId]/PATCH]', error);
    return ERRORS.internal();
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ childId: string }> }) {
  const { childId } = await context.params;
  if (!uuid.safeParse(childId).success) return ERRORS.validationFailed({ childId: 'Invalid child ID.' });
  try {
    const result = await parentChild(childId);
    if ('response' in result) return result.response;
    await db.update(sessions).set({ revokedAt: new Date() }).where(and(eq(sessions.childId, childId), isNull(sessions.revokedAt)));
    const [updated] = await db.update(children).set({ isActive: false, updatedAt: new Date() } as Partial<typeof children.$inferInsert>)
      .where(and(eq(children.id, childId), eq(children.householdId, result.household.id))).returning({ id: children.id });
    if (!updated) return ERRORS.notFound('Child not found.');
    await db.insert(auditEvents).values({ eventType: 'child.deactivated', actorId: result.session.sub, actorType: 'parent', resourceType: 'child', resourceId: childId } as typeof auditEvents.$inferInsert);
    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[children/[childId]/DELETE]', error);
    return ERRORS.internal();
  }
}
