import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { buildFallbackMiaResponse, evaluateConversationRisk } from "../../../../src/server/conversation-policy";
import { createAlert, toAlertResponse } from "../../../../src/server/alerts-repository";
import { createMessage, listRecentMessages, toMessageResponse } from "../../../../src/server/messages-repository";
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
    childId?: unknown;
    message?: unknown;
    emotionHistory?: unknown;
  } | null;
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const emotionHistory = Array.isArray(body?.emotionHistory)
    ? body.emotionHistory.filter((event): event is { emotion: string; confidence: number } =>
      typeof event?.emotion === "string" && typeof event?.confidence === "number"
    )
    : [];

  if (!sessionId || !message) {
    return apiError(400, "validation_error", "sessionId and message are required.");
  }

  const parent = await resolveParentProfile(parentSession);
  const ownedSession = await getOwnedSession(parent.id, sessionId);

  if (!ownedSession) {
    return apiError(404, "authorization_error", "Session was not found for this parent.");
  }

  const userMessage = await createMessage(sessionId, "user", message);
  const response = buildFallbackMiaResponse(message);
  const assistantMessage = await createMessage(sessionId, "assistant", response);
  const recentMessages = await listRecentMessages(sessionId);
  const risk = evaluateConversationRisk(message, emotionHistory);
  const alert = risk.triggered
    ? await createAlert({
      sessionId,
      severity: risk.severity,
      triggerType: risk.triggerType,
      message: risk.message,
      emotionHistory,
      channels: risk.channels
    })
    : null;

  return NextResponse.json({
    response,
    emergencyFlag: risk.triggered && risk.severity === "critical",
    intent: risk.triggered ? "safety_check" : "practice_response",
    mode: "fallback",
    messages: [userMessage, assistantMessage].map(toMessageResponse),
    recentMessages: recentMessages.map(toMessageResponse),
    alert: alert ? toAlertResponse(alert) : null
  });
}
