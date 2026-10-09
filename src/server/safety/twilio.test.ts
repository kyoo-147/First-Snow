import { createHmac } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTwilioAdapters, normalizeE164, readTwilioConfig, validateTwilioSignature } from './twilio';

const env = {
  NODE_ENV: 'test',
  TWILIO_ENABLED: 'true',
  TWILIO_ACCOUNT_SID: `AC${'a'.repeat(32)}`,
  TWILIO_API_KEY: `SK${'b'.repeat(32)}`,
  TWILIO_API_SECRET: 'api-secret',
  TWILIO_AUTH_TOKEN: 'webhook-secret',
  TWILIO_FROM_NUMBER: '+12025550123',
  TWILIO_MESSAGING_SERVICE_SID: `MG${'c'.repeat(32)}`,
  TWILIO_STATUS_CALLBACK_URL: 'https://app.agentkid.io.vn/api/safety/twilio/status',
} as NodeJS.ProcessEnv;

afterEach(() => vi.unstubAllGlobals());

describe('Twilio emergency delivery', () => {
  it('stays disabled unless explicitly enabled with complete valid configuration', () => {
    expect(readTwilioConfig({ ...env, TWILIO_ENABLED: 'false' })).toBeNull();
    expect(readTwilioConfig({ ...env, TWILIO_AUTH_TOKEN: '' })).toBeNull();
    expect(readTwilioConfig(env)).toMatchObject({ fromNumber: '+12025550123' });
  });

  it('normalizes Vietnamese mobile numbers to E.164', () => {
    expect(normalizeE164('0941 836 793')).toBe('+84941836793');
    expect(normalizeE164('+84941836793')).toBe('+84941836793');
    expect(normalizeE164('not-a-phone')).toBeNull();
  });

  it('validates Twilio webhook signatures using the configured public URL', () => {
    const url = env.TWILIO_STATUS_CALLBACK_URL!;
    const params = new URLSearchParams({ CallSid: 'CA123', CallStatus: 'completed' });
    const payload = url + 'CallSidCA123CallStatuscompleted';
    const signature = createHmac('sha1', env.TWILIO_AUTH_TOKEN!).update(payload).digest('base64');
    expect(validateTwilioSignature(url, params, signature, env.TWILIO_AUTH_TOKEN!)).toBe(true);
    expect(validateTwilioSignature(url, params, 'invalid', env.TWILIO_AUTH_TOKEN!)).toBe(false);
  });

  it('submits SMS and Voice requests without exposing credentials in payloads', async () => {
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      expect(String(init.headers)).not.toContain('api-secret');
      return new Response(JSON.stringify({ sid: 'SM123', status: 'queued' }), { status: 201 });
    });
    vi.stubGlobal('fetch', fetchMock);
    const config = readTwilioConfig(env)!;
    const adapters = createTwilioAdapters(config);
    await expect(adapters.sms.send({ recipientId: 'u1', destination: '+84941836793', subject: null, body: 'Kiểm tra' }, 'n1')).resolves.toMatchObject({ acknowledged: true, providerReference: 'SM123' });
    await expect(adapters.voice.send({ recipientId: 'u1', destination: '+84941836793', subject: null, body: 'Kiểm tra' }, 'n2')).resolves.toMatchObject({ acknowledged: true, providerReference: 'SM123' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
