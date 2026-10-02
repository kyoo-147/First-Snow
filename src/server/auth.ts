import 'server-only';
import { cookies } from 'next/headers';
import { db } from '@/db/client';
import { children, households, householdMembers, sessions, users } from '@/db/schema';
import {
  verifyParentSession,
  verifyChildSession,
  hashToken,
  type ParentSessionPayload,
  type ChildSessionPayload,
  PARENT_COOKIE_NAME,
  CHILD_COOKIE_NAME,
  PARENT_COOKIE_OPTIONS,
  CHILD_COOKIE_OPTIONS,
} from '@/lib/auth/session';
import { ERRORS } from '@/lib/api/errors';
import { and, eq } from 'drizzle-orm';

// ── Session retrieval (DB-backed, Fail-Closed) ───────────────────────────────

/**
 * Read and verify parent session JWT from cookies AND validate against PostgreSQL.
 * Requires:
 * 1. Valid cryptographic JWT signature
 * 2. Presence of opaque sessionId claim
 * 3. Matching session row in DB where tokenHash = sha256(sessionId)
 * 4. DB session row is unrevoked (revokedAt IS NULL) and unexpired (expiresAt > now)
 * 5. DB session actorType matches 'parent' or 'admin' and userId matches payload.sub
 * 6. User isActive is true in users table
 *
 * FAIL CLOSED: If DB is unreachable, query errors, token is tampered, or row is missing/revoked,
 * returns null (never true).
 */
/**
 * Verify a parent session JWT token against PostgreSQL.
 * Requires:
 * 1. Valid cryptographic JWT signature
 * 2. Presence of opaque sessionId claim
 * 3. Matching session row in DB where tokenHash = sha256(sessionId)
 * 4. DB session row is unrevoked (revokedAt IS NULL) and unexpired (expiresAt > now)
 * 5. DB session actorType matches payload.role and userId matches payload.sub
 * 6. User isActive is true in users table
 *
 * FAIL CLOSED: If DB is unreachable, query errors, token is tampered, or row is missing/revoked,
 * returns null (never true).
 */
export async function verifyParentSessionTokenWithDb(
  token: string,
): Promise<ParentSessionPayload | null> {
  if (!token) return null;

  const payload = await verifyParentSession(token);
  if (!payload || !payload.sessionId) return null;

  try {
    const tokenHash = hashToken(payload.sessionId);
    const [sessionRow] = await db
      .select({
        id: sessions.id,
        actorType: sessions.actorType,
        userId: sessions.userId,
        expiresAt: sessions.expiresAt,
        revokedAt: sessions.revokedAt,
      })
      .from(sessions)
      .where(eq(sessions.tokenHash, tokenHash))
      .limit(1);

    if (!sessionRow) return null;
    if (sessionRow.revokedAt) return null;
    if (new Date(sessionRow.expiresAt) <= new Date()) return null;
    if (sessionRow.userId !== payload.sub) return null;
    if (sessionRow.actorType !== payload.role) return null;

    // Verify user is still active in users table
    const [user] = await db
      .select({ id: users.id, isActive: users.isActive })
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);

    if (!user || !user.isActive) return null;

    return payload;
  } catch {
    // Fail closed on any database failure
    return null;
  }
}

/**
 * Read and verify parent session JWT from cookies AND validate against PostgreSQL.
 */
export async function getParentSession(): Promise<ParentSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PARENT_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyParentSessionTokenWithDb(token);
}

/**
 * Verify a child session JWT token against PostgreSQL.
 * Requires:
 * 1. Valid cryptographic JWT signature (child session key)
 * 2. Presence of opaque sessionId claim
 * 3. Matching session row in DB where tokenHash = sha256(sessionId)
 * 4. DB session row is unrevoked (revokedAt IS NULL) and unexpired (expiresAt > now)
 * 5. DB session actorType === 'child' and childId === payload.sub
 * 6. Child isActive is true in children table
 *
 * FAIL CLOSED: If DB is unreachable, query errors, or row is invalid, returns null.
 */
export async function verifyChildSessionTokenWithDb(
  token: string,
): Promise<ChildSessionPayload | null> {
  if (!token) return null;

  const payload = await verifyChildSession(token);
  if (!payload || !payload.sessionId) return null;

  try {
    const tokenHash = hashToken(payload.sessionId);
    const [sessionRow] = await db
      .select({
        id: sessions.id,
        actorType: sessions.actorType,
        childId: sessions.childId,
        expiresAt: sessions.expiresAt,
        revokedAt: sessions.revokedAt,
      })
      .from(sessions)
      .where(eq(sessions.tokenHash, tokenHash))
      .limit(1);

    if (!sessionRow) return null;
    if (sessionRow.revokedAt) return null;
    if (new Date(sessionRow.expiresAt) <= new Date()) return null;
    if (sessionRow.childId !== payload.sub) return null;
    if (sessionRow.actorType !== 'child') return null;

    // Verify child is still active in children table
    const [child] = await db
      .select({ id: children.id, isActive: children.isActive })
      .from(children)
      .where(eq(children.id, payload.sub))
      .limit(1);

    if (!child || !child.isActive) return null;

    return payload;
  } catch {
    // Fail closed on any database failure
    return null;
  }
}

/**
 * Read and verify child session JWT from cookies AND validate against PostgreSQL.
 */
export async function getChildSession(): Promise<ChildSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CHILD_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyChildSessionTokenWithDb(token);
}

