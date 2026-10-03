import 'server-only';
import { asc, and, eq, inArray, lt } from 'drizzle-orm';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '@/db/schema';
import { auditEvents, children, companionMessages, companionSessions, dataDeletionJobs, dataExportJobs, householdMembers, households, lessonAttempts, lessonProgress, notificationPreferences, notifications, sessions, users } from '@/db/schema';
import type { DeletionJob, DeliveryAdapter, ExportJob, ExportRequest, NotificationJob, SafetyWorkerRepository } from './worker';

type WorkerDb = ReturnType<typeof drizzle<typeof schema>>;
type JsonObject = Record<string, unknown>;
type DeletionStage = { stage: string; name?: string; status: 'pending' | 'running' | 'completed' | 'failed'; detail?: string };

export class DatabaseSafetyWorkerRepository implements SafetyWorkerRepository {
  private readonly client: ReturnType<typeof postgres>;
  private readonly db: WorkerDb;

  constructor(connectionString = process.env.DATABASE_URL) {
    if (!connectionString) throw new Error('DATABASE_URL is required to run the safety worker.');
    this.client = postgres(connectionString, { max: 1, idle_timeout: 5 });
    this.db = drizzle(this.client, { schema });
  }

  async close() { await this.client.end(); }

  async claimExports(limit: number, retryFailed: boolean): Promise<ExportJob[]> {
    const now = new Date();
    const staleBefore = new Date(now.getTime() - 30 * 60 * 1000);
    return this.db.transaction(async (tx) => {
      await tx.update(dataExportJobs).set({ status: 'pending', updatedAt: now, errorMessage: 'Worker lease expired; eligible for retry.' } as Partial<typeof dataExportJobs.$inferInsert>).where(and(eq(dataExportJobs.status, 'processing'), lt(dataExportJobs.updatedAt, staleBefore)));
      const states: Array<'pending' | 'failed'> = retryFailed ? ['pending', 'failed'] : ['pending'];
      const rows = await tx.select().from(dataExportJobs).where(inArray(dataExportJobs.status, states)).orderBy(asc(dataExportJobs.createdAt)).limit(limit).for('update', { skipLocked: true });
      for (const row of rows) await tx.update(dataExportJobs).set({ status: 'processing', updatedAt: now } as Partial<typeof dataExportJobs.$inferInsert>).where(and(eq(dataExportJobs.id, row.id), inArray(dataExportJobs.status, states)));
      return rows.map((row) => ({ id: row.id, householdId: row.householdId, requestedByUserId: row.requestedByUserId }));
    });
  }

  async getExportRequest(job: ExportJob): Promise<ExportRequest> {
    const [event] = await this.db.select({ metadata: auditEvents.metadata, actorId: auditEvents.actorId }).from(auditEvents).where(and(eq(auditEvents.eventType, 'data_export.requested'), eq(auditEvents.resourceType, 'data_export_job'), eq(auditEvents.resourceId, job.id))).limit(1);
    if (!event || event.actorId !== job.requestedByUserId || !event.metadata || typeof event.metadata !== 'object') throw new Error('Persisted export request metadata is missing or invalid.');
    const metadata = event.metadata as JsonObject;
    const format = metadata.format;
    if (format !== 'json' && format !== 'csv' && format !== 'zip') throw new Error('Persisted export format is invalid.');
    const childId = typeof metadata.childId === 'string' ? metadata.childId : undefined;
    if (childId) await assertWorkerChildOwned(this.db, job.householdId, childId);
    return { format, ...(childId ? { childId } : {}), includeTranscripts: metadata.includeTranscripts === true, includeEmotionTimeline: metadata.includeEmotionTimeline === true, includeLearningProgress: metadata.includeLearningProgress === true };
  }

