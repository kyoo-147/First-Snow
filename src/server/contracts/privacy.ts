import { z } from 'zod';

// ── Privacy settings contracts ────────────────────────────────────────────────

/**
 * PATCH /api/privacy — guardian updates a subset of privacy settings.
 * `cameraPreview` is accepted by the schema but the route fails closed with 503
 * because it is not separately persisted or enforced.
 */
export const UpdatePrivacySettingsSchema = z
  .object({
    microphoneAccess: z.boolean().optional(),
    cameraAccess: z.boolean().optional(),
    visionAiAccess: z.boolean().optional(),
    screenCaptureAccess: z.boolean().optional(),
    cameraPreview: z.boolean().optional(),
    transcriptStorageDays: z.number().int().min(0).max(3650).optional(),
    emotionTimelineStorage: z.boolean().optional(),
    reauthPassword: z.string().optional(),
  })
  .strict();

/** GET /api/privacy — effective, persisted privacy settings for a household. */
export const PrivacySettingsSchema = z.object({
  microphoneAccess: z.boolean(),
  cameraAccess: z.boolean(),
  visionAiAccess: z.boolean(),
  screenCaptureAccess: z.boolean(),
  cameraPreview: z.boolean(),
  transcriptStorageDays: z.number().int(),
  emotionTimelineStorage: z.boolean(),
  updatedAt: z.string().optional(),
});

export const PrivacySettingsResponseSchema = z.object({
  privacy: PrivacySettingsSchema,
});

// ── Consent contracts ─────────────────────────────────────────────────────────

export const ConsentScopeSchema = z.enum(['microphone', 'camera', 'vision', 'screen']);

/** POST /api/consents — record a versioned consent grant/revoke. */
export const CreateConsentSchema = z
  .object({
    scope: ConsentScopeSchema,
    granted: z.boolean(),
    policyVersion: z.string().optional(),
    childId: z.string().uuid().optional(),
    notes: z.string().max(500).optional(),
    reauthPassword: z.string().optional(),
  })
  .strict();

export const ConsentSchema = z.object({
  id: z.string().uuid(),
  scope: ConsentScopeSchema,
  status: z.enum(['granted', 'revoked']),
  granted: z.boolean(),
  policyVersion: z.string(),
  grantedAt: z.string().optional(),
  revokedAt: z.string().optional(),
  childId: z.string().uuid().optional(),
  guardianId: z.string().uuid().optional(),
});

export const ConsentsResponseSchema = z.object({
  consents: z.array(ConsentSchema),
  summary: z.object({
    microphone: z.boolean(),
    camera: z.boolean(),
    vision: z.boolean(),
    screen: z.boolean(),
  }),
  policyVersion: z.string(),
});

// ── Inferred types ────────────────────────────────────────────────────────────

export type UpdatePrivacySettingsInput = z.infer<typeof UpdatePrivacySettingsSchema>;
export type PrivacySettingsShape = z.infer<typeof PrivacySettingsSchema>;
export type CreateConsentInput = z.infer<typeof CreateConsentSchema>;
export type ConsentShape = z.infer<typeof ConsentSchema>;
export type ConsentsResponseShape = z.infer<typeof ConsentsResponseSchema>;
