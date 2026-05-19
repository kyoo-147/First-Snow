import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { endSession, toSessionResponse } from "../../../../../src/server/sessions-repository";
import { apiError, readIdentitySession } from "../../../../../src/server/identity-session";
import { resolveParentProfile } from "../../../../../src/server/parent-profile";

export const runtime = "nodejs";

type SessionEndContext = {
  params: Promise<{ sessionId: string }>;
};

export async function PATCH(request: NextRequest, context: SessionEndContext) {
  const session = readIdentitySession(request);

  if (!session) {
    return apiError(401, "authentication_error", "Parent session is required.");
  }

  const body = await request.json().catch(() => null) as {
    status?: unknown;
    score?: unknown;
    aiNotes?: unknown;
  } | null;
  const status = body?.status;

  if (status !== "completed" && status !== "interrupted") {
    return apiError(400, "validation_error", "status must be completed or interrupted.");
  }

  const { sessionId } = await context.params;
  const parent = await resolveParentProfile(session);
  const record = await endSession(parent.id, sessionId, status, {
    score: typeof body?.score === "number" ? body.score : undefined,
    aiNotes: typeof body?.aiNotes === "string" ? body.aiNotes : undefined
  });

  if (!record) {
    return apiError(404, "authorization_error", "Session was not found for this parent.");
  }

  return NextResponse.json({ session: toSessionResponse(record) });
}
