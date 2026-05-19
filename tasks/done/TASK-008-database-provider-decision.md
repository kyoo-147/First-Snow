# TASK-008 Database Provider Decision

## Goal
Choose the production database/auth direction before implementing schema, auth, persistence, migrations, or provider SDK code.

## Context
Earlier docs assumed Supabase Auth/PostgreSQL. The product owner has since stated that Supabase should not be used. This task exists to prevent backend implementation from continuing on an invalid provider assumption.

## Acceptance
- A new ADR is written under `docs/decisions/`.
- `ARCHITECTURE.md`, `API_SPEC.md`, and `docs/engineering/system-spec.md` are updated to reflect the selected provider.
- Environment variables are updated in `packages/config` and relevant docs.
- The old Supabase-specific database task is either replaced or rewritten.
- Ownership, auth identity, migrations, local development, backup, and deployment implications are documented.

## Decision Inputs To Compare
- PostgreSQL with a custom auth layer
- PostgreSQL with managed auth provider
- Firebase/Firestore
- MongoDB/DocumentDB
- Other provider if product constraints require it

## Decision
Accepted via `docs/decisions/ADR-008-self-hosted-postgres-docker.md`.

## Current Status
Completed. Follow-up implementation moves to `TASK-003-database-postgres-foundation`.
