# TASK-011 Child Profile API Persistence

## Status
Done.

## Goal
Implement database-backed child profile CRUD after server DB access and parent profile persistence are ready.

## Completed Implementation
- Added database-backed child profile API routes:
  - `GET /api/children`
  - `POST /api/children`
  - `GET /api/children/[childId]`
  - `PATCH /api/children/[childId]`
- Added server-side PostgreSQL pool helper in `apps/web/src/server/postgres.ts`.
- Added parent profile resolver that maps signed prototype session `authSubjectId` to `users.auth_subject_id`.
- Added child repository helpers that enforce `children.user_id = parentProfile.id`.
- Added child input validation for:
  - `displayName`
  - `condition`
  - `dateOfBirth`
  - `communicationPreferences`
  - `goals`

## Ownership Boundary
- API routes require a valid parent session cookie.
- Parent profile is resolved or created through `users.auth_subject_id`.
- Child reads and mutations are always scoped by parent profile ID.
- Cross-parent child access returns an authorization-shaped not-found response.

## Verification
- `POST /api/identity/login`: `200`
- `POST /api/children`: `201`
- `GET /api/children`: `200`
- `GET /api/children/[childId]`: `200`
- `PATCH /api/children/[childId]`: `200`
- Test parent/child data was deleted from the server database after verification.

## Notes
- This uses the current signed prototype identity session.
- Production auth provider integration can replace the session issuer later while preserving the `authSubjectId -> users.auth_subject_id -> children.user_id` chain.
