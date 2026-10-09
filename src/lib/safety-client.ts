/**
 * Safety and Parent Operations Client
 *
 * Provides typed, truthful API client operations for parent safety controls:
 * - GET/PATCH /api/privacy
 * - GET/POST /api/consents
 * - GET/POST/PATCH/DELETE /api/emergency-contacts
 * - GET/PATCH /api/notification-preferences
 * - POST/GET /api/data-exports
 * - POST/GET /api/deletion-requests
 *
 * Implements strict error parsing, re-auth detection, and progress states.
 * No fake success: failures and pending progress are surfaced faithfully.
 */

export type ApiErrorDetails = Record<string, string[] | string>;

export class SafetyApiError extends Error {
  statusCode: number;
  code?: string;
  details?: ApiErrorDetails;
  requestId?: string;
  isReauthRequired: boolean;

  constructor(
    message: string,
    statusCode = 500,
    options?: {
      code?: string;
      details?: ApiErrorDetails;
      requestId?: string;
    },
  ) {
    super(message);
    this.name = "SafetyApiError";
    this.statusCode = statusCode;
    this.code = options?.code;
    this.details = options?.details;
    this.requestId = options?.requestId;
    this.isReauthRequired =
      options?.code === "REAUTH_REQUIRED" ||
      options?.code === "INVALID_PASSWORD" ||
      ((statusCode === 401 || statusCode === 403) &&
        typeof message === "string" &&
        (message.toLowerCase().includes("reauth") ||
          message.toLowerCase().includes("password") ||
          message.toLowerCase().includes("credential")));
  }
}

export function parseSafetyApiError(
  data: unknown,
  status: number,
  statusText?: string,
): SafetyApiError {
  let errorMsg: string | undefined;
  let code: string | undefined;
  let details: ApiErrorDetails | undefined;
  let requestId: string | undefined;

  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;

    // Case 1: Nested error contract { error: { code, message, details, requestId } }
    if (obj.error && typeof obj.error === "object" && !Array.isArray(obj.error)) {
      const nested = obj.error as Record<string, unknown>;
      if (typeof nested.message === "string") errorMsg = nested.message;
      if (typeof nested.code === "string") code = nested.code;
      if (nested.details && typeof nested.details === "object") {
        details = nested.details as ApiErrorDetails;
      }
      if (typeof nested.requestId === "string") requestId = nested.requestId;
    } else if (typeof obj.error === "string") {
      // Case 2: Simple string error { error: "..." }
      errorMsg = obj.error;
    }

    // Case 3: Simple message { message: "..." }
    if (!errorMsg && typeof obj.message === "string") {
      errorMsg = obj.message;
    }

    if (!code && typeof obj.code === "string") {
      code = obj.code;
    }
    if (!details && obj.details && typeof obj.details === "object") {
      details = obj.details as ApiErrorDetails;
    }
    if (!requestId && typeof obj.requestId === "string") {
      requestId = obj.requestId;
    }
  }

  if (!errorMsg) {
    errorMsg =
      status === 401
        ? "Session expired or guardian authentication required. Please sign in."
        : status === 403
          ? "Parent authorization required for this safety control."
          : status === 404
            ? "Requested safety configuration or resource not found."
            : status === 409
              ? "A conflict occurred while updating safety preferences."
              : statusText || `Request failed (${status}). Please try again.`;
  }

  return new SafetyApiError(errorMsg, status, { code, details, requestId });
}

async function handleResponse<T>(res: Response): Promise<T> {
  let data: unknown = null;
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    throw parseSafetyApiError(data, res.status, res.statusText);
  }

  return (data as T) ?? ({} as T);
}

function safeCatch(err: unknown): never {
  if (err instanceof SafetyApiError) {
    throw err;
  }
  if (err instanceof Error && err.name === "AbortError") {
    throw new SafetyApiError("Request was cancelled. Please try again.", 499);
  }
  throw new SafetyApiError(
    "Unable to connect to the safety service. Please verify your connection and try again.",
    0,
  );
}

// -------------------------------------------------------------
// Privacy Types & APIs
// -------------------------------------------------------------

export interface PrivacySettingsData {
  microphoneAccess: boolean;
  cameraAccess: boolean;
  visionAiAccess: boolean;
  screenCaptureAccess: boolean;
  cameraPreview: boolean;
  transcriptStorageDays: number;
  emotionTimelineStorage: boolean;
  updatedAt?: string;
}

export type UpdatePrivacyPayload = Partial<PrivacySettingsData> & { reauthPassword?: string };

