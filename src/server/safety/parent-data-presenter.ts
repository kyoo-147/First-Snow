import { emergencyContacts, notificationPreferences } from '@/db/schema';

export function mapEmergencyContact(row: typeof emergencyContacts.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    relation: row.relationship ?? '',
    phone: row.phone ?? '',
    ...(row.email ? { email: row.email } : {}),
    isPrimary: row.isPrimary,
    notifyOnAlert: row.notifyOnAlert ?? false,
    consentGrantedAt: row.consentGrantedAt?.toISOString(),
    verifiedAt: row.verifiedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

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
