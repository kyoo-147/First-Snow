import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import type { AlertChannel, EmotionType } from "@agentkid/domain";
import { sessions } from "./sessions";
import {
  alertSeverityEnum,
  alertStatusEnum,
  alertTriggerTypeEnum,
} from "./enums";

export const alerts = pgTable(
  "alerts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    severity: alertSeverityEnum("severity").notNull(),
    triggerType: alertTriggerTypeEnum("trigger_type").notNull(),
    message: text("message").notNull(),
    emotionHistory: jsonb("emotion_history").$type<
      Array<{ emotion: EmotionType; confidence: number }>
    >(),
    channels: jsonb("channels").$type<AlertChannel[]>().notNull().default([]),
    status: alertStatusEnum("status")
      .notNull()
      .default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    acknowledgedAt: timestamp("acknowledged_at", { withTimezone: true }),
  },
  (table) => [
    index("alerts_session_id_idx").on(table.sessionId),
    index("alerts_severity_idx").on(table.severity),
    index("alerts_created_at_idx").on(table.createdAt),
  ]
);
