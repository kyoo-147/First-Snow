# AgentKid Technical Specification

## Current Provider Decision Status
`ADR-008` selects self-hosted PostgreSQL in Docker as the initial database direction. Supabase-specific details from older notes are historical context only and must not be implemented.

Implementation baseline:
- PostgreSQL runs privately in Docker on the server.
- Local development connects to the server database through SSH tunnel/VPN/private network access; a local PostgreSQL instance is not part of the default workflow.
- `apps/web` and `apps/worker` access the database from server-side code only.
- Browser clients never connect directly to PostgreSQL.
- Authorization is enforced in the BFF/service layer first.
- PostgreSQL row-level security can be added later as defense in depth.
- Auth is implemented or integrated separately while preserving the auth identity -> parent profile -> child-owned records chain.

## 1. Scope and Technical Intent
Tài liệu này là source of truth kỹ thuật cho MVP đầu tiên của AgentKid. Mục tiêu là chốt các quyết định cần thiết để implementation có thể bắt đầu mà không phải đoán lại data model, API contracts, privacy rules, hoặc state transitions.

This document is the technical source of truth for the first AgentKid MVP. Its purpose is to lock the decisions needed to start implementation safely, without re-deciding data models, API contracts, privacy rules, or state transitions.

## 2. Architecture Summary
- Client: Next.js App Router app under `apps/web`
- Auth and primary data: separate auth implementation plus server-hosted PostgreSQL in Docker; `pgvector` reserved for memory retrieval
- AI providers: Google Speech-to-Text, Google Text-to-Speech, Gemini 1.5 Flash, Google embeddings
- Emotion inference: `face-api.js` on-device in browser
- Alerts: Web Push first, plus Twilio SMS and Zalo OA for critical events
- Storage: Cloudflare R2 reserved for future private assets; not required for raw audio/video in MVP

This document preserves the detailed MVP implementation contract layer. The canonical production repo shape is described in the top-level `ARCHITECTURE.md`.

### Main Data Flow
1. Child audio is recorded in browser.
2. Audio goes to `POST /api/conversation/stt`.
3. Emotion inference runs client-side in parallel and feeds the current state into chat.
4. Text, session context, and memory context go to `POST /api/conversation/chat`.
5. Chat response text goes to `POST /api/conversation/tts`.
6. Audio plays back in browser while UI switches Mia state to speaking.
7. Transcript, emotion events, lesson state, session summary, and alerts are persisted in PostgreSQL through server-side code.

## 3. Identity Model
### Auth Identity vs Parent Profile
- The auth identity store is separate from the parent profile table.
- Public table `users` is the parent profile table with a 1:1 mapping to the authenticated parent identity.
- `users.auth_subject_id` stores the stable auth subject from the auth implementation.
- The app must never treat `users` as a password/authentication table.

### Parent Profile Rules
- Each authenticated parent owns zero or more `children`.
- Every child-owned record is reachable through the parent via `children.user_id`.
- All user-facing authorization must resolve through the authenticated subject and then the parent profile.

## 4. Repository Layout
```text
/
├─ apps/
│  ├─ web/
│  └─ worker/
├─ packages/
├─ infra/
├─ scripts/
├─ docs/
├─ tasks/
├─ tests/
├─ .codex/
└─ .claude/
```

## 5. Environment Variables
```bash
DATABASE_URL=
DATABASE_DIRECT_URL=
DATABASE_POOL_MAX=
DATABASE_SSL_MODE=
DATABASE_REMOTE_HOST=
DATABASE_REMOTE_PORT=
DATABASE_SSH_TUNNEL=

AUTH_SECRET=
AUTH_SESSION_COOKIE_NAME=
AUTH_COOKIE_SECURE=

GOOGLE_APPLICATION_CREDENTIALS_JSON=
GOOGLE_CLOUD_PROJECT_ID=
GOOGLE_GEMINI_API_KEY=

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

ZALO_OA_ACCESS_TOKEN=
ZALO_OA_ID=

NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
```

