import type { ApiAlert, ApiTranscriptMessage, CompanionMessage, CompanionSession } from '@/lib/companion-client';
import type { CompanionMessage as DbMessage, CompanionSession as DbSession } from '@/db/schema/companion';

export const sessionDto = (row: DbSession): CompanionSession => ({ id: row.id, childId: row.childId, createdAt: row.startedAt.toISOString(), status: row.endedAt ? 'closed' : 'active' });
export const messageDto = (row: DbMessage): CompanionMessage => ({ id: row.id, clientMessageId: row.clientMessageId ?? undefined, sessionId: row.sessionId, role: row.speaker === 'snow' ? 'assistant' : 'child', content: row.text, createdAt: row.createdAt.toISOString() });
export const transcriptDto = (row: DbMessage): ApiTranscriptMessage => ({ id: row.id, sessionId: row.sessionId, role: row.speaker === 'snow' ? 'assistant' : 'child', content: row.text, createdAt: row.createdAt.toISOString() });

export function alertDto(row: DbMessage): ApiAlert {
  let state: { codes?: string[]; readAt?: string | null } = {};
  try { state = JSON.parse(row.safetyAlerts ?? '{}') as typeof state; } catch { /* legacy rows have no state */ }
  const codes = state.codes ?? [];
  const severity = codes.some((code) => code === 'self_harm' || code === 'immediate_danger') ? 'high' : 'medium';
  return { id: row.id, childId: row.childId, title: 'Conversation safety review', description: row.flagReason ?? 'A conversation may need a caregiver check-in.', severity, createdAt: row.createdAt.toISOString(), readAt: state.readAt ?? null, linkedSessionId: row.sessionId };
}
