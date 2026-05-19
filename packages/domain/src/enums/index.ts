export type ChildCondition = "ASD" | "language_delay" | "both";

export type EmotionType =
  | "happy"
  | "sad"
  | "angry"
  | "fearful"
  | "surprised"
  | "neutral";

export type SessionStatus = "active" | "completed" | "interrupted";

export type LessonFramework = "ABA" | "PECS" | "SocialStories";

export type LessonCategory = "emotion" | "social" | "routine";

export type LessonStatus =
  | "suggested"
  | "approved"
  | "active"
  | "completed"
  | "rejected";

export type MessageRole = "user" | "assistant";

export type LessonNodeType = "prompt" | "question" | "feedback" | "end";

export type AlertSeverity = "warning" | "critical";

export type AlertTriggerType = "keyword" | "emotion";

export type AlertChannel = "push" | "sms" | "zalo";

export type AlertStatus = "pending" | "sent" | "acknowledged" | "failed";
