import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { children } from './children';

export const lessonStatusEnum = pgEnum('lesson_status', [
  'not_started',
  'in_progress',
  'completed',
]);

export const lessons = pgTable('lessons', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 100 }).notNull(),
  gradeLevel: varchar('grade_level', { length: 50 }),
  content: text('content'),
  estimatedMinutes: integer('estimated_minutes').notNull().default(15),
  isPublished: boolean('is_published').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const lessonAttempts = pgTable('lesson_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  childId: uuid('child_id')
    .notNull()
    .references(() => children.id, { onDelete: 'cascade' }),
  lessonId: uuid('lesson_id')
    .notNull()
    .references(() => lessons.id, { onDelete: 'cascade' }),
  status: lessonStatusEnum('status').notNull().default('not_started'),
  score: integer('score'),
  answers: jsonb('answers'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Lesson = typeof lessons.$inferSelect;
export type NewLesson = typeof lessons.$inferInsert;
export type LessonAttempt = typeof lessonAttempts.$inferSelect;
export type NewLessonAttempt = typeof lessonAttempts.$inferInsert;
