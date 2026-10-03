import { createHash, timingSafeEqual } from 'node:crypto';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { isIP } from 'node:net';
import postgres from 'postgres';
import { WebSocket, WebSocketServer, type RawData } from 'ws';

export const COMPANION_WS_PATH = '/api/companion/ws';
export const CAPABILITIES = Object.freeze({ audio_input: false, camera: false, screen: false, vision: false });

export type GatewayConfig = {
  databaseUrl: string;
  publicOrigin: string;
  production: boolean;
  host: string;
  port: number;
  trustedProxyAddress: string;
  maxConnections: number;
  maxFrameBytes: number;
  heartbeatIntervalMs: number;
  idleTimeoutMs: number;
  authTimeoutMs: number;
};

export type TicketBinding = { token: string; origin: string; path: string; sessionId?: string };
export type ConsumedTicket = { childId: string; sessionId: string };
export interface GatewayTicketAdapter {
  consume(binding: TicketBinding): Promise<ConsumedTicket | null>;
  health(): Promise<boolean>;
  close?(): Promise<void>;
}
export interface GatewayProviderAdapter { unavailableProviders(): readonly string[] }
export interface GatewayLogger { (level: 'info' | 'warn' | 'error', event: string, fields?: Record<string, string | number | boolean>): void }

export class ProviderUnavailableAdapter implements GatewayProviderAdapter {
  unavailableProviders(): readonly string[] { return ['asr', 'tts', 'llm']; }
}

export function readGatewayConfig(env: NodeJS.ProcessEnv = process.env): GatewayConfig {
  const production = env.NODE_ENV === 'production';
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required.');
  let database: URL;
  try { database = new URL(databaseUrl); } catch { throw new Error('DATABASE_URL must be a valid PostgreSQL URL.'); }
  if (!['postgres:', 'postgresql:'].includes(database.protocol)) throw new Error('DATABASE_URL must use PostgreSQL.');

  const publicOrigin = env.COMPANION_PUBLIC_ORIGIN || (production ? '' : 'http://localhost:3000');
  let parsedOrigin: URL;
  try { parsedOrigin = new URL(publicOrigin); } catch { throw new Error('COMPANION_PUBLIC_ORIGIN must be an origin URL.'); }
  if (!['http:', 'https:'].includes(parsedOrigin.protocol) || parsedOrigin.pathname !== '/' || parsedOrigin.search || parsedOrigin.hash || parsedOrigin.username || parsedOrigin.password) {
    throw new Error('COMPANION_PUBLIC_ORIGIN must not include credentials, a path, or query.');
  }
  if (production && parsedOrigin.protocol !== 'https:') throw new Error('COMPANION_PUBLIC_ORIGIN must use HTTPS in production.');

  const host = env.COMPANION_GATEWAY_HOST || '127.0.0.1';
  const port = positiveInteger(env.COMPANION_GATEWAY_PORT, 4001, 65535);
  const trustedProxyAddress = normalizeIp(env.COMPANION_TRUSTED_PROXY_ADDRESS || '127.0.0.1');
  const maxConnections = positiveInteger(env.COMPANION_MAX_CONNECTIONS, 100, 10000);
  const maxFrameBytes = positiveInteger(env.COMPANION_MAX_FRAME_BYTES, 16 * 1024, 1024 * 1024);
  const heartbeatIntervalMs = positiveInteger(env.COMPANION_HEARTBEAT_INTERVAL_MS, 25_000, 300_000);
  const idleTimeoutMs = positiveInteger(env.COMPANION_IDLE_TIMEOUT_MS, 120_000, 3_600_000);
  const authTimeoutMs = positiveInteger(env.COMPANION_AUTH_TIMEOUT_MS, 5_000, 60_000);

  if (production && isWildcardHost(host) && !env.COMPANION_TRUSTED_PROXY_ADDRESS) {
    throw new Error('COMPANION_TRUSTED_PROXY_ADDRESS is required when the production gateway binds to a non-loopback host.');
  }

  return {
    databaseUrl, publicOrigin: parsedOrigin.origin, production, host, port, trustedProxyAddress,
    maxConnections, maxFrameBytes, heartbeatIntervalMs, idleTimeoutMs, authTimeoutMs,
  };
}

