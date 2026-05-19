# Data Scripts

Seed generation, sample data, or import/export helpers belong here.

## PostgreSQL Helpers
- `apply-database-migrations.ps1`: runs Drizzle migration checks and applies pending migrations using `DATABASE_DIRECT_URL` or `DATABASE_URL`.
- `postgres-backup.ps1`: creates a custom-format PostgreSQL dump from the server Compose stack.

Do not commit generated backup files. Treat transcripts, emotion events, memories, and alerts as sensitive child-related data.
