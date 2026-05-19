import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createAlert, toAlertResponse } from "../../../../src/server/alerts-repository";
import { evaluateConversationRisk } from "../../../../src/server/conversation-policy";
import { getOwnedSession } from "../../../../src/server/sessions-repository";
import { apiError, readIdentitySession } from "../../../../src/server/identity-session";
import { resolveParentProfile } from "../../../../src/server/parent-profile";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const parentSession = readIdentitySession(request);

  if (!parentSession) {
    return apiError(401, "authentication_error", "Parent session is required.");
  }

  const body = await request.json().catch(() => null) as {
    sessionId?: unknown;
    message?: unknown;
    emotionHistory?: unknown;
  } | null;
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";
  const message = typeof body?.message === "string" ? body.message : "";
  const emotionHistory = Array.isArray(body?.emotionHistory)
    ? body.emotionHistory.filter((event): event is { emotion: string; confidence: number } =>
      typeof event?.emotion === "string" && typeof event?.confidence === "number"
    )
    : [];

  if (!sessionId) {
    return apiError(400, "validation_error", "sessionId is required.");
  }

  const parent = await resolveParentProfile(parentSession);
  const ownedSession = await getOwnedSession(parent.id, sessionId);

  if (!ownedSession) {
    return apiError(404, "authorization_error", "Session was not found for this parent.");
  }

  const risk = evaluateConversationRisk(message, emotionHistory);

  if (!risk.triggered) {
    return NextResponse.json({ triggered: false });
  }

  const alert = await createAlert({
    sessionId,
    severity: risk.severity,
    triggerType: risk.triggerType,
    message: risk.message,
    emotionHistory,
    channels: risk.channels
  });

  return NextResponse.json({
    triggered: true,
    severity: risk.severity,
    alert: toAlertResponse(alert)
  });
}
