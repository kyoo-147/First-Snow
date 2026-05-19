import {
  pgTable,
  uuid,
  text,
  numeric,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { sessions } from "./sessions";
import { emotionTypeEnum } from "./enums";

export const emotionEvents = pgTable(
  "emotion_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    emotion: emotionTypeEnum("emotion").notNull(),
    confidence: numeric("confidence", {
      precision: 4,
      scale: 3,
      mode: "number",
    }).notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("emotion_events_session_id_idx").on(table.sessionId),
    index("emotion_events_timestamp_idx").on(table.timestamp),
  ]
);