export async function getPrivacySettings(customFetch = fetch): Promise<PrivacySettingsData> {
  try {
    const res = await customFetch("/api/privacy", {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    const data = await handleResponse<{ privacy?: PrivacySettingsData } | PrivacySettingsData>(res);
    if ("privacy" in data && data.privacy) {
      return data.privacy;
    }
    return data as PrivacySettingsData;
  } catch (err) {
    return safeCatch(err);
  }
}

export async function updatePrivacySettings(
  payload: UpdatePrivacyPayload,
  customFetch = fetch,
): Promise<PrivacySettingsData> {
  try {
    const res = await customFetch("/api/privacy", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const data = await handleResponse<{ privacy?: PrivacySettingsData } | PrivacySettingsData>(res);
    if ("privacy" in data && data.privacy) {
      return data.privacy;
    }
    return data as PrivacySettingsData;
  } catch (err) {
    return safeCatch(err);
  }
}

// -------------------------------------------------------------
// Consent Types & APIs
// -------------------------------------------------------------

export type ConsentScope = "microphone" | "camera" | "vision" | "screen";
export type ConsentStatus = "granted" | "revoked" | "pending" | "expired";

export interface ConsentRecord {
  id: string;
  scope: ConsentScope;
  status: ConsentStatus;
  granted: boolean;
  policyVersion: string;
  grantedAt?: string;
  revokedAt?: string;
  expiresAt?: string;
  notes?: string;
  guardianId?: string;
  guardianName?: string;
  childId?: string;
}

export interface ConsentsResponse {
  consents: ConsentRecord[];
  summary?: Record<ConsentScope, boolean>;
  policyVersion?: string;
}

export interface CreateConsentPayload {
  scope: ConsentScope;
  granted: boolean;
  policyVersion?: string;
  childId?: string;
  notes?: string;
  reauthPassword?: string;
}

export async function getConsents(
  params?: { childId?: string },
  customFetch = fetch,
): Promise<ConsentsResponse> {
  try {
    const url = params?.childId
      ? `/api/consents?childId=${encodeURIComponent(params.childId)}`
      : "/api/consents";

    const res = await customFetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    });

    const data = await handleResponse<ConsentsResponse | ConsentRecord[]>(res);
    if (Array.isArray(data)) {
      const summary: Record<ConsentScope, boolean> = {
        microphone: false,
        camera: false,
        vision: false,
        screen: false,
      };
      for (const item of data) {
        if (item.granted && item.status === "granted") {
          summary[item.scope] = true;
        }
      }
      return { consents: data, summary };
    }
    return data;
  } catch (err) {
    return safeCatch(err);
  }
}

export async function createConsent(
  payload: CreateConsentPayload,
  customFetch = fetch,
): Promise<{ consent: ConsentRecord; message?: string }> {
  try {
    const res = await customFetch("/api/consents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    return await handleResponse<{ consent: ConsentRecord; message?: string }>(res);
  } catch (err) {
    return safeCatch(err);
  }
}

// -------------------------------------------------------------
// Emergency Contacts Types & APIs
// -------------------------------------------------------------

export interface EmergencyContactRecord {
  id: string;
  name: string;
  relation: string;
  phone: string;
  email?: string;
  isPrimary: boolean;
  notifyOnAlert: boolean;
  priority?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEmergencyContactPayload {
  name: string;
  relation: string;
  phone: string;
  email?: string;
  isPrimary?: boolean;
  notifyOnAlert?: boolean;
}

export type UpdateEmergencyContactPayload = Partial<CreateEmergencyContactPayload>;

export async function getEmergencyContacts(
  customFetch = fetch,
): Promise<EmergencyContactRecord[]> {
  try {
    const res = await customFetch("/api/emergency-contacts", {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    const data = await handleResponse<
      { contacts?: EmergencyContactRecord[] } | EmergencyContactRecord[]
    >(res);
    if (Array.isArray(data)) {
      return data;
    }
    return data.contacts ?? [];
  } catch (err) {
    return safeCatch(err);
  }
}

export async function createEmergencyContact(
  payload: CreateEmergencyContactPayload,
  customFetch = fetch,
): Promise<{ contact: EmergencyContactRecord; message?: string }> {
  try {
    const res = await customFetch("/api/emergency-contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    return await handleResponse<{ contact: EmergencyContactRecord; message?: string }>(res);
  } catch (err) {
    return safeCatch(err);
  }
}

export async function updateEmergencyContact(
  id: string,
  payload: UpdateEmergencyContactPayload,
  customFetch = fetch,
): Promise<{ contact: EmergencyContactRecord; message?: string }> {
  try {
    const res = await customFetch("/api/emergency-contacts", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ id, ...payload }),
    });
    return await handleResponse<{ contact: EmergencyContactRecord; message?: string }>(res);
  } catch (err) {
    return safeCatch(err);
  }
}

export async function deleteEmergencyContact(
  id: string,
  customFetch = fetch,
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await customFetch("/api/emergency-contacts", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ id }),
    });
    return await handleResponse<{ success: boolean; message?: string }>(res);
  } catch (err) {
    return safeCatch(err);
  }
}

// -------------------------------------------------------------
// Notification Preferences Types & APIs
// -------------------------------------------------------------

export type NotificationChannel = "email" | "push" | "both" | "none";
export type NotificationFrequency = "immediate" | "digest_daily" | "digest_weekly";
export type ReportCadence = "daily" | "weekly" | "monthly";

