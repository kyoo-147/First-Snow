# AgentKid Snow Full Product V1 Plan

Status: APPROVED by Founder on 2026-10-03.

## Objective

Deliver a broad, working AgentKid Snow product across P0-P4 before prolonged polish. The required end-to-end outcome is:

`Parent registers -> creates child -> child signs in -> completes lesson -> result persists -> parent sees progress -> child uses text and voice companion -> transcript and alerts reach parent -> consent-governed camera/vision, export/delete, and notifications work.`

## Delivery rules

- Use `D:\work\SS-WD` as the operating, worker, monitoring, evidence, and Git playbook.
- Prefer a modular monolith plus one authenticated WebSocket gateway over microservices.
- Keep one database/migration owner. Concurrent writers must use isolated worktrees and non-overlapping ownership.
- Build breadth-first: establish real happy paths across the whole product, then harden and polish.
- UI is not complete without server logic, authorization, persistence, error states, and executable verification.
- Security/privacy gates fail closed. Never claim provider delivery, deletion, backup, escalation, or consent enforcement without evidence.
- Never commit secrets, `.env` files, `.pi` operational records, provider credentials, or production data.
- The Chief reviews and integrates small commits, runs gates, merges canonical source, pushes, deploys, and verifies.

## Architecture

- Next.js 16 application and BFF
- PostgreSQL with Drizzle ORM and versioned migrations
- Auth.js parent sessions, child PIN sessions, and database RBAC
- Zod validation and shared API error contracts
- Append-only audit events, versioned consent, retention, export, and deletion workflows
- OpenAI-compatible provider adapters for LLM/ASR/TTS
- Authenticated `wss://` companion gateway with recovery and idempotency
- S3-compatible media storage, email adapter, and Web Push/VAPID adapter
- Vitest integration tests and Playwright critical-flow tests

## Waves

### Wave A - P0 foundation

1. Environment validation, database schema/migrations, seed and test database workflow.
2. Parent authentication, child PIN authentication, admin role, RBAC, household ownership, and route guards.
3. API/BFF contracts, validation, audit events, consent records, retention policies, and fail-closed authorization tests.
4. Auth and session UI integrated into the Snow design system.

### Wave B - P1 and P2 breadth

1. Lesson catalog, versioned attempts, answers, completion, progress, rewards, and parent learning visibility.
2. Text companion, safety pre/post-processing, persisted transcripts, parent transcript review, and escalation records.
3. Real parent CRUD for children, routines, alerts, privacy, consent, account, emergency contacts, and notifications.

### Wave C - P3 and P4

1. Hosted authenticated WebSocket gateway, ASR, TTS, Live2D delivery, subtitle sync, reconnect, and session recovery.
2. Explicit-consent camera, vision, and screen capture with visible capture state and server-side policy enforcement.
3. Emergency parent escalation, email/push delivery tracking, data export, deletion, and retention jobs.

### Wave D - integration and release

1. Remove production dependence on mock data and reconcile duplicate/unused UI implementations.
2. Run lint, typecheck, unit, integration, E2E, migration-from-empty, build, authorization-isolation, and browser gates.
3. Review security/privacy boundaries, merge to `main`, push, deploy, and verify public production behavior.

## Mandatory acceptance flows

1. Parent register/login/logout and session revocation.
2. Parent creates child and PIN; child accesses only its own data.
3. Child completes a real lesson; reload preserves result; parent sees it; duplicate completion does not duplicate rewards.
4. Child sends text; safe AI response and transcript persist; parent sees transcript and linked alert.
5. Voice utterance reaches ASR -> AI -> TTS; reconnect restores session without duplicate messages/audio.
6. Non-admin cannot access admin; one household cannot access another household's resources.
7. Camera/vision/screen capture remain blocked without current consent and active browser permission.
8. Export produces an expiring archive; deletion reports per-stage success/failure truthfully.
9. Email/push/escalation delivery status is recorded and never fabricated.
10. Production build, migrations, critical tests, browser smoke, and Git status pass on canonical source.

## External prerequisites

Production provider proof ultimately requires valid credentials for PostgreSQL, LLM/ASR/TTS, object storage, email, and Web Push plus a legally usable Live2D model. Adapters and local/test implementations may proceed without them, but unavailable external integrations must remain explicitly unverified rather than simulated as successful.
