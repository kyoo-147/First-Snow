export interface PublicRuntimeConfig {
  appUrl?: string;
  marketingUrl?: string;
  vapidPublicKey?: string;
}

export interface ServerRuntimeConfig {
  databaseUrl: string;
  databaseDirectUrl?: string;
  databasePoolMax: number;
  databaseSslMode: "disable" | "require" | "prefer";
  databaseRemoteHost?: string;
  databaseRemotePort: number;
  databaseSshTunnel?: string;
  authSecret: string;
  authSessionCookieName: string;
  authCookieSecure?: boolean;
  googleCloudProjectId?: string;
  googleGeminiApiKey?: string;
  googleApplicationCredentialsJson?: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioPhoneNumber?: string;
  zaloOaAccessToken?: string;
  zaloOaId?: string;
  vapidPrivateKey?: string;
}

export interface RuntimeConfig {
  public: PublicRuntimeConfig;
  server: ServerRuntimeConfig;
}
