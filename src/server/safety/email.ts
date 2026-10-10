import nodemailer from 'nodemailer';
import type { DeliveryAdapter } from './worker';

export type MailConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
  alertRecipients: string[];
};

export function readMailConfig(env: NodeJS.ProcessEnv = process.env): MailConfig | null {
  const host = env.AGENTKID_SMTP_HOST?.trim() || env.SMTP_HOST?.trim();
  const user = env.AGENTKID_SMTP_USER?.trim() || env.SMTP_USER?.trim();
  const password = env.AGENTKID_SMTP_PASSWORD || env.SMTP_PASSWORD;
  const from = env.AGENTKID_SMTP_FROM?.trim() || env.SMTP_FROM?.trim() || user;
  const port = Number(env.AGENTKID_SMTP_PORT || env.SMTP_PORT || 587);
  const alertRecipients = (env.AGENTKID_ALERT_EMAIL_TO || '').split(',').map((value) => value.trim()).filter((value) => value.includes('@'));
  if (!host || !user || !password || !from || !Number.isInteger(port) || port < 1 || port > 65535) return null;
  return { host, port, secure: (env.AGENTKID_SMTP_SECURE || env.SMTP_SECURE || 'false').toLowerCase() === 'true', user, password, from, alertRecipients };
}

type MailTransport = { sendMail(options: Record<string, unknown>): Promise<{ messageId: string }> };

export function createEmailAdapter(config: MailConfig, injectedTransport?: MailTransport): DeliveryAdapter {
  const transporter = injectedTransport ?? nodemailer.createTransport({ host: config.host, port: config.port, secure: config.secure, auth: { user: config.user, pass: config.password } });
  return {
    async send(message) {
      if (!message.destination || !message.destination.includes('@')) throw new Error('Email destination is missing or invalid.');
      const recipients = config.alertRecipients.length > 0 ? config.alertRecipients : [message.destination];
      const result = await transporter.sendMail({ from: config.from, to: recipients.join(','), subject: message.subject ?? 'Cảnh báo an toàn AgentKid', text: message.body, headers: { 'X-AgentKid-Delivery': 'safety-alert' } });
      return { acknowledged: true, providerReference: result.messageId, providerStatus: 'accepted' };
    },
  };
}
