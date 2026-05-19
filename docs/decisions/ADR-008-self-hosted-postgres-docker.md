# ADR-008: Self-Hosted PostgreSQL in Docker

## Status
Accepted

## Context
AgentKid handles sensitive child-related data: parent profiles, child profiles, transcripts, emotion events, memories, lesson metadata, and alert logs. Earlier planning documents assumed Supabase Auth/PostgreSQL, but the product owner has decided not to use Supabase for the initial backend direction.

The project still needs a relational data model, strong ownership boundaries, repeatable migrations, backup/restore discipline, and a path to vector search for memory recall.

## Decision
AgentKid will use self-hosted PostgreSQL running in Docker on the server for the initial backend foundation.

There is no required local database for normal development. Local development connects to the server database through a secure private path such as SSH tunnel or VPN. This keeps the project aligned with one realistic data/runtime environment while avoiding divergent local database state.

The application will access PostgreSQL from server-side code only:
- `apps/web` owns BFF route handlers and user-facing request orchestration.
- `apps/worker` owns async jobs such as memory extraction, scoring, and alert retries.
- Browser clients must not connect directly to the database.
- Local developer machines must not connect through a public database port; use SSH tunnel/VPN/private network access.
- Authorization is enforced in the BFF/service layer first.
- PostgreSQL row-level security may be added later for defense in depth, but it is not the primary MVP access-control mechanism.

Authentication will be implemented or integrated separately from the database. The exact auth library/provider remains a follow-up implementation choice, but it must preserve the `auth identity -> parent profile -> child-owned records` ownership chain.

## Consequences
### Positive
- Full control over child-related data and deployment topology.
- Lower provider lock-in than Supabase-specific Auth/RLS/client SDK conventions.
- Clean fit with the `Next.js BFF + worker-ready` architecture.
- Straightforward path to `pgvector` for memory retrieval.
- Database access can be kept private inside the server network.
- Local and deployed code exercise the same remote PostgreSQL environment instead of drifting between local and server databases.

### Tradeoffs
- The team owns backups, restore drills, upgrades, monitoring, connection limits, and security hardening.
- Auth, realtime, dashboard storage helpers, and database UI are not provided out of the box.
- More implementation work is required before the backend becomes usable.
- Local development now depends on safe server connectivity and coordination around shared development data.

## Operating Requirements
- PostgreSQL must not expose its port publicly.
- Local development must use SSH tunnel, VPN, or an equivalent private access path to reach server PostgreSQL.
- Persistent data must live in named Docker volumes or managed server storage with documented backup behavior.
- Backups must be automated before pilot data is collected.
- Restore must be tested before pilot data is collected.
- Migrations must be repeatable and reviewed.
- Production credentials must not be committed.
- Logs must not include child PII, raw transcripts beyond intentional audit records, raw audio, or raw video.

## Supersedes
This ADR supersedes Supabase-specific assumptions in older source notes and legacy planning docs. Supabase references may remain in `docs/archive/` only as historical context.
