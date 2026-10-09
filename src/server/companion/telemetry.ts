import { randomUUID } from 'node:crypto';

export type CompanionPhase =
  | 'ui_input'
  | 'session_auth'
  | 'db_history'
  | 'safety_precheck'
  | 'provider'
  | 'output_safety'
  | 'persistence'
  | 'render';

/**
 * Privacy-safe companion timing. Values are deliberately limited to phase,
 * duration, correlation id, and outcome; never pass message/error data here.
 */
export function createCompanionCorrelationId(): string {
  return randomUUID();
}

export function recordCompanionPhase(
  correlationId: string,
  phase: CompanionPhase,
  startedAt: number,
  outcome: 'ok' | 'blocked' | 'error',
): void {
  console.info('[companion.telemetry]', {
    correlationId,
    phase,
    durationMs: Math.max(0, Math.round(performance.now() - startedAt)),
    outcome,
  });
}

export function markCompanionPhase(): number {
  return performance.now();
}

export function withCompanionCorrelation<T extends Response>(response: T, correlationId: string): T {
  response.headers.set('x-correlation-id', correlationId);
  return response;
}