function positiveInteger(value: string | undefined, fallback: number, maximum: number): number {
  if (value === undefined || value === '') return fallback;
  if (!/^\d+$/.test(value)) throw new Error('Gateway numeric settings must be positive integers.');
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maximum) throw new Error('Gateway numeric setting is outside the allowed range.');
  return parsed;
}

function normalizeIp(address: string): string {
  const candidate = address.startsWith('::ffff:') ? address.slice(7) : address;
  if (!isIP(candidate)) throw new Error('COMPANION_TRUSTED_PROXY_ADDRESS must be an IP address.');
  return candidate;
}

function isWildcardHost(host: string): boolean { return host === '0.0.0.0' || host === '::'; }

function redactedLogger(level: 'info' | 'warn' | 'error', event: string, fields: Record<string, string | number | boolean> = {}): void {
  process.stdout.write(`${JSON.stringify({ timestamp: new Date().toISOString(), level, event, ...fields })}\n`);
}

export function createPostgresTicketAdapter(connectionString: string): GatewayTicketAdapter {
  const sql = postgres(connectionString, { max: 4, connect_timeout: 5, idle_timeout: 20 });
  return {
    async health() {
      try { await sql`SELECT 1`; return true; } catch { return false; }
    },
    async consume(binding) {
      if (!/^[A-Za-z0-9_-]{10,128}$/.test(binding.token) || binding.path !== COMPANION_WS_PATH) return null;
      if (binding.sessionId && !/^[0-9a-f-]{36}$/i.test(binding.sessionId)) return null;
      const tokenHash = createHash('sha256').update(binding.token).digest('hex');
      try {
        return await sql.begin(async (transaction) => {
          const sessions = binding.sessionId
            ? await transaction`
                SELECT id, child_id, metadata
                FROM companion_sessions
                WHERE id = ${binding.sessionId}::uuid AND ended_at IS NULL
                  AND metadata LIKE ${'%"' + tokenHash + '"%'}
                FOR UPDATE
              `
            : await transaction`
                SELECT id, child_id, metadata
                FROM companion_sessions
                WHERE ended_at IS NULL
                  AND metadata LIKE ${'%"' + tokenHash + '"%'}
                FOR UPDATE
              `;
          if (sessions.length !== 1) return null;
          const session = sessions[0];
          if (!session || !session.metadata) return null;
          let metadata: Record<string, unknown>;
          try { metadata = JSON.parse(session.metadata) as Record<string, unknown>; } catch { return null; }
          const ticket = metadata.companionWsTicket as {
            hash?: string; childId?: string; origin?: string; expiresAt?: number; path?: string;
          } | undefined;
          if (!ticket || !constantTimeHexEqual(ticket.hash, tokenHash) || ticket.childId !== session.child_id || ticket.origin !== binding.origin || ticket.path !== binding.path || !Number.isSafeInteger(ticket.expiresAt) || (ticket.expiresAt ?? 0) <= Date.now()) return null;
          if (binding.sessionId && session.id !== binding.sessionId) return null;

          delete metadata.companionWsTicket;
          const updated = await transaction`
            UPDATE companion_sessions
            SET metadata = ${JSON.stringify(metadata)}
            WHERE id = ${session.id}::uuid AND child_id = ${session.child_id}::uuid AND metadata = ${session.metadata}
            RETURNING id
          `;
          if (updated.length !== 1) return null;
          return { childId: session.child_id as string, sessionId: session.id as string };
        });
      } catch { return null; }
    },
    close: () => sql.end({ timeout: 5 }),
  };
}

