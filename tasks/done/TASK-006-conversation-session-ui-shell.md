# TASK-006 Conversation Session UI Shell

## Status
Done.

## Goal
Implement the child session shell in `apps/web` as the foundation for the conversation domain.

## Acceptance
- Mia session UI shell exists.
- Consent and media entry points are intentional.
- Child-facing UX follows calm interaction rules.

## Completed Implementation
- Parent dashboard remains under `/dashboard` and `/dashboard/session`.
- Child-facing prototype route exists at `/session/[childId]`.
- `/dashboard/session` links to `/session/demo-child` as the current session prototype.
- Session shell includes:
  - consent gate before any browser media permission request
  - mic permission entry point
  - optional camera permission entry point
  - session state preview: `ready | active | completed | interrupted`
  - transcript, emotion signal, and guardian layer placeholders for future API integration
- UI copy states the MVP privacy baseline: no raw audio/video storage.

## Verification
- `npm.cmd run build` passed in `apps/web`.
- No production API, auth, or persistence is implied by this task.

## Follow-up
Real STT/chat/TTS integration is tracked separately by `TASK-010-session-api-integration`.
