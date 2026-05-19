# Roadmap Status

## Snapshot
- Current mode: frontend foundation + backend foundation
- Current implementation phase: static web UI shell implemented; child-facing session prototype implemented; server PostgreSQL foundation completed
- Product scope baseline: locked for initial build
- Technical foundation: reorganized for app-first monorepo development and scaffolded in `apps/web`
- Repo operating system: aligned for human and AI continuation

## Completed Since Foundation
- Monorepo production structure exists.
- Canonical top-level docs and supporting docs exist.
- `apps/web` Next.js app builds successfully.
- Public landing site, subpages, login UI, dashboard shell, dashboard subpages, and Mia chat-first dashboard UI exist as static/mock UI.
- Floating/collapsible dashboard sidebar and responsive mobile dashboard layout are implemented.
- Child-facing `/session/[childId]` prototype exists with consent-first mic/camera entry points.
- Prototype identity API routes exist for register, login, current session, and consent.
- `TASK-004-identity-auth-flow` is completed for foundation scope.
- Dedicated child profile dashboard foundation exists with safe personalization fields and child-owned session entry.
- `TASK-005-child-profile-management` is completed for foundation scope.
- Database-backed child profile CRUD routes exist with parent ownership scoping.
- `TASK-011-child-profile-api-persistence` is completed.
- `TASK-006-conversation-session-ui-shell` is completed.
- `TASK-007-platform-media-hooks-spike` is completed.
- `TASK-002-platform-env-and-contracts` is completed.
- `TASK-003-database-postgres-foundation` is completed repo-side with Drizzle schema, migration, connection helper, ownership helpers, backup helper, and schema checks.
- `TASK-009-database-server-apply-and-smoke-test` is completed on the server with `pgcrypto`, `vector`, and 8 canonical tables.
- `TASK-012-observability-foundation` is completed with shared logging/correlation helpers.

## Immediate Next Focus
- Keep documentation/task state synced as runtime implementation begins.
- Replace or extend prototype identity routes with database-backed parent profile persistence after server schema access is available.
- Use `TASK-010-session-api-integration` when auth, API handlers, and safe database access are ready for the real STT/chat/TTS loop.

## Watch Items
- Encoding consistency for Vietnamese markdown
- Git tool availability in local environment
- Database provider is selected: server-hosted PostgreSQL in Docker via `ADR-008`.
- Local dev uses secure remote DB access instead of local PostgreSQL.
- Backup/restore must be verified before pilot data is stored.
- PostgreSQL is running privately inside Docker; do not publish port `5432`.
- Package boundary discipline once implementation begins