  async collectExport(job: ExportJob, request: ExportRequest): Promise<Record<string, unknown>> {
    const selectedChildren = await this.db.select({ id: children.id, displayName: children.displayName, age: children.age, gradeLevel: children.gradeLevel, avatarUrl: children.avatarUrl, createdAt: children.createdAt }).from(children).where(and(eq(children.householdId, job.householdId), ...(request.childId ? [eq(children.id, request.childId)] : [])));
    if (request.childId && selectedChildren.length !== 1) throw new Error('Export child is no longer owned by this household.');
    const childIds = selectedChildren.map((child) => child.id);
    const output: Record<string, unknown> = { children: selectedChildren };
    if (request.includeTranscripts) {
      output.transcripts = childIds.length ? await this.db.select({ id: companionMessages.id, childId: companionMessages.childId, sessionId: companionMessages.sessionId, speaker: companionMessages.speaker, text: companionMessages.text, isFlagged: companionMessages.isFlagged, flagReason: companionMessages.flagReason, safetyScore: companionMessages.safetyScore, safetyAlerts: companionMessages.safetyAlerts, createdAt: companionMessages.createdAt }).from(companionMessages).innerJoin(children, eq(companionMessages.childId, children.id)).where(and(eq(children.householdId, job.householdId), inArray(companionMessages.childId, childIds))) : [];
    }
    if (request.includeEmotionTimeline) throw new Error('Emotion timeline export is unavailable: no emotion timeline table exists in this schema.');
    if (request.includeLearningProgress) {
      output.learningProgress = childIds.length ? await this.db.select({ childId: lessonProgress.childId, lessonId: lessonProgress.lessonId, status: lessonProgress.status, bestScore: lessonProgress.bestScore, completionCount: lessonProgress.completionCount, lastAttemptAt: lessonProgress.lastAttemptAt, updatedAt: lessonProgress.updatedAt }).from(lessonProgress).innerJoin(children, eq(lessonProgress.childId, children.id)).where(and(eq(children.householdId, job.householdId), inArray(lessonProgress.childId, childIds))) : [];
      output.learningAttempts = childIds.length ? await this.db.select({ id: lessonAttempts.id, childId: lessonAttempts.childId, lessonId: lessonAttempts.lessonId, status: lessonAttempts.status, score: lessonAttempts.score, answers: lessonAttempts.answers, startedAt: lessonAttempts.startedAt, completedAt: lessonAttempts.completedAt, createdAt: lessonAttempts.createdAt }).from(lessonAttempts).innerJoin(children, eq(lessonAttempts.childId, children.id)).where(and(eq(children.householdId, job.householdId), inArray(lessonAttempts.childId, childIds))) : [];
    }
    return output;
  }

  async completeExport(job: ExportJob, result: { archiveUrl: string; expiresAt: Date; stagesCompleted: string[] }) {
    await this.db.transaction(async (tx) => {
      const [updated] = await tx.update(dataExportJobs).set({ status: 'completed', archiveUrl: result.archiveUrl, archiveExpiresAt: result.expiresAt, stagesCompleted: result.stagesCompleted, errorMessage: null, updatedAt: new Date() } as Partial<typeof dataExportJobs.$inferInsert>).where(and(eq(dataExportJobs.id, job.id), eq(dataExportJobs.status, 'processing'), eq(dataExportJobs.householdId, job.householdId))).returning({ id: dataExportJobs.id });
      if (!updated) throw new Error('Export job was not claimed by this worker.');
      await tx.insert(auditEvents).values({ actorId: job.requestedByUserId, actorType: 'parent', eventType: 'data_export.completed', resourceType: 'data_export_job', resourceId: job.id, metadata: { expiresAt: result.expiresAt.toISOString(), stagesCompleted: result.stagesCompleted } } as typeof auditEvents.$inferInsert);
    });
  }

  async failExport(job: ExportJob, reason: string) {
    await this.db.transaction(async (tx) => {
      const [updated] = await tx.update(dataExportJobs).set({ status: 'failed', archiveUrl: null, archiveExpiresAt: null, errorMessage: reason.slice(0, 2000), updatedAt: new Date() } as Partial<typeof dataExportJobs.$inferInsert>).where(and(eq(dataExportJobs.id, job.id), eq(dataExportJobs.status, 'processing'), eq(dataExportJobs.householdId, job.householdId))).returning({ id: dataExportJobs.id });
      if (updated) await tx.insert(auditEvents).values({ actorId: job.requestedByUserId, actorType: 'parent', eventType: 'data_export.failed', resourceType: 'data_export_job', resourceId: job.id, metadata: { reason: reason.slice(0, 1000) } } as typeof auditEvents.$inferInsert);
    });
  }

