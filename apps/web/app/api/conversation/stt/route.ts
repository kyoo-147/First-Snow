import type { NextRequest } from "next/server";
import { apiError, readIdentitySession } from "../../../../src/server/identity-session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = readIdentitySession(request);

  if (!session) {
    return apiError(401, "authentication_error", "Parent session is required.");
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.includes("multipart/form-data")) {
    return apiError(400, "validation_error", "STT expects multipart/form-data with an audio field.");
  }

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || !process.env.GOOGLE_CLOUD_PROJECT_ID) {
    return apiError(503, "dependency_unavailable", "Google Speech-to-Text is not configured yet.");
  }

  return apiError(503, "dependency_unavailable", "Google Speech-to-Text adapter is pending implementation.");
}
