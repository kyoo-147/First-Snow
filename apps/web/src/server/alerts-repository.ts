import { query } from "./postgres";

export type AlertSeverity = "warning" | "critical";

export type AlertRecord = {
  id: string;
  session_id: string;
  severity: AlertSeverity;
  trigger_type: "keyword" | "emotion";
  message: string;
  emotion_history: Array<{ emotion: string; confidence: number }> | null;
  channels: string[];
  status: string;
  created_at: string;
};

export function toAlertResponse(row: AlertRecord) {
  return {
    id: row.id,
    sessionId: row.session_id,
    severity: row.severity,
    triggerType: row.trigger_type,
    message: row.message,
    emotionHistory: row.emotion_history ?? [],
    channels: row.channels,
    status: row.status,
    createdAt: row.created_at
  };
}

export async function createAlert(input: {
  sessionId: string;
  severity: AlertSeverity;
  triggerType: "keyword" | "emotion";
  message: string;
  emotionHistory?: Array<{ emotion: string; confidence: number }>;
  channels: string[];
}) {
  const result = await query<AlertRecord>(
    `insert into alerts (session_id, severity, trigger_type, message, emotion_history, channels, status)
     values ($1, $2, $3, $4, $5::jsonb, $6::jsonb, 'pending')
     returning id, session_id, severity, trigger_type, message, emotion_history, channels, status, created_at`,
    [
      input.sessionId,
      input.severity,
      input.triggerType,
      input.message,
      JSON.stringify(input.emotionHistory ?? []),
      JSON.stringify(input.channels)
    ]
  );

  return result.rows[0];
}
