import { createHash } from 'node:crypto';

export interface ObjectStore {
  put(key: string, body: Uint8Array, contentType: string): Promise<void>;
  get(key: string): Promise<Uint8Array | null>;
  signedDownloadUrl(key: string, expiresAt: Date): Promise<string>;
  delete?(key: string): Promise<void>;
}

export interface DeliveryAdapter {
  /** Implementations must deduplicate sends by this key to cover a provider acknowledgement followed by a database rollback. */
  send(message: { recipientId: string; subject: string | null; body: string }, idempotencyKey: string): Promise<{ acknowledged: true }>;
}

export interface WorkerAdapters {
  objectStore?: ObjectStore;
  email?: DeliveryAdapter;
  push?: DeliveryAdapter;
}

export interface ExportJob {
  id: string;
  householdId: string;
  requestedByUserId: string;
}

export interface ExportRequest {
  childId?: string;
  format: 'json' | 'csv' | 'zip';
  includeTranscripts: boolean;
  includeEmotionTimeline: boolean;
  includeLearningProgress: boolean;
}

export interface DeletionJob {
  id: string;
  householdId: string;
  requestedByUserId: string;
}

export interface NotificationJob {
  id: string;
  recipientId: string;
  channel: 'email' | 'push' | 'in_app';
  subject: string | null;
  body: string;
}

export interface SafetyWorkerRepository {
  claimExports(limit: number, retryFailed: boolean): Promise<ExportJob[]>;
  getExportRequest(job: ExportJob): Promise<ExportRequest>;
  collectExport(job: ExportJob, request: ExportRequest): Promise<Record<string, unknown>>;
  completeExport(job: ExportJob, result: { archiveUrl: string; expiresAt: Date; stagesCompleted: string[] }): Promise<void>;
  failExport(job: ExportJob, reason: string): Promise<void>;
  claimDeletions(limit: number, retryFailed: boolean): Promise<DeletionJob[]>;
  processDeletion(job: DeletionJob, retryFailed: boolean): Promise<'completed' | 'failed' | 'blocked'>;
  failDeletion(job: DeletionJob, reason: string): Promise<void>;
  listPendingNotifications(limit: number, retryFailed: boolean): Promise<NotificationJob[]>;
  deliverNotification(job: NotificationJob, adapter: DeliveryAdapter | undefined): Promise<'sent' | 'failed' | 'skipped'>;
  queueFlaggedSafetyAlerts(limit: number): Promise<number>;
  close?(): Promise<void>;
}

export interface RunOnceOptions {
  repository: SafetyWorkerRepository;
  adapters: WorkerAdapters;
  limit?: number;
  retryFailed?: boolean;
  now?: Date;
  downloadLifetimeMs?: number;
}

export interface RunOnceResult {
  exports: { completed: number; failed: number };
  deletions: { completed: number; failed: number; blocked: number };
  notifications: { sent: number; failed: number };
  safetyAlertsQueued: number;
}

