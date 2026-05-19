import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export type ParentConsentState = {
  media: boolean;
  alerts: boolean;
  dataRetention: boolean;
  acceptedAt?: string;
};

export type IdentityParentSession = {
  authSubjectId: string;
  email: string;
  displayName: string;
  parentProfileId?: string;
  issuedAt: string;
  expiresAt: string;
  consent: ParentConsentState;
};

export type IdentitySessionResponse = {
  authenticated: boolean;
  mode: "prototype" | "production";
  parent: IdentityParentSession;
};

type ApiErrorCode =
  | "validation_error"
  | "authentication_error"
  | "authorization_error"
  | "identity_runtime_unavailable";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const PROTOTYPE_MODE = "prototype" as const;

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getCookieName() {
  return process.env.AUTH_SESSION_COOKIE_NAME || "agentkid_session";
}

function shouldUseSecureCookie() {
  if (process.env.AUTH_COOKIE_SECURE === "true") {
    return true;
  }

  if (process.env.AUTH_COOKIE_SECURE === "false") {
    return false;
  }

  return process.env.NODE_ENV === "production";
}

function getAuthSecret() {
  if (process.env.AUTH_SECRET) {
    return process.env.AUTH_SECRET;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is required for identity routes in production.");
  }

  return "agentkid-local-dev-secret-change-before-production";
}

function signPayload(payload: string) {
  return createHmac("sha256", getAuthSecret()).update(payload).digest("base64url");
}

function verifySignature(payload: string, signature: string) {
  const expected = signPayload(payload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

function serializeSession(session: IdentityParentSession) {
  const payload = base64UrlEncode(JSON.stringify(session));
  const signature = signPayload(payload);
  return `${payload}.${signature}`;
}

function parseSessionCookie(rawCookie?: string) {
  if (!rawCookie) {
    return null;
  }

  const [payload, signature] = rawCookie.split(".");

  if (!payload || !signature || !verifySignature(payload, signature)) {
    return null;
  }

  try {
    const session = JSON.parse(base64UrlDecode(payload)) as IdentityParentSession;

    if (!session.expiresAt || new Date(session.expiresAt).getTime() <= Date.now()) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

function normalizeEmail(email: unknown) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

export function validateEmail(email: unknown) {
  const normalized = normalizeEmail(email);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : null;
}

export function validatePassword(password: unknown) {
  return typeof password === "string" && password.length >= 8;
}

export function createPrototypeSession(input: {
  email: string;
  displayName?: string;
  consent?: ParentConsentState;
}) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_SECONDS * 1000);
  const displayName =
    input.displayName?.trim() ||
    input.email
      .split("@")[0]
      .split(/[._-]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ") ||
    "Phụ huynh";

  return {
    authSubjectId: `prototype:${input.email}`,
    email: input.email,
    displayName,
    issuedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    consent: input.consent ?? {
      media: false,
      alerts: false,
      dataRetention: false
    }
  } satisfies IdentityParentSession;
}

export function readIdentitySession(request: NextRequest) {
  return parseSessionCookie(request.cookies.get(getCookieName())?.value);
}

export function identityResponse(session: IdentityParentSession, init?: ResponseInit) {
  const response = NextResponse.json(
    {
      authenticated: true,
      mode: PROTOTYPE_MODE,
      parent: session
    } satisfies IdentitySessionResponse,
    init
  );

  response.cookies.set(getCookieName(), serializeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(),
    maxAge: SESSION_TTL_SECONDS,
    path: "/"
  });

  return response;
}

export function clearIdentityResponse() {
  const response = NextResponse.json({ authenticated: false, mode: PROTOTYPE_MODE });
  response.cookies.set(getCookieName(), "", {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(),
    maxAge: 0,
    path: "/"
  });
  return response;
}

export function apiError(status: number, code: ApiErrorCode, message: string) {
  return NextResponse.json(
    {
      ok: false,
      code,
      message
    },
    { status }
  );
}
