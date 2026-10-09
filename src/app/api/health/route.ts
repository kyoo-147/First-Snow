import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { getProviderDiagnostics } from '@/server/companion/contracts';

export const dynamic = 'force-dynamic';

// GET /api/health
// Truthful liveness/readiness probe: reports 200 only after a real database
// round-trip succeeds, and 503 when it does not. It never guesses "ok".
// Exposes redacted provider diagnostics indicating configured/unconfigured
// and provider/model identifiers, without ever leaking secret keys.
export async function GET(): Promise<NextResponse> {
  let databaseOk = false;
  try {
    await db.execute(sql`select 1`);
    databaseOk = true;
  } catch {
    databaseOk = false;
  }

  const aiProvider = await getProviderDiagnostics();

  return NextResponse.json(
    {
      status: databaseOk ? 'ok' : 'unavailable',
      checks: {
        database: databaseOk ? 'ok' : 'error',
        ai_provider: aiProvider,
      },
    },
    {
      status: databaseOk ? 200 : 503,
      headers: { 'cache-control': 'no-store' },
    },
  );
}
