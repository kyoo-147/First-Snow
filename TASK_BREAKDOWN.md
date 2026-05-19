# Task Breakdown

## Backlog by Domain
### Platform
- monorepo root scaffold: done
- workspace manifests: done
- shared config and env contract package: done
- observability package foundation: done

### Database
- database provider decision: done, server-hosted PostgreSQL in Docker
- remote dev access pattern: done
- server Docker topology: done
- backup and restore workflow: done
- schema packaging: done
- service-layer ownership policy model: done
- migration execution strategy: done
- server migration apply and smoke test: done

### Identity
- parent auth flow: done for foundation scope
- parent profile sync: backlog after production auth/persistence integration
- consent capture: done for prototype session, persistence pending

### Child Profile
- child profile management UI/domain foundation: done
- child CRUD API persistence: done

### Conversation
- session shell UI: done
- media permission hooks spike: done
- STT route
- chat route
- TTS route
- session API integration: backlog

### Alerting and Operations
- alert evaluation
- delivery routing
- worker retries

## Starter Tasks
The current first-pass backlog lives under [tasks/backlog](/D:/working/agentkid/tasks/backlog).

## Current Task Reality
- `TASK-001-platform-foundation-init` is completed.
- `TASK-002-platform-env-and-contracts` is completed.
- `TASK-003-database-postgres-foundation` is completed repo-side and replaces the blocked Supabase schema task.
- `TASK-004-identity-auth-flow` is completed for foundation scope with prototype signed session routes; database-backed parent profile persistence waits for `TASK-009`.
- `TASK-005-child-profile-management` is completed for foundation scope with a dedicated child profile dashboard and child-owned session entry point.
- `TASK-006-conversation-session-ui-shell` is completed with a child-facing `/session/[childId]` prototype route.
- `TASK-007-platform-media-hooks-spike` is completed with a client-side media permission hook.
- `TASK-009-database-server-apply-and-smoke-test` is completed on the server.
- `TASK-010-session-api-integration` is backlog and should wait for auth/API/database runtime readiness.
- `TASK-011-child-profile-api-persistence` is completed with database-backed child CRUD and parent ownership scoping.
- `TASK-012-observability-foundation` is completed with shared logging and correlation helpers.
