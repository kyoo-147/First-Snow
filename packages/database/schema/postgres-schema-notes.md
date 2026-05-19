# PostgreSQL Schema Notes

The active schema target is the server-hosted PostgreSQL database described in `ADR-008`.

## Source Of Truth
- Domain model: `docs/architecture/domain-model.md`
- Technical rules: `docs/engineering/system-spec.md`
- Infra runbooks: `infra/postgres/`
- Drizzle schema definitions: `packages/database/src/schema/`
- Generated migrations: `packages/database/migrations/`

## Current State
Schema implementation is complete using **Drizzle ORM**. The following are in place:

- **8 table schemas** defined in TypeScript (`src/schema/`):
  - `users`, `children`, `sessions`, `messages`, `emotion_events`, `lessons`, `memories`, `alerts`
- **7 foreign key relationships** enforcing the ownership chain
- **13 indexes** for ownership joins and timeline queries
- **Connection factory** (`src/connection.ts`) with pool management
- **Ownership verification helpers** (`src/ownership.ts`) for authorization checks
- **Drizzle Kit config** (`drizzle.config.ts`) for migration management
- **Dev seed data** (`seeds/dev-seed.ts`) with realistic Vietnamese demo content

## Migration/Query Tool
**Drizzle ORM** was selected over Prisma and raw SQL for:
- TypeScript-first schema-as-code (type-safe queries without separate codegen)
- PostgreSQL-native support (enums, jsonb, arrays, pgvector-ready)
- Lightweight runtime (no engine daemon)
- SQL migration output (human-reviewable)

## Commands
```bash
# From packages/database:
npm run db:generate   # Generate SQL migration from schema changes
npm run db:push       # Apply schema directly to database (dev)
npm run db:migrate    # Run pending migrations (production)
npm run db:studio     # Open Drizzle Studio visual editor
npm run db:seed       # Populate dev data
```

## Next Steps
- Apply schema to server PostgreSQL via SSH tunnel + `db:push`
- Run seed data for development
- Add pgvector extension and embedding column after dimension selection