## 6. Domain Types and Enums
### Enums
- `ChildCondition = 'ASD' | 'language_delay' | 'both'`
- `EmotionType = 'happy' | 'sad' | 'angry' | 'fearful' | 'surprised' | 'neutral'`
- `LessonFramework = 'ABA' | 'PECS' | 'SocialStories'`
- `LessonCategory = 'emotion' | 'social' | 'routine'`
- `LessonStatus = 'suggested' | 'approved' | 'active' | 'completed' | 'rejected'`
- `SessionStatus = 'active' | 'completed' | 'interrupted'`
- `AlertSeverity = 'warning' | 'critical'`
- `AlertTriggerType = 'keyword' | 'emotion'`

### Core Types
- `ParentProfile`
- `Child`
- `Session`
- `Message`
- `EmotionEvent`
- `Lesson`
- `LessonNode`
- `Memory`
- `Alert`

## 7. Database Schema
### Canonical Table Set
- `users`
- `children`
- `sessions`
- `messages`
- `emotion_events`
- `lessons`
- `memories`
- `alerts`

### Required Constraints
- `users.id` is the internal parent profile UUID.
- `users.auth_subject_id` stores the stable subject from the chosen auth implementation and must be unique.
- `children.user_id` references `users.id`.
- `sessions.child_id` references `children.id`.
- `messages.session_id`, `emotion_events.session_id`, and `alerts.session_id` reference `sessions.id`.
- `lessons.child_id` and `memories.child_id` reference `children.id`.

### Session State Machine
- `active`: session is in progress.
- `completed`: session ended normally and can be summarized.
- `interrupted`: session ended unexpectedly or was aborted.

Transitions:
- `active -> completed`
- `active -> interrupted`
- no reopening in v1

### Memory Lifecycle
- Session transcript and messages are short-term memory.
- Extracted child facts are long-term memory records in `memories`.
- Memory extraction runs asynchronously after session end.
- Long-term memory recall returns top relevant facts only; it does not hydrate full prior transcripts.

## 8. Authorization and Optional RLS
Authorization is enforced in server-side service code for MVP. PostgreSQL RLS may be enabled later for defense in depth on:
- `children`
- `sessions`
- `messages`
- `emotion_events`
- `lessons`
- `memories`
- `alerts`

Required policy pattern:
- Parent can read/write their own `children`.
- Parent can read/write `sessions` only when the session belongs to one of their children.
- Parent can read/write `messages`, `emotion_events`, `lessons`, `memories`, and `alerts` only through ownership of the underlying child/session chain.

Implementation note:
- Server-side business logic must enforce parent ownership before every read/write mutation.
- Worker jobs must operate on explicit job/session identifiers and still verify record ownership or system-job authorization.

## 9. API Contracts
### `POST /api/conversation/stt`
Input:
- `multipart/form-data`
- required field: `audio`

Response:
```ts
type STTResponse = {
  transcript: string;
  confidence: number;
};
```

Behavior:
- Use `vi-VN`.
- Reject clearly unusable audio.
- Return a typed error for API failure or low-confidence transcription.

### `POST /api/conversation/chat`
Input:
```ts
type ChatRequest = {
  sessionId: string;
  childId: string;
  message: string;
  emotion?: EmotionType;
  emotionConfidence?: number;
};
```

Response:
```ts
type ChatResponse = {
  response: string;
  emergencyFlag: boolean;
  intent?: string;
};
```

Behavior:
- Fetch child profile, short-term history, and top relevant memories.
- Build Mia system prompt from child profile plus memory context.
- Save user and assistant messages without blocking the main response path when safe to do so.

### `POST /api/conversation/tts`
Input:
```ts
type TTSRequest = {
  text: string;
};
```

Response:
- Streaming audio response
- `Content-Type: audio/mpeg`

