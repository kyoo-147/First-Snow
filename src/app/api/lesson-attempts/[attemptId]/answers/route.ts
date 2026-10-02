import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ERRORS } from '@/lib/api/errors';
import { requireChildSession } from '@/server/auth';
import { saveLessonAnswer } from '@/server/learning';

const schema = z.object({ stepId: z.string().uuid(), answer: z.unknown() });
const uuid = z.string().uuid();

export async function PUT(request: Request, context: { params: Promise<{ attemptId: string }> }) {
  const session = await requireChildSession();
  if (session instanceof Response) return session;
  const { attemptId } = await context.params;
  if (!uuid.safeParse(attemptId).success) return ERRORS.validationFailed({ attemptId: 'Invalid attempt ID.' });
  let body: unknown;
  try { body = await request.json(); } catch { return ERRORS.validationFailed({ body: 'Valid JSON is required.' }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return ERRORS.validationFailed(parsed.error.flatten().fieldErrors as Record<string, string[]>);
  try {
    const attempt = await saveLessonAnswer(session.sub, attemptId, parsed.data.stepId, parsed.data.answer);
    return attempt ? NextResponse.json({ attempt }) : ERRORS.notFound('Attempt or lesson step not found.');
  } catch (error) {
    console.error('[lesson-attempts/answers/PUT]', error);
    return ERRORS.internal();
  }
}
