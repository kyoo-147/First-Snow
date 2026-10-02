import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  boolean,
} from 'drizzle-orm/pg-core';
import { households } from './households';

export const children = pgTable('children', {
  id: uuid('id').primaryKey().defaultRandom(),
  householdId: uuid('household_id')
    .notNull()
    .references(() => households.id, { onDelete: 'cascade' }),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  pinHash: varchar('pin_hash', { length: 255 }).notNull(),
  gradeLevel: varchar('grade_level', { length: 50 }),
  age: integer('age'),
  avatarUrl: varchar('avatar_url', { length: 1024 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Child = typeof children.$inferSelect;
export type NewChild = typeof children.$inferInsert;
