import { CHILD_COOKIE_OPTIONS } from '@/lib/auth/session';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(): Promise<NextResponse> {
  const cookieStore = await cookies();
  cookieStore.delete(CHILD_COOKIE_OPTIONS.name);
  return NextResponse.json({ success: true });
}