// ── Standard nested error responses ──────────────────────────────────────────

export function unauthorizedResponse(message = 'Authentication required.'): Response {
  return ERRORS.unauthorized(message);
}

export function forbiddenResponse(message = 'Access denied.'): Response {
  return ERRORS.forbidden(message);
}

// ── Auth guards ──────────────────────────────────────────────────────────────
// Pattern: each guard returns ParentSessionPayload | Response
// Callers do: const session = await requireParentSession(); if (session instanceof Response) return session;

/**
 * Require a valid DB-backed parent session (parent or admin role).
 * Returns payload or 401 Response. Fail closed.
 */
export async function requireParentSession(): Promise<
  ParentSessionPayload | Response
> {
  const session = await getParentSession();
  if (!session) return unauthorizedResponse();
  return session;
}

/**
 * Require a valid DB-backed admin session (role must be 'admin').
 * Returns payload or 401/403 Response. Fail closed.
 */
export async function requireAdminSession(): Promise<
  ParentSessionPayload | Response
> {
  const session = await getParentSession();
  if (!session) return unauthorizedResponse();
  if (session.role !== 'admin') return forbiddenResponse('Admin access required');
  return session;
}

/**
 * Require a valid DB-backed child session.
 * Returns payload or 401 Response. Fail closed.
 */
export async function requireChildSession(): Promise<
  ChildSessionPayload | Response
> {
  const session = await getChildSession();
  if (!session) return unauthorizedResponse();
  return session;
}

// ── DB-backed session helper ──────────────────────────────────────────────────

/**
 * Check if a session token is active in the database (not revoked and not expired).
 * Computes SHA-256 of token to query tokenHash.
 * Returns false on DB failure (fail closed).
 */
export async function isDbSessionValid(sessionToken: string): Promise<boolean> {
  if (!sessionToken) return false;
  try {
    const tokenHash = hashToken(sessionToken);
    const [session] = await db
      .select({
        id: sessions.id,
        revokedAt: sessions.revokedAt,
        expiresAt: sessions.expiresAt,
      })
      .from(sessions)
      .where(eq(sessions.tokenHash, tokenHash))
      .limit(1);

    if (!session) return false;
    if (session.revokedAt) return false;
    if (new Date(session.expiresAt) <= new Date()) return false;
    return true;
  } catch {
    // Fail closed on DB error
    return false;
  }
}

// ── Household ownership helpers ──────────────────────────────────────────────

/**
 * Return the household owned by or member of userId, or null if none exists.
 */
export async function getParentHousehold(
  userId: string,
): Promise<{ id: string; ownerId: string; name: string } | null> {
  try {
    const [owned] = await db
      .select({
        id: households.id,
        ownerId: households.ownerId,
        name: households.name,
      })
      .from(households)
      .where(eq(households.ownerId, userId))
      .limit(1);

    if (owned) return owned;

    const [membership] = await db
      .select({
        id: households.id,
        ownerId: households.ownerId,
        name: households.name,
      })
      .from(householdMembers)
      .innerJoin(households, eq(householdMembers.householdId, households.id))
      .where(eq(householdMembers.userId, userId))
      .limit(1);

    return membership ?? null;
  } catch {
    return null;
  }
}

/**
 * Verify that childId belongs to householdId.
 * Returns a 403 Response if the child doesn't exist or belongs to a different household.
 * Returns null if ownership is confirmed.
 *
 * IMPORTANT: Returns 403 (not 404) for non-existent children to prevent
 * resource enumeration across household boundaries.
 */
export async function assertChildBelongsToHousehold(
  childId: string,
  householdId: string,
): Promise<Response | null> {
  try {
    const [child] = await db
      .select({ id: children.id, householdId: children.householdId })
      .from(children)
      .where(eq(children.id, childId))
      .limit(1);

    // Return 403 for both non-existent and cross-household access
    // This prevents enumeration: callers cannot distinguish "doesn't exist" from "not yours"
    if (!child) return forbiddenResponse();
    if (child.householdId !== householdId) return forbiddenResponse();

    return null;
  } catch {
    return forbiddenResponse();
  }
}

/**
 * Verify that userId has membership or ownership of householdId.
 * Returns a 403 Response if unauthorized, or null if confirmed.
 */
export async function assertUserBelongsToHousehold(
  userId: string,
  householdId: string,
): Promise<Response | null> {
  try {
    const [owned] = await db
      .select({ id: households.id })
      .from(households)
      .where(and(eq(households.id, householdId), eq(households.ownerId, userId)))
      .limit(1);

    if (owned) return null;

    const [membership] = await db
      .select({ householdId: householdMembers.householdId })
      .from(householdMembers)
      .where(
        and(
          eq(householdMembers.householdId, householdId),
          eq(householdMembers.userId, userId),
        ),
      )
      .limit(1);

    if (membership) return null;

    return forbiddenResponse('Access to household denied.');
  } catch {
    return forbiddenResponse('Access to household denied.');
  }
}

/**
 * Verify that the child session's subject matches the requested childId.
 * A child can only access their own data.
 * Returns a 403 Response if the session child ID doesn't match.
 */
export async function assertChildSessionOwnsChild(
  session: ChildSessionPayload,
  childId: string,
): Promise<Response | null> {
  if (session.sub !== childId) {
    return forbiddenResponse('Child can only access own data');
  }
  return null;
}