export interface DeliveryPreferenceConfig {
  channel: NotificationChannel;
  frequency: NotificationFrequency;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export interface NotificationPreferencesData {
  emailAlerts: boolean;
  pushAlerts: boolean;
  weeklyReport: boolean;
  emergencySmsAlerts: boolean;
  reportCadence: ReportCadence;
  deliveryPreference: DeliveryPreferenceConfig;
  verifiedEmail?: string;
  pushDeviceCount?: number;
  updatedAt?: string;
}

export type UpdateNotificationPreferencesPayload = Partial<{
  emailAlerts: boolean;
  pushAlerts: boolean;
  weeklyReport: boolean;
  emergencySmsAlerts: boolean;
  reportCadence: ReportCadence;
  deliveryPreference: Partial<DeliveryPreferenceConfig>;
}>;

export async function getNotificationPreferences(
  customFetch = fetch,
): Promise<NotificationPreferencesData> {
  try {
    const res = await customFetch("/api/notification-preferences", {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    const data = await handleResponse<
      { preferences?: NotificationPreferencesData } | NotificationPreferencesData
    >(res);
    if ("preferences" in data && data.preferences) {
      return data.preferences;
    }
    return data as NotificationPreferencesData;
  } catch (err) {
    return safeCatch(err);
  }
}

export async function updateNotificationPreferences(
  payload: UpdateNotificationPreferencesPayload,
  customFetch = fetch,
): Promise<NotificationPreferencesData> {
  try {
    const res = await customFetch("/api/notification-preferences", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const data = await handleResponse<
      { preferences?: NotificationPreferencesData } | NotificationPreferencesData
    >(res);
    if ("preferences" in data && data.preferences) {
      return data.preferences;
    }
    return data as NotificationPreferencesData;
  } catch (err) {
    return safeCatch(err);
  }
}

// -------------------------------------------------------------
// Data Exports Types & APIs (requested/running/completed/failed)
// -------------------------------------------------------------

export type DataExportProgressState = "requested" | "running" | "completed" | "failed";

export interface DataExportRecord {
  id: string;
  status: DataExportProgressState;
  requestedAt: string;
  completedAt?: string;
  expiresAt?: string;
  downloadUrl?: string;
  format: "json" | "csv" | "zip";
  archiveSizeBytes?: number;
  childId?: string;
  error?: string;
  progressPercent?: number;
}

export interface RequestDataExportPayload {
  childId?: string;
  includeTranscripts?: boolean;
  includeEmotionTimeline?: boolean;
  includeLearningProgress?: boolean;
  format?: "json" | "csv" | "zip";
  reauthPassword?: string;
}

export async function getDataExports(customFetch = fetch): Promise<DataExportRecord[]> {
  try {
    const res = await customFetch("/api/data-exports", {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    const data = await handleResponse<{ exports?: DataExportRecord[] } | DataExportRecord[]>(res);
    if (Array.isArray(data)) {
      return data;
    }
    return data.exports ?? [];
  } catch (err) {
    return safeCatch(err);
  }
}

export async function requestDataExport(
  payload: RequestDataExportPayload,
  customFetch = fetch,
): Promise<{ export: DataExportRecord; message?: string }> {
  try {
    const res = await customFetch("/api/data-exports", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    return await handleResponse<{ export: DataExportRecord; message?: string }>(res);
  } catch (err) {
    return safeCatch(err);
  }
}

// -------------------------------------------------------------
// Deletion Requests Types & APIs (requested/running/completed/failed)
// -------------------------------------------------------------

export type DeletionProgressState = "requested" | "running" | "completed" | "failed";
export type DeletionScope =
  | "child_transcripts"
  | "emotion_timeline"
  | "all_child_data"
  | "entire_account";

export interface DeletionStageStatus {
  stage: "transcripts" | "emotion_timeline" | "session_logs" | "profile_metadata";
  name: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  detail?: string;
}

export interface DeletionRequestRecord {
  id: string;
  scope: DeletionScope;
  status: DeletionProgressState;
  requestedAt: string;
  completedAt?: string;
  childId?: string;
  stages?: DeletionStageStatus[];
  error?: string;
  scheduledPurgeAt?: string;
}

export interface RequestDeletionPayload {
  scope: DeletionScope;
  childId?: string;
  reason?: string;
  reauthPassword?: string;
  confirmed: boolean;
}

export async function getDeletionRequests(
  customFetch = fetch,
): Promise<DeletionRequestRecord[]> {
  try {
    const res = await customFetch("/api/deletion-requests", {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    const data = await handleResponse<
      { deletionRequests?: DeletionRequestRecord[] } | DeletionRequestRecord[]
    >(res);
    if (Array.isArray(data)) {
      return data;
    }
    return data.deletionRequests ?? [];
  } catch (err) {
    return safeCatch(err);
  }
}

export async function requestDataDeletion(
  payload: RequestDeletionPayload,
  customFetch = fetch,
): Promise<{ deletion: DeletionRequestRecord; message?: string }> {
  try {
    const res = await customFetch("/api/deletion-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    return await handleResponse<{ deletion: DeletionRequestRecord; message?: string }>(res);
  } catch (err) {
    return safeCatch(err);
  }
}
