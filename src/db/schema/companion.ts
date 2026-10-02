import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  boolean,
} from 'drizzle-orm/pg-core';
import { children } from './children';

export const companionTranscripts = pgTable('companion_transcripts', {
  id: uuid('id').primaryKey().defaultRandom(),
  childId: uuid('child_id')
    .notNull()
    .references(() => children.id, { onDelete: 'cascade' }),
  sessionId: uuid('session_id'),
  speaker: varchar('speaker', { length: 20 }).notNull(), // 'child' | 'snow'
  text: text('text').notNull(),
  isFlagged: boolean('is_flagged').notNull().default(false),
  flagReason: text('flag_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type CompanionTranscript = typeof companionTranscripts.$inferSelect;
export type NewCompanionTranscript = typeof companionTranscripts.$inferInsert;
