# API Spec

## Purpose
This document defines the planned internal product APIs and route families for the first production-ready implementation shape. The repository contains static web UI routes, but it does not contain running product API route handlers yet.

## Current API Status
- Public marketing and dashboard pages exist in `apps/web`.
- Identity route handlers exist for prototype session flow only.
- Most product API routes are still placeholders.
- No route below should be treated as production-ready until a matching route handler exists and persistence/auth ownership are connected.
- Persistence will use self-hosted PostgreSQL in Docker through server-side BFF/worker code only.
- Auth currently uses a signed prototype session cookie. Production auth remains a follow-up implementation concern, but every route must enforce the auth identity -> parent profile -> child-owned record chain.

## Route Families
### `identity`
- `POST /api/identity/register` - implemented as prototype signed session
- `POST /api/identity/login` - implemented as prototype signed session
- `GET /api/identity/me` - implemented as prototype signed session lookup
- `POST /api/identity/consent` - implemented as prototype cookie consent update

### `child-profile`
- `GET /api/children` - implemented with parent ownership scope
- `POST /api/children` - implemented with parent ownership scope
- `PATCH /api/children/:childId` - implemented with parent ownership scope
- `GET /api/children/:childId` - implemented with parent ownership scope

### `session`
- `POST /api/sessions`
- `PATCH /api/sessions/:sessionId/end`
- `GET /api/sessions/:sessionId`

### `conversation`
- `POST /api/conversation/stt`
- `POST /api/conversation/chat`
- `POST /api/conversation/tts`

### `lesson`
- `POST /api/lessons/generate`
- `PATCH /api/lessons/:lessonId`
- `GET /api/lessons`

### `alerting`
- `POST /api/alerts/evaluate`
- `PATCH /api/alerts/:alertId/acknowledge`
- `GET /api/alerts`

### `reporting`
- `GET /api/reports/sessions/:sessionId`
- `GET /api/reports/progress`

## API Rules
- Domain-first route grouping
- Explicit request and response contracts
- Typed errors
- Ownership enforced server-side
- Async work moved out of hot paths where safe

## Supporting Contract Source
Detailed MVP request and response shapes remain preserved in [system-spec.md](/D:/working/agentkid/docs/engineering/system-spec.md).
