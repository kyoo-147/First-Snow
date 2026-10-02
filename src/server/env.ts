import 'server-only';
import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  SESSION_SECRET: z
    .string()
    .min(32, 'SESSION_SECRET must be at least 32 characters'),
  CHILD_SESSION_SECRET: z
    .string()
    .min(32, 'CHILD_SESSION_SECRET must be at least 32 characters'),
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
