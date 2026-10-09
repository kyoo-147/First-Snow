import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { notifications } from '@/db/schema';
import { readTwilioConfig, validateTwilioSignature } from '@/server/safety/twilio';

const FAILURE_STATES = new Set(['failed', 'undelivered', 'canceled', 'busy', 'no-answer']);
const DELIVERED_STATES = new Set(['delivered', 'completed']);

export async function POST(request: Request) {
  const config = readTwilioConfig();
  if (!config) return NextResponse.json({ error: 'Provider unavailable.' }, { status: 503 });
  const raw = await request.text();
  const params = new URLSearchParams(raw);
  if (!validateTwilioSignature(config.statusCallbackUrl, params, request.headers.get('x-twilio-signature'), config.authToken)) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 403 });
  }
  const reference = params.get('MessageSid') || params.get('CallSid');
  const providerStatus = params.get('MessageStatus') || params.get('CallStatus');
  if (!reference || !providerStatus) return NextResponse.json({ error: 'Invalid callback.' }, { status: 400 });

  const status = DELIVERED_STATES.has(providerStatus)
    ? 'delivered'
    : FAILURE_STATES.has(providerStatus)
      ? 'failed'
      : 'sent';
  const [updated] = await db
    .update(notifications)
    .set({
      status,
      providerStatus,
      ...(status === 'delivered' ? { deliveredAt: new Date(), failureReason: null } : {}),
      ...(status === 'failed' ? { failureReason: `Twilio reported ${providerStatus}.` } : {}),
    } as Partial<typeof notifications.$inferInsert>)
    .where(eq(notifications.providerReference, reference))
    .returning({ id: notifications.id });
  if (!updated) return NextResponse.json({ error: 'Unknown provider reference.' }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
