import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { apiError, readIdentitySession } from "../../../src/server/identity-session";
import { createChild, listChildren, toChildResponse } from "../../../src/server/children-repository";
import { parseChildInput } from "../../../src/server/children-validation";
import { resolveParentProfile } from "../../../src/server/parent-profile";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = readIdentitySession(request);

  if (!session) {
    return apiError(401, "authentication_error", "Parent session is required.");
  }

  const parent = await resolveParentProfile(session);
  const children = await listChildren(parent.id);

  return NextResponse.json({ children: children.map(toChildResponse) });
}

export async function POST(request: NextRequest) {
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

  const parsed = parseChildInput(body);

  if (!parsed.ok) {
    return apiError(400, "validation_error", parsed.message);
  }

  const parent = await resolveParentProfile(session);
  const child = await createChild(parent.id, parsed.value);

  return NextResponse.json({ child: toChildResponse(child) }, { status: 201 });
}
