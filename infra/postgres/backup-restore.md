# PostgreSQL Backup And Restore Runbook

## Requirement
Backups and restore drills are required before collecting pilot data.

## Backup Targets
- Primary: encrypted server-side backup artifact copied to private object storage or a secure backup host.
- Secondary: short-lived local operator download only for restore testing.

## Minimum Backup Command
Run from the server deployment directory:
```bash
docker compose exec -T postgres pg_dump \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  --format=custom \
  --no-owner \
  --no-acl \
  > "agentkid-$(date +%Y%m%d-%H%M%S).dump"
```

## Backup Helper
From the repo root, operators can run:

```powershell
powershell -ExecutionPolicy Bypass -File ./scripts/data/postgres-backup.ps1 -ComposeDir ./infra/deploy/server -OutputDir ./backups
```

The output directory is local to the operator machine or server shell where the command runs. Do not commit generated `.dump` files.

## Minimum Restore Drill
Restore into a non-production database before trusting backups:
```bash
createdb agentkid_restore_check
pg_restore \
  --dbname=agentkid_restore_check \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  agentkid-YYYYMMDD-HHMMSS.dump
```

## Schedule
- Development phase: daily backup while active backend work is happening.
- Pilot phase: at least daily backup plus manual restore drill before onboarding real pilot data.
- Production phase: define retention, encryption, and point-in-time recovery strategy before launch.

## Safety Rules
- Do not include raw media because raw audio/video must not be stored in MVP.
- Treat transcripts, emotion events, memories, and alerts as sensitive child-related data.
- Do not send backup files through chat or email.
- Rotate database credentials if a backup or env file is exposed.
