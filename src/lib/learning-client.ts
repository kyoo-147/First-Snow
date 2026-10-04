/**
 * Production API Client for AgentKid Snow P1 Learning Flows.
 * Connects directly to backend API routes without local/mock fallbacks.
 */

export class LearningApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  requestId?: string;

  constructor(
    message: string,
    status: number,
    options?: { code?: string; details?: unknown; requestId?: string } | unknown
  ) {
    super(message);
    this.name = "LearningApiError";
    this.status = status;

    if (
      options &&
      typeof options === "object" &&
      ("code" in options || "details" in options || "requestId" in options)
    ) {
      const opts = options as { code?: string; details?: unknown; requestId?: string };
      this.code = opts.code;
      this.details = opts.details;
      this.requestId = opts.requestId;
    } else {
      this.details = options;
    }
  }
}

export function parseApiError(
  data: unknown,
  status: number,
  statusText?: string
): LearningApiError {
  let errorMsg: string | undefined;
  let code: string | undefined;
  let details: unknown | undefined;
  let requestId: string | undefined;

  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;

    // Case 1: Nested error contract { error: { code, message, details, requestId } }
    if (obj.error && typeof obj.error === "object" && !Array.isArray(obj.error)) {
      const nested = obj.error as Record<string, unknown>;
      if (typeof nested.message === "string") errorMsg = nested.message;
      if (typeof nested.code === "string") code = nested.code;
      if (nested.details !== undefined) details = nested.details;
      if (typeof nested.requestId === "string") requestId = nested.requestId;
    } else if (typeof obj.error === "string") {
      // Case 2: Simple string error { error: "..." }
      errorMsg = obj.error;
    }

    // Case 3: Simple message { message: "..." }
    if (!errorMsg && typeof obj.message === "string") {
      errorMsg = obj.message;
    }

    if (!code && typeof obj.code === "string") {
      code = obj.code;
    }
    if (details === undefined && obj.details !== undefined) {
      details = obj.details;
    }
    if (!requestId && typeof obj.requestId === "string") {
      requestId = obj.requestId;
    }
  }

  if (!errorMsg) {
    errorMsg = statusText || `Request failed with status ${status}`;
  }

  return new LearningApiError(errorMsg, status, { code, details, requestId });
}

export interface LessonSummary {
  id: string;
  title: string;
  subject: string;
  gradeLevel?: string | null;
  estimatedMinutes?: number;
  subtitle?: string;
  description?: string | null;
  rating?: string;
  image?: string;
  accent?: "primary" | "aqua" | "peach" | "pink" | "ice";
  progress?: number;
  status?: "not_started" | "in_progress" | "completed";
  bestScore?: number | null;
  isPublished?: boolean;
}

export interface LessonStepOption {
  id: string;
  label: string;
  helper?: string;
  tone?: string;
  icon?: string;
}

export interface LessonStep {
  id: string;
  title: string;
  prompt?: string;
  instruction?: string;
  helper?: string;
  image?: string;
  options?: LessonStepOption[];
  correctAnswer?: string;
  audioUrl?: string;
}

export interface LessonDetail {
  id: string;
  title: string;
  subject: string;
  gradeLevel?: string | null;
  estimatedMinutes?: number;
  subtitle?: string;
  description?: string | null;
  accent?: "primary" | "aqua" | "peach" | "pink" | "ice";
  image?: string;
  rating?: string;
  content?: string | { steps?: LessonStep[]; [key: string]: unknown } | null;
  steps: LessonStep[];
  isPublished?: boolean;
}

export interface LessonAttempt {
  id: string;
  childId: string;
  lessonId: string;
  status: "not_started" | "in_progress" | "completed";
  score?: number | null;
  answers?: Record<string, unknown> | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ChildProgressSkill {
  label: string;
  value: number;
  note?: string;
}

export interface ChildProgress {
  childId: string;
  practiceTimeMinutes?: number;
  lessonsCompleted?: number;
  totalLessons?: number;
  comfortPattern?: string;
  nextFocus?: string;
  skills?: ChildProgressSkill[];
}

export interface ChildAttemptSummary {
  id: string;
  childId?: string;
  lessonId: string;
  lessonTitle?: string;
  lessonSubtitle?: string;
  status: "not_started" | "in_progress" | "completed";
  score?: number | null;
  startedAt?: string | null;
  completedAt?: string | null;
  answers?: Record<string, unknown> | null;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    credentials: "same-origin",
  });

  if (!res.ok) {
    let errorData: unknown = null;
    try {
      errorData = await res.json();
    } catch {
      errorData = null;
    }
    throw parseApiError(errorData, res.status, res.statusText);
  }

  return (await res.json()) as T;
}

