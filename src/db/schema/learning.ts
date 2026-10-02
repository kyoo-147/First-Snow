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
  unique,
} from 'drizzle-orm/pg-core';
import { children } from './children';

export const lessonStepTypeEnum = pgEnum('lesson_step_type', [
  'intro',
  'question',
  'activity',
  'summary',
]);

export const lessonStatusEnum = pgEnum('lesson_status', [
  'not_started',
  'in_progress',
  'completed',
]);

export const lessonProgressStatusEnum = pgEnum('lesson_progress_status', [
  'not_started',
  'in_progress',
  'completed',
]);

export const rewardTypeEnum = pgEnum('reward_type', ['star', 'badge', 'streak', 'milestone']);

// ── Lesson catalog ────────────────────────────────────────────────────────────

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

// ── Lesson steps ──────────────────────────────────────────────────────────────

export const lessonSteps = pgTable(
  'lesson_steps',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lessonId: uuid('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    stepOrder: integer('step_order').notNull(),
    stepType: lessonStepTypeEnum('step_type').notNull().default('question'),
    prompt: text('prompt').notNull(),
    correctAnswer: text('correct_answer'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('lesson_steps_lesson_order_unique').on(t.lessonId, t.stepOrder)],
);

// ── Lesson attempts ───────────────────────────────────────────────────────────

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

// ── Step-level answers (per attempt + step) ───────────────────────────────────

export const lessonStepAnswers = pgTable('lesson_step_answers', {
  id: uuid('id').primaryKey().defaultRandom(),
  attemptId: uuid('attempt_id')
    .notNull()
    .references(() => lessonAttempts.id, { onDelete: 'cascade' }),
  stepId: uuid('step_id')
    .notNull()
    .references(() => lessonSteps.id, { onDelete: 'cascade' }),
  answer: text('answer'),
  isCorrect: boolean('is_correct'),
  answeredAt: timestamp('answered_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── Per-child lesson progress (aggregate view, prevents duplicate reward) ─────

export const lessonProgress = pgTable(
  'lesson_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    childId: uuid('child_id')
      .notNull()
      .references(() => children.id, { onDelete: 'cascade' }),
    lessonId: uuid('lesson_id')
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    status: lessonProgressStatusEnum('status').notNull().default('not_started'),
    bestScore: integer('best_score'),
    completionCount: integer('completion_count').notNull().default(0),
    lastAttemptAt: timestamp('last_attempt_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('lesson_progress_child_lesson_unique').on(t.childId, t.lessonId)],
);

// ── Rewards ───────────────────────────────────────────────────────────────────

export const rewards = pgTable('rewards', {
  id: uuid('id').primaryKey().defaultRandom(),
  childId: uuid('child_id')
    .notNull()
    .references(() => children.id, { onDelete: 'cascade' }),
  rewardType: rewardTypeEnum('reward_type').notNull(),
  label: varchar('label', { length: 255 }).notNull(),
  awardedAt: timestamp('awarded_at', { withTimezone: true }).notNull().defaultNow(),
  sourceAttemptId: uuid('source_attempt_id').references(() => lessonAttempts.id, {
    onDelete: 'set null',
  }),
});

// ── Inferred types ────────────────────────────────────────────────────────────

export type Lesson = typeof lessons.$inferSelect;
export type NewLesson = typeof lessons.$inferInsert;
export type LessonStep = typeof lessonSteps.$inferSelect;
export type NewLessonStep = typeof lessonSteps.$inferInsert;
export type LessonAttempt = typeof lessonAttempts.$inferSelect;
export type NewLessonAttempt = typeof lessonAttempts.$inferInsert;
export type LessonStepAnswer = typeof lessonStepAnswers.$inferSelect;
export type NewLessonStepAnswer = typeof lessonStepAnswers.$inferInsert;
export type LessonProgress = typeof lessonProgress.$inferSelect;
export type NewLessonProgress = typeof lessonProgress.$inferInsert;
export type Reward = typeof rewards.$inferSelect;
export type NewReward = typeof rewards.$inferInsert;
