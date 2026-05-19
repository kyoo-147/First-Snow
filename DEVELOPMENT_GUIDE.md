# Development Guide

## Work Order
1. Read `PROJECT_OVERVIEW.md`
2. Read `ARCHITECTURE.md`
3. Read `API_SPEC.md`
4. Read `CODING_STANDARDS.md`
5. Read the relevant task in `tasks/`

## Monorepo Workflow
- `apps/` for runtime applications
- `packages/` for shared logic and contracts
- `infra/` for deployment-specific assets
- `scripts/` for repeatable automation
- `docs/` for canonical knowledge

## Engineering Expectations
- Prefer domain-first modules over screen-first sprawl.
- Keep route handlers thin.
- Keep provider code behind package adapters.
- Keep contracts centralized and reusable.
- Keep docs in sync when contracts or architecture change.
