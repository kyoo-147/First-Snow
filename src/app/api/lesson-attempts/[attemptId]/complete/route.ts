import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ERRORS } from '@/lib/api/errors';
import { requireChildSession } from '@/server/auth';
import { completeLessonAttempt } from '@/server/learning';

const uuid = z.string().uuid();

export async function POST(_request: Request, context: { params: Promise<{ attemptId: string }> }) {
  const session = await requireChildSession();
  if (session instanceof Response) return session;
  const { attemptId } = await context.params;
  if (!uuid.safeParse(attemptId).success) return ERRORS.validationFailed({ attemptId: 'Invalid attempt ID.' });
  try {
    const attempt = await completeLessonAttempt(session.sub, attemptId);
    return attempt ? NextResponse.json({ attempt }) : ERRORS.notFound('Attempt not found.');
  } catch (error: unknown) {
    if (error && typeof error === 'object' && ('code' in error || 'name' in error)) {
      const err = error as { code?: string; name?: string; message?: string };
      if (err.code === 'INCOMPLETE_ATTEMPT' || err.name === 'IncompleteLessonAttemptError') {
        return ERRORS.conflict(err.message || 'Cannot complete attempt: required steps remain unanswered.');
      }
    }
    console.error('[lesson-attempts/complete/POST]', error);
    return ERRORS.internal();
  }
}
