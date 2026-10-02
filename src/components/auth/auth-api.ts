import type { AuthSessionData, AuthUser, ChildProfileSummary } from "./auth-types";

export class AuthApiError extends Error {
  statusCode: number;
  details?: Record<string, string[]>;

  constructor(message: string, statusCode = 500, details?: Record<string, string[]>) {
    super(message);
    this.name = "AuthApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  let data: Record<string, unknown> | null = null;
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const errorMsg =
      (typeof data?.message === "string" && data.message) ||
      (typeof data?.error === "string" && data.error) ||
      (res.status === 401
        ? "Invalid email or password. Please try again."
        : res.status === 403
          ? "Access denied. Guardian permission required."
          : res.status === 404
            ? "Account or profile not found."
            : res.status === 409
              ? "An account with this email already exists."
              : `Request failed (${res.status}). Please try again.`);

    const details = data?.details as Record<string, string[]> | undefined;
    throw new AuthApiError(errorMsg, res.status, details);
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
    if (res.status === 401 || res.status === 403) {
      return [];
    }
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
