import { NextResponse } from 'next/server';
import { listPublishedLessons } from '@/server/learning';
import { ERRORS } from '@/lib/api/errors';

export async function GET() {
  try {
    const lessons = await listPublishedLessons();
    return NextResponse.json({ lessons });
  } catch (error) {
    console.error('[lessons/GET]', error);
    return ERRORS.internal();
  }
}
