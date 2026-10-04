import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { capabilityConsents, retentionPolicies } from '@/db/schema';
import { requireParentSession } from '@/server/auth';
import { audit, consentCapabilities, context, latestConsents, POLICY_VERSION, privacySettings, reauthenticate, SafetyError, safetyErrorResponse } from '@/server/safety';
import { UpdatePrivacySettingsSchema } from '@/server/contracts/privacy';

export async function GET() {
  try { const session = await requireParentSession(); if (session instanceof Response) return session; const { household } = await context(session); return NextResponse.json({ privacy: await privacySettings(household.id) }); }
  catch (e) { return safetyErrorResponse(e); }
}

const schema = UpdatePrivacySettingsSchema;
export async function PATCH(request: Request) {
  try {
    const session = await requireParentSession(); if (session instanceof Response) return session;
    const body = schema.safeParse(await request.json()); if (!body.success) throw new SafetyError(400, 'VALIDATION_FAILED', 'Invalid privacy settings.', body.error.flatten().fieldErrors as Record<string, string[]>);
    const input = body.data;
    if (input.cameraPreview === true) throw new SafetyError(503, 'CAPABILITY_UNAVAILABLE', 'Camera preview is unavailable because it is not separately persisted or enforced.');
    const { household } = await context(session);
    const values = Object.entries(consentCapabilities).filter(([key]) => {
      if (key === 'camera') return typeof input.cameraAccess === 'boolean';
      const field = key === 'microphone' ? 'microphoneAccess' : key === 'vision' ? 'visionAiAccess' : 'screenCaptureAccess';
      return typeof input[field] === 'boolean';
    });
    if (values.length || input.emotionTimelineStorage !== undefined || input.transcriptStorageDays !== undefined) await reauthenticate(session.sub, input.reauthPassword);
    for (const [scope, capability] of values) {
      const granted = scope === 'camera'
        ? input.cameraAccess === true
        : Boolean(input[`${scope === 'microphone' ? 'microphoneAccess' : scope === 'vision' ? 'visionAiAccess' : 'screenCaptureAccess'}` as keyof typeof input]);
      const [latest] = (await latestConsents(household.id)).filter((row) => row.capability === capability).slice(0, 1);
      await db.insert(capabilityConsents).values({ householdId: household.id, capability, version: (latest?.version ?? 0) + 1, granted, grantedAt: granted ? new Date() : null, revokedAt: granted ? null : new Date(), grantedByUserId: session.sub, metadata: { policyVersion: POLICY_VERSION } } as typeof capabilityConsents.$inferInsert);
    }
    const existingPolicies = await db.select().from(retentionPolicies).where(eq(retentionPolicies.householdId, household.id));
    for (const [resourceType, retentionDays, isActive, requested] of [['transcripts', input.transcriptStorageDays, true, input.transcriptStorageDays !== undefined], ['emotion_timeline', 0, input.emotionTimelineStorage, input.emotionTimelineStorage !== undefined]] as const) {
      if (!requested) continue;
      const existing = existingPolicies.find((row) => row.resourceType === resourceType);
      const update = { ...(retentionDays !== undefined ? { retentionDays } : {}), ...(isActive !== undefined ? { isActive } : {}), updatedAt: new Date() };
      if (existing) await db.update(retentionPolicies).set(update).where(and(eq(retentionPolicies.id, existing.id), eq(retentionPolicies.householdId, household.id)));
      else await db.insert(retentionPolicies).values({ householdId: household.id, resourceType, retentionDays: retentionDays ?? 0, isActive: isActive ?? true } as typeof retentionPolicies.$inferInsert);
    }
    await audit(session.sub, 'privacy.settings.updated', 'privacy_settings', household.id, { fields: Object.keys(input).filter((key) => key !== 'reauthPassword') });
    return NextResponse.json({ privacy: await privacySettings(household.id) });
  } catch (e) { return safetyErrorResponse(e); }
}
