import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ERRORS } from '@/lib/api/errors';
import { authorizeChildLearning } from '@/server/learning-access';
import { getChildProgress } from '@/server/learning';

export async function GET(_request: Request, context: { params: Promise<{ childId: string }> }) {
  const { childId } = await context.params;
  if (!z.string().uuid().safeParse(childId).success) return ERRORS.validationFailed({ childId: 'Invalid child ID.' });
  const denied = await authorizeChildLearning(childId);
  if (denied) return denied;
  try { return NextResponse.json({ progress: await getChildProgress(childId) }); }
  catch (error) { console.error('[children/progress/GET]', error); return ERRORS.internal(); }
}
