import type { NextRequest } from "next/server";
import { apiError, identityResponse, readIdentitySession } from "../../../../src/server/identity-session";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = readIdentitySession(request);

  if (!session) {
    return apiError(401, "authentication_error", "Parent session is missing or expired.");
  }

  return identityResponse(session);
}
