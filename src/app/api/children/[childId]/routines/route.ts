import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db/client';
import { children } from '@/db/schema';
import { ERRORS } from '@/lib/api/errors';
import { getChildSession, getParentSession, getParentHousehold, requireParentSession } from '@/server/auth';
import { createRoutine, deleteRoutine, listRoutines, updateRoutine, type RoutineInput } from '@/server/routines';

const uuid = z.string().uuid();
const stepSchema = z.object({
  title: z.string().trim().min(1).max(255),
  durationMinutes: z.number().int().min(1).max(240),
});
const routineSchema = z.object({
  title: z.string().trim().min(1).max(255),
  timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'anytime']),
  scheduledTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
  isActive: z.boolean().optional(),
  steps: z.array(stepSchema).max(30),
});
const patchSchema = routineSchema.partial().refine((value) => Object.keys(value).length > 0);

function dateIsValid(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function todayInSaigon(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

async function parentOwnedChild(childId: string) {
  const session = await requireParentSession();
  if (session instanceof Response) return session;
  const household = await getParentHousehold(session.sub);
  if (!household) return ERRORS.notFound('Household not found.');
  const [child] = await db.select({ id: children.id }).from(children)
    .where(and(eq(children.id, childId), eq(children.householdId, household.id))).limit(1);
  if (!child) return ERRORS.notFound('Child not found.');
  return { session, householdId: household.id };
}

export async function GET(request: Request, context: { params: Promise<{ childId: string }> }) {
  const { childId } = await context.params;
  if (!uuid.safeParse(childId).success) return ERRORS.validationFailed({ childId: 'Invalid child ID.' });
  const date = new URL(request.url).searchParams.get('date') ?? todayInSaigon();
  if (!dateIsValid(date)) return ERRORS.validationFailed({ date: 'Date must be a valid YYYY-MM-DD value.' });
  try {
    const childSession = await getChildSession();
    if (childSession) {
      if (childSession.sub !== childId) return ERRORS.forbidden('Child can only access own routines.');
      return NextResponse.json({ routines: await listRoutines(childId, date, true), date });
    }
    const parent = await getParentSession();
    if (!parent) return ERRORS.unauthorized();
    const access = await parentOwnedChild(childId);
    if (access instanceof Response) return access;
    return NextResponse.json({ routines: await listRoutines(childId, date), date });
  } catch (error) {
    console.error('[children/routines/GET]', error);
    return ERRORS.internal();
  }
}

export async function POST(request: Request, context: { params: Promise<{ childId: string }> }) {
  const { childId } = await context.params;
  if (!uuid.safeParse(childId).success) return ERRORS.validationFailed({ childId: 'Invalid child ID.' });
  let body: unknown;
  try { body = await request.json(); } catch { return ERRORS.validationFailed({ body: 'Valid JSON is required.' }); }
  const parsed = routineSchema.safeParse(body);
  if (!parsed.success) return ERRORS.validationFailed(parsed.error.flatten().fieldErrors as Record<string, string[]>);
  try {
    const access = await parentOwnedChild(childId);
    if (access instanceof Response) return access;
    const routineId = await createRoutine(childId, access.session.sub, parsed.data as RoutineInput);
    return NextResponse.json({ routineId }, { status: 201 });
  } catch (error) {
    console.error('[children/routines/POST]', error);
    return ERRORS.internal();
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ childId: string }> }) {
  const { childId } = await context.params;
  if (!uuid.safeParse(childId).success) return ERRORS.validationFailed({ childId: 'Invalid child ID.' });
  let body: unknown;
  try { body = await request.json(); } catch { return ERRORS.validationFailed({ body: 'Valid JSON is required.' }); }
  const bodySchema = z.object({ routineId: uuid, patch: patchSchema });
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return ERRORS.validationFailed(parsed.error.flatten().fieldErrors as Record<string, string[]>);
  try {
    const access = await parentOwnedChild(childId);
    if (access instanceof Response) return access;
    const updated = await updateRoutine(childId, parsed.data.routineId, access.session.sub, parsed.data.patch as Partial<RoutineInput>);
    return updated ? NextResponse.json({ success: true }) : ERRORS.notFound('Routine not found.');
  } catch (error) {
    console.error('[children/routines/PATCH]', error);
    return ERRORS.internal();
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ childId: string }> }) {
  const { childId } = await context.params;
  if (!uuid.safeParse(childId).success) return ERRORS.validationFailed({ childId: 'Invalid child ID.' });
  const routineId = new URL(request.url).searchParams.get('routineId');
  if (!routineId || !uuid.safeParse(routineId).success) return ERRORS.validationFailed({ routineId: 'A valid routineId is required.' });
  try {
    const access = await parentOwnedChild(childId);
    if (access instanceof Response) return access;
    const deleted = await deleteRoutine(childId, routineId, access.session.sub);
    return deleted ? NextResponse.json({ success: true }) : ERRORS.notFound('Routine not found.');
  } catch (error) {
    console.error('[children/routines/DELETE]', error);
    return ERRORS.internal();
  }
}
