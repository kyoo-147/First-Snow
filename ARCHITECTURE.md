# Architecture

## Target System Style
AgentKid uses a `Next.js BFF + worker-ready` architecture inside an app-first monorepo.

- `apps/web` owns the user-facing web app and latency-sensitive BFF orchestration.
- `apps/worker` owns asynchronous and retry-safe background jobs.
- Self-hosted PostgreSQL in Docker is the initial system of record, accepted in `ADR-008`.
- Auth is implemented or integrated separately from the database while preserving the auth identity -> parent profile -> child ownership chain.
- Shared business contracts live in `packages/domain`.
- Provider wrappers live in `packages/integrations`.
- Database schema and policies live in `packages/database`.
- Prompts and prompt builders live in `packages/prompts`.
- Logging and tracing helpers live in `packages/observability`.

## Runtime Boundaries
- `web`: parent dashboard, child session UI, route handlers, auth/session gating
- `worker`: memory extraction, scoring, alert retries, post-session processing
- `database`: schema, migrations, ownership policies, seeds, typed access helpers
- `integrations`: Google, auth provider if external, Twilio, Zalo, Web Push, Cloudflare adapters
- `observability`: logs, tracing hooks, error reporting wrappers

## Domain Modules
- `identity`
- `child-profile`
- `conversation`
- `emotion`
- `memory`
- `lesson`
- `alerting`
- `reporting`
- `platform`

## Temporary vs Production Classification
### Temporary / Demo
- placeholder package readmes with no runtime code
- route list without handlers yet
- archived day-by-day planning notes
- current `apps/web` dashboard content is static/mock UI, not connected to backend data

### Production-Suitable
- explicit auth identity and parent/child ownership chain
- private server-side PostgreSQL access through BFF/worker only
- Vietnamese-first Mia policy
- parent approval for AI-generated lessons
- no raw media storage baseline
- app-first monorepo with shared packages

### Future Extraction Points
- alert processing
- memory extraction and scoring
- provider orchestration hot paths
- reporting and analytics pipelines

## Bottlenecks and Risks
- STT + Gemini + TTS orchestration in BFF routes
- provider dependency concentration
- synchronous lesson generation or scoring
- ownership bypass through child/session chains
- PII leakage in logs or outbound alerts
- self-hosted database operations: backup, restore, monitoring, upgrades, and connection limits
