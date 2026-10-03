import { NextResponse } from 'next/server';
import { and, count, desc, gt, isNull } from 'drizzle-orm';
import { db } from '@/db/client';
import {
  auditEvents,
  children,
  companionSessions,
  dataDeletionJobs,
  dataExportJobs,
  households,
  lessonAttempts,
  sessions,
  users,
} from '@/db/schema';
import { requireAdminSession } from '@/server/auth';

const RECENT_LIMIT = 10;

type AdminDashboardResponse = {
  counts: {
    users: number;
    children: number;
    households: number;
    activeSessions: number;
    lessonAttempts: number;
    companionSessions: number;
  };
  recentAudit: Array<{
    id: string;
    eventType: string;
    actorType: string | null;
    resourceType: string | null;
    createdAt: string;
  }>;
  recentJobs: Array<{
    id: string;
    kind: 'export' | 'deletion';
    status: string;
    createdAt: string;
    updatedAt: string;
  }>;
  providerHealth: {
    status: 'not_recorded';
    providers: [];
  };
};

function asNumber(value: unknown): number {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function asIso(value: Date | string): string {
  return new Date(value).toISOString();
}

export async function GET() {
  const session = await requireAdminSession();
  if (session instanceof Response) return session;

  try {
    const now = new Date();
    const [
      [userCount],
      [childCount],
      [householdCount],
      [activeSessionCount],
      [attemptCount],
      [companionSessionCount],
      auditRows,
      exportRows,
      deletionRows,
    ] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(children),
      db.select({ count: count() }).from(households),
      db
        .select({ count: count() })
        .from(sessions)
        .where(and(isNull(sessions.revokedAt), gt(sessions.expiresAt, now))),
      db.select({ count: count() }).from(lessonAttempts),
      db.select({ count: count() }).from(companionSessions),
      db
        .select({
          id: auditEvents.id,
          eventType: auditEvents.eventType,
          actorType: auditEvents.actorType,
          resourceType: auditEvents.resourceType,
          createdAt: auditEvents.createdAt,
        })
        .from(auditEvents)
        .orderBy(desc(auditEvents.createdAt))
        .limit(RECENT_LIMIT),
      db
        .select({
          id: dataExportJobs.id,
          status: dataExportJobs.status,
          createdAt: dataExportJobs.createdAt,
          updatedAt: dataExportJobs.updatedAt,
        })
        .from(dataExportJobs)
        .orderBy(desc(dataExportJobs.updatedAt))
        .limit(RECENT_LIMIT),
      db
        .select({
          id: dataDeletionJobs.id,
          status: dataDeletionJobs.status,
          createdAt: dataDeletionJobs.createdAt,
          updatedAt: dataDeletionJobs.updatedAt,
        })
        .from(dataDeletionJobs)
        .orderBy(desc(dataDeletionJobs.updatedAt))
        .limit(RECENT_LIMIT),
    ]);

    const recentJobs = [
      ...exportRows.map((row) => ({ ...row, kind: 'export' as const })),
      ...deletionRows.map((row) => ({ ...row, kind: 'deletion' as const })),
    ]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, RECENT_LIMIT)
      .map((row) => ({
        id: row.id,
        kind: row.kind,
        status: row.status,
        createdAt: asIso(row.createdAt),
        updatedAt: asIso(row.updatedAt),
      }));

    const response: AdminDashboardResponse = {
      counts: {
        users: asNumber(userCount?.count),
        children: asNumber(childCount?.count),
        households: asNumber(householdCount?.count),
        activeSessions: asNumber(activeSessionCount?.count),
        lessonAttempts: asNumber(attemptCount?.count),
        companionSessions: asNumber(companionSessionCount?.count),
      },
      recentAudit: auditRows.map((row) => ({
        id: row.id,
        eventType: row.eventType,
        actorType: row.actorType,
        resourceType: row.resourceType,
        createdAt: asIso(row.createdAt),
      })),
      recentJobs,
      // There is no provider-health table or persisted probe result in the V1 schema.
      // Do not turn configuration or a successful DB query into a health claim.
      providerHealth: { status: 'not_recorded', providers: [] },
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: { code: 'ADMIN_DATA_UNAVAILABLE', message: 'Admin data is temporarily unavailable.' } },
      { status: 500 },
    );
  }
}
