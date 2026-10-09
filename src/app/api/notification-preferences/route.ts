import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { notificationPreferences } from '@/db/schema';
import { requireParentSession } from '@/server/auth';
import { audit, context, SafetyError, safetyErrorResponse } from '@/server/safety';
import { readTwilioConfig } from '@/server/safety/twilio';
import { z } from 'zod';

const channels = ['email', 'push', 'in_app', 'sms', 'voice'] as const;
export function mapNotificationPreferences(rows: Array<typeof notificationPreferences.$inferSelect>) {
  const enabled = (channel: typeof channels[number]) => rows.find((row) => row.channel === channel)?.enabled ?? false;
  const emailAlerts = enabled('email');
  const pushAlerts = enabled('push');
  const weeklyReport = enabled('in_app');
  const emergencySmsAlerts = enabled('sms') && enabled('voice');
  const channel = emailAlerts && pushAlerts ? 'both' : emailAlerts ? 'email' : pushAlerts ? 'push' : 'none';
  const updatedAt = rows.reduce<Date | undefined>((latest, row) => !latest || row.updatedAt > latest ? row.updatedAt : latest, undefined);
  return { emailAlerts, pushAlerts, weeklyReport, emergencySmsAlerts, reportCadence: 'weekly' as const, deliveryPreference: { channel, frequency: 'immediate' as const, quietHoursEnabled: false }, ...(updatedAt ? { updatedAt: updatedAt.toISOString() } : {}) };
}
async function read(userId: string) { return mapNotificationPreferences(await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId))); }

export async function GET() {
  try {
    const session = await requireParentSession();
    if (session instanceof Response) return session;
    await context(session);
    return NextResponse.json({ preferences: await read(session.sub), emergencyProviderConfigured: Boolean(readTwilioConfig()) });
  } catch (error) { return safetyErrorResponse(error); }
}

const schema = z.object({ emailAlerts: z.boolean().optional(), pushAlerts: z.boolean().optional(), weeklyReport: z.boolean().optional(), emergencySmsAlerts: z.boolean().optional(), reportCadence: z.enum(['daily', 'weekly', 'monthly']).optional(), deliveryPreference: z.object({ channel: z.enum(['email', 'push', 'both', 'none']).optional(), frequency: z.enum(['immediate', 'digest_daily', 'digest_weekly']).optional(), quietHoursEnabled: z.boolean().optional(), quietHoursStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(), quietHoursEnd: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional() }).strict().optional() }).strict();

export async function PATCH(request: Request) {
  try {
    const session = await requireParentSession();
    if (session instanceof Response) return session;
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) throw new SafetyError(400, 'VALIDATION_FAILED', 'Invalid notification preferences.', parsed.error.flatten().fieldErrors as Record<string, string[]>);
    await context(session);
    const values = parsed.data;
    if (values.emergencySmsAlerts === true && !readTwilioConfig()) throw new SafetyError(503, 'PROVIDER_UNAVAILABLE', 'Twilio SMS and Voice are not fully configured.');
    if (values.reportCadence && values.reportCadence !== 'weekly') throw new SafetyError(503, 'WORKER_UNAVAILABLE', 'Report scheduling is unavailable because no scheduler is configured.');
    if (values.deliveryPreference && (values.deliveryPreference.frequency !== undefined && values.deliveryPreference.frequency !== 'immediate' || values.deliveryPreference.quietHoursEnabled || values.deliveryPreference.quietHoursStart || values.deliveryPreference.quietHoursEnd)) throw new SafetyError(503, 'WORKER_UNAVAILABLE', 'Digest and quiet hour scheduling are unavailable because no scheduler is configured.');
    const channelValues: Partial<Record<typeof channels[number], boolean>> = { email: values.emailAlerts, push: values.pushAlerts, in_app: values.weeklyReport, sms: values.emergencySmsAlerts, voice: values.emergencySmsAlerts };
    const deliveryChannel = values.deliveryPreference?.channel;
    if (deliveryChannel) {
      if (values.emailAlerts === undefined) channelValues.email = deliveryChannel === 'email' || deliveryChannel === 'both';
      if (values.pushAlerts === undefined) channelValues.push = deliveryChannel === 'push' || deliveryChannel === 'both';
    }
    for (const channel of channels) {
      const enabled = channelValues[channel];
      if (enabled === undefined) continue;
      const [existing] = await db.select({ id: notificationPreferences.id }).from(notificationPreferences).where(and(eq(notificationPreferences.userId, session.sub), eq(notificationPreferences.channel, channel))).limit(1);
      if (existing) await db.update(notificationPreferences).set({ enabled, updatedAt: new Date() }).where(eq(notificationPreferences.id, existing.id));
      else await db.insert(notificationPreferences).values({ userId: session.sub, channel, enabled, updatedAt: new Date() });
    }
    await audit(session.sub, 'notification_preferences.updated', 'notification_preferences', session.sub, { fields: Object.keys(values) });
    return NextResponse.json({ preferences: await read(session.sub) });
  } catch (error) { return safetyErrorResponse(error); }
}
