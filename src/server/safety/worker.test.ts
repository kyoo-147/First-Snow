import { describe, expect, it, vi } from 'vitest';
import { runSafetyJobsOnce, type DeliveryAdapter, type ExportJob, type NotificationJob, type ObjectStore, type RetentionPurgeResult, type SafetyWorkerRepository } from './worker';
import { isDeletionComplete } from './worker-repository';

vi.mock('server-only', () => ({}));

const exportJob: ExportJob = { id: 'export-1', householdId: 'household-1', requestedByUserId: 'parent-1' };
const notification: NotificationJob = { id: 'notice-1', recipientId: 'parent-1', channel: 'email', subject: 'Safety review', body: 'Review the alert.' };

class FakeRepository implements SafetyWorkerRepository {
  exports = [exportJob];
  notifications = [notification];
  completedExports: unknown[] = [];
  failedExports: string[] = [];
  failedDeletions: string[] = [];
  deletionState: 'completed' | 'failed' | 'blocked' = 'completed';
  notificationState: 'sent' | 'failed' | 'skipped' = 'sent';
  queuedAlerts = 0;
  retention: RetentionPurgeResult = { purgedRecords: 0, policiesApplied: 0 };
  purgeCalls: Date[] = [];
  request = { format: 'zip' as const, includeTranscripts: true, includeEmotionTimeline: false, includeLearningProgress: true };
  exportData: Record<string, unknown> = { children: [{ id: 'child-1', displayName: 'Actual child record' }], transcripts: [] };
  async claimExports() { const claimed = this.exports; this.exports = []; return claimed; }
  async getExportRequest() { return this.request; }
  async collectExport() { return this.exportData; }
  async completeExport(_job: ExportJob, result: unknown) { this.completedExports.push(result); }
  async failExport(_job: ExportJob, reason: string) { this.failedExports.push(reason); }
  async claimDeletions() { return [{ id: 'delete-1', householdId: 'household-1', requestedByUserId: 'parent-1' }]; }
  async processDeletion() { return this.deletionState; }
  async failDeletion(_job: { id: string }, reason: string) { this.deletionState = 'failed'; this.failedDeletions.push(reason); }
  async listPendingNotifications() { return this.notifications; }
  async deliverNotification(_job: NotificationJob, adapter: DeliveryAdapter | undefined): Promise<'sent' | 'failed' | 'skipped'> {
    if (!adapter) { this.notificationState = 'failed'; return this.notificationState; }
    try { await adapter.send({ recipientId: _job.recipientId, subject: _job.subject, body: _job.body }, _job.id); this.notificationState = 'sent'; }
    catch { this.notificationState = 'failed'; }
    return this.notificationState;
  }
  async queueFlaggedSafetyAlerts() { return this.queuedAlerts; }
  async purgeExpiredRetention(now: Date) { this.purgeCalls.push(now); return this.retention; }
}

function memoryStore(options: { corruptRead?: boolean; url?: string } = {}) {
  let stored: Uint8Array | null = null;
  const store: ObjectStore = {
    async put(_key, body) { stored = body; },
    async get() { return options.corruptRead ? Buffer.from('different bytes') : stored; },
    async signedDownloadUrl() { return options.url ?? 'https://objects.example.test/export?signature=verified'; },
  };
  return store;
}

