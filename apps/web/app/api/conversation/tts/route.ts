import type { NextRequest } from "next/server";
import { apiError, readIdentitySession } from "../../../../src/server/identity-session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = readIdentitySession(request);

  if (!session) {
    return apiError(401, "authentication_error", "Parent session is required.");
  }

  const body = await request.json().catch(() => null) as { text?: unknown } | null;

  if (typeof body?.text !== "string" || body.text.trim().length === 0) {
    return apiError(400, "validation_error", "text is required.");
  }

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || !process.env.GOOGLE_CLOUD_PROJECT_ID) {
    return apiError(503, "dependency_unavailable", "Google Text-to-Speech is not configured yet.");
  }

  return apiError(503, "dependency_unavailable", "Google Text-to-Speech adapter is pending implementation.");
}
