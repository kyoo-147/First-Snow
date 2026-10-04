import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ERRORS } from '@/lib/api/errors';
import { getChildSession } from '@/server/auth';
import { authorizeChildLearning } from '@/server/learning-access';
import { getChildRewards } from '@/server/learning';

// GET /api/rewards
// Returns the rewards earned by a child. A child session reads its own rewards
// when `childId` is omitted; parents must pass the `childId` they are entitled to.
export async function GET(request: Request) {
  let childId = new URL(request.url).searchParams.get('childId');

  if (childId) {
    if (!z.string().uuid().safeParse(childId).success) {
      return ERRORS.validationFailed({ childId: 'Invalid child ID.' });
    }
  } else {
    const childSession = await getChildSession();
    if (!childSession) return ERRORS.validationFailed({ childId: 'childId is required.' });
    childId = childSession.sub;
  }

  const denied = await authorizeChildLearning(childId);
  if (denied) return denied;

  try {
    return NextResponse.json({ rewards: await getChildRewards(childId) });
  } catch (error) {
    console.error('[rewards/GET]', error);
    return ERRORS.internal();
  }
}
