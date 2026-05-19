# TASK-009 Database Server Apply And Smoke Test

## Status
Done.

## Goal
Apply the checked Drizzle migration set to the real server-hosted PostgreSQL database and verify the schema exists before implementing auth or API runtime features.

## Server Evidence
- Server: `34.55.68.105`
- App directory: `/opt/agentkid`
- Container: `agentkid-postgres`
- Image: `pgvector/pgvector:pg16`
- Exposure: Docker internal only, `5432/tcp`; no public host port is published.
- Migration path: local Drizzle migration over SSH tunnel to the server-side Docker network.

## Completed Steps
1. Updated `/opt/agentkid/compose.yaml` from the repo server compose template.
2. Created `/opt/agentkid/db.env` on the server with private file permissions.
3. Updated `/opt/agentkid/web.env` database connection values for Docker-internal runtime access.
4. Started `agentkid-postgres`.
5. Opened a temporary SSH tunnel from local port `15432` to the PostgreSQL container IP.
6. Ran `scripts/data/apply-database-migrations.ps1 -RequireDirectUrl`.
7. Removed the local temporary database URL file and stopped the temporary tunnel process.

## Smoke Test Evidence
Extensions:
- `pgcrypto`
- `vector`

Canonical tables:
- `alerts`
- `children`
- `emotion_events`
- `lessons`
- `memories`
- `messages`
- `sessions`
- `users`

Additional checks:
- raw media storage column count: `0`
- Drizzle migrations recorded: `1`

## Notes
- The running web container was not restarted as part of this task.
- The server `web.env` now contains database URLs for future runtime use.
- Do not print, commit, or share `/opt/agentkid/db.env` or database URLs.
