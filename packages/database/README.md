# Database Package

Schema, migrations, ownership policies, seeds, and typed database access helpers for self-hosted PostgreSQL belong here.

## Baseline
- PostgreSQL is the active database target.
- Drizzle ORM + Drizzle Kit are the schema and migration tooling.
- `DATABASE_URL` is used by app/worker runtime pools.
- `DATABASE_DIRECT_URL` is preferred for migrations and one-off admin operations.
- Database access is server-side only through `apps/web` route handlers and `apps/worker` jobs.
- Service-layer ownership checks are required before every parent/child/session mutation.
- PostgreSQL RLS may be added later as defense in depth, but MVP authorization starts in server-side services.

## Commands
Run these from `packages/database`.

```bash
npm run build       # Type-check database package
npm run db:generate # Generate SQL from Drizzle schema changes
npm run db:migrate  # Apply generated migrations through DATABASE_DIRECT_URL
npm run db:check    # Validate Drizzle migration consistency
npm run db:studio   # Open Drizzle Studio
```

From the repo root:

```bash
npm run check:database-schema
```

This static check verifies the initial migration contains the required tables/extensions and does not introduce raw media storage columns.

## Server Apply Helper
After opening the SSH tunnel and setting `DATABASE_DIRECT_URL`, run from the repo root:

```powershell
powershell -ExecutionPolicy Bypass -File ./scripts/data/apply-database-migrations.ps1 -RequireDirectUrl
```
