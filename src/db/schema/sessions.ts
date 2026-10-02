import {
  pgTable,
  uuid,
  timestamp,
  pgEnum,
  varchar,
  text,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
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
    // SHA-256 hex of opaque token stored in httpOnly cookie; 64 chars, unique, not null
    tokenHash: varchar('token_hash', { length: 64 }).notNull().unique(),
    userAgent: text('user_agent'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('sessions_token_hash_idx').on(t.tokenHash),
    check(
      'sessions_actor_fk_check',
      sql`(("actor_type" IN ('parent', 'admin') AND "user_id" IS NOT NULL AND "child_id" IS NULL) OR ("actor_type" = 'child' AND "user_id" IS NULL AND "child_id" IS NOT NULL))`,
    ),
  ],
);

export type DbSession = typeof sessions.$inferSelect;
export type NewDbSession = typeof sessions.$inferInsert;
