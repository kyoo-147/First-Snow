import { describe, expect, it, vi } from 'vitest';
import { runSafetyJobsOnce, type DeliveryAdapter, type ExportJob, type NotificationJob, type ObjectStore, type SafetyWorkerRepository } from './worker';

vi.mock('server-only', () => ({}));

const exportJob: ExportJob = { id: 'export-1', householdId: 'household-1', requestedByUserId: 'parent-1' };
const notification: NotificationJob = { id: 'notice-1', recipientId: 'parent-1', channel: 'email', subject: 'Safety review', body: 'Review the alert.' };

class FakeRepository implements SafetyWorkerRepository {
  exports = [exportJob];
  notifications = [notification];
  completedExports: unknown[] = [];
  failedExports: string[] = [];
  deletionState: 'completed' | 'failed' | 'blocked' = 'completed';
  notificationState: 'sent' | 'failed' | 'skipped' = 'sent';
  queuedAlerts = 0;
  request = { format: 'zip' as const, includeTranscripts: true, includeEmotionTimeline: false, includeLearningProgress: true };
  exportData: Record<string, unknown> = { children: [{ id: 'child-1', displayName: 'Actual child record' }], transcripts: [] };
  async claimExports() { const claimed = this.exports; this.exports = []; return claimed; }
  async getExportRequest() { return this.request; }
  async collectExport() { return this.exportData; }
  async completeExport(_job: ExportJob, result: unknown) { this.completedExports.push(result); }
  async failExport(_job: ExportJob, reason: string) { this.failedExports.push(reason); }
  async claimDeletions() { return [{ id: 'delete-1', householdId: 'household-1', requestedByUserId: 'parent-1' }]; }
  async processDeletion() { return this.deletionState; }
  async listPendingNotifications() { return this.notifications; }
  async deliverNotification(_job: NotificationJob, adapter: DeliveryAdapter | undefined) {
    if (!adapter) { this.notificationState = 'failed'; return this.notificationState; }
    try { await adapter.send({ recipientId: _job.recipientId, subject: _job.subject, body: _job.body }, _job.id); this.notificationState = 'sent'; }
    catch { this.notificationState = 'failed'; }
    return this.notificationState;
  }
  async queueFlaggedSafetyAlerts() { return this.queuedAlerts; }
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

  it('preserves failed deletion state and queued alert count in run results', async () => {
    const repository = new FakeRepository();
    repository.deletionState = 'blocked';
    repository.queuedAlerts = 2;
    const result = await runSafetyJobsOnce({ repository, adapters: {} });
    expect(result.deletions.blocked).toBe(1);
    expect(result.safetyAlertsQueued).toBe(2);
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
});
