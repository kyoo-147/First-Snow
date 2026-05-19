import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "./schema";

export type DatabaseClient = ReturnType<typeof createDatabaseClient>;

/**
 * Create a Drizzle ORM database client connected to PostgreSQL.
 *
 * Uses the standard env vars: DATABASE_URL, DATABASE_POOL_MAX, DATABASE_SSL_MODE.
 * Browser clients must never call this – it is server-side only.
 */
export function createDatabaseClient(options?: {
  connectionString?: string;
  maxConnections?: number;
  ssl?: boolean;
}) {
  const connectionString =
    options?.connectionString ?? process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. See infra/postgres/remote-dev-access.md for setup instructions."
    );
  }

  const poolMax =
    options?.maxConnections ??
    (process.env.DATABASE_POOL_MAX
      ? parseInt(process.env.DATABASE_POOL_MAX, 10)
      : 10);

  const sslMode = process.env.DATABASE_SSL_MODE ?? "disable";

  const pool = new Pool({
    connectionString,
    max: poolMax,
    ssl: sslMode === "require" ? { rejectUnauthorized: false } : undefined,
  });

  return drizzle(pool, { schema });
}

/**
 * Lightweight health check – runs SELECT 1 to verify the pool is reachable.
 */
export async function checkDatabaseHealth(db: DatabaseClient): Promise<boolean> {
  try {
    await db.execute(sql`SELECT 1`);
    return true;
  } catch {
    return false;
  }
}
