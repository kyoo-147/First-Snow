import { Pool, type QueryResultRow } from "pg";

let pool: Pool | null = null;

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_DIRECT_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL or DATABASE_DIRECT_URL is required for database-backed API routes.");
  }

  return databaseUrl;
}

export function getPostgresPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: getDatabaseUrl(),
      max: Number(process.env.DATABASE_POOL_MAX || 5),
      ssl: process.env.DATABASE_SSL_MODE === "require" ? { rejectUnauthorized: false } : undefined
    });
  }

  return pool;
}

export async function query<T extends QueryResultRow>(text: string, values: unknown[] = []) {
  return getPostgresPool().query<T>(text, values);
}
