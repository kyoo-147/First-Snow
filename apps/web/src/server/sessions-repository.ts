import { query } from "./postgres";

export type SessionStatus = "active" | "completed" | "interrupted";

export type SessionRecord = {
  id: string;
  child_id: string;
  status: SessionStatus;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  score: number | null;
  ai_notes: string | null;
  created_at: string;
};

const sessionSelect = `
  s.id,
  s.child_id,
  s.status,
  s.started_at,
  s.ended_at,
  s.duration_seconds,
  s.score,
  s.ai_notes,
  s.created_at
`;

export function toSessionResponse(row: SessionRecord) {
  return {
    id: row.id,
    childId: row.child_id,
    status: row.status,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    durationSeconds: row.duration_seconds,
    score: row.score,
    aiNotes: row.ai_notes,
    createdAt: row.created_at
  };
}

export async function createSession(parentProfileId: string, childId: string) {
  const result = await query<SessionRecord>(
    `insert into sessions (child_id, status)
     select id, 'active'
     from children
     where id = $1 and user_id = $2
     returning id, child_id, status, started_at, ended_at, duration_seconds, score, ai_notes, created_at`,
    [childId, parentProfileId]
  );

  return result.rows[0] ?? null;
}

export async function getOwnedSession(parentProfileId: string, sessionId: string) {
  const result = await query<SessionRecord>(
    `select ${sessionSelect}
     from sessions s
     inner join children c on c.id = s.child_id
     where s.id = $1 and c.user_id = $2
     limit 1`,
    [sessionId, parentProfileId]
  );

  return result.rows[0] ?? null;
}

export async function endSession(
  parentProfileId: string,
  sessionId: string,
  status: Extract<SessionStatus, "completed" | "interrupted">,
  input: { score?: number | null; aiNotes?: string | null } = {}
) {
  const current = await getOwnedSession(parentProfileId, sessionId);

  if (!current) {
    return null;
  }

  const result = await query<SessionRecord>(
    `update sessions
     set
       status = $3,
       ended_at = now(),
       duration_seconds = greatest(0, extract(epoch from (now() - started_at))::int),
       score = $4,
       ai_notes = $5
     where id = $1 and child_id in (select id from children where user_id = $2)
     returning id, child_id, status, started_at, ended_at, duration_seconds, score, ai_notes, created_at`,
    [
      sessionId,
      parentProfileId,
      status,
      input.score ?? current.score,
      input.aiNotes ?? current.ai_notes
    ]
  );

  return result.rows[0] ?? null;
}
