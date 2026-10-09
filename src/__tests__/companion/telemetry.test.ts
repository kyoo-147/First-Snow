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
