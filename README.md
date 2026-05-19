# AgentKid

AgentKid is a production-oriented monorepo foundation for an AI companion web product for Vietnamese children ages 6-10 with ASD, language delay, or both. The repository is organized for long-term maintainability, clear module boundaries, and strong AI continuity.

## Start Here
- Product context: [PROJECT_OVERVIEW.md](/D:/working/agentkid/PROJECT_OVERVIEW.md)
- System shape: [ARCHITECTURE.md](/D:/working/agentkid/ARCHITECTURE.md)
- Interface contracts: [API_SPEC.md](/D:/working/agentkid/API_SPEC.md)
- Development workflow: [DEVELOPMENT_GUIDE.md](/D:/working/agentkid/DEVELOPMENT_GUIDE.md)
- AI workflow: [AI_AGENT_GUIDE.md](/D:/working/agentkid/AI_AGENT_GUIDE.md)

## Canonical Document Order
1. `PROJECT_OVERVIEW.md`
2. `ARCHITECTURE.md`
3. `API_SPEC.md`
4. `CODING_STANDARDS.md`
5. `DEVELOPMENT_GUIDE.md`
6. `DEPLOYMENT_GUIDE.md`
7. `FEATURE_ROADMAP.md`
8. `TASK_BREAKDOWN.md`
9. supporting docs under `docs/`

If two documents conflict, the higher item wins unless a newer ADR in `docs/decisions/` explicitly supersedes it.

## Repository Shape
- `apps/`: runtime applications
- `packages/`: shared business and technical packages
- `infra/`: deployment and environment topology
- `scripts/`: repeatable automation
- `docs/`: canonical human and AI knowledge
- `tasks/`: lifecycle-based work tracking
- `tests/`: unit, integration, e2e, and manual validation layers

## Common Checks
- `npm.cmd run build`: runs build scripts across apps and packages through the repo-local workspace runner.
- `npm.cmd run check:docs`: validates canonical documentation structure.
- `npm.cmd run check:database-schema`: validates the checked PostgreSQL migration shape.

## Current State
- `apps/web` has been scaffolded as a Next.js app with the public marketing site, login UI, static dashboard UI shell, and child-facing session prototype route.
- Product, architecture, API, and workflow decisions are organized for a production build.
- `TASK-002` domain/config contracts are complete.
- `TASK-003` PostgreSQL foundation is complete repo-side with Drizzle schema, migrations, connection helpers, ownership helpers, backup helper, and schema checks.
- `TASK-004` identity foundation is complete for prototype scope with signed session routes; database-backed parent profile persistence is still pending.
- `TASK-005` child profile management is complete for prototype scope with dedicated dashboard UI and child-owned session entry.
- `TASK-006` session shell and `TASK-007` media hooks spike are complete as UI/client-side foundation work.
- `TASK-009` server PostgreSQL apply/smoke test is complete; the server has the canonical schema and required extensions.
- `TASK-011` child profile API persistence is complete with parent ownership scoping.
- Conversation, lesson, alert, reporting, real authentication, worker jobs, and provider integrations are still pending.
- Database provider is selected in `ADR-008`: server-hosted PostgreSQL in Docker. Local development connects to the server database through secure remote access, not a default local database.
- Legacy plans and source notes are preserved under `docs/archive/`.
