// src/lib/companion-client.ts
// API client for Companion sessions, messages, transcripts, and alerts.
// No "use client" — works in both client components and test environments.

// ── Types ────────────────────────────────────────────────────────────────────

export type CompanionSession = {
  id: string;
  childId: string;
  createdAt: string;
  status: "active" | "closed";
};

export type CompanionMessage = {
  id: string;
  clientMessageId?: string;
  sessionId: string;
  role: "child" | "assistant";
  content: string;
  createdAt: string;
};

export type ApiAlert = {
  id: string;
  childId: string;
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
  createdAt: string;
  readAt: string | null;
  linkedSessionId?: string;
};

export type ApiTranscriptMessage = {
  id: string;
  sessionId: string;
  role: "child" | "assistant";
  content: string;
  createdAt: string;
};

export type CompanionChildSession = {
  id: string;
  name: string;
  householdId: string;
};

// ── Error class ──────────────────────────────────────────────────────────────

export class CompanionApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "CompanionApiError";
  }
}

// ── Internal helpers ─────────────────────────────────────────────────────────

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function extractMessage(body: unknown): string {
  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    // Nested: { error: { message: "..." } }
    if (b["error"] && typeof b["error"] === "object") {
      const err = b["error"] as Record<string, unknown>;
      if (typeof err["message"] === "string") return err["message"];
    }
    // Flat: { message: "..." }
    if (typeof b["message"] === "string") return b["message"];
    // Flat: { error: "..." }
    if (typeof b["error"] === "string") return b["error"];
  }
  return "Unknown error";
}

function extractCode(body: unknown): string | undefined {
  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>;
    if (b["error"] && typeof b["error"] === "object") {
      const err = b["error"] as Record<string, unknown>;
      if (typeof err["code"] === "string") return err["code"];
    }
    if (typeof b["code"] === "string") return b["code"];
  }
  return undefined;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await safeJson(res);
    throw new CompanionApiError(res.status, extractMessage(body), extractCode(body));
  }
  return (await res.json()) as T;
}

// ── API functions ────────────────────────────────────────────────────────────

/** POST /api/companion/sessions */
export function createSession(childId: string): Promise<CompanionSession> {
  return request<CompanionSession>("/api/companion/sessions", {
    method: "POST",
    body: JSON.stringify({ childId }),
  });
}

/** GET /api/companion/sessions/:id */
export function getSession(sessionId: string): Promise<CompanionSession> {
  return request<CompanionSession>(
    `/api/companion/sessions/${encodeURIComponent(sessionId)}`,
  );
}

/** POST /api/companion/sessions/:id/messages */
export function sendMessage(
  sessionId: string,
  clientMessageId: string,
  content: string,
): Promise<CompanionMessage> {
  return request<CompanionMessage>(
    `/api/companion/sessions/${encodeURIComponent(sessionId)}/messages`,
    {
      method: "POST",
      body: JSON.stringify({ clientMessageId, content }),
    },
  );
}

/** GET /api/companion/sessions/:id/messages?afterId=... */
export function getMessages(
  sessionId: string,
  afterId?: string,
): Promise<CompanionMessage[]> {
  const encodedSessionId = encodeURIComponent(sessionId);
  const url = afterId
    ? `/api/companion/sessions/${encodedSessionId}/messages?afterId=${encodeURIComponent(afterId)}`
    : `/api/companion/sessions/${encodedSessionId}/messages`;
  return request<CompanionMessage[]>(url);
}

/** GET /api/children/:childId/transcripts */
export async function getTranscripts(childId: string): Promise<ApiTranscriptMessage[]> {
  if (!childId || !childId.trim()) {
    throw new Error("childId is required to fetch transcripts");
  }
  const data = await request<ApiTranscriptMessage[] | { transcripts?: ApiTranscriptMessage[] }>(
    `/api/children/${encodeURIComponent(childId.trim())}/transcripts`,
  );
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.transcripts) ? data.transcripts : [];
}

/** GET /api/auth/session — resolve the authenticated child session, or null. */
export async function getChildSession(): Promise<CompanionChildSession | null> {
  let res: Response;
  try {
    res = await fetch("/api/auth/session", { credentials: "same-origin" });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const body = (await safeJson(res)) as
    | {
        session?: {
          actorType?: unknown;
          child?: { id?: unknown; name?: unknown; householdId?: unknown };
        } | null;
      }
    | null;
  const session = body?.session;
  const child = session?.child;
  if (session?.actorType !== "child" || !child || typeof child.id !== "string" || !child.id) {
    return null;
  }
  return {
    id: child.id,
    name: typeof child.name === "string" ? child.name : "",
    householdId: typeof child.householdId === "string" ? child.householdId : "",
  };
}

/** GET /api/alerts or /api/alerts?childId=... */
export async function getAlerts(childId?: string): Promise<ApiAlert[]> {
  const url = childId
    ? `/api/alerts?childId=${encodeURIComponent(childId.trim())}`
    : "/api/alerts";
  const data = await request<ApiAlert[] | { alerts?: ApiAlert[] }>(url);
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.alerts) ? data.alerts : [];
}

/** PATCH /api/alerts/:id */
export function markAlertRead(alertId: string): Promise<ApiAlert> {
  return request<ApiAlert>(`/api/alerts/${encodeURIComponent(alertId)}`, {
    method: "PATCH",
    body: JSON.stringify({ readAt: new Date().toISOString() }),
  });
}
