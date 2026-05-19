# PostgreSQL Infra

Runtime notes, environment mapping, backup/restore workflow, and operational assets for self-hosted PostgreSQL belong here.

## Baseline Direction
- PostgreSQL runs in Docker on the server.
- The database port must stay private to the server or Docker network.
- `apps/web` and `apps/worker` access the database from server-side code only.
- Local development connects to the server database through SSH tunnel/VPN/private networking.
- Local development does not require a local PostgreSQL instance.
- Backups and restore drills are required before collecting pilot data.

## Expected Files
- Docker/compose snippets or references
- backup scripts or runbooks
- restore runbook
- environment variable mapping
- monitoring and disk usage notes

## Active Runbooks
- [remote-dev-access.md](/D:/working/agentkid/infra/postgres/remote-dev-access.md)
- [backup-restore.md](/D:/working/agentkid/infra/postgres/backup-restore.md)
- [schema-plan.md](/D:/working/agentkid/infra/postgres/schema-plan.md)
