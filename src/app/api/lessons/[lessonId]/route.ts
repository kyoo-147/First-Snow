import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ERRORS } from '@/lib/api/errors';
import { getPublishedLesson } from '@/server/learning';

const uuid = z.string().uuid();

export async function GET(_request: Request, context: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await context.params;
  if (!uuid.safeParse(lessonId).success) return ERRORS.validationFailed({ lessonId: 'Invalid lesson ID.' });
  try {
    const lesson = await getPublishedLesson(lessonId);
    return lesson ? NextResponse.json({ lesson }) : ERRORS.notFound('Lesson not found.');
  } catch (error) {
    console.error('[lessons/[lessonId]/GET]', error);
    return ERRORS.internal();
  }
}
