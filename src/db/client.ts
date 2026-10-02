import 'server-only';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Use a single connection for tests to avoid connection pool issues
const queryClient = postgres(connectionString, {
  max: process.env.NODE_ENV === 'test' ? 1 : 10,
  onnotice: () => {}, // suppress NOTICE messages in logs
});

export const db = drizzle(queryClient, { schema });
export type Database = typeof db;
