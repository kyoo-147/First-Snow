export class DashboardApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "DashboardApiError";
  }
}

export type ParentSession = {
  actorType: "parent" | "admin";
  user: { id: string; email: string; name: string; role: string; householdId: string | null };
};

export type ChildSession = {
  actorType: "child";
  child: { id: string; name: string; householdId: string };
};

export type AuthSession = ParentSession | ChildSession;

export type DashboardChild = {
  id: string;
  name: string;
  displayName?: string;
  age: number | null;
  grade: string | null;
  gradeLevel?: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt?: string;
};

export type DashboardProgress = {
  childId: string;
  lessonsCompleted: number;
  totalLessons: number;
  practiceTimeMinutes: number;
};

export type DashboardAttempt = {
  id: string;
  childId: string;
  lessonId: string;
  lessonTitle: string;
  status: "not_started" | "in_progress" | "completed";
  score: number | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type DashboardRoutineStep = {
  id: string;
  title: string;
  durationMinutes: number;
  isCompleted: boolean;
};

export type DashboardRoutine = {
  id: string;
  childId: string;
  title: string;
  timeOfDay: "morning" | "afternoon" | "evening" | "anytime";
  scheduledTime: string | null;
  isActive: boolean;
  steps: DashboardRoutineStep[];
};

export type DashboardLesson = {
  id: string;
  title: string;
  subject: string;
  gradeLevel?: string | null;
  estimatedMinutes?: number | null;
  description?: string | null;
};

export type DashboardAlert = {
  id: string;
  childId: string;
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
  createdAt: string;
  readAt: string | null;
  linkedSessionId?: string;
};

export type CreateChildInput = {
  name: string;
  pin: string;
  age?: number | null;
  grade?: string | null;
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: "same-origin",
    ...init,
  });

  const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!response.ok) {
    const nested = body?.error && typeof body.error === "object" ? (body.error as Record<string, unknown>) : null;
    const message =
      typeof nested?.message === "string"
        ? nested.message
        : typeof body?.error === "string"
          ? body.error
          : typeof body?.message === "string"
            ? body.message
            : response.statusText || `Request failed with status ${response.status}`;
    throw new DashboardApiError(message, response.status, typeof nested?.code === "string" ? nested.code : undefined);
  }
  return body as T;
}

export async function fetchDashboardSession(): Promise<AuthSession | null> {
  const data = await request<{ session: AuthSession | null }>("/api/auth/session");
  return data.session ?? null;
}

export async function fetchHouseholdChildren(): Promise<DashboardChild[]> {
  const data = await request<{ children?: DashboardChild[] }>("/api/children");
  return Array.isArray(data.children) ? data.children : [];
}

export async function fetchDashboardProgress(childId: string): Promise<DashboardProgress> {
  const data = await request<{ progress: DashboardProgress }>(`/api/children/${encodeURIComponent(childId)}/progress`);
  return data.progress;
}

export async function fetchDashboardAttempts(childId: string): Promise<DashboardAttempt[]> {
  const data = await request<{ attempts?: DashboardAttempt[] }>(`/api/children/${encodeURIComponent(childId)}/attempts`);
  return Array.isArray(data.attempts) ? data.attempts : [];
}

export async function fetchDashboardRoutines(childId: string, date = localDateKey()): Promise<DashboardRoutine[]> {
  const data = await request<{ routines?: DashboardRoutine[] }>(
    `/api/children/${encodeURIComponent(childId)}/routines?date=${encodeURIComponent(date)}`,
  );
  return Array.isArray(data.routines) ? data.routines : [];
}

export async function fetchDashboardLessons(): Promise<DashboardLesson[]> {
  const data = await request<DashboardLesson[] | { lessons?: DashboardLesson[] }>("/api/lessons");
  if (Array.isArray(data)) return data;
  return Array.isArray(data.lessons) ? data.lessons : [];
}

export async function fetchDashboardAlerts(childId?: string): Promise<DashboardAlert[]> {
  const url = childId ? `/api/alerts?childId=${encodeURIComponent(childId)}` : "/api/alerts";
  const data = await request<DashboardAlert[] | { alerts?: DashboardAlert[] }>(url);
  if (Array.isArray(data)) return data;
  return Array.isArray(data.alerts) ? data.alerts : [];
}

export async function fetchDashboardAlert(alertId: string): Promise<DashboardAlert> {
  return request<DashboardAlert>(`/api/alerts/${encodeURIComponent(alertId)}`);
}

export async function markDashboardAlertRead(alertId: string): Promise<DashboardAlert> {
  return request<DashboardAlert>(`/api/alerts/${encodeURIComponent(alertId)}`, { method: "PATCH" });
}

export async function createHouseholdChild(input: CreateChildInput): Promise<DashboardChild> {
  const data = await request<{ child: DashboardChild }>("/api/children", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return data.child;
}

export function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong while loading this page.";
}
