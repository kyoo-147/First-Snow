# Changelog

All notable changes to this project will be documented in this file.

## Unreleased
- Added the canonical GitHub development workflow, CI skeleton, PR template, and repo-local GitHub operations skill.
- Added repo-wide `typecheck` workflow support and cross-platform workspace script execution for local and CI verification.
- Established the canonical documentation foundation for AgentKid.
- Added project brief, BRD, technical spec, architecture notes, decisions log, phase plans, and initial task backlog.
- Marked archived source notes under `docs/archive/` as historical reference rather than ongoing source of truth.
- Completed shared domain/config foundation for TASK-002.
- Completed repo-side PostgreSQL foundation for TASK-003 with Drizzle schema, generated migration, database connection helper, ownership helpers, backup helper, and static schema check.
- Completed TASK-004 identity foundation with prototype signed session routes and consent endpoint.
- Completed TASK-005 child profile dashboard foundation with safe personalization and child-owned session entry.
- Completed TASK-006 child-facing session shell prototype at `/session/[childId]`.
- Completed TASK-007 media permission hook spike for mic/camera consent flow.
- Completed TASK-009 server PostgreSQL apply and smoke test with Drizzle migration evidence.
- Completed TASK-011 child profile API persistence with parent ownership scoping.
- Completed TASK-012 observability foundation with structured logging and correlation helpers.
- Added a root workspace script runner so `npm.cmd run build`, `lint`, and `test` work without local Turbo bootstrap.
