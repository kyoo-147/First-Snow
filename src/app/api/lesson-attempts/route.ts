import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ERRORS } from '@/lib/api/errors';
import { requireChildSession } from '@/server/auth';
import { createOrResumeLessonAttempt } from '@/server/learning';

const schema = z.object({ lessonId: z.string().uuid() });

export async function POST(request: Request) {
  const session = await requireChildSession();
  if (session instanceof Response) return session;
  let body: unknown;
  try { body = await request.json(); } catch { return ERRORS.validationFailed({ body: 'Valid JSON is required.' }); }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return ERRORS.validationFailed(parsed.error.flatten().fieldErrors as Record<string, string[]>);
  try {
    const attempt = await createOrResumeLessonAttempt(session.sub, parsed.data.lessonId);
    return attempt ? NextResponse.json({ attempt }, { status: 201 }) : ERRORS.notFound('Lesson not found.');
  } catch (error) {
    console.error('[lesson-attempts/POST]', error);
    return ERRORS.internal();
  }
}
