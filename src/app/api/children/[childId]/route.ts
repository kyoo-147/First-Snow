import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db/client';
import { auditEvents, children } from '@/db/schema';
import { hashPin } from '@/lib/auth/child-auth';
import { ERRORS } from '@/lib/api/errors';
import { requireParentSession, getParentHousehold } from '@/server/auth';
import { childFields, presentChild } from '@/server/learning';

const uuid = z.string().uuid();
const patchSchema = z.object({
  name: z.string().min(1).max(255).trim().optional(),
  displayName: z.string().min(1).max(255).trim().optional(),
  age: z.number().int().min(3).max(18).nullable().optional(),
  grade: z.string().max(50).nullable().optional(),
  gradeLevel: z.string().max(50).nullable().optional(),
  avatarUrl: z.string().url().max(1024).nullable().optional(),
  pin: z.string().length(4).regex(/^\d{4}$/).optional(),
  isActive: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, 'At least one field is required');

async function parentChild(childId: string) {
  const session = await requireParentSession();
  if (session instanceof Response) return { response: session };
  const household = await getParentHousehold(session.sub);
  if (!household) return { response: ERRORS.notFound('Household not found.') };
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
    return 'response' in result ? result.response : NextResponse.json({ child: presentChild(result.child) });
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
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return ERRORS.validationFailed(parsed.error.flatten().fieldErrors as Record<string, string[]>);
  try {
    const result = await parentChild(childId);
    if ('response' in result) return result.response;
    const data = parsed.data;
    const [updated] = await db.update(children).set({
      ...(data.name || data.displayName ? { displayName: data.name ?? data.displayName } : {}),
      ...(data.age !== undefined ? { age: data.age } : {}),
      ...(data.grade !== undefined || data.gradeLevel !== undefined ? { gradeLevel: data.gradeLevel ?? data.grade } : {}),
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
    return NextResponse.json({ child: presentChild(updated) });
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
    const [updated] = await db.update(children).set({ isActive: false, updatedAt: new Date() } as Partial<typeof children.$inferInsert>)
      .where(and(eq(children.id, childId), eq(children.householdId, result.household.id))).returning({ id: children.id });
    if (!updated) return ERRORS.notFound('Child not found.');
    await db.insert(auditEvents).values({ eventType: 'child.deactivated', actorId: result.session.sub, actorType: 'parent', resourceType: 'child', resourceId: childId } as typeof auditEvents.$inferInsert);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[children/[childId]/DELETE]', error);
    return ERRORS.internal();
  }
}
