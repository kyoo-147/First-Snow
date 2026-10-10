import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { getDiscordDiagnostics, getProviderDiagnostics } from '@/server/companion/contracts';
import { readTwilioConfig } from '@/server/safety/twilio';
import { readMailConfig } from '@/server/safety/email';

export const dynamic = 'force-dynamic';

// GET /api/health
// Truthful liveness/readiness probe: reports 200 only after a real database
// round-trip succeeds, and 503 when it does not. It never guesses "ok".
// Exposes redacted provider diagnostics indicating configured/unconfigured
// and provider/model identifiers, without ever leaking secret keys.
// Also exposes fail-closed discord_boundary status without inventing connectivity.
export async function GET(): Promise<NextResponse> {
  let databaseOk = false;
  try {
    await db.execute(sql`select 1`);
    databaseOk = true;
  } catch {
    databaseOk = false;
  }

  const aiProvider = await getProviderDiagnostics();
  const discordBoundary = getDiscordDiagnostics();
  const twilio = readTwilioConfig();
  const email = readMailConfig();
  const emergencyDelivery = twilio
    ? { configured: true, enabled: true, sms: true, voice: true, callback: 'configured' }
    : { configured: false, enabled: process.env.TWILIO_ENABLED === 'true', sms: false, voice: false, callback: 'unavailable' };

  return NextResponse.json(
    {
      status: databaseOk ? 'ok' : 'unavailable',
      checks: {
        database: databaseOk ? 'ok' : 'error',
        ai_provider: aiProvider,
        discord_boundary: discordBoundary,
        emergency_delivery: emergencyDelivery,
        email_delivery: { configured: Boolean(email), provider: email ? 'smtp' : 'none' },
      },
    },
    {
      status: databaseOk ? 200 : 503,
      headers: { 'cache-control': 'no-store' },
    },
  );
}