describe('safety worker orchestration', () => {
  it('verifies stored bytes and URL before completing an export', async () => {
    const repository = new FakeRepository();
    const result = await runSafetyJobsOnce({ repository, adapters: { objectStore: memoryStore() }, now: new Date('2026-01-01T00:00:00Z') });
    expect(result.exports.completed).toBe(1);
    expect(repository.completedExports).toHaveLength(1);
    expect(repository.failedExports).toHaveLength(0);
    expect(repository.completedExports[0]).toMatchObject({ archiveUrl: 'https://objects.example.test/export?signature=verified', expiresAt: new Date('2026-01-02T00:00:00Z') });
  });

  it('fails an export when storage readback does not match the upload', async () => {
    const repository = new FakeRepository();
    const result = await runSafetyJobsOnce({ repository, adapters: { objectStore: memoryStore({ corruptRead: true }) } });
    expect(result.exports.failed).toBe(1);
    expect(repository.completedExports).toHaveLength(0);
    expect(repository.failedExports[0]).toContain('matching checksum');
  });

  it('fails pending exports when object storage is not configured', async () => {
    const repository = new FakeRepository();
    const result = await runSafetyJobsOnce({ repository, adapters: {} });
    expect(result.exports).toEqual({ completed: 0, failed: 1 });
    expect(repository.failedExports[0]).toContain('not configured');
  });

  it('fails requested exports when an included dataset is unavailable', async () => {
    const repository = new FakeRepository();
    repository.request = { ...repository.request, includeEmotionTimeline: true };
    repository.collectExport = async () => { throw new Error('No emotion timeline table exists.'); };
    const result = await runSafetyJobsOnce({ repository, adapters: { objectStore: memoryStore() } });
    expect(result.exports.failed).toBe(1);
    expect(repository.completedExports).toHaveLength(0);
    expect(repository.failedExports[0]).toContain('emotion timeline');
  });

  it('does not complete an export when the adapter returns a non-HTTPS URL', async () => {
    const repository = new FakeRepository();
    const result = await runSafetyJobsOnce({ repository, adapters: { objectStore: memoryStore({ url: 'http://objects.example.test/export' }) } });
    expect(result.exports.failed).toBe(1);
    expect(repository.completedExports).toHaveLength(0);
    expect(repository.failedExports[0]).toContain('invalid download URL');
  });

  it('passes a stable idempotency key to the provider and records only acknowledged delivery', async () => {
    const repository = new FakeRepository();
    const keys: string[] = [];
    const email: DeliveryAdapter = { async send(_message, key) { keys.push(key); return { acknowledged: true }; } };
    const result = await runSafetyJobsOnce({ repository, adapters: { email } });
    expect(result.notifications.sent).toBe(1);
    expect(keys).toEqual(['notice-1']);
  });

  it('records missing notification providers as failed', async () => {
    const repository = new FakeRepository();
    const result = await runSafetyJobsOnce({ repository, adapters: {} });
    expect(result.notifications.failed).toBe(1);
    expect(repository.notificationState).toBe('failed');
  });

  it('records a deletion failure when repository processing throws', async () => {
    const repository = new FakeRepository();
    repository.processDeletion = async () => { throw new Error('stage transaction failed'); };
    const result = await runSafetyJobsOnce({ repository, adapters: {} });
    expect(result.deletions.failed).toBe(1);
    expect(repository.failedDeletions).toEqual(['stage transaction failed']);
  });

  it('preserves failed deletion state and queued alert count in run results', async () => {
    const repository = new FakeRepository();
    repository.deletionState = 'blocked';
    repository.queuedAlerts = 2;
    const result = await runSafetyJobsOnce({ repository, adapters: {} });
    expect(result.deletions.blocked).toBe(1);
    expect(result.safetyAlertsQueued).toBe(2);
  });

  it('enforces stored retention windows through the repository purge task', async () => {
    const repository = new FakeRepository();
    repository.retention = { purgedRecords: 4, policiesApplied: 2 };
    const now = new Date('2026-01-01T00:00:00Z');
    const result = await runSafetyJobsOnce({ repository, adapters: {}, now });
    expect(result.retention).toEqual({ purgedRecords: 4, policiesApplied: 2 });
    expect(repository.purgeCalls).toEqual([now]);
  });

  it('leaves subsequent runs without claimed exports idle, supporting repository-level idempotency', async () => {
    const repository = new FakeRepository();
    const store = memoryStore();
    await runSafetyJobsOnce({ repository, adapters: { objectStore: store } });
    repository.completedExports.length = 0;
    const result = await runSafetyJobsOnce({ repository, adapters: { objectStore: store } });
    expect(result.exports.completed).toBe(0);
    expect(repository.completedExports).toHaveLength(0);
  });

  it('calls failDeletion and increments failed count when processDeletion throws', async () => {
    const repository = new FakeRepository();
    repository.processDeletion = async () => { throw new Error('Database connection lost.'); };
    const result = await runSafetyJobsOnce({ repository, adapters: {} });
    expect(result.deletions.failed).toBe(1);
    expect(repository.failedDeletions).toHaveLength(1);
    expect(repository.failedDeletions[0]).toContain('Database connection lost');
  });

  it('does not call failDeletion when processDeletion returns a terminal state', async () => {
    const repository = new FakeRepository();
    repository.deletionState = 'completed';
    const result = await runSafetyJobsOnce({ repository, adapters: {} });
    expect(result.deletions.completed).toBe(1);
    expect(repository.failedDeletions).toHaveLength(0);
  });

  it('does not double-count a notification whose deliverNotification returns skipped', async () => {
    const repository = new FakeRepository();
    repository.deliverNotification = async () => 'skipped';
    const result = await runSafetyJobsOnce({ repository, adapters: {} });
    expect(result.notifications.sent).toBe(0);
    expect(result.notifications.failed).toBe(0);
  });
});

describe('safety worker CLI: no DATABASE_URL', () => {
  it('throws a human-readable error immediately when DATABASE_URL is absent', async () => {
    const original = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      // Importing the constructor directly keeps this a unit-level check
      // without spawning a subprocess — the constructor throws synchronously.
      const { DatabaseSafetyWorkerRepository } = await import('./worker-repository');
      expect(() => new DatabaseSafetyWorkerRepository()).toThrow('DATABASE_URL is required');
    } finally {
      if (original !== undefined) process.env.DATABASE_URL = original;
    }
  });

  it('main() propagates a DATABASE_URL error that causes process.exitCode to be set', async () => {
    const original = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      const { main } = await import('./run-worker');
      await expect(main([])).rejects.toThrow('DATABASE_URL is required');
    } finally {
      if (original !== undefined) process.env.DATABASE_URL = original;
    }
  });
});

describe('deletion stage resolution', () => {
  it('treats skipped stages as resolved but a failed stage as unresolved', () => {
    expect(isDeletionComplete([{ status: 'completed' }, { status: 'skipped' }])).toBe(true);
    expect(isDeletionComplete([{ status: 'completed' }, { status: 'failed' }])).toBe(false);
    expect(isDeletionComplete([{ status: 'pending' }])).toBe(false);
  });
});
