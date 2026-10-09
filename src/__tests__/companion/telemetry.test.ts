import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createCompanionCorrelationId,
  recordCompanionPhase,
  withCompanionCorrelation,
} from '@/server/companion/telemetry';

test('companion telemetry emits only redacted phase timing fields', () => {
  const originalInfo = console.info;
  let payload: Record<string, unknown> | undefined;
  console.info = (_label: unknown, value: Record<string, unknown>) => { payload = value; };
  try {
    const correlationId = createCompanionCorrelationId();
    recordCompanionPhase(correlationId, 'provider', performance.now() - 4, 'ok');
    assert.deepEqual({ correlationId, phase: 'provider', outcome: 'ok' }, {
      correlationId: payload?.correlationId,
      phase: payload?.phase,
      outcome: payload?.outcome,
    });
    assert.equal(typeof payload?.durationMs, 'number');
    assert.equal(JSON.stringify(payload).includes('message content'), false);
    assert.equal(JSON.stringify(payload).includes('child'), false);
  } finally {
    console.info = originalInfo;
  }
});

test('correlation id is attached without changing response body contract', async () => {
  const response = withCompanionCorrelation(Response.json({ role: 'child', content: 'safe' }), 'corr-test');
  assert.equal(response.headers.get('x-correlation-id'), 'corr-test');
  assert.deepEqual(await response.json(), { role: 'child', content: 'safe' });
});

test('CompanionTelemetryCollector emits exactly one redacted summary payload on flush', async () => {
  const { CompanionTelemetryCollector } = await import('@/server/companion/telemetry');
  const originalInfo = console.info;
  const calls: unknown[][] = [];
  console.info = (...args: unknown[]) => { calls.push(args); };
  try {
    const collector = new CompanionTelemetryCollector('corr-abc', performance.now() - 50);
    collector.recordPhase('session_auth', performance.now() - 30, 'ok');
    collector.recordPhase('db_history', performance.now() - 10, 'ok');
    const summary = collector.flush('ok');

    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], '[companion.telemetry]');
    const payload = calls[0][1] as Record<string, unknown>;
    assert.equal(payload.correlationId, 'corr-abc');
    assert.equal(payload.outcome, 'ok');
    assert.equal(Array.isArray(payload.phases), true);
    assert.equal((payload.phases as unknown[]).length, 2);
    assert.equal(typeof payload.totalDurationMs, 'number');

    const json = JSON.stringify(payload);
    assert.equal(json.includes('child'), false);
    assert.equal(json.includes('content'), false);
    assert.equal(json.includes('sessionId'), false);
  } finally {
    console.info = originalInfo;
  }
});
