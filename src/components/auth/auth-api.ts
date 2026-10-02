import type { AuthSessionData, AuthUser, ChildProfileSummary } from "./auth-types";

export type ApiErrorDetails = Record<string, string[] | string>;

export class AuthApiError extends Error {
  statusCode: number;
  code?: string;
  details?: ApiErrorDetails;
  requestId?: string;

  constructor(
    message: string,
    statusCode = 500,
    options?: {
      code?: string;
      details?: ApiErrorDetails;
      requestId?: string;
    },
  ) {
    super(message);
    this.name = "AuthApiError";
    this.statusCode = statusCode;
    this.code = options?.code;
    this.details = options?.details;
    this.requestId = options?.requestId;
  }
}

export function parseApiError(
  data: unknown,
  status: number,
  statusText?: string,
): AuthApiError {
  let errorMsg: string | undefined;
  let code: string | undefined;
  let details: ApiErrorDetails | undefined;
  let requestId: string | undefined;

  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;

    // Case 1: Nested error contract { error: { code, message, details, requestId } }
    if (obj.error && typeof obj.error === "object" && !Array.isArray(obj.error)) {
      const nested = obj.error as Record<string, unknown>;
      if (typeof nested.message === "string") errorMsg = nested.message;
      if (typeof nested.code === "string") code = nested.code;
      if (nested.details && typeof nested.details === "object") {
        details = nested.details as ApiErrorDetails;
      }
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
    if (!details && obj.details && typeof obj.details === "object") {
      details = obj.details as ApiErrorDetails;
    }
    if (!requestId && typeof obj.requestId === "string") {
      requestId = obj.requestId;
    }
  }

  // Safe fallback per status code
  if (!errorMsg) {
    errorMsg =
      status === 401
        ? "Invalid credentials or session expired. Please sign in."
        : status === 403
          ? "Access denied. Guardian permission required."
          : status === 404
            ? "Account or profile not found."
            : status === 409
              ? "An account with this email already exists."
              : statusText || `Request failed (${status}). Please try again.`;
  }

  return new AuthApiError(errorMsg, status, { code, details, requestId });
}

async function handleResponse<T>(res: Response): Promise<T> {
  let data: unknown = null;
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    throw parseApiError(data, res.status, res.statusText);
  }

  return (data as T) ?? ({} as T);
}

function safeCatch(err: unknown): never {
  if (err instanceof AuthApiError) {
    throw err;
  }
  if (err instanceof Error && err.name === "AbortError") {
    throw new AuthApiError("Request was cancelled. Please try again.", 499);
  }
  throw new AuthApiError(
    "Unable to connect to the authentication service. Please check your connection and try again.",
    0,
  );
}

export async function registerParent(payload: {
  name: string;
  email: string;
  password: string;
}): Promise<{ user: AuthUser; message?: string }> {
  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    return await handleResponse<{ user: AuthUser; message?: string }>(res);
  } catch (err) {
    return safeCatch(err);
  }
}

export async function loginParent(payload: {
  email: string;
  password: string;
}): Promise<{ user: AuthUser; message?: string }> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    return await handleResponse<{ user: AuthUser; message?: string }>(res);
  } catch (err) {
    return safeCatch(err);
  }
}

export async function loginChild(payload: {
  childId: string;
  pin: string;
}): Promise<{ child: { id: string; name: string }; message?: string }> {
  try {
    const res = await fetch("/api/auth/child-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    return await handleResponse<{ child: { id: string; name: string }; message?: string }>(res);
  } catch (err) {
    return safeCatch(err);
  }
}

export async function logoutUser(): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    return await handleResponse<{ success: boolean; message?: string }>(res);
  } catch (err) {
    return safeCatch(err);
  }
}

export async function getAuthSession(): Promise<AuthSessionData> {
  try {
    const res = await fetch("/api/auth/session", {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    if (res.status === 401) {
      return { isAuthenticated: false, user: null, child: null };
    }
    return await handleResponse<AuthSessionData>(res);
  } catch (err) {
    return safeCatch(err);
  }
}

export async function getChildren(): Promise<ChildProfileSummary[]> {
  try {
    const res = await fetch("/api/children", {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    // Do NOT swallow 401/403; handleResponse will throw AuthApiError with status code
    const data = await handleResponse<{ children?: ChildProfileSummary[] } | ChildProfileSummary[]>(res);
    if (Array.isArray(data)) {
      return data;
    }
    return data.children ?? [];
  } catch (err) {
    return safeCatch(err);
  }
}

export async function createChild(payload: {
  name: string;
  pin: string;
  age?: number;
  grade?: string;
  comfortStyle?: string;
}): Promise<{ child: ChildProfileSummary; message?: string }> {
  try {
    const res = await fetch("/api/children", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    return await handleResponse<{ child: ChildProfileSummary; message?: string }>(res);
  } catch (err) {
    return safeCatch(err);
  }
}
