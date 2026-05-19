import type { NextRequest } from "next/server";
import { apiError, identityResponse, readIdentitySession } from "../../../../src/server/identity-session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = readIdentitySession(request);

  if (!session) {
    return apiError(401, "authentication_error", "Parent session is required before consent can be saved.");
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError(400, "validation_error", "Request body must be valid JSON.");
  }

  const payload = body as {
    media?: unknown;
    alerts?: unknown;
    dataRetention?: unknown;
  };

  if (
    typeof payload.media !== "boolean" ||
    typeof payload.alerts !== "boolean" ||
    typeof payload.dataRetention !== "boolean"
  ) {
    return apiError(400, "validation_error", "Consent fields media, alerts, and dataRetention must be boolean.");
  }

  return identityResponse({
    ...session,
    consent: {
      media: payload.media,
      alerts: payload.alerts,
      dataRetention: payload.dataRetention,
      acceptedAt: new Date().toISOString()
    }
  });
}
