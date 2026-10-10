import { describe, expect, it, vi } from 'vitest';
import { createEmailAdapter, readMailConfig } from './email';

const env = {
  AGENTKID_SMTP_HOST: 'mail.navinresearch.com',
  AGENTKID_SMTP_PORT: '587',
  AGENTKID_SMTP_SECURE: 'false',
  AGENTKID_SMTP_USER: 'alerts@navinresearch.com',
  AGENTKID_SMTP_PASSWORD: 'secret',
  AGENTKID_SMTP_FROM: 'AgentKid <alerts@navinresearch.com>',
  AGENTKID_ALERT_EMAIL_TO: 'one@example.com,two@example.com',
} as unknown as NodeJS.ProcessEnv;

describe('SMTP safety-alert adapter', () => {
  it('fails closed when credentials are incomplete', () => {
    expect(readMailConfig({ AGENTKID_SMTP_HOST: 'mail.navinresearch.com' } as unknown as NodeJS.ProcessEnv)).toBeNull();
  });

  it('parses bounded SMTP configuration and recipients', () => {
    expect(readMailConfig(env)).toMatchObject({ host: 'mail.navinresearch.com', port: 587, secure: false, user: 'alerts@navinresearch.com', alertRecipients: ['one@example.com', 'two@example.com'] });
  });

  it('delivers to the parent and configured escalation recipients', async () => {
    const sendMail = vi.fn(async () => ({ messageId: '<accepted@navinresearch.com>' }));
    const adapter = createEmailAdapter(readMailConfig(env)!, { sendMail });
    await expect(adapter.send({ recipientId: 'parent-1', destination: 'parent@example.com', subject: 'Cảnh báo', body: 'Vui lòng kiểm tra AgentKid.' }, 'job-1')).resolves.toEqual({ acknowledged: true, providerReference: '<accepted@navinresearch.com>', providerStatus: 'accepted' });
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'one@example.com,two@example.com', subject: 'Cảnh báo' }));
  });

  it('rejects jobs without an email destination', async () => {
    const adapter = createEmailAdapter(readMailConfig(env)!, { sendMail: vi.fn() });
    await expect(adapter.send({ recipientId: 'parent-1', subject: null, body: 'Alert' }, 'job-1')).rejects.toThrow('Email destination');
  });
});

  it('propagates SMTP failures so the safety worker can retry and persist failure state', async () => {
    const adapter = createEmailAdapter(readMailConfig(env)!, { sendMail: vi.fn(async () => { throw new Error('SMTP unavailable'); }) });
    await expect(adapter.send({ recipientId: 'parent-1', destination: 'parent@example.com', subject: 'Cảnh báo', body: 'Alert' }, 'job-1')).rejects.toThrow('SMTP unavailable');
  });
