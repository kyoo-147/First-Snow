import { z } from "zod";

const databaseEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DATABASE_DIRECT_URL: z.string().optional(),
  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),
  DATABASE_SSL_MODE: z
    .enum(["disable", "require", "prefer"])
    .default("disable"),
  DATABASE_REMOTE_HOST: z.string().optional(),
  DATABASE_REMOTE_PORT: z.coerce.number().int().positive().default(5432),
  DATABASE_SSH_TUNNEL: z.string().optional(),
});

const authEnvSchema = z.object({
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
  AUTH_SESSION_COOKIE_NAME: z.string().default("agentkid_session"),
  AUTH_COOKIE_SECURE: z
    .enum(["true", "false"])
    .optional(),
});

const googleEnvSchema = z.object({
  GOOGLE_APPLICATION_CREDENTIALS_JSON: z.string().optional(),
  GOOGLE_CLOUD_PROJECT_ID: z.string().optional(),
  GOOGLE_GEMINI_API_KEY: z.string().optional(),
});

const alertEnvSchema = z.object({
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  ZALO_OA_ACCESS_TOKEN: z.string().optional(),
  ZALO_OA_ID: z.string().optional(),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
});

const publicEnvSchema = z.object({
  NEXT_PUBLIC_MARKETING_URL: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
});

export const serverEnvSchema = databaseEnvSchema
  .merge(authEnvSchema)
  .merge(googleEnvSchema)
  .merge(alertEnvSchema)
  .merge(publicEnvSchema);

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Parse and validate server-side environment variables.
 * Throws a descriptive error at startup if required variables are missing.
 */
export function parseServerEnv(
  env: Record<string, string | undefined> = process.env
): ServerEnv {
  const result = serverEnvSchema.safeParse(env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `Environment validation failed:\n${formatted}\n\nCheck your .env file or server environment.`
    );
  }

  return result.data;
}

/**
 * Parse only the database-related environment variables.
 * Useful for packages/database connection setup.
 */
export function parseDatabaseEnv(
  env: Record<string, string | undefined> = process.env
) {
  const result = databaseEnvSchema.safeParse(env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `Database environment validation failed:\n${formatted}\n\nEnsure DATABASE_URL is set. See infra/postgres/remote-dev-access.md for setup.`
    );
  }

  return result.data;
}

export function toRuntimeConfig(env: ServerEnv) {
  return {
    public: {
      appUrl: env.NEXT_PUBLIC_APP_URL,
      marketingUrl: env.NEXT_PUBLIC_MARKETING_URL,
      vapidPublicKey: env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    },
    server: {
      databaseUrl: env.DATABASE_URL,
      databaseDirectUrl: env.DATABASE_DIRECT_URL,
      databasePoolMax: env.DATABASE_POOL_MAX,
      databaseSslMode: env.DATABASE_SSL_MODE,
      databaseRemoteHost: env.DATABASE_REMOTE_HOST,
      databaseRemotePort: env.DATABASE_REMOTE_PORT,
      databaseSshTunnel: env.DATABASE_SSH_TUNNEL,
      authSecret: env.AUTH_SECRET,
      authSessionCookieName: env.AUTH_SESSION_COOKIE_NAME,
      authCookieSecure: env.AUTH_COOKIE_SECURE === undefined ? undefined : env.AUTH_COOKIE_SECURE === "true",
      googleApplicationCredentialsJson: env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
      googleCloudProjectId: env.GOOGLE_CLOUD_PROJECT_ID,
      googleGeminiApiKey: env.GOOGLE_GEMINI_API_KEY,
      twilioAccountSid: env.TWILIO_ACCOUNT_SID,
      twilioAuthToken: env.TWILIO_AUTH_TOKEN,
      twilioPhoneNumber: env.TWILIO_PHONE_NUMBER,
      zaloOaAccessToken: env.ZALO_OA_ACCESS_TOKEN,
      zaloOaId: env.ZALO_OA_ID,
      vapidPrivateKey: env.VAPID_PRIVATE_KEY,
    },
  };
}

export function readRuntimeConfig(
  env: Record<string, string | undefined> = process.env
) {
  return toRuntimeConfig(parseServerEnv(env));
}

export { databaseEnvSchema, authEnvSchema };
