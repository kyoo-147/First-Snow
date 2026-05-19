# TASK-003 Database PostgreSQL Foundation

## Status
Done.

## Goal
Build the initial server-hosted PostgreSQL foundation for AgentKid so auth, child profiles, sessions, messages, lessons, memories, alerts, and worker jobs can be implemented safely.

## Decision Basis
`ADR-008` selects self-hosted PostgreSQL in Docker as the initial database direction. Supabase is not an active implementation target.

## Completed Work
- Server Compose topology includes `postgres` using `pgvector/pgvector:pg16`.
- PostgreSQL is private to the Compose network via `expose`, not public `ports`.
- `db.env.template` and `web.env.template` include PostgreSQL/Auth environment placeholders.
- Remote dev access runbook exists for SSH tunnel/VPN/private-network access.
- Backup/restore runbook exists and `scripts/data/postgres-backup.ps1` provides a repeatable backup helper.
- Drizzle ORM + Drizzle Kit are selected as migration/query tooling.
- Core Drizzle schema exists for `users`, `children`, `sessions`, `messages`, `emotion_events`, `lessons`, `memories`, and `alerts`.
- Initial executable SQL migration exists for extensions, enums, tables, foreign keys, comments, and indexes.
- App-side database connection helper and ownership-check helpers exist.
- Static schema check guards required tables/extensions and forbids raw media storage columns.
- Migration helper script exists for applying migrations once `DATABASE_DIRECT_URL` is available.

## Verification
- `npm.cmd run build` from `packages/database`
- `npm.cmd run db:check` from `packages/database`
- `npm.cmd run db:generate` from `packages/database`
- `npm.cmd run check:database-schema` from repo root
- `npm.cmd run check:docs` from repo root

## Deferred Operational Step
Applying migrations to the real server PostgreSQL requires server tunnel/credentials and is tracked separately in `TASK-009-database-server-apply-and-smoke-test`.

## Out of Scope
- Production auth implementation.
- Full CRUD API implementation.
- Realtime subscriptions.
- Provider integrations for STT/TTS/LLM.
