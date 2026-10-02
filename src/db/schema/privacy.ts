import {
  pgTable,
  uuid,
  varchar,
  boolean,
  integer,
  timestamp,
  jsonb,
  pgEnum,
  text,
} from 'drizzle-orm/pg-core';
import { children } from './children';
import { households } from './households';
import { users } from './users';

// ── Versioned capability consents ─────────────────────────────────────────────

export const capabilityConsentTypeEnum = pgEnum('capability_consent_type', [
  'mic',
  'camera',
  'vision',
  'screen',
]);

export const capabilityConsents = pgTable('capability_consents', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),
  childId: uuid('child_id').references(() => children.id, { onDelete: 'cascade' }),
  capability: capabilityConsentTypeEnum('capability').notNull(),
  // Incremented on each grant/revoke cycle; latest version wins
  version: integer('version').notNull().default(1),
  granted: boolean('granted').notNull(),
  grantedAt: timestamp('granted_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  grantedByUserId: uuid('granted_by_user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Legacy alias — old code that imported consentRecords continues to compile
export const consentRecords = capabilityConsents;

// ── Retention policies ────────────────────────────────────────────────────────

export const retentionPolicies = pgTable('retention_policies', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),
  resourceType: varchar('resource_type', { length: 100 }).notNull(),
  retentionDays: integer('retention_days').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Data export jobs ──────────────────────────────────────────────────────────

export const exportJobStatusEnum = pgEnum('export_job_status', [
  'pending',
  'processing',
  'completed',
  'failed',
  'expired',
]);

export const dataExportJobs = pgTable('data_export_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),
  requestedByUserId: uuid('requested_by_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  status: exportJobStatusEnum('status').notNull().default('pending'),
  archiveUrl: text('archive_url'),
  archiveExpiresAt: timestamp('archive_expires_at', { withTimezone: true }),
  stagesCompleted: jsonb('stages_completed'), // string[] of completed stage names
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Data deletion jobs ────────────────────────────────────────────────────────

export const deletionJobStatusEnum = pgEnum('deletion_job_status', [
  'pending',
  'processing',
  'completed',
  'failed',
]);

export const dataDeletionJobs = pgTable('data_deletion_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),
  requestedByUserId: uuid('requested_by_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  status: deletionJobStatusEnum('status').notNull().default('pending'),
  // { stageName: 'success'|'failed'|'skipped', details?: string }[]
  stagesReport: jsonb('stages_report'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Emergency contacts ────────────────────────────────────────────────────────

export const emergencyContacts = pgTable('emergency_contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  relationship: varchar('relationship', { length: 100 }),
  phone: varchar('phone', { length: 30 }),
  email: varchar('email', { length: 255 }),
  isPrimary: boolean('is_primary').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Inferred types ────────────────────────────────────────────────────────────

export type CapabilityConsent = typeof capabilityConsents.$inferSelect;
export type NewCapabilityConsent = typeof capabilityConsents.$inferInsert;
// Legacy aliases
export type ConsentRecord = CapabilityConsent;
export type NewConsentRecord = NewCapabilityConsent;

export type RetentionPolicy = typeof retentionPolicies.$inferSelect;
export type NewRetentionPolicy = typeof retentionPolicies.$inferInsert;

export type DataExportJob = typeof dataExportJobs.$inferSelect;
export type NewDataExportJob = typeof dataExportJobs.$inferInsert;

export type DataDeletionJob = typeof dataDeletionJobs.$inferSelect;
export type NewDataDeletionJob = typeof dataDeletionJobs.$inferInsert;

export type EmergencyContact = typeof emergencyContacts.$inferSelect;
export type NewEmergencyContact = typeof emergencyContacts.$inferInsert;
