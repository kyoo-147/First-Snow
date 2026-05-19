import type { IdentityParentSession } from "./identity-session";
import { query } from "./postgres";

export type ParentProfileRecord = {
  id: string;
  auth_subject_id: string;
  email: string;
  display_name: string;
};

export async function resolveParentProfile(session: IdentityParentSession) {
  const existing = await query<ParentProfileRecord>(
    `select id, auth_subject_id, email, display_name
     from users
     where auth_subject_id = $1
     limit 1`,
    [session.authSubjectId]
  );

  if (existing.rows[0]) {
    return existing.rows[0];
  }

  const created = await query<ParentProfileRecord>(
    `insert into users (auth_subject_id, email, display_name, alert_channels)
     values ($1, $2, $3, $4::jsonb)
     returning id, auth_subject_id, email, display_name`,
    [session.authSubjectId, session.email, session.displayName, JSON.stringify(["push"])]
  );

  return created.rows[0];
}