  async claimDeletions(limit: number, retryFailed: boolean): Promise<DeletionJob[]> {
    const now = new Date();
    const staleBefore = new Date(now.getTime() - 30 * 60 * 1000);
    return this.db.transaction(async (tx) => {
      await tx.update(dataDeletionJobs).set({ status: 'pending', updatedAt: now, errorMessage: 'Worker lease expired; eligible for retry.' } as Partial<typeof dataDeletionJobs.$inferInsert>).where(and(eq(dataDeletionJobs.status, 'processing'), lt(dataDeletionJobs.updatedAt, staleBefore)));
      const states: Array<'pending' | 'failed'> = retryFailed ? ['pending', 'failed'] : ['pending'];
      const rows = await tx.select().from(dataDeletionJobs).where(inArray(dataDeletionJobs.status, states)).orderBy(asc(dataDeletionJobs.createdAt)).limit(limit).for('update', { skipLocked: true });
      for (const row of rows) await tx.update(dataDeletionJobs).set({ status: 'processing', updatedAt: now } as Partial<typeof dataDeletionJobs.$inferInsert>).where(and(eq(dataDeletionJobs.id, row.id), inArray(dataDeletionJobs.status, states)));
      return rows.map((row) => ({ id: row.id, householdId: row.householdId, requestedByUserId: row.requestedByUserId }));
    });
  }

  async processDeletion(job: DeletionJob, retryFailed: boolean): Promise<'completed' | 'failed' | 'blocked'> {
    const [initial] = await this.db.select({ stagesReport: dataDeletionJobs.stagesReport }).from(dataDeletionJobs).where(and(eq(dataDeletionJobs.id, job.id), eq(dataDeletionJobs.status, 'processing'))).limit(1);
    if (!initial) return 'failed';
    const report = parseDeletionReport(initial.stagesReport);
    if (report.request.scope === 'entire_account') {
      const stages = report.stages.map((stage) => ({ ...stage, status: 'failed' as const, detail: 'blocked: deleting this account would cascade-delete the job and prevent durable completion and audit evidence.' }));
      await this.finishDeletion(job, { ...report, stages }, 'failed', 'Account deletion is blocked because the existing schema cannot preserve the job and audit record.');
      return 'blocked';
    }
    for (const stage of report.stages) {
      if (stage.status === 'completed' || (stage.status === 'failed' && !retryFailed)) continue;
      await this.runDeletionStage(job, stage.stage, report.request.childId);
    }
    const [fresh] = await this.db.select({ stagesReport: dataDeletionJobs.stagesReport }).from(dataDeletionJobs).where(eq(dataDeletionJobs.id, job.id)).limit(1);
    const completedReport = parseDeletionReport(fresh?.stagesReport);
    const complete = completedReport.stages.every((stage) => stage.status === 'completed');
    await this.finishDeletion(job, completedReport, complete ? 'completed' : 'failed', complete ? null : 'One or more deletion stages failed. Review the stage report before retrying.');
    return complete ? 'completed' : 'failed';
  }