function normalizeOption(raw: unknown): LessonStepOption | null {
  if (!raw || typeof raw !== "object") return null;
  const opt = raw as Record<string, unknown>;
  if (typeof opt.id !== "string" || !opt.id.trim()) return null;
  if (typeof opt.label !== "string" || !opt.label.trim()) return null;

  return {
    id: opt.id.trim(),
    label: opt.label.trim(),
    ...(typeof opt.helper === "string" ? { helper: opt.helper } : {}),
    ...(typeof opt.tone === "string" ? { tone: opt.tone } : {}),
    ...(typeof opt.icon === "string" ? { icon: opt.icon } : {}),
  };
}

function normalizeStep(raw: unknown, index: number): LessonStep | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Record<string, unknown>;
  const id =
    typeof s.id === "string" && s.id.trim()
      ? s.id.trim()
      : typeof s.stepId === "string" && s.stepId.trim()
        ? s.stepId.trim()
        : null;
  if (!id) return null;

  const title =
    typeof s.title === "string" && s.title.trim()
      ? s.title.trim()
      : `Step ${index + 1}`;

  let options: LessonStepOption[] | undefined = undefined;
  if (Array.isArray(s.options)) {
    const validOptions: LessonStepOption[] = [];
    for (const rawOpt of s.options) {
      const opt = normalizeOption(rawOpt);
      if (opt) validOptions.push(opt);
    }
    options = validOptions;
  }

  return {
    id,
    title,
    ...(typeof s.prompt === "string" ? { prompt: s.prompt } : {}),
    ...(typeof s.instruction === "string" ? { instruction: s.instruction } : {}),
    ...(typeof s.helper === "string" ? { helper: s.helper } : {}),
    ...(typeof s.image === "string" ? { image: s.image } : {}),
    ...(typeof s.correctAnswer === "string" ? { correctAnswer: s.correctAnswer } : {}),
    ...(typeof s.audioUrl === "string" ? { audioUrl: s.audioUrl } : {}),
    ...(options !== undefined ? { options } : {}),
  };
}

/**
 * Normalizes content string or object into an array of LessonStep.
 * Never invents steps or options when server content is absent or malformed.
 */
export function normalizeLessonSteps(lesson?: Partial<LessonDetail> | null): LessonStep[] {
  if (!lesson || typeof lesson !== "object") {
    return [];
  }

  if (Array.isArray(lesson.steps)) {
    const validSteps = lesson.steps
      .map((st, i) => normalizeStep(st, i))
      .filter((st): st is LessonStep => st !== null);
    if (validSteps.length > 0) {
      return validSteps;
    }
    return [];
  }

  if (lesson.content) {
    if (
      typeof lesson.content === "object" &&
      lesson.content !== null &&
      Array.isArray((lesson.content as Record<string, unknown>).steps)
    ) {
      const rawSteps = (lesson.content as { steps: unknown[] }).steps;
      return rawSteps
        .map((st, i) => normalizeStep(st, i))
        .filter((st): st is LessonStep => st !== null);
    }

    if (typeof lesson.content === "string") {
      try {
        const parsed = JSON.parse(lesson.content);
        if (Array.isArray(parsed)) {
          return parsed
            .map((st, i) => normalizeStep(st, i))
            .filter((st): st is LessonStep => st !== null);
        }
        if (
          parsed &&
          typeof parsed === "object" &&
          Array.isArray((parsed as Record<string, unknown>).steps)
        ) {
          const rawSteps = (parsed as { steps: unknown[] }).steps;
          return rawSteps
            .map((st, i) => normalizeStep(st, i))
            .filter((st): st is LessonStep => st !== null);
        }
      } catch {
        // Plain text content or invalid JSON: never invent interactive steps
        return [];
      }
    }
  }

  return [];
}

/**
 * Fetch all lessons.
 * GET /api/lessons
 */
export async function fetchLessons(): Promise<LessonSummary[]> {
  const data = await request<LessonSummary[] | { lessons: LessonSummary[] }>("/api/lessons");
  if (Array.isArray(data)) {
    return data;
  }
  if (data && typeof data === "object" && Array.isArray(data.lessons)) {
    return data.lessons;
  }
  return [];
}

/**
 * Fetch a single lesson by ID.
 * GET /api/lessons/:lessonId
 */
export async function fetchLesson(lessonId: string): Promise<LessonDetail> {
  if (!lessonId) {
    throw new LearningApiError("lessonId is required", 400);
  }
  const data = await request<LessonDetail | { lesson: LessonDetail }>(`/api/lessons/${encodeURIComponent(lessonId)}`);
  const raw = (data && typeof data === "object" && "lesson" in data ? data.lesson : data) as LessonDetail;

  return {
    ...raw,
    steps: normalizeLessonSteps(raw),
  };
}