export async function runSafetyJobsOnce(options: RunOnceOptions): Promise<RunOnceResult> {
  const { repository, adapters } = options;
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
  const now = options.now ?? new Date();
  const result: RunOnceResult = {
    exports: { completed: 0, failed: 0 },
    deletions: { completed: 0, failed: 0, blocked: 0 },
    notifications: { sent: 0, failed: 0 },
    safetyAlertsQueued: 0,
  };

  result.safetyAlertsQueued = await repository.queueFlaggedSafetyAlerts(limit);

  const exportJobs = await repository.claimExports(limit, options.retryFailed ?? false);
  for (const job of exportJobs) {
    try {
      if (!adapters.objectStore) throw new Error('Object storage is not configured.');
      const request = await repository.getExportRequest(job);
      const data = await repository.collectExport(job, request);
      const body = encodeExport(data, request.format);
      const key = `safety-exports/${job.householdId}/${job.id}.${request.format}`;
      const checksum = createHash('sha256').update(body).digest('hex');
      await adapters.objectStore.put(key, body, contentType(request.format));
      const stored = await adapters.objectStore.get(key);
      if (!stored || createHash('sha256').update(stored).digest('hex') !== checksum) {
        throw new Error('Uploaded export could not be read back with a matching checksum.');
      }
      const expiresAt = new Date(now.getTime() + (options.downloadLifetimeMs ?? 24 * 60 * 60 * 1000));
      const archiveUrl = await adapters.objectStore.signedDownloadUrl(key, expiresAt);
      if (!isValidDownloadUrl(archiveUrl)) throw new Error('Object storage returned an invalid download URL.');
      await repository.completeExport(job, { archiveUrl, expiresAt, stagesCompleted: Object.keys(data) });
      result.exports.completed++;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Export failed for an unknown reason.';
      await repository.failExport(job, reason);
      result.exports.failed++;
    }
  }

  const deletionJobs = await repository.claimDeletions(limit, options.retryFailed ?? false);
  for (const job of deletionJobs) {
    try {
      const state = await repository.processDeletion(job, options.retryFailed ?? false);
      result.deletions[state]++;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Deletion worker failed for an unknown reason.';
      await repository.failDeletion(job, reason);
      result.deletions.failed++;
    }
  }

  const notifications = await repository.listPendingNotifications(limit, options.retryFailed ?? false);
  for (const job of notifications) {
    const adapter = job.channel === 'email' ? adapters.email : job.channel === 'push' ? adapters.push : undefined;
    const state = await repository.deliverNotification(job, adapter);
    if (state === 'sent') result.notifications.sent++;
    if (state === 'failed') result.notifications.failed++;
  }

  return result;
}

function contentType(format: ExportRequest['format']): string {
  return format === 'json' ? 'application/json' : format === 'csv' ? 'text/csv; charset=utf-8' : 'application/zip';
}

function encodeExport(data: Record<string, unknown>, format: ExportRequest['format']): Uint8Array {
  if (format === 'json') return Buffer.from(JSON.stringify(data, null, 2));
  if (format === 'csv') {
    const lines = ['section,record_json'];
    for (const [section, rows] of Object.entries(data)) {
      if (!Array.isArray(rows)) continue;
      for (const row of rows) lines.push(`${csv(section)},${csv(JSON.stringify(row))}`);
    }
    return Buffer.from(lines.join('\r\n'));
  }
  return createZip([{ name: 'export.json', body: Buffer.from(JSON.stringify(data, null, 2)) }]);
}

function csv(value: string): string { return `"${value.replaceAll('"', '""')}"`; }

function isValidDownloadUrl(value: string): boolean {
  try { const url = new URL(value); return url.protocol === 'https:'; } catch { return false; }
}

function createZip(files: Array<{ name: string; body: Buffer }>): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;
  for (const file of files) {
    const name = Buffer.from(file.name);
    const crc = crc32(file.body);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8); local.writeUInt16LE(0, 10); local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14); local.writeUInt32LE(file.body.length, 18); local.writeUInt32LE(file.body.length, 22); local.writeUInt16LE(name.length, 26);
    localParts.push(local, name, file.body);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8); central.writeUInt16LE(0, 10); central.writeUInt16LE(0, 12); central.writeUInt16LE(0, 14);
    central.writeUInt32LE(crc, 16); central.writeUInt32LE(file.body.length, 20); central.writeUInt32LE(file.body.length, 24);
    central.writeUInt16LE(name.length, 28); central.writeUInt16LE(0, 30); central.writeUInt16LE(0, 32); central.writeUInt16LE(0, 34); central.writeUInt16LE(0, 36); central.writeUInt32LE(0, 38); central.writeUInt32LE(offset, 42);
    centralParts.push(central, name);
    offset += local.length + name.length + file.body.length;
  }
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(0, 4); end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10); end.writeUInt32LE(centralSize, 12); end.writeUInt32LE(offset, 16); end.writeUInt16LE(0, 20);
  return Buffer.concat([...localParts, ...centralParts, end]);
}

function crc32(data: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
