import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getOwnedSession, toSessionResponse } from "../../../../src/server/sessions-repository";
import { apiError, readIdentitySession } from "../../../../src/server/identity-session";
import { resolveParentProfile } from "../../../../src/server/parent-profile";

export const runtime = "nodejs";

type SessionContext = {
  params: Promise<{ sessionId: string }>;
};

export async function GET(request: NextRequest, context: SessionContext) {
  const session = readIdentitySession(request);

  if (!session) {
    return apiError(401, "authentication_error", "Parent session is required.");
  }

  const { sessionId } = await context.params;
  const parent = await resolveParentProfile(session);
  const record = await getOwnedSession(parent.id, sessionId);

  if (!record) {
    return apiError(404, "authorization_error", "Session was not found for this parent.");
  }

  return NextResponse.json({ session: toSessionResponse(record) });
}
