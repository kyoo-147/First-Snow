import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import type { LessonNode } from "@agentkid/domain";
import { children } from "./children";
import {
  lessonCategoryEnum,
  lessonFrameworkEnum,
  lessonStatusEnum,
} from "./enums";

export const lessons = pgTable(
  "lessons",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    childId: uuid("child_id")
      .notNull()
      .references(() => children.id, { onDelete: "cascade" }),
    framework: lessonFrameworkEnum("framework").notNull(),
    category: lessonCategoryEnum("category").notNull(),
    title: text("title").notNull(),
    status: lessonStatusEnum("status")
      .notNull()
      .default("suggested"),
    nodes: jsonb("nodes").$type<LessonNode[]>().notNull().default([]),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("lessons_child_id_idx").on(table.childId),
    index("lessons_status_idx").on(table.status),
    index("lessons_child_status_idx").on(table.childId, table.status),
  ]
);
