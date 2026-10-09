import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  unique,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { emergencyContacts } from './privacy';

export const notificationChannelEnum = pgEnum('notification_channel', [
  'email',
  'push',
  'in_app',
  'sms',
  'voice',
]);
export const notificationStatusEnum = pgEnum('notification_status', [
  'pending',
  'sent',
  'failed',
  'delivered',
]);

// ── Notification deliveries ───────────────────────────────────────────────────

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  recipientId: uuid('recipient_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  emergencyContactId: uuid('emergency_contact_id').references(() => emergencyContacts.id, {
    onDelete: 'cascade',
  }),
  channel: notificationChannelEnum('channel').notNull(),
  subject: varchar('subject', { length: 255 }),
  body: text('body').notNull(),
  status: notificationStatusEnum('status').notNull().default('pending'),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  failureReason: text('failure_reason'),
  providerReference: varchar('provider_reference', { length: 80 }),
  providerStatus: varchar('provider_status', { length: 40 }),
  attempts: integer('attempts').notNull().default(0),
  lastAttemptAt: timestamp('last_attempt_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Per-user notification preferences ────────────────────────────────────────

export const notificationPreferences = pgTable(
  'notification_preferences',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    channel: notificationChannelEnum('channel').notNull(),
    enabled: boolean('enabled').notNull().default(true),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('notification_preferences_user_channel_unique').on(t.userId, t.channel),
  ],
);

// ── Inferred types ────────────────────────────────────────────────────────────

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type NewNotificationPreference = typeof notificationPreferences.$inferInsert;
