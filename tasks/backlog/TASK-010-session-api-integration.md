# TASK-010 Session API Integration

## Status
Backlog.

## Goal
Connect the child-facing session UI to the real conversation runtime after auth, API handlers, and database access are ready.

## Prerequisites
- `TASK-004` identity/auth flow has a usable authenticated parent session.
- Server database migration has been applied or a safe development database path exists.
- Conversation route handlers exist for:
  - `POST /api/conversation/stt`
  - `POST /api/conversation/chat`
  - `POST /api/conversation/tts`
- Alert route exists for `POST /api/alerts/evaluate`.

## Acceptance
- Session creation persists a `sessions` record.
- Mic audio can be sent to STT only after consent.
- Chat calls include session, child, short-term history, and allowed memory context.
- TTS response can play back in the child-facing UI.
- Session end transitions to `completed` or `interrupted`.
- No raw audio/video is persisted.
