import type {
  AlertChannel,
  AlertSeverity,
  AlertStatus,
  AlertTriggerType,
  ChildCondition,
  EmotionType,
  LessonCategory,
  LessonFramework,
  LessonNodeType,
  LessonStatus,
  MessageRole,
  SessionStatus,
} from "../enums";

export type UUID = string;
export type ISODateString = string;
export type JsonObject = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Reference types (lightweight, used for ownership checks and job correlation)
// ---------------------------------------------------------------------------

export interface ParentProfileRef {
  id: UUID;
}

export interface ChildRef {
  id: UUID;
  parentId: UUID;
}

export interface SessionRef {
  id: UUID;
  childId: UUID;
  status: SessionStatus;
}

export interface JobCorrelation {
  requestId?: UUID;
  jobId?: UUID;
  sessionId?: UUID;
}

// ---------------------------------------------------------------------------
// Full domain types (used for API contracts, service layer, and persistence)
// ---------------------------------------------------------------------------

export interface ParentProfile {
  id: UUID;
  authSubjectId: string;
  email: string;
  displayName: string;
  phone?: string;
  alertChannels: AlertChannel[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Child {
  id: UUID;
  userId: UUID;
  displayName: string;
  dateOfBirth?: ISODateString;
  condition: ChildCondition;
  communicationPreferences?: JsonObject;
  goals?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: UUID;
  childId: UUID;
  status: SessionStatus;
  startedAt: Date;
  endedAt?: Date;
  durationSeconds?: number;
  score?: number;
  aiNotes?: string;
  createdAt: Date;
}

export interface Message {
  id: UUID;
  sessionId: UUID;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

export interface EmotionEvent {
  id: UUID;
  sessionId: UUID;
  emotion: EmotionType;
  confidence: number;
  timestamp: Date;
}

// ---------------------------------------------------------------------------
// Lesson node schema v1 (system-spec §10)
// ---------------------------------------------------------------------------

export interface LessonChoice {
  keywords: string[];
  nextNodeId: UUID | string;
  feedback?: string;
}

export interface LessonNode {
  id: UUID | string;
  type: LessonNodeType;
  text: string;
  choices?: LessonChoice[];
  defaultNextNodeId?: UUID | string;
  feedback?: string;
  emotionTrigger?: EmotionType;
  difficultyAdjust?: -1 | 0 | 1;
}

export interface Lesson {
  id: UUID;
  childId: UUID;
  framework: LessonFramework;
  category: LessonCategory;
  title: string;
  status: LessonStatus;
  nodes: LessonNode[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Memory {
  id: UUID;
  childId: UUID;
  fact: string;
  sourceSessionId?: UUID;
  confidence?: number;
  createdAt: Date;
}

export interface Alert {
  id: UUID;
  sessionId: UUID;
  severity: AlertSeverity;
  triggerType: AlertTriggerType;
  message: string;
  emotionHistory?: Array<{
    emotion: EmotionType;
    confidence: number;
  }>;
  channels: AlertChannel[];
  status: AlertStatus;
  createdAt: Date;
  acknowledgedAt?: Date;
}

// ---------------------------------------------------------------------------
// MVP API request/response contracts
// ---------------------------------------------------------------------------

export interface STTResponse {
  transcript: string;
  confidence: number;
}

export interface ChatRequest {
  sessionId: UUID;
  childId: UUID;
  message: string;
  emotion?: EmotionType;
  emotionConfidence?: number;
}

export interface ChatResponse {
  response: string;
  emergencyFlag: boolean;
  intent?: string;
}

export interface TTSRequest {
  text: string;
}

export interface AlertRequest {
  sessionId: UUID;
  message: string;
  emotionHistory: Array<{
    emotion: EmotionType;
    confidence: number;
  }>;
  userId: UUID;
}

export interface AlertResponse {
  triggered: boolean;
  severity?: AlertSeverity;
}

export interface GenerateLessonRequest {
  childId: UUID;
  framework: LessonFramework;
  category: LessonCategory;
}

export type GenerateLessonResponse = Lesson;

export interface UpdateLessonStatusRequest {
  status: Extract<LessonStatus, "approved" | "rejected" | "active" | "completed">;
}

// ---------------------------------------------------------------------------
// Identity API contracts
// ---------------------------------------------------------------------------

export interface IdentityParentSession {
  authSubjectId: string;
  email: string;
  displayName: string;
  parentProfileId?: UUID;
  issuedAt: ISODateString;
  expiresAt: ISODateString;
  consent: ParentConsentState;
}

export interface ParentConsentState {
  media: boolean;
  alerts: boolean;
  dataRetention: boolean;
  acceptedAt?: ISODateString;
}

export interface IdentityLoginRequest {
  email: string;
  password: string;
}

export interface IdentityRegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface IdentitySessionResponse {
  authenticated: boolean;
  mode: "prototype" | "production";
  parent: IdentityParentSession;
}

export interface IdentityConsentRequest {
  media: boolean;
  alerts: boolean;
  dataRetention: boolean;
}
