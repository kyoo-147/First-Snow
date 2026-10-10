import { randomUUID } from 'node:crypto';

export type CompanionPhase =
  | 'ui_input'
  | 'session_auth'
  | 'db_history'
  | 'safety_precheck'
  | 'safety_intent'
  | 'provider'
  | 'output_safety'
  | 'persistence'
  | 'render';

export type CompanionPhaseRecord = {
  phase: CompanionPhase;
  durationMs: number;
  outcome: 'ok' | 'blocked' | 'error';
};

export type CompanionRequestSummary = {
  correlationId: string;
  totalDurationMs: number;
  phases: CompanionPhaseRecord[];
  outcome: 'ok' | 'blocked' | 'error';
};

/**
 * Privacy-safe companion timing. Values are deliberately limited to phase,
 * duration, correlation id, and outcome; never pass message/error data here.
 */
export function createCompanionCorrelationId(): string {
  return randomUUID();
}

export function markCompanionPhase(): number {
  return performance.now();
}

export function withCompanionCorrelation<T extends Response>(response: T, correlationId: string): T {
  response.headers.set('x-correlation-id', correlationId);
  return response;
}

export class CompanionTelemetryCollector {
  private readonly correlationId: string;
  private readonly requestStartedAt: number;
  private readonly phases: CompanionPhaseRecord[] = [];
  private terminalOutcome: 'ok' | 'blocked' | 'error' = 'ok';

  constructor(correlationId: string = createCompanionCorrelationId(), requestStartedAt: number = markCompanionPhase()) {
    this.correlationId = correlationId;
    this.requestStartedAt = requestStartedAt;
  }

  getCorrelationId(): string {
    return this.correlationId;
  }

  recordPhase(phase: CompanionPhase, startedAt: number, outcome: 'ok' | 'blocked' | 'error'): void {
    const durationMs = Math.max(0, Math.round(performance.now() - startedAt));
    this.phases.push({ phase, durationMs, outcome });
    if (outcome === 'error') {
      this.terminalOutcome = 'error';
    } else if (outcome === 'blocked' && this.terminalOutcome !== 'error') {
      this.terminalOutcome = 'blocked';
    }
  }

  flush(overrideOutcome?: 'ok' | 'blocked' | 'error'): CompanionRequestSummary {
    const totalDurationMs = Math.max(0, Math.round(performance.now() - this.requestStartedAt));
    const outcome = overrideOutcome ?? this.terminalOutcome;
    const summary: CompanionRequestSummary = {
      correlationId: this.correlationId,
      totalDurationMs,
      phases: [...this.phases],
      outcome,
    };

    console.info('[companion.telemetry]', summary);
    return summary;
  }
}

/**
 * Backward compatibility helper for recording single phases.
 * Dispatches a single redacted log entry.
 */
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