function constantTimeHexEqual(candidate: string | undefined, expected: string): boolean {
  if (!candidate || !/^[0-9a-f]{64}$/i.test(candidate)) return false;
  const left = Buffer.from(candidate, 'hex');
  const right = Buffer.from(expected, 'hex');
  return left.length === right.length && timingSafeEqual(left, right);
}

export type GatewayDependencies = { tickets: GatewayTicketAdapter; providers?: GatewayProviderAdapter; log?: GatewayLogger };

export function createCompanionGateway(config: GatewayConfig, dependencies: GatewayDependencies): {
  server: Server;
  close: () => Promise<void>;
} {
  const log = dependencies.log ?? redactedLogger;
  const providers = dependencies.providers ?? new ProviderUnavailableAdapter();
  const httpServer = createServer((request, response) => { void handleHttp(request, response); });
  const wsServer = new WebSocketServer({ noServer: true, maxPayload: config.maxFrameBytes, perMessageDeflate: false, clientTracking: true });
  const state = new WeakMap<WebSocket, { alive: boolean; lastActivity: number; authenticated: boolean; sessionId: string | null; authTimer: NodeJS.Timeout | null }>();
  let closing = false;

  async function handleHttp(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const path = new URL(request.url || '/', 'http://gateway.invalid').pathname;
    if (request.method === 'GET' && path === '/health') {
      let healthy = false;
      try { healthy = !closing && await dependencies.tickets.health(); } catch { healthy = false; }
      response.writeHead(healthy ? 200 : 503, { 'content-type': 'application/json', 'cache-control': 'no-store' });
      response.end(JSON.stringify({ status: healthy ? 'ok' : 'unavailable' }));
      return;
    }
    response.writeHead(404, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    response.end(JSON.stringify({ error: 'not_found' }));
  }

  function rejectUpgrade(socket: import('node:stream').Duplex, status: number, reason: string): void {
    if (socket.destroyed) return;
    socket.end(`HTTP/1.1 ${status} ${reason}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);
  }

  function validOrigin(request: IncomingMessage): boolean {
    if (request.headers.origin !== config.publicOrigin) return false;
    if (!config.production) return true;
    const forwardedProto = request.headers['x-forwarded-proto'];
    const forwardedHost = request.headers['x-forwarded-host'];
    const remoteAddress = normalizeRemoteAddress(request.socket.remoteAddress);
    const publicHost = new URL(config.publicOrigin).host;
    return remoteAddress === config.trustedProxyAddress && forwardedProto === 'https' && forwardedHost === publicHost;
  }

  httpServer.on('upgrade', async (request, socket, head) => {
    if (closing) return rejectUpgrade(socket, 503, 'Service Unavailable');
    let url: URL;
    try { url = new URL(request.url || '/', config.publicOrigin); }
    catch { return rejectUpgrade(socket, 400, 'Bad Request'); }
    if (url.pathname !== COMPANION_WS_PATH || url.hash) return rejectUpgrade(socket, 404, 'Not Found');
    if (!validOrigin(request)) {
      log('warn', 'websocket_rejected', { code: 'origin_or_forwarding_invalid' });
      return rejectUpgrade(socket, 403, 'Forbidden');
    }
    if (wsServer.clients.size >= config.maxConnections) {
      log('warn', 'websocket_rejected', { code: 'connection_limit' });
      return rejectUpgrade(socket, 503, 'Service Unavailable');
    }

    const queryTicket = url.searchParams.get('ticket');
    if (queryTicket !== null) {
      if (!queryTicket) {
        log('warn', 'websocket_auth_rejected', { code: 'ticket_missing' });
        return rejectUpgrade(socket, 401, 'Unauthorized');
      }
      const requestOrigin = request.headers.origin || config.publicOrigin;
      const querySessionId = url.searchParams.get('sessionId') || undefined;
      let ticket: ConsumedTicket | null = null;
      try {
        ticket = await dependencies.tickets.consume({
          token: queryTicket,
          sessionId: querySessionId,
          origin: requestOrigin,
          path: COMPANION_WS_PATH,
        });
      } catch {
        log('error', 'websocket_auth_failed', { code: 'ticket_store_error' });
        return rejectUpgrade(socket, 500, 'Internal Server Error');
      }
      if (!ticket) {
        log('warn', 'websocket_auth_rejected', { code: 'ticket_invalid' });
        return rejectUpgrade(socket, 401, 'Unauthorized');
      }
      if (socket.destroyed) return;
      wsServer.handleUpgrade(request, socket, head, (websocket) => {
        wsServer.emit('connection', websocket, request, ticket);
      });
      return;
    }

    if (url.search) {
      return rejectUpgrade(socket, 400, 'Bad Request');
    }

    wsServer.handleUpgrade(request, socket, head, (websocket) => {
      wsServer.emit('connection', websocket, request, null);
    });
  });

  wsServer.on('connection', (websocket, request, preAuthTicket?: ConsumedTicket | null) => {
    const authenticated = Boolean(preAuthTicket);
    const clientState = {
      alive: true,
      lastActivity: Date.now(),
      authenticated,
      sessionId: preAuthTicket?.sessionId ?? null,
      authTimer: authenticated ? null : setTimeout(() => websocket.close(1008, 'auth_timeout'), config.authTimeoutMs),
    };
    state.set(websocket, clientState);
    log('info', 'websocket_opened', { activeConnections: wsServer.clients.size });

    if (authenticated && preAuthTicket) {
      log('info', 'websocket_authenticated', { activeConnections: wsServer.clients.size, sessionId: preAuthTicket.sessionId });
      websocket.send(JSON.stringify({ type: 'connected', sessionId: preAuthTicket.sessionId, capabilities: CAPABILITIES }));
      websocket.send(JSON.stringify({ type: 'capabilities', capabilities: CAPABILITIES }));
      websocket.send(JSON.stringify({ type: 'provider_unavailable', providers: [...providers.unavailableProviders()] }));
    } else {
      websocket.send(JSON.stringify({ type: 'auth_required' }));
    }

    websocket.on('pong', () => { clientState.alive = true; });
    websocket.on('message', (data: RawData, isBinary: boolean) => {
      clientState.lastActivity = Date.now();
      if (!clientState.authenticated) {
        void authenticateFirstFrame(websocket, request, data, isBinary, clientState);
        return;
      }
      websocket.send(JSON.stringify({ type: 'provider_unavailable', providers: [...providers.unavailableProviders()] }));
    });
    websocket.on('error', () => log('warn', 'websocket_error', { code: 'transport_error' }));
    websocket.on('close', (code) => {
      if (clientState.authTimer) clearTimeout(clientState.authTimer);
      log('info', 'websocket_closed', { code, activeConnections: Math.max(0, wsServer.clients.size - 1) });
    });
  });

  async function authenticateFirstFrame(websocket: WebSocket, request: IncomingMessage, data: RawData, isBinary: boolean, clientState: { alive: boolean; lastActivity: number; authenticated: boolean; sessionId: string | null; authTimer: NodeJS.Timeout | null }): Promise<void> {
    const frame = rawDataBuffer(data);
    if (isBinary || frame.byteLength > config.maxFrameBytes) return websocket.close(1009, 'frame_too_large');
    let auth: Record<string, unknown>;
    try {
      auth = JSON.parse(frame.toString('utf8')) as Record<string, unknown>;
    } catch { return websocket.close(1008, 'invalid_auth_frame'); }
    if (auth.type !== 'auth' || typeof auth.ticket !== 'string' || auth.ticket.length > 128 || (auth.sessionId !== undefined && (typeof auth.sessionId !== 'string' || !/^[0-9a-f-]{36}$/i.test(auth.sessionId)))) {
      return websocket.close(1008, 'invalid_auth_frame');
    }
    const requestOrigin = request.headers.origin;
    if (!requestOrigin || requestOrigin !== config.publicOrigin) return websocket.close(1008, 'invalid_origin');
    let ticket: ConsumedTicket | null;
    try {
      ticket = await dependencies.tickets.consume({
        token: auth.ticket,
        sessionId: typeof auth.sessionId === 'string' ? auth.sessionId : undefined,
        origin: requestOrigin,
        path: COMPANION_WS_PATH,
      });
    } catch {
      log('error', 'websocket_auth_failed', { code: 'ticket_store_error' });
      return websocket.close(1011, 'authentication_unavailable');
    }
    if (!ticket || (typeof auth.sessionId === 'string' && ticket.sessionId !== auth.sessionId)) {
      log('warn', 'websocket_auth_rejected', { code: 'ticket_invalid' });
      return websocket.close(1008, 'ticket_invalid');
    }
    clientState.authenticated = true;
    clientState.sessionId = ticket.sessionId;
    if (clientState.authTimer) {
      clearTimeout(clientState.authTimer);
      clientState.authTimer = null;
    }
    websocket.send(JSON.stringify({ type: 'connected', sessionId: ticket.sessionId, capabilities: CAPABILITIES }));
    websocket.send(JSON.stringify({ type: 'capabilities', capabilities: CAPABILITIES }));
    websocket.send(JSON.stringify({ type: 'provider_unavailable', providers: [...providers.unavailableProviders()] }));
    log('info', 'websocket_authenticated', { activeConnections: wsServer.clients.size, sessionId: ticket.sessionId });
  }

  const heartbeat = setInterval(() => {
    const now = Date.now();
    for (const websocket of wsServer.clients) {
      const clientState = state.get(websocket);
      if (!clientState) continue;
      if (now - clientState.lastActivity > config.idleTimeoutMs) {
        websocket.close(1001, 'idle_timeout');
        continue;
      }
      if (!clientState.alive) {
        websocket.terminate();
        continue;
      }
      clientState.alive = false;
      websocket.ping();
    }
  }, config.heartbeatIntervalMs);
  heartbeat.unref();

  async function close(): Promise<void> {
    if (closing) return;
    closing = true;
    clearInterval(heartbeat);
    for (const websocket of wsServer.clients) websocket.close(1001, 'server_shutdown');
    await new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        for (const websocket of wsServer.clients) websocket.terminate();
        resolve();
      }, 2_000);
      timer.unref();
      wsServer.close(() => { clearTimeout(timer); resolve(); });
      httpServer.close(() => { clearTimeout(timer); resolve(); });
    });
    await dependencies.tickets.close?.();
    log('info', 'gateway_stopped');
  }

  return { server: httpServer, close };
}

function normalizeRemoteAddress(address: string | undefined): string { return address?.startsWith('::ffff:') ? address.slice(7) : address || ''; }
function rawDataBuffer(data: RawData): Buffer {
  if (Array.isArray(data)) return Buffer.concat(data);
  if (data instanceof ArrayBuffer) return Buffer.from(data);
  return data;
}

export async function startGatewayFromEnv(): Promise<{ server: Server; close: () => Promise<void> }> {
  const config = readGatewayConfig();
  const tickets = createPostgresTicketAdapter(config.databaseUrl);
  if (!await tickets.health()) {
    await tickets.close?.();
    throw new Error('Companion ticket database is unavailable.');
  }
  const gateway = createCompanionGateway(config, { tickets, providers: new ProviderUnavailableAdapter() });
  try {
    await new Promise<void>((resolve, reject) => {
      gateway.server.once('error', reject);
      gateway.server.listen(config.port, config.host, () => {
        gateway.server.off('error', reject);
        resolve();
      });
    });
  } catch (error) {
    await gateway.close();
    throw error;
  }
  redactedLogger('info', 'gateway_started', { host: config.host, port: config.port, production: config.production });
  return gateway;
}
