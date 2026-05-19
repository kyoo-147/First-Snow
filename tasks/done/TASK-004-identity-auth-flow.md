# TASK-004 Identity Auth Flow

## Status
Done for foundation scope.

## Goal
Implement parent auth and profile ownership flow in the production monorepo structure.

## Acceptance
- Parent registration and login paths are defined.
- Consent entry points are explicit.
- Ownership assumptions match architecture docs.

## Completed Implementation
- Added identity route handlers under `apps/web/app/api/identity`:
  - `POST /api/identity/register`
  - `POST /api/identity/login`
  - `GET /api/identity/me`
  - `POST /api/identity/consent`
- Added signed prototype parent session cookie support in `apps/web/src/server/identity-session.ts`.
- Added identity request/response/session contract types in `packages/domain`.
- Fixed `/login` Vietnamese copy and clarified that the current UI/API foundation is not production persistence.

## Ownership Boundary
- The auth subject is represented as `authSubjectId`.
- The parent profile table remains `users`.
- `users.auth_subject_id` is still the future persistence mapping from authenticated subject to parent profile.
- Child/session/lesson/alert ownership must continue to resolve through parent profile -> child-owned records.

## Current Limitation
This task does not persist users to PostgreSQL because `TASK-009` is blocked until secure server DB access is available. The route handlers create a signed prototype session only and must be replaced or extended with database-backed identity before pilot data.

## Verification
- `npm.cmd run build` passed in `apps/web`.
- `npm.cmd run build` passed in `packages/domain`.
