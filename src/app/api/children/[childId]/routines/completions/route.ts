import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ERRORS } from '@/lib/api/errors';
import { getChildSession } from '@/server/auth';
import { setRoutineStepCompletion } from '@/server/routines';

const schema = z.object({
  stepId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  completed: z.boolean(),
});

function dateIsValid(value: string): boolean {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export async function PUT(request: Request, context: { params: Promise<{ childId: string }> }) {
  const { childId } = await context.params;
  if (!z.string().uuid().safeParse(childId).success) return ERRORS.validationFailed({ childId: 'Invalid child ID.' });
  let body: unknown;
  try { body = await request.json(); } catch { return ERRORS.validationFailed({ body: 'Valid JSON is required.' }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success || !dateIsValid(parsed.data.date)) {
    return ERRORS.validationFailed(parsed.success ? { date: 'Date must be a valid YYYY-MM-DD value.' } : parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }
  try {
    const session = await getChildSession();
    if (!session) return ERRORS.unauthorized();
    if (session.sub !== childId) return ERRORS.forbidden('Child can only update own routines.');
    const result = await setRoutineStepCompletion(childId, parsed.data.stepId, parsed.data.date, parsed.data.completed);
    return result ? NextResponse.json({ completion: result }) : ERRORS.notFound('Active routine step not found.');
  } catch (error) {
    console.error('[children/routines/completions/PUT]', error);
    return ERRORS.internal();
  }
}
