import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { alertDto } from '@/server/companion/format';
import { checkSafety, generateReply, MemoryTicketStore, secureWebSocketRequest, setTestCompanionProvider } from '@/server/companion/contracts';

afterEach(() => setTestCompanionProvider(null));

describe('companion backend contracts', () => {
  it('returns a truthful provider unavailable error when no provider is configured', async () => {
    await assert.rejects(generateReply({ content: 'hello', history: [] }), /COMPANION_PROVIDER_UNAVAILABLE/);
  });

  it('uses the injected deterministic provider and surfaces provider errors', async () => {
    setTestCompanionProvider(async ({ content }) => `Test reply: ${content}`);
    assert.equal(await generateReply({ content: 'hello', history: [] }), 'Test reply: hello');
    setTestCompanionProvider(async () => { throw new Error('provider down'); });
    await assert.rejects(generateReply({ content: 'hello', history: [] }), /provider down/);
  });

  it('flags conservative safety phrases and leaves ordinary messages unflagged', () => {
    assert.ok(checkSafety('I might hurt myself tonight').codes.includes('self_harm'));
    assert.equal(checkSafety('Can you help me with math?').flagged, false);
  });

  it('maps linked safety messages into household alert DTOs with persisted read state', () => {
    const createdAt = new Date('2026-01-02T03:04:05.000Z');
    const alert = alertDto({
      id: 'alert-1', childId: 'child-1', sessionId: 'session-1', clientMessageId: 'message-1', speaker: 'child', text: 'private text omitted', isFlagged: true,
      flagReason: 'Potential safety concern detected.', safetyScore: 25,
      safetyAlerts: JSON.stringify({ codes: ['self_harm'], readAt: '2026-01-02T04:00:00.000Z' }), createdAt,
    });
    assert.deepEqual({ id: alert.id, childId: alert.childId, linkedSessionId: alert.linkedSessionId, severity: alert.severity, readAt: alert.readAt }, { id: 'alert-1', childId: 'child-1', linkedSessionId: 'session-1', severity: 'high', readAt: '2026-01-02T04:00:00.000Z' });
    assert.equal(alert.description.includes('private text'), false);
  });

  it('consumes tickets once, and rejects expired or wrong-origin tickets', async () => {
    const store = new MemoryTicketStore();
    await store.put({ token: 'secret', childId: 'child-1', sessionId: 'session-1', origin: 'https://app.example', expiresAt: 20_000 });
    assert.equal((await store.consume('secret', 'https://app.example', 10_000))?.childId, 'child-1');
    assert.equal(await store.consume('secret', 'https://app.example', 10_000), null);
    await store.put({ token: 'expired', childId: 'child-1', sessionId: 'session-1', origin: 'https://app.example', expiresAt: 20_000 });
    assert.equal(await store.consume('expired', 'https://app.example', 20_000), null);
    await store.put({ token: 'origin', childId: 'child-1', sessionId: 'session-1', origin: 'https://app.example', expiresAt: 30_000 });
    assert.equal(await store.consume('origin', 'https://attacker.example', 10_000), null);
  });

  it('requires HTTPS for production websocket ticket requests', () => {
    assert.equal(secureWebSocketRequest('https://app.example/api/companion/ws-ticket', true), true);
    assert.equal(secureWebSocketRequest('http://app.example/api/companion/ws-ticket', true), false);
    assert.equal(secureWebSocketRequest('http://localhost/api/companion/ws-ticket', false), true);
  });
});
