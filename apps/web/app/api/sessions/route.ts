import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createSession, toSessionResponse } from "../../../src/server/sessions-repository";
import { apiError, readIdentitySession } from "../../../src/server/identity-session";
import { resolveParentProfile } from "../../../src/server/parent-profile";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = readIdentitySession(request);

  if (!session) {
    return apiError(401, "authentication_error", "Parent session is required.");
  }

  const body = await request.json().catch(() => null) as { childId?: unknown } | null;
  const childId = typeof body?.childId === "string" ? body.childId : "";

  if (!childId) {
    return apiError(400, "validation_error", "childId is required.");
  }

  const parent = await resolveParentProfile(session);
  const created = await createSession(parent.id, childId);

  if (!created) {
    return apiError(404, "authorization_error", "Child profile was not found for this parent.");
  }

  return NextResponse.json({ session: toSessionResponse(created) }, { status: 201 });
}
