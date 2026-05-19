import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  numeric,
  index,
} from "drizzle-orm/pg-core";
import { children } from "./children";
import { sessionStatusEnum } from "./enums";

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    childId: uuid("child_id")
      .notNull()
      .references(() => children.id, { onDelete: "cascade" }),
    status: sessionStatusEnum("status")
      .notNull()
      .default("active"),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    durationSeconds: integer("duration_seconds"),
    score: numeric("score", { precision: 5, scale: 2, mode: "number" }),
    aiNotes: text("ai_notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("sessions_child_id_idx").on(table.childId),
    index("sessions_child_status_idx").on(table.childId, table.status),
    index("sessions_started_at_idx").on(table.startedAt),
  ]
);
