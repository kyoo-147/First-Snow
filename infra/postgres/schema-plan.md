# PostgreSQL Schema Plan

## Canonical Tables
- `users`
- `children`
- `sessions`
- `messages`
- `emotion_events`
- `lessons`
- `memories`
- `alerts`

## Identity Mapping
`users` is a parent profile table, not an auth table.

Required baseline fields:
- `id`: internal UUID primary key
- `auth_subject_id`: stable subject from the chosen auth implementation
- `email`: parent email, unique where available
- `display_name`
- `created_at`
- `updated_at`

## Ownership Chain
- `children.user_id -> users.id`
- `sessions.child_id -> children.id`
- `messages.session_id -> sessions.id`
- `emotion_events.session_id -> sessions.id`
- `alerts.session_id -> sessions.id`
- `lessons.child_id -> children.id`
- `memories.child_id -> children.id`

Every API read/write must verify ownership through this chain in server-side service code.

## Extension Readiness
- `pgcrypto` or app-generated UUIDs for IDs
- `pgvector` for long-term memory embedding search

## Migration Direction
Use Drizzle ORM schema definitions under `packages/database/src/schema/` and migration files under `packages/database/migrations`.

Initial migration should include:
- extensions
- PostgreSQL enum types for canonical domain enums
- tables
- indexes for ownership joins
- indexes for session timeline queries
- vector index strategy only after embedding dimensions are selected

Runtime code should use `DATABASE_URL`. Migration/admin commands should prefer `DATABASE_DIRECT_URL`, usually through an SSH tunnel to the server database.

## Do Not Implement Yet
- Raw audio storage
- Raw video storage
- direct browser database access
- unaudited worker writes
