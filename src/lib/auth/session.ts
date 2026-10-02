import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { env } from '@/server/env';

// ── Payload types ────────────────────────────────────────────────────────────

export type ParentSessionPayload = {
  sub: string; // userId
  role: 'parent' | 'admin';
  actorType: 'parent' | 'admin';
  sessionId?: string;
  iat?: number;
  exp?: number;
};

export type ChildSessionPayload = {
  sub: string; // childId
  householdId: string;
  actorType: 'child';
  sessionId?: string;
  iat?: number;
  exp?: number;
};

// ── Cookie name constants ────────────────────────────────────────────────────

export const PARENT_COOKIE_NAME = 'snow_parent_session';
export const CHILD_COOKIE_NAME = 'snow_child_session';

// ── Cookie options ───────────────────────────────────────────────────────────

export const PARENT_COOKIE_OPTIONS = {
  name: PARENT_COOKIE_NAME,
  httpOnly: true as const,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
};

export const CHILD_COOKIE_OPTIONS = {
  name: CHILD_COOKIE_NAME,
  httpOnly: true as const,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 12 * 60 * 60, // 12 hours in seconds
};

// ── Key derivation ───────────────────────────────────────────────────────────

function parentSecretKey(): Uint8Array {
  return new TextEncoder().encode(env.SESSION_SECRET);
}

function childSecretKey(): Uint8Array {
  return new TextEncoder().encode(env.CHILD_SESSION_SECRET);
}

// ── Parent session ───────────────────────────────────────────────────────────

/**
 * Create a signed JWT for a parent or admin user.
 * Expires in 7 days.
 */
export async function createParentSession(
  userId: string,
  role: 'parent' | 'admin',
  sessionId?: string,
): Promise<string> {
  return new SignJWT({ role, actorType: role as string, sessionId })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(parentSecretKey());
}

/**
 * Verify a parent session JWT.
 * Returns null for expired, invalid, or tampered tokens.
 */
export async function verifyParentSession(
  token: string,
): Promise<ParentSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, parentSecretKey());
    return payload as unknown as ParentSessionPayload;
  } catch {
    return null;
  }
}

// ── Child session ────────────────────────────────────────────────────────────

/**
 * Create a signed JWT for a child session.
 * Uses a SEPARATE secret key from parent sessions.
 * Expires in 12 hours.
 */
export async function createChildSession(
  childId: string,
  householdId: string,
  sessionId?: string,
): Promise<string> {
  return new SignJWT({ householdId, actorType: 'child', sessionId })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(childId)
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(childSecretKey());
}

/**
 * Verify a child session JWT.
 * Returns null for expired, invalid, or tampered tokens.
 * A token signed with the parent key will return null here (different key).
 */
export async function verifyChildSession(
  token: string,
): Promise<ChildSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, childSecretKey());
    return payload as unknown as ChildSessionPayload;
  } catch {
    return null;
  }
}