/**
 * Start or resume a lesson attempt.
 * POST /api/lesson-attempts { lessonId }
 */
export async function createOrResumeAttempt(lessonId: string): Promise<LessonAttempt> {
  if (!lessonId) {
    throw new LearningApiError("lessonId is required", 400);
  }
  const data = await request<LessonAttempt | { attempt: LessonAttempt }>("/api/lesson-attempts", {
    method: "POST",
    body: JSON.stringify({ lessonId }),
  });

  return (data && typeof data === "object" && "attempt" in data ? data.attempt : data) as LessonAttempt;
}

/**
 * Autosave an answer for a step in an ongoing attempt.
 * PUT /api/lesson-attempts/:attemptId/answers { stepId, answer }
 */
export async function saveAttemptAnswer(
  attemptId: string,
  stepId: string,
  answer: unknown
): Promise<LessonAttempt> {
  if (!attemptId) {
    throw new LearningApiError("attemptId is required", 400);
  }
  if (!stepId) {
    throw new LearningApiError("stepId is required", 400);
  }
  const data = await request<LessonAttempt | { attempt: LessonAttempt }>(
    `/api/lesson-attempts/${encodeURIComponent(attemptId)}/answers`,
    {
      method: "PUT",
      body: JSON.stringify({ stepId, answer }),
    }
  );

  return (data && typeof data === "object" && "attempt" in data ? data.attempt : data) as LessonAttempt;
}

/**
 * Mark a lesson attempt as completed.
 * POST /api/lesson-attempts/:attemptId/complete
 */
export async function completeAttempt(attemptId: string): Promise<LessonAttempt> {
  if (!attemptId) {
    throw new LearningApiError("attemptId is required", 400);
  }
  const data = await request<LessonAttempt | { attempt: LessonAttempt }>(
    `/api/lesson-attempts/${encodeURIComponent(attemptId)}/complete`,
    {
      method: "POST",
      body: JSON.stringify({}),
    }
  );

  return (data && typeof data === "object" && "attempt" in data ? data.attempt : data) as LessonAttempt;
}

/**
 * Fetch child learning progress summary.
 * GET /api/children/:childId/progress
 */
export async function fetchChildProgress(childId: string): Promise<ChildProgress> {
  if (!childId) {
    throw new LearningApiError("childId is required", 400);
  }
  const data = await request<ChildProgress | { progress: ChildProgress }>(
    `/api/children/${encodeURIComponent(childId)}/progress`
  );

  return (data && typeof data === "object" && "progress" in data ? data.progress : data) as ChildProgress;
}

/**
 * Fetch child recent lesson attempts.
 * GET /api/children/:childId/attempts
 */
export async function fetchChildAttempts(childId: string): Promise<ChildAttemptSummary[]> {
  if (!childId) {
    throw new LearningApiError("childId is required", 400);
  }
  const data = await request<ChildAttemptSummary[] | { attempts: ChildAttemptSummary[] }>(
    `/api/children/${encodeURIComponent(childId)}/attempts`
  );

  if (Array.isArray(data)) {
    return data;
  }
  if (data && typeof data === "object" && Array.isArray(data.attempts)) {
    return data.attempts;
  }
  return [];
}

export type RewardType = "star" | "badge" | "streak" | "milestone";

export interface ChildReward {
  id: string;
  type: RewardType;
  label: string;
  awardedAt: string;
  sourceAttemptId?: string | null;
}

export interface SessionChild {
  id: string;
  name: string;
}

/**
 * Fetch a child's earned rewards.
 * GET /api/rewards (session child) or /api/rewards?childId=...
 */
export async function fetchChildRewards(childId?: string): Promise<ChildReward[]> {
  const url = childId
    ? `/api/rewards?childId=${encodeURIComponent(childId)}`
    : "/api/rewards";
  const data = await request<ChildReward[] | { rewards: ChildReward[] }>(url);
  if (Array.isArray(data)) {
    return data;
  }
  if (data && typeof data === "object" && Array.isArray(data.rewards)) {
    return data.rewards;
  }
  return [];
}

/**
 * Resolve the signed-in child (id + display name) from the session, or null.
 * GET /api/auth/session
 */
export async function fetchSessionChild(): Promise<SessionChild | null> {
  try {
    const res = await fetch("/api/auth/session", { credentials: "same-origin" });
    if (!res.ok) return null;
    const body = (await res.json()) as
      | {
          session?: {
            actorType?: unknown;
            child?: { id?: unknown; name?: unknown };
          } | null;
        }
      | null;
    const session = body?.session;
    const child = session?.child;
    if (session?.actorType !== "child" || !child || typeof child.id !== "string" || !child.id) {
      return null;
    }
    return { id: child.id, name: typeof child.name === "string" ? child.name : "" };
  } catch {
    return null;
  }
}
