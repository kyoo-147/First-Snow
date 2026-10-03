import { NextResponse } from 'next/server';
import { listPublishedLessons } from '@/server/learning';
import { ERRORS } from '@/lib/api/errors';
import { authorizeLessonCatalog } from '@/server/learning-access';

export async function GET() {
  const denied = await authorizeLessonCatalog();
  if (denied) return denied;
  try {
    const lessons = await listPublishedLessons();
    return NextResponse.json({ lessons });
  } catch (error) {
    console.error('[lessons/GET]', error);
    return ERRORS.internal();
  }
}
