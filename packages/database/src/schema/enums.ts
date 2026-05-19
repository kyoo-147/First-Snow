import { pgEnum } from "drizzle-orm/pg-core";

export const childConditionEnum = pgEnum("child_condition", [
  "ASD",
  "language_delay",
  "both",
]);

export const sessionStatusEnum = pgEnum("session_status", [
  "active",
  "completed",
  "interrupted",
]);

export const messageRoleEnum = pgEnum("message_role", ["user", "assistant"]);

export const emotionTypeEnum = pgEnum("emotion_type", [
  "happy",
  "sad",
  "angry",
  "fearful",
  "surprised",
  "neutral",
]);

export const lessonFrameworkEnum = pgEnum("lesson_framework", [
  "ABA",
  "PECS",
  "SocialStories",
]);

export const lessonCategoryEnum = pgEnum("lesson_category", [
  "emotion",
  "social",
  "routine",
]);

export const lessonStatusEnum = pgEnum("lesson_status", [
  "suggested",
  "approved",
  "active",
  "completed",
  "rejected",
]);

export const alertSeverityEnum = pgEnum("alert_severity", [
  "warning",
  "critical",
]);

export const alertTriggerTypeEnum = pgEnum("alert_trigger_type", [
  "keyword",
  "emotion",
]);

export const alertStatusEnum = pgEnum("alert_status", [
  "pending",
  "sent",
  "acknowledged",
  "failed",
]);
