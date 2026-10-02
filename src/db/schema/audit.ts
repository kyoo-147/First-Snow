import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  jsonb,
  inet,
} from 'drizzle-orm/pg-core';

export const auditEvents = pgTable('audit_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  actorId: uuid('actor_id'),
  actorType: varchar('actor_type', { length: 20 }),
  resourceType: varchar('resource_type', { length: 100 }),
  resourceId: uuid('resource_id'),
  metadata: jsonb('metadata'),
  ipAddress: inet('ip_address'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type AuditEvent = typeof auditEvents.$inferSelect;
export type NewAuditEvent = typeof auditEvents.$inferInsert;
