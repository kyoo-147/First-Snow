import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  pgEnum,
  unique,
  index,
} from 'drizzle-orm/pg-core';
import { children } from './children';

export const companionSpeakerEnum = pgEnum('companion_speaker', ['child', 'snow']);

// ── Companion sessions (one per activity session) ─────────────────────────────

export const companionSessions = pgTable('companion_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  childId: uuid('child_id')
    .notNull()
    .references(() => children.id, { onDelete: 'cascade' }),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  metadata: text('metadata'), // JSON string for ad-hoc session metadata
});

// ── Companion messages with idempotency and safety flags ──────────────────────

export const companionMessages = pgTable(
  'companion_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => companionSessions.id, { onDelete: 'cascade' }),
    childId: uuid('child_id')
      .notNull()
      .references(() => children.id, { onDelete: 'cascade' }),
    // Client-supplied idempotency key — unique per session; prevents duplicate inserts on reconnect
    clientMessageId: varchar('client_message_id', { length: 128 }),
    speaker: companionSpeakerEnum('speaker').notNull(),
    text: text('text').notNull(),
    isFlagged: boolean('is_flagged').notNull().default(false),
    flagReason: text('flag_reason'),
    safetyScore: integer('safety_score'), // 0-100; null = not yet scored
    safetyAlerts: text('safety_alerts'), // JSON-encoded array of alert codes
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Idempotency: one clientMessageId per session
    unique('companion_messages_session_client_id_unique').on(t.sessionId, t.clientMessageId),
    index('companion_messages_child_id_idx').on(t.childId),
  ],
);

// Backward-compat alias — callers that used `companionTranscripts` continue to compile
export const companionTranscripts = companionMessages;

// ── Inferred types ────────────────────────────────────────────────────────────

export type CompanionSession = typeof companionSessions.$inferSelect;
export type NewCompanionSession = typeof companionSessions.$inferInsert;
export type CompanionMessage = typeof companionMessages.$inferSelect;
export type NewCompanionMessage = typeof companionMessages.$inferInsert;
// Legacy aliases
export type CompanionTranscript = CompanionMessage;
export type NewCompanionTranscript = NewCompanionMessage;
