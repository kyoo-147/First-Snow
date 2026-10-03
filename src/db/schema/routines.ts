import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { children } from './children';

export const routineTimeOfDayEnum = pgEnum('routine_time_of_day', [
  'morning',
  'afternoon',
  'evening',
  'anytime',
]);

export const routines = pgTable(
  'routines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    childId: uuid('child_id')
      .notNull()
      .references(() => children.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    timeOfDay: routineTimeOfDayEnum('time_of_day').notNull().default('anytime'),
    scheduledTime: varchar('scheduled_time', { length: 5 }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('routines_child_id_idx').on(table.childId)],
);

export const routineSteps = pgTable(
  'routine_steps',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    routineId: uuid('routine_id')
      .notNull()
      .references(() => routines.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    stepOrder: integer('step_order').notNull(),
    durationMinutes: integer('duration_minutes').notNull().default(5),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('routine_steps_routine_order_unique').on(table.routineId, table.stepOrder)],
);

export const routineStepCompletions = pgTable(
  'routine_step_completions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    routineStepId: uuid('routine_step_id')
      .notNull()
      .references(() => routineSteps.id, { onDelete: 'cascade' }),
    childId: uuid('child_id')
      .notNull()
      .references(() => children.id, { onDelete: 'cascade' }),
    completionDate: date('completion_date').notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('routine_step_completions_step_date_unique').on(
      table.routineStepId,
      table.completionDate,
    ),
    index('routine_step_completions_child_date_idx').on(table.childId, table.completionDate),
  ],
);

export type Routine = typeof routines.$inferSelect;
export type RoutineStep = typeof routineSteps.$inferSelect;
export type RoutineStepCompletion = typeof routineStepCompletions.$inferSelect;
