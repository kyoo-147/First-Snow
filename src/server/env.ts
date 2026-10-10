import 'server-only';
import { z } from 'zod';

const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

const EnvSchema = z.object({
  DATABASE_URL: isBuildPhase
    ? z.string().min(1).default('postgresql://build-placeholder:build-placeholder@localhost:5432/build')
    : z.string().min(1, 'DATABASE_URL is required'),
  SESSION_SECRET: isBuildPhase
    ? z.string().min(32).default('build-phase-placeholder-secret-at-least-32-chars')
    : z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  CHILD_SESSION_SECRET: isBuildPhase
    ? z.string().min(32).default('build-phase-placeholder-secret-at-least-32-chars')
    : z.string().min(32, 'CHILD_SESSION_SECRET must be at least 32 characters'),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
});

const result = EnvSchema.safeParse(process.env);

if (!result.success) {
  const missing = result.error.issues
    .map((i) => i.path.join('.') || i.message)
    .join(', ');
  throw new Error(
    `Environment validation failed. Missing or invalid: ${missing}`,
  );
}

export const env = result.data;
