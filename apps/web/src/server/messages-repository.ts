import { query } from "./postgres";

export type MessageRole = "user" | "assistant";

export type MessageRecord = {
  id: string;
  session_id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
};

export function toMessageResponse(row: MessageRecord) {
  return {
    id: row.id,
    sessionId: row.session_id,
    role: row.role,
    content: row.content,
    timestamp: row.timestamp
  };
}

export async function createMessage(sessionId: string, role: MessageRole, content: string) {
  const result = await query<MessageRecord>(
    `insert into messages (session_id, role, content)
     values ($1, $2, $3)
     returning id, session_id, role, content, timestamp`,
    [sessionId, role, content]
  );

  return result.rows[0];
}

export async function listRecentMessages(sessionId: string, limit = 12) {
  const result = await query<MessageRecord>(
    `select id, session_id, role, content, timestamp
     from messages
     where session_id = $1
     order by timestamp desc
     limit $2`,
    [sessionId, limit]
  );

  return result.rows.reverse();
}
