import { query } from "./postgres";

export type ChildCondition = "ASD" | "language_delay" | "both";

export type ChildRecord = {
  id: string;
  user_id: string;
  display_name: string;
  date_of_birth: string | null;
  condition: ChildCondition;
  communication_preferences: Record<string, unknown> | null;
  goals: string[] | null;
  created_at: string;
  updated_at: string;
};

export type ChildInput = {
  displayName: string;
  condition: ChildCondition;
  dateOfBirth?: string | null;
  communicationPreferences?: Record<string, unknown> | null;
  goals?: string[] | null;
};

const childSelect = `
  id,
  user_id,
  display_name,
  date_of_birth,
  condition,
  communication_preferences,
  goals,
  created_at,
  updated_at
`;

export function toChildResponse(row: ChildRecord) {
  return {
    id: row.id,
    userId: row.user_id,
    displayName: row.display_name,
    dateOfBirth: row.date_of_birth,
    condition: row.condition,
    communicationPreferences: row.communication_preferences,
    goals: row.goals ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function listChildren(parentProfileId: string) {
  const result = await query<ChildRecord>(
    `select ${childSelect}
     from children
     where user_id = $1
     order by created_at desc`,
    [parentProfileId]
  );

  return result.rows;
}

export async function getOwnedChild(parentProfileId: string, childId: string) {
  const result = await query<ChildRecord>(
    `select ${childSelect}
     from children
     where id = $1 and user_id = $2
     limit 1`,
    [childId, parentProfileId]
  );

  return result.rows[0] ?? null;
}

export async function createChild(parentProfileId: string, input: ChildInput) {
  const result = await query<ChildRecord>(
    `insert into children (
       user_id,
       display_name,
       date_of_birth,
       condition,
       communication_preferences,
       goals
     )
     values ($1, $2, $3, $4, $5::jsonb, $6::jsonb)
     returning ${childSelect}`,
    [
      parentProfileId,
      input.displayName,
      input.dateOfBirth ?? null,
      input.condition,
      JSON.stringify(input.communicationPreferences ?? null),
      JSON.stringify(input.goals ?? [])
    ]
  );

  return result.rows[0];
}

export async function updateChild(parentProfileId: string, childId: string, input: Partial<ChildInput>) {
  const current = await getOwnedChild(parentProfileId, childId);

  if (!current) {
    return null;
  }

  const result = await query<ChildRecord>(
    `update children
     set
       display_name = $3,
       date_of_birth = $4,
       condition = $5,
       communication_preferences = $6::jsonb,
       goals = $7::jsonb,
       updated_at = now()
     where id = $1 and user_id = $2
     returning ${childSelect}`,
    [
      childId,
      parentProfileId,
      input.displayName ?? current.display_name,
      input.dateOfBirth === undefined ? current.date_of_birth : input.dateOfBirth,
      input.condition ?? current.condition,
      JSON.stringify(input.communicationPreferences === undefined ? current.communication_preferences : input.communicationPreferences),
      JSON.stringify(input.goals === undefined ? current.goals ?? [] : input.goals ?? [])
    ]
  );

  return result.rows[0] ?? null;
}
