import 'server-only';
import { cookies } from 'next/headers';
import { db } from '@/db/client';
import { children, households, householdMembers, sessions } from '@/db/schema';
import {
  verifyParentSession,
  verifyChildSession,
  type ParentSessionPayload,
  type ChildSessionPayload,
  PARENT_COOKIE_OPTIONS,
  CHILD_COOKIE_OPTIONS,
} from '@/lib/auth/session';
import { ERRORS } from '@/lib/api/errors';
import { and, eq } from 'drizzle-orm';

// ── Session retrieval ────────────────────────────────────────────────────────

/**
 * Read and verify the parent session JWT from cookies.
 * Returns null if no cookie or token is invalid/expired.
 */
export async function getParentSession(): Promise<ParentSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PARENT_COOKIE_OPTIONS.name)?.value;
  if (!token) return null;
  return verifyParentSession(token);
}

/**
 * Read and verify the child session JWT from cookies.
 * Returns null if no cookie or token is invalid/expired.
 */
export async function getChildSession(): Promise<ChildSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CHILD_COOKIE_OPTIONS.name)?.value;
  if (!token) return null;
  return verifyChildSession(token);
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
 * Require a valid parent session (parent or admin role).
 * Returns the payload or a 401 Response object.
 */
export async function requireParentSession(): Promise<
  ParentSessionPayload | Response
> {
  const session = await getParentSession();
  if (!session) return unauthorizedResponse();
  return session;
}

/**
 * Require an admin session (role must be 'admin').
 * Returns the payload or 401/403 Response object.
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
 * Require a valid child session.
 * Returns the payload or a 401 Response object.
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
 * Check if a DB session is active (not revoked and not expired).
 */
export async function isDbSessionValid(sessionId: string): Promise<boolean> {
  try {
    const [session] = await db
      .select({
        id: sessions.id,
        revokedAt: sessions.revokedAt,
        expiresAt: sessions.expiresAt,
      })
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);

    if (!session) return false;
    if (session.revokedAt) return false;
    if (session.expiresAt && new Date(session.expiresAt) < new Date()) return false;
    return true;
  } catch {
    // If DB is offline, fall back safely
    return true;
  }
}

// ── Household ownership helpers ──────────────────────────────────────────────

/**
 * Return the household owned by or member of userId, or null if none exists.
 */
export async function getParentHousehold(
  userId: string,
): Promise<{ id: string; ownerId: string; name: string } | null> {
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
}

/**
 * Verify that userId has membership or ownership of householdId.
 * Returns a 403 Response if unauthorized, or null if confirmed.
 */
export async function assertUserBelongsToHousehold(
  userId: string,
  householdId: string,
): Promise<Response | null> {
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
