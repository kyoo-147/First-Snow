import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getOwnedChild, toChildResponse, updateChild } from "../../../../src/server/children-repository";
import { parseChildInput } from "../../../../src/server/children-validation";
import { apiError, readIdentitySession } from "../../../../src/server/identity-session";
import { resolveParentProfile } from "../../../../src/server/parent-profile";

export const runtime = "nodejs";

type ChildRouteContext = {
  params: Promise<{
    childId: string;
  }>;
};

export async function GET(request: NextRequest, context: ChildRouteContext) {
  const session = readIdentitySession(request);

  if (!session) {
    return apiError(401, "authentication_error", "Parent session is required.");
  }

  const { childId } = await context.params;
  const parent = await resolveParentProfile(session);
  const child = await getOwnedChild(parent.id, childId);

  if (!child) {
    return apiError(404, "authorization_error", "Child profile was not found for this parent.");
  }

  return NextResponse.json({ child: toChildResponse(child) });
}

export async function PATCH(request: NextRequest, context: ChildRouteContext) {
  const session = readIdentitySession(request);

  if (!session) {
    return apiError(401, "authentication_error", "Parent session is required.");
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError(400, "validation_error", "Request body must be valid JSON.");
  }

  const parsed = parseChildInput(body, true);

  if (!parsed.ok) {
    return apiError(400, "validation_error", parsed.message);
  }

  const { childId } = await context.params;
  const parent = await resolveParentProfile(session);
  const child = await updateChild(parent.id, childId, parsed.value);

  if (!child) {
    return apiError(404, "authorization_error", "Child profile was not found for this parent.");
  }

  return NextResponse.json({ child: toChildResponse(child) });
}
