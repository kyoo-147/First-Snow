import {
  pgTable,
  uuid,
  timestamp,
  pgEnum,
  varchar,
  text,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { children } from './children';

export const sessionActorEnum = pgEnum('session_actor', ['parent', 'child', 'admin']);

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorType: sessionActorEnum('actor_type').notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    childId: uuid('child_id').references(() => children.id, { onDelete: 'cascade' }),
    // SHA-256 hex of opaque token stored in httpOnly cookie; 64 chars
    tokenHash: varchar('token_hash', { length: 64 }),
    userAgent: text('user_agent'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('sessions_token_hash_idx').on(t.tokenHash)],
);

export type DbSession = typeof sessions.$inferSelect;
export type NewDbSession = typeof sessions.$inferInsert;
