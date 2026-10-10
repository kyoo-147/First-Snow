import { NextResponse } from 'next/server';
import { and, desc, eq, ne } from 'drizzle-orm';
import { db } from '@/db/client';
import { emergencyContacts } from '@/db/schema';
import { requireParentSession } from '@/server/auth';
import { audit, context, reauthenticate, SafetyError, safetyErrorResponse } from '@/server/safety';
import { normalizeE164, readTwilioConfig } from '@/server/safety/twilio';
import { emergencyContactSavedMessage, emergencyContactUpdatedMessage } from '@/server/safety/emergency-contact-presenter';
import { mapEmergencyContact } from '@/server/safety/parent-data-presenter';
import { z } from 'zod';

export async function GET() {
  try {
    const session = await requireParentSession();
    if (session instanceof Response) return session;
    const { household } = await context(session);
    const rows = await db.select().from(emergencyContacts).where(eq(emergencyContacts.householdId, household.id)).orderBy(desc(emergencyContacts.isPrimary), desc(emergencyContacts.createdAt));
    return NextResponse.json({ contacts: rows.map(mapEmergencyContact), providerConfigured: Boolean(readTwilioConfig()) });
  } catch (error) { return safetyErrorResponse(error); }
}

const fields = {
  name: z.string().trim().min(1).max(255),
  relation: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(3).max(30),
  email: z.string().trim().email().max(255).optional(),
  isPrimary: z.boolean().optional(),
  notifyOnAlert: z.boolean().optional(),
};
const createSchema = z.object(fields).strict();

function deliveryFields(phone: string, enabled: boolean) {
  if (!enabled) return { phone, notifyOnAlert: false, consentGrantedAt: null, verifiedAt: null };
  if (!readTwilioConfig()) throw new SafetyError(503, 'PROVIDER_UNAVAILABLE', 'Twilio emergency delivery is not fully configured.');
  const normalized = normalizeE164(phone);
  if (!normalized) throw new SafetyError(400, 'VALIDATION_FAILED', 'Emergency alert phone must be a valid E.164 or Vietnamese mobile number.', { phone: ['Use +849... or 09... format.'] });
  const now = new Date();
  return { phone: normalized, notifyOnAlert: true, consentGrantedAt: now, verifiedAt: now };
}

export async function POST(request: Request) {
  try {
    const session = await requireParentSession();
    if (session instanceof Response) return session;
    let body: unknown;
    try { body = await request.json(); } catch { throw new SafetyError(400, 'VALIDATION_FAILED', 'Valid JSON is required.'); }
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) throw new SafetyError(400, 'VALIDATION_FAILED', 'Invalid emergency contact.', parsed.error.flatten().fieldErrors as Record<string, string[]>);
    const delivery = deliveryFields(parsed.data.phone, parsed.data.notifyOnAlert === true);
    const { household } = await context(session);
    if (parsed.data.isPrimary) {
      await db.update(emergencyContacts)
        .set({ isPrimary: false, updatedAt: new Date() })
        .where(and(eq(emergencyContacts.householdId, household.id), eq(emergencyContacts.isPrimary, true)));
    }
    const [row] = await db.insert(emergencyContacts).values({ householdId: household.id, name: parsed.data.name, relationship: parsed.data.relation, ...delivery, email: parsed.data.email ?? null, isPrimary: parsed.data.isPrimary ?? false } as typeof emergencyContacts.$inferInsert).returning();
    if (!row) throw new Error('Contact insert returned no row');
    await audit(session.sub, 'emergency_contact.created', 'emergency_contact', row.id, { alertPreference: row.notifyOnAlert, consentConfirmed: Boolean(row.consentGrantedAt) });
    return NextResponse.json({ contact: mapEmergencyContact(row), message: emergencyContactSavedMessage(row.notifyOnAlert) }, { status: 201 });
  } catch (error) { return safetyErrorResponse(error); }
}

const patchSchema = z.object({ id: z.string().uuid(), name: fields.name.optional(), relation: fields.relation.optional(), phone: fields.phone.optional(), email: fields.email.nullable(), isPrimary: fields.isPrimary, notifyOnAlert: fields.notifyOnAlert, reauthPassword: z.string().optional() }).strict();

export async function PATCH(request: Request) {
  try {
    const session = await requireParentSession();
    if (session instanceof Response) return session;
    let body: unknown;
    try { body = await request.json(); } catch { throw new SafetyError(400, 'VALIDATION_FAILED', 'Valid JSON is required.'); }
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) throw new SafetyError(400, 'VALIDATION_FAILED', 'Invalid emergency contact update.', parsed.error.flatten().fieldErrors as Record<string, string[]>);
    const { household } = await context(session);
    const { id, reauthPassword, ...data } = parsed.data;
    const [existing] = await db.select().from(emergencyContacts).where(and(eq(emergencyContacts.id, id), eq(emergencyContacts.householdId, household.id))).limit(1);
    if (!existing) throw new SafetyError(404, 'NOT_FOUND', 'Emergency contact not found.');
    if (data.isPrimary !== undefined || data.phone !== undefined || data.email !== undefined) await reauthenticate(session.sub, reauthPassword);
    if (data.isPrimary === true) {
      await db.update(emergencyContacts)
        .set({ isPrimary: false, updatedAt: new Date() })
        .where(and(eq(emergencyContacts.householdId, household.id), eq(emergencyContacts.isPrimary, true), ne(emergencyContacts.id, id)));
    }
    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (data.name !== undefined) update.name = data.name;
    if (data.relation !== undefined) update.relationship = data.relation;
    if (data.email !== undefined) update.email = data.email;
    if (data.isPrimary !== undefined) update.isPrimary = data.isPrimary;
    if (data.notifyOnAlert !== undefined || data.phone !== undefined) Object.assign(update, deliveryFields(data.phone ?? existing.phone ?? '', data.notifyOnAlert ?? existing.notifyOnAlert));
    const [row] = await db.update(emergencyContacts).set(update).where(and(eq(emergencyContacts.id, id), eq(emergencyContacts.householdId, household.id))).returning();
    if (!row) throw new Error('Contact update returned no row');
    await audit(session.sub, 'emergency_contact.updated', 'emergency_contact', id, { alertPreference: row.notifyOnAlert, consentConfirmed: Boolean(row.consentGrantedAt) });
    return NextResponse.json({ contact: mapEmergencyContact(row), message: emergencyContactUpdatedMessage(row.notifyOnAlert) });
  } catch (error) { return safetyErrorResponse(error); }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireParentSession();
    if (session instanceof Response) return session;
    let body: unknown;
    try { body = await request.json(); } catch { throw new SafetyError(400, 'VALIDATION_FAILED', 'Valid JSON is required.'); }
    const parsed = z.object({ id: z.string().uuid(), reauthPassword: z.string().optional() }).strict().safeParse(body);
    if (!parsed.success) throw new SafetyError(400, 'VALIDATION_FAILED', 'Invalid contact identifier.');
    await reauthenticate(session.sub, parsed.data.reauthPassword);
    const { household } = await context(session);
    const [row] = await db.delete(emergencyContacts).where(and(eq(emergencyContacts.id, parsed.data.id), eq(emergencyContacts.householdId, household.id))).returning({ id: emergencyContacts.id });
    if (!row) throw new SafetyError(404, 'NOT_FOUND', 'Emergency contact not found.');
    await audit(session.sub, 'emergency_contact.deleted', 'emergency_contact', row.id);
    return NextResponse.json({ success: true, message: 'Contact deleted.' });
  } catch (error) { return safetyErrorResponse(error); }
}