Behavior:
- Use a Vietnamese WaveNet voice.
- Optimize for first-byte playback, not full-buffer completion.

### `POST /api/alerts/evaluate`
Input:
```ts
type AlertRequest = {
  sessionId: string;
  message: string;
  emotionHistory: Array<{
    emotion: EmotionType;
    confidence: number;
  }>;
  userId: string;
};
```

Response:
```ts
type AlertResponse = {
  triggered: boolean;
  severity?: 'warning' | 'critical';
};
```

Behavior:
- `warning` sends push only.
- `critical` sends push plus SMS and Zalo where available.
- Save the alert record and sent channels.

### `POST /api/lessons/generate`
Input:
```ts
type GenerateLessonRequest = {
  childId: string;
  framework: LessonFramework;
  category: LessonCategory;
};
```

Response:
```ts
type GenerateLessonResponse = Lesson;
```

Behavior:
- Generate a lesson suggestion only.
- Persist with status `suggested`.

### `PATCH /api/lessons/[id]`
Input:
```ts
type UpdateLessonStatusRequest = {
  status: 'approved' | 'rejected' | 'active' | 'completed';
};
```

Response:
- updated lesson object

Behavior:
- Parent approval is required before a generated lesson becomes usable in normal learning flow.

## 10. Lesson Node Schema v1
Lesson JSON in `lessons.nodes` must follow this shape:

```ts
type LessonChoice = {
  keywords: string[];
  nextNodeId: string;
  feedback?: string;
};

type LessonNode = {
  id: string;
  type: 'prompt' | 'question' | 'feedback' | 'end';
  text: string;
  choices?: LessonChoice[];
  defaultNextNodeId?: string;
  feedback?: string;
  emotionTrigger?: EmotionType;
  difficultyAdjust?: -1 | 0 | 1;
};
```

Rules:
- `id`, `type`, and `text` are always required.
- `choices` is required for branching question nodes.
- `defaultNextNodeId` is required whenever progression may continue after the current node.
- `end` nodes must not require `defaultNextNodeId`.
- `feedback` is optional supplemental text and not a replacement for `text`.

## 11. Prompting Rules for Mia
- Mia speaks Vietnamese only.
- Responses should be short, concrete, and encouraging.
- Mia must avoid judgmental or negative wording about the child.
- Mia should soften tone when emotion context suggests sadness or fear.
- Emergency-sensitive phrases must produce `emergencyFlag = true` or equivalent downstream trigger logic.

## 12. Privacy Baseline
- Do not store raw video in MVP.
- Do not store raw audio in MVP unless a later documented decision changes this.
- Store transcript, emotion events, lesson metadata, score, AI notes, memories, and alert logs.
- Explain consent clearly before mic/camera use.
- Dashboard copy may be bilingual; child-facing voice remains Vietnamese-first.

## 13. Alert Rules
### Warning
- Triggered by a single danger keyword or lower-confidence concern.
- Channels: push only.

### Critical
- Triggered by sustained fearful emotion pattern or stronger keyword evidence.
- Channels: push, SMS, and Zalo if configured.

Fallback order:
1. push
2. SMS
3. Zalo

If SMS or Zalo is unavailable, the system still records the alert and sends available channels.

## 14. Known Risks and Phase Mapping
- iOS Safari media quirks: Phase 1 and Phase 2
- face-api performance in poor lighting: Phase 3
- Zalo OA approval/setup friction: Phase 4
- latency budget under 2 seconds: Phase 2 and Phase 4
- lesson quality drift from LLM output: Phase 3 with parent approval as mitigation

## 15. Acceptance for Technical Foundation
- Another engineer can implement APIs, schema, and UI flows using this spec without making new product decisions.
- RLS ownership logic is unambiguous.
- Lesson node format is stable enough for parser and runner work.
- Memory, privacy, and alerting rules are explicit.
