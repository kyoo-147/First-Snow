import {
  pgTable,
  uuid,
  text,
  numeric,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { children } from "./children";
import { sessions } from "./sessions";

// Note: vector column for embeddings will be added after embedding dimensions
// are selected and pgvector extension is enabled. For now, embedding is deferred.
export const memories = pgTable(
  "memories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    childId: uuid("child_id")
      .notNull()
      .references(() => children.id, { onDelete: "cascade" }),
    fact: text("fact").notNull(),
    sourceSessionId: uuid("source_session_id").references(() => sessions.id, {
      onDelete: "set null",
    }),
    confidence: numeric("confidence", { precision: 4, scale: 3, mode: "number" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("memories_child_id_idx").on(table.childId),
    index("memories_child_created_at_idx").on(table.childId, table.createdAt),
  ]
);
