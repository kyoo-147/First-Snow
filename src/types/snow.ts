import type { LucideIcon } from "lucide-react";

export type CompanionState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "interrupted"
  | "connection-lost";

export type SnowExpression =
  | "calm"
  | "happy"
  | "excited"
  | "thinking"
  | "encouraging"
  | "sleepy"
  | "sad-supportive";

export type SnowNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  key: string;
};

export type ParentNavGroup = {
  group: string;
  items: SnowNavItem[];
};

export type LessonCardData = {
  id: string;
  title: string;
  subtitle: string;
  subject: string;
  duration: string;
  rating: string;
  image: string;
  accent: "primary" | "aqua" | "peach" | "pink" | "ice";
  progress?: number;
};

export type MoodOption = {
  label: string;
  value: SnowExpression;
  description: string;
};

export type ParentInsight = {
  title: string;
  description: string;
  metric: string;
  tone: "success" | "calm" | "warm";
};

export type Child = {
  id: string;
  name: string;
  age: number;
  grade: string;
  comfortStyle: string;
  avatarUrl?: string;
};

export type Parent = {
  id: string;
  name: string;
  email: string;
  children: Child[];
};

export type Session = {
  id: string;
  childId: string;
  title: string;
  date: string; // ISO string
  durationMinutes: number;
  mood: "happy" | "calm" | "excited" | "sad" | "anxious" | "neutral";
  highlights: string[];
};

export type TranscriptMessage = {
  id: string;
  sessionId: string;
  speaker: "snow" | "child";
  text: string;
  timestamp: string; // ISO string
};

export type EmotionEvent = {
  id: string;
  childId: string;
  sessionId: string;
  emotion: "happy" | "calm" | "excited" | "sad" | "anxious" | "frustrated";
  timestamp: string; // ISO string
  note?: string;
};

export type RoutineStep = {
  id: string;
  title: string;
  durationMinutes: number;
  isCompleted: boolean;
};

export type Routine = {
  id: string;
  childId: string;
  title: string;
  date: string; // ISO string
  timeOfDay: "morning" | "afternoon" | "evening";
  isActive: boolean;
  steps: RoutineStep[];
};

export type Alert = {
  id: string;
  childId: string;
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
  date: string; // ISO string
  isRead: boolean;
};

export type PrivacySettings = {
  microphoneAccess: boolean;
  cameraAccess: boolean;
  visionAiAccess: boolean;
  transcriptStorageDays: number;
  emotionTimelineStorage: boolean;
};

export type NotificationSettings = {
  emailAlerts: boolean;
  pushAlerts: boolean;
  weeklyReport: boolean;
};

export type EmergencyContact = {
  id: string;
  name: string;
  relation: string;
  phone: string;
};

export type AdminCompanionSettings = {
  live2dModel: string;
  asrProvider: string;
  ttsProvider: string;
  llmProvider: string;
  systemPrompt: string;
};
