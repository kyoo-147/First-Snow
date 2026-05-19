export const ENV_CATEGORIES = {
  publicClient: "public-client",
  serverRuntime: "server-runtime",
  providerCredentials: "provider-credentials",
  alertCredentials: "alert-credentials",
  deploymentMetadata: "deployment-metadata",
  observability: "observability"
} as const;

export type EnvCategory = (typeof ENV_CATEGORIES)[keyof typeof ENV_CATEGORIES];

export {
  serverEnvSchema,
  databaseEnvSchema,
  authEnvSchema,
  parseServerEnv,
  parseDatabaseEnv,
} from "./schema";
export type { ServerEnv } from "./schema";