  private async runDeletionStage(job: DeletionJob, stageName: string, childId?: string) {
    try {
      await this.db.transaction(async (tx) => {
        const [jobRow] = await tx.select({ stagesReport: dataDeletionJobs.stagesReport }).from(dataDeletionJobs).where(and(eq(dataDeletionJobs.id, job.id), eq(dataDeletionJobs.status, 'processing'))).for('update');
        if (!jobRow) return;
        const report = parseDeletionReport(jobRow.stagesReport);
        const stage = report.stages.find((item) => item.stage === stageName);
        if (!stage || stage.status === 'completed') return;
        if (stageName === 'emotion_timeline') throw new Error('No emotion timeline table exists in this schema; no records were changed.');
        if (!['transcripts', 'session_logs', 'profile_metadata'].includes(stageName)) throw new Error(`Unsupported deletion stage: ${stageName}`);
        if (!childId) throw new Error('A child identifier is required for this deletion stage.');
        const child = await tx.select({ id: children.id }).from(children).where(and(eq(children.id, childId), eq(children.householdId, job.householdId))).limit(1);
        if (!child.length) throw new Error('Child ownership could not be verified; no records were changed.');
        if (stageName === 'transcripts') await tx.delete(companionMessages).where(eq(companionMessages.childId, childId));
        if (stageName === 'session_logs') {
          await tx.delete(sessions).where(and(eq(sessions.childId, childId), eq(sessions.actorType, 'child')));
          await tx.delete(companionSessions).where(eq(companionSessions.childId, childId));
        }
        if (stageName === 'profile_metadata') await tx.delete(children).where(and(eq(children.id, childId), eq(children.householdId, job.householdId)));
        const detail = stageName === 'profile_metadata'
          ? 'Child profile deleted. Database cascades removed child-linked learning progress, attempts, rewards, consents, and any remaining child records.'
          : stageName === 'session_logs' ? 'Child authentication sessions and companion sessions deleted.' : 'Owned companion transcript messages deleted.';
        const updatedStages = report.stages.map((item) => item.stage === stageName ? { ...item, status: 'completed' as const, detail } : item);
        await tx.update(dataDeletionJobs).set({ stagesReport: { ...report, stages: updatedStages }, updatedAt: new Date() } as Partial<typeof dataDeletionJobs.$inferInsert>).where(and(eq(dataDeletionJobs.id, job.id), eq(dataDeletionJobs.status, 'processing')));
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Deletion stage failed.';
      await this.db.transaction(async (tx) => {
        const [jobRow] = await tx.select({ stagesReport: dataDeletionJobs.stagesReport }).from(dataDeletionJobs).where(and(eq(dataDeletionJobs.id, job.id), eq(dataDeletionJobs.status, 'processing'))).for('update');
        if (!jobRow) return;
        const report = parseDeletionReport(jobRow.stagesReport);
        const stages = report.stages.map((stage) => stage.stage === stageName && stage.status !== 'completed' ? { ...stage, status: 'failed' as const, detail: reason.slice(0, 1000) } : stage);
        await tx.update(dataDeletionJobs).set({ stagesReport: { ...report, stages }, updatedAt: new Date() } as Partial<typeof dataDeletionJobs.$inferInsert>).where(and(eq(dataDeletionJobs.id, job.id), eq(dataDeletionJobs.status, 'processing')));
      });
    }
  }

  private async finishDeletion(job: DeletionJob, report: DeletionReport, status: 'completed' | 'failed', errorMessage: string | null) {
    await this.db.transaction(async (tx) => {
      const [updated] = await tx.update(dataDeletionJobs).set({ status, stagesReport: report, errorMessage, updatedAt: new Date() } as Partial<typeof dataDeletionJobs.$inferInsert>).where(and(eq(dataDeletionJobs.id, job.id), eq(dataDeletionJobs.status, 'processing'))).returning({ id: dataDeletionJobs.id });
      if (!updated) throw new Error('Deletion job was not claimed by this worker.');
      await tx.insert(auditEvents).values({ actorId: job.requestedByUserId, actorType: 'parent', eventType: status === 'completed' ? 'data_deletion.completed' : 'data_deletion.failed', resourceType: 'data_deletion_job', resourceId: job.id, metadata: { stages: report.stages, errorMessage } } as typeof auditEvents.$inferInsert);
    });
  }

  async failDeletion(job: DeletionJob, reason: string) {
    await this.db.transaction(async (tx) => {
      const [updated] = await tx.update(dataDeletionJobs).set({ status: 'failed', errorMessage: reason.slice(0, 2000), updatedAt: new Date() } as Partial<typeof dataDeletionJobs.$inferInsert>).where(and(eq(dataDeletionJobs.id, job.id), eq(dataDeletionJobs.status, 'processing'))).returning({ id: dataDeletionJobs.id });
      if (updated) await tx.insert(auditEvents).values({ actorId: job.requestedByUserId, actorType: 'parent', eventType: 'data_deletion.failed', resourceType: 'data_deletion_job', resourceId: job.id, metadata: { reason: reason.slice(0, 1000) } } as typeof auditEvents.$inferInsert);
    });
  }

  async listPendingNotifications(limit: number, retryFailed: boolean): Promise<NotificationJob[]> {
    return this.db.select({ id: notifications.id, recipientId: notifications.recipientId, channel: notifications.channel, subject: notifications.subject, body: notifications.body }).from(notifications).where(retryFailed ? inArray(notifications.status, ['pending', 'failed']) : eq(notifications.status, 'pending')).orderBy(asc(notifications.createdAt)).limit(limit);
  }

  async deliverNotification(job: NotificationJob, adapter: DeliveryAdapter | undefined): Promise<'sent' | 'failed' | 'skipped'> {
    return this.db.transaction(async (tx) => {
      const [locked] = await tx.select().from(notifications).where(eq(notifications.id, job.id)).for('update', { skipLocked: true });
      if (!locked || (locked.status !== 'pending' && locked.status !== 'failed')) return 'skipped';
      if (!adapter) {
        await tx.update(notifications).set({ status: 'failed', failureReason: `No ${job.channel} delivery adapter is configured.`, sentAt: null } as Partial<typeof notifications.$inferInsert>).where(eq(notifications.id, job.id));
        return 'failed';
      }
      try {
        const acknowledgement = await adapter.send({ recipientId: locked.recipientId, subject: locked.subject, body: locked.body }, locked.id);
        if (!acknowledgement || acknowledgement.acknowledged !== true) throw new Error('Provider did not acknowledge delivery.');
        await tx.update(notifications).set({ status: 'sent', sentAt: new Date(), failureReason: null } as Partial<typeof notifications.$inferInsert>).where(eq(notifications.id, job.id));
        return 'sent';
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'Notification provider failed.';
        await tx.update(notifications).set({ status: 'failed', failureReason: reason.slice(0, 2000), sentAt: null } as Partial<typeof notifications.$inferInsert>).where(eq(notifications.id, job.id));
        return 'failed';
      }
    });
  }

  async queueFlaggedSafetyAlerts(limit: number): Promise<number> {
    const flagged = await this.db.select({ id: companionMessages.id }).from(companionMessages).where(eq(companionMessages.isFlagged, true)).orderBy(asc(companionMessages.createdAt)).limit(limit);
    let queued = 0;
    for (const item of flagged) queued += await this.queueOneFlaggedAlert(item.id);
    return queued;
  }

  private async queueOneFlaggedAlert(messageId: string): Promise<number> {
    return this.db.transaction(async (tx) => {
      const [message] = await tx.select({ id: companionMessages.id, householdId: children.householdId }).from(companionMessages).innerJoin(children, eq(companionMessages.childId, children.id)).where(and(eq(companionMessages.id, messageId), eq(companionMessages.isFlagged, true))).for('update');
      if (!message) return 0;
      const [existing] = await tx.select({ id: auditEvents.id }).from(auditEvents).where(and(eq(auditEvents.eventType, 'safety_alert.notifications_queued'), eq(auditEvents.resourceType, 'companion_message'), eq(auditEvents.resourceId, messageId))).limit(1);
      if (existing) return 0;
      const owner = await tx.select({ id: users.id }).from(households).innerJoin(users, eq(households.ownerId, users.id)).where(and(eq(households.id, message.householdId), eq(users.isActive, true)));
      const members = await tx.select({ id: users.id }).from(householdMembers).innerJoin(users, eq(householdMembers.userId, users.id)).where(and(eq(householdMembers.householdId, message.householdId), inArray(householdMembers.role, ['owner', 'guardian']), eq(users.isActive, true)));
      const recipientIds = [...new Set([...owner.map((row) => row.id), ...members.map((row) => row.id)])];
      const prefs = recipientIds.length ? await tx.select({ userId: notificationPreferences.userId, channel: notificationPreferences.channel }).from(notificationPreferences).where(and(inArray(notificationPreferences.userId, recipientIds), inArray(notificationPreferences.channel, ['email', 'push']), eq(notificationPreferences.enabled, true))) : [];
      const rows = prefs.map((preference) => ({ recipientId: preference.userId, channel: preference.channel, subject: 'A companion safety alert needs review', body: 'A companion message was flagged for safety review. Sign in to review the alert.' }));
      const inserted = rows.length ? await tx.insert(notifications).values(rows as typeof notifications.$inferInsert[]).returning({ id: notifications.id }) : [];
      await tx.insert(auditEvents).values({ actorType: 'system', eventType: 'safety_alert.notifications_queued', resourceType: 'companion_message', resourceId: messageId, metadata: { notificationIds: inserted.map((row) => row.id), recipientCount: new Set(rows.map((row) => row.recipientId)).size } } as typeof auditEvents.$inferInsert);
      return inserted.length;
    });
  }
}

type DeletionReport = { request: { scope: string; childId?: string }; stages: DeletionStage[] };
function parseDeletionReport(value: unknown): DeletionReport {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Deletion request report is missing or invalid.');
  const object = value as JsonObject;
  const request = object.request as JsonObject | undefined;
  if (!request || typeof request.scope !== 'string') throw new Error('Deletion scope metadata is missing.');
  const stages = Array.isArray(object.stages) ? object.stages as DeletionStage[] : [];
  if (stages.some((stage) => typeof stage.stage !== 'string' || !['pending', 'running', 'completed', 'failed'].includes(stage.status))) throw new Error('Deletion stage report is invalid.');
  return { request: { scope: request.scope, ...(typeof request.childId === 'string' ? { childId: request.childId } : {}) }, stages };
}

async function assertWorkerChildOwned(db: WorkerDb, householdId: string, childId: string) {
  const [child] = await db.select({ id: children.id }).from(children).where(and(eq(children.id, childId), eq(children.householdId, householdId))).limit(1);
  if (!child) throw new Error('Export child is not owned by the requested household.');
}
