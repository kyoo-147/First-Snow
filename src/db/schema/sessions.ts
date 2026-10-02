import {
  pgTable,
  uuid,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { children } from './children';

export const sessionActorEnum = pgEnum('session_actor', ['parent', 'child', 'admin']);

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorType: sessionActorEnum('actor_type').notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  childId: uuid('child_id').references(() => children.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type DbSession = typeof sessions.$inferSelect;
export type NewDbSession = typeof sessions.$inferInsert;
