import { createHmac, timingSafeEqual } from 'node:crypto';
import type { DeliveryAdapter } from './worker';

const E164 = /^\+[1-9]\d{7,14}$/;

export interface TwilioConfig {
  accountSid: string;
  apiKey: string;
  apiSecret: string;
  authToken: string;
  fromNumber: string;
  messagingServiceSid?: string;
  statusCallbackUrl: string;
}

export function readTwilioConfig(env: NodeJS.ProcessEnv = process.env): TwilioConfig | null {
  if (env.TWILIO_ENABLED !== 'true') return null;
  const accountSid = env.TWILIO_ACCOUNT_SID?.trim() ?? '';
  const authToken = env.TWILIO_AUTH_TOKEN?.trim() ?? '';
  const apiKey = env.TWILIO_API_KEY?.trim() || accountSid;
  const apiSecret = env.TWILIO_API_SECRET?.trim() || authToken;
  const fromNumber = env.TWILIO_FROM_NUMBER?.trim() ?? '';
  const messagingServiceSid = env.TWILIO_MESSAGING_SERVICE_SID?.trim() || undefined;
  const statusCallbackUrl = env.TWILIO_STATUS_CALLBACK_URL?.trim() ?? '';
  if (!/^AC[a-fA-F0-9]{32}$/.test(accountSid) || !apiKey || !apiSecret || !authToken) return null;
  if (!E164.test(fromNumber)) return null;
  if (messagingServiceSid && !/^MG[a-fA-F0-9]{32}$/.test(messagingServiceSid)) return null;
  try {
    const callback = new URL(statusCallbackUrl);
    if (callback.protocol !== 'https:') return null;
  } catch {
    return null;
  }
  return { accountSid, apiKey, apiSecret, authToken, fromNumber, messagingServiceSid, statusCallbackUrl };
}

export function normalizeE164(value: string): string | null {
  const compact = value.replace(/[\s().-]/g, '');
  if (E164.test(compact)) return compact;
  if (/^0\d{9}$/.test(compact)) return `+84${compact.slice(1)}`;
  return null;
}

type TwilioResponse = { sid?: string; status?: string; message?: string; code?: number };

async function requestTwilio(config: TwilioConfig, resource: 'Messages' | 'Calls', fields: URLSearchParams): Promise<{ sid: string; status: string }> {
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/${resource}.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: fields,
    signal: AbortSignal.timeout(15_000),
  });
  const payload = await response.json().catch(() => ({})) as TwilioResponse;
  if (!response.ok || !payload.sid) throw new Error(`Twilio ${resource} request failed (${response.status}${payload.code ? `/${payload.code}` : ''}).`);
  return { sid: payload.sid, status: payload.status ?? 'queued' };
}

export function createTwilioAdapters(config: TwilioConfig): { sms: DeliveryAdapter; voice: DeliveryAdapter } {
  return {
    sms: {
      async send(message) {
        if (!message.destination || !E164.test(message.destination)) throw new Error('SMS destination is not a valid E.164 number.');
        const fields = new URLSearchParams({ To: message.destination, Body: `[AgentKid] ${message.body}`, StatusCallback: config.statusCallbackUrl });
        if (config.messagingServiceSid) fields.set('MessagingServiceSid', config.messagingServiceSid);
        else fields.set('From', config.fromNumber);
        const result = await requestTwilio(config, 'Messages', fields);
        return { acknowledged: true, providerReference: result.sid, providerStatus: result.status };
      },
    },
    voice: {
      async send(message) {
        if (!message.destination || !E164.test(message.destination)) throw new Error('Voice destination is not a valid E.164 number.');
        const twiml = '<Response><Say language="vi-VN">AgentKid phát hiện một cảnh báo an toàn khẩn cấp. Vui lòng đăng nhập để xem và kiểm tra ngay.</Say></Response>';
        const fields = new URLSearchParams({
          To: message.destination,
          From: config.fromNumber,
          Twiml: twiml,
          StatusCallback: config.statusCallbackUrl,
          StatusCallbackEvent: 'initiated ringing answered completed',
          StatusCallbackMethod: 'POST',
        });
        const result = await requestTwilio(config, 'Calls', fields);
        return { acknowledged: true, providerReference: result.sid, providerStatus: result.status };
      },
    },
  };
}

export function validateTwilioSignature(url: string, params: URLSearchParams, signature: string | null, authToken: string): boolean {
  if (!signature || !authToken) return false;
  const sorted = [...params.entries()].sort(([a], [b]) => a.localeCompare(b));
  const payload = sorted.reduce((value, [key, item]) => value + key + item, url);
  const expected = createHmac('sha1', authToken).update(payload).digest('base64');
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}
