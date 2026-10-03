import 'server-only';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '@/db/client';
import { auditEvents, capabilityConsents, dataDeletionJobs, dataExportJobs, retentionPolicies, users, households, householdMembers } from '@/db/schema';
import { verifyPassword } from '@/lib/auth/parent-auth';
import type { ParentSessionPayload } from '@/lib/auth/session';

export const POLICY_VERSION = '1.0';
export const consentCapabilities = { microphone: 'mic', camera: 'camera', vision: 'vision', screen: 'screen' } as const;
export type ConsentScope = keyof typeof consentCapabilities;
export class SafetyError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: Record<string, string[]>) { super(message); }
}

export async function context(session: ParentSessionPayload) {
  const [owned] = await db.select({ id: households.id, ownerId: households.ownerId, name: households.name }).from(households).where(eq(households.ownerId, session.sub)).limit(1);
  const [member] = owned ? [undefined] : await db.select({ id: households.id, ownerId: households.ownerId, name: households.name }).from(householdMembers).innerJoin(households, eq(householdMembers.householdId, households.id)).where(eq(householdMembers.userId, session.sub)).limit(1);
  const household = owned ?? member;
  if (!household) throw new SafetyError(404, 'NOT_FOUND', 'Household not found.');
  return { household, userId: session.sub };
}

export async function reauthenticate(userId: string, password: unknown) {
  if (typeof password !== 'string' || !password) throw new SafetyError(403, 'REAUTH_REQUIRED', 'Please confirm your password to continue.');
  const [user] = await db.select({ passwordHash: users.passwordHash, isActive: users.isActive }).from(users).where(eq(users.id, userId)).limit(1);
  if (!user || !user.isActive || !(await verifyPassword(password, user.passwordHash))) throw new SafetyError(403, 'INVALID_PASSWORD', 'Password confirmation failed.');
}

export async function audit(userId: string, eventType: string, resourceType: string, resourceId?: string, metadata?: Record<string, unknown>) {
  await db.insert(auditEvents).values({ actorId: userId, actorType: 'parent', eventType, resourceType, resourceId: resourceId ?? null, metadata: metadata ?? null } as typeof auditEvents.$inferInsert);
}

export function safetyErrorResponse(error: unknown) {
  if (error instanceof SafetyError) return Response.json({ error: { code: error.code, message: error.message, ...(error.details ? { details: error.details } : {}) } }, { status: error.status });
  console.error('[safety] database or handler failure', error);
  return Response.json({ error: { code: 'INTERNAL', message: 'Safety service is temporarily unavailable.' } }, { status: 500 });
}

export async function latestConsents(householdId: string, childId?: string) {
  const rows = await db.select().from(capabilityConsents).where(childId ? and(eq(capabilityConsents.householdId, householdId), eq(capabilityConsents.childId, childId)) : and(eq(capabilityConsents.householdId, householdId), isNull(capabilityConsents.childId))).orderBy(desc(capabilityConsents.createdAt));
  const latest = new Map<string, typeof rows[number]>();
  for (const row of rows) if (!latest.has(row.capability)) latest.set(row.capability, row);
  return [...latest.values()];
}

export async function privacySettings(householdId: string) {
  const [consents, retention] = await Promise.all([
    latestConsents(householdId),
    db.select().from(retentionPolicies).where(eq(retentionPolicies.householdId, householdId)),
  ]);
  const granted = (capability: string) => consents.find((row) => row.capability === capability)?.granted === true;
  const transcript = retention.find((row) => row.resourceType === 'transcripts');
  const emotion = retention.find((row) => row.resourceType === 'emotion_timeline');
  return { microphoneAccess: granted('mic'), cameraAccess: granted('camera'), visionAiAccess: granted('vision'), screenCaptureAccess: granted('screen'), cameraPreview: granted('camera'), transcriptStorageDays: transcript?.retentionDays ?? 0, emotionTimelineStorage: emotion?.isActive ?? false };
}

export function mapConsent(row: typeof capabilityConsents.$inferSelect) {
  const scope = Object.entries(consentCapabilities).find(([, value]) => value === row.capability)?.[0] as ConsentScope;
  return { id: row.id, scope, status: row.granted ? 'granted' : 'revoked', granted: row.granted, policyVersion: String((row.metadata as { policyVersion?: string } | null)?.policyVersion ?? POLICY_VERSION), ...(row.grantedAt ? { grantedAt: row.grantedAt.toISOString() } : {}), ...(row.revokedAt ? { revokedAt: row.revokedAt.toISOString() } : {}), ...(row.childId ? { childId: row.childId } : {}), guardianId: row.grantedByUserId ?? undefined };
}

export function mapExport(row: typeof dataExportJobs.$inferSelect, request?: { format?: 'json' | 'csv' | 'zip'; childId?: string }) {
  return { id: row.id, status: row.status === 'processing' ? 'running' : row.status === 'completed' ? 'completed' : row.status === 'failed' || row.status === 'expired' ? 'failed' : 'requested', requestedAt: row.createdAt.toISOString(), ...(row.archiveExpiresAt ? { expiresAt: row.archiveExpiresAt.toISOString() } : {}), ...(row.status === 'completed' && row.archiveUrl && row.archiveExpiresAt && row.archiveExpiresAt > new Date() ? { downloadUrl: row.archiveUrl } : {}), format: request?.format ?? 'zip', ...(request?.childId ? { childId: request.childId } : {}), ...(row.errorMessage ? { error: row.errorMessage } : {}), progressPercent: row.status === 'completed' ? 100 : 0 };
}

export function mapDeletion(row: typeof dataDeletionJobs.$inferSelect) {
  const stored = row.stagesReport && !Array.isArray(row.stagesReport) ? row.stagesReport as { request?: { scope?: string; childId?: string }; stages?: Array<{ stage?: string; name?: string; status?: string; detail?: string }> } : null;
  const stages = stored?.stages ?? (Array.isArray(row.stagesReport) ? row.stagesReport as Array<{ stage?: string; name?: string; status?: string; detail?: string }> : []);
  const request = stored?.request;
  return { id: row.id, scope: request?.scope ?? 'all_child_data', status: row.status === 'processing' ? 'running' : row.status === 'completed' ? 'completed' : row.status === 'failed' ? 'failed' : 'requested', requestedAt: row.createdAt.toISOString(), ...(request?.childId ? { childId: request.childId } : {}), ...(stages.length ? { stages: stages.map((stage) => ({ ...stage, name: stage.name ?? stage.stage })) } : {}), ...(row.errorMessage ? { error: row.errorMessage } : {}) };
}

export async function assertChildOwned(householdId: string, childId?: string) {
  if (!childId) return;
  const { children } = await import('@/db/schema');
  const [child] = await db.select({ id: children.id }).from(children).where(and(eq(children.id, childId), eq(children.householdId, householdId), eq(children.isActive, true))).limit(1);
  if (!child) throw new SafetyError(403, 'FORBIDDEN', 'Child is not part of this household.');
}
