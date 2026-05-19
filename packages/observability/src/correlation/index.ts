export interface CorrelationIds {
  requestId?: string;
  jobId?: string;
  sessionId?: string;
}

export function createRequestId(prefix = "req") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function mergeCorrelationIds(
  base: CorrelationIds,
  override?: CorrelationIds
): CorrelationIds {
  return {
    ...base,
    ...override
  };
}
