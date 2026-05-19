import type { ChildCondition, ChildInput } from "./children-repository";

const childConditions = new Set<ChildCondition>(["ASD", "language_delay", "both"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateDate(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return undefined;
  }

  return value;
}

export function parseChildInput(value: unknown, partial = false) {
  if (!isRecord(value)) {
    return { ok: false as const, message: "Request body must be an object." };
  }

  const displayName = typeof value.displayName === "string" ? value.displayName.trim() : undefined;
  const condition = typeof value.condition === "string" && childConditions.has(value.condition as ChildCondition)
    ? value.condition as ChildCondition
    : undefined;
  const dateOfBirth = validateDate(value.dateOfBirth);
  const goals = Array.isArray(value.goals)
    ? value.goals.filter((goal): goal is string => typeof goal === "string").map((goal) => goal.trim()).filter(Boolean).slice(0, 12)
    : undefined;
  const communicationPreferences = isRecord(value.communicationPreferences)
    ? value.communicationPreferences
    : undefined;

  if (!partial && !displayName) {
    return { ok: false as const, message: "displayName is required." };
  }

  if (!partial && !condition) {
    return { ok: false as const, message: "condition must be ASD, language_delay, or both." };
  }

  if (value.dateOfBirth !== undefined && dateOfBirth === undefined) {
    return { ok: false as const, message: "dateOfBirth must use YYYY-MM-DD format." };
  }

  const parsed: Partial<ChildInput> = {};

  if (displayName !== undefined) {
    parsed.displayName = displayName;
  }

  if (condition !== undefined) {
    parsed.condition = condition;
  }

  if (value.dateOfBirth !== undefined) {
    parsed.dateOfBirth = dateOfBirth;
  }

  if (goals !== undefined) {
    parsed.goals = goals;
  }

  if (communicationPreferences !== undefined) {
    parsed.communicationPreferences = communicationPreferences;
  }

  return { ok: true as const, value: parsed as ChildInput };
}
