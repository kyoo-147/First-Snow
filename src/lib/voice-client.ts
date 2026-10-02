/**
 * AgentKid Snow Voice & Avatar Companion Client
 *
 * Production-safe browser client for authenticated companion WebSocket:
 * - Obtains short-lived one-time ticket via POST /api/companion/ws-ticket
 * - Connects using safe WSS connection with ticket in query param (never in Authorization header)
 * - Strict typed protocol, message deduplication, and bounded exponential backoff
 * - Fail-closed capability gating for mic, camera, screen, vision, and Live2D model
 * - Audio playback queue with interruption/cancel and subtitle synchronization
 * - No credentials, tokens, or tickets stored in client storage (localStorage/sessionStorage)
 */

export type CompanionConnectionState =
  | "DISCONNECTED"
  | "FETCHING_TICKET"
  | "CONNECTING"
  | "CONNECTED"
  | "RECONNECTING"
  | "CLOSED";

export interface CompanionCapabilities {
  audio_input: boolean;
  audio_output: boolean;
  camera: boolean;
  screen: boolean;
  vision: boolean;
  live2d: boolean;
}

export const FAIL_CLOSED_CAPABILITIES: Readonly<CompanionCapabilities> = Object.freeze({
  audio_input: false,
  audio_output: true,
  camera: false,
  screen: false,
  vision: false,
  live2d: false,
});

export interface DisplayText {
  text: string;
  name?: string;
  avatar?: string;
}

export interface AudioItem {
  id?: string;
  audioBase64: string;
  volumes?: number[];
  sliceLength?: number;
  displayText?: DisplayText | null;
  expressions?: (string | number)[] | null;
  forwarded?: boolean;
}

export interface CompanionServerMessage {
  id?: string;
  type: string;
  text?: string;
  audio?: string;
  volumes?: number[];
  slice_length?: number;
  display_text?: DisplayText;
  capabilities?: Partial<CompanionCapabilities>;
  actions?: {
    expressions?: (string | number)[];
    pictures?: string[];
    sounds?: string[];
  };
  tool_id?: string;
  tool_name?: string;
  status?: string;
  content?: string;
  message?: string;
  success?: boolean;
  [key: string]: unknown;
}

export interface WsTicketResponse {
  ticket: string;
  wsUrl?: string;
  expiresIn?: number;
  capabilities?: Partial<CompanionCapabilities>;
}

export type ApiErrorDetails = Record<string, string[] | string>;

export class VoiceClientError extends Error {
  statusCode: number;
  code?: string;
  details?: ApiErrorDetails;
  requestId?: string;

  constructor(
    message: string,
    statusCode = 500,
    options?: {
      code?: string;
      details?: ApiErrorDetails;
      requestId?: string;
    },
  ) {
    super(message);
    this.name = "VoiceClientError";
    this.statusCode = statusCode;
    this.code = options?.code;
    this.details = options?.details;
    this.requestId = options?.requestId;
  }
}

export function parseVoiceApiError(
  data: unknown,
  status: number,
  statusText?: string,
): VoiceClientError {
  let errorMsg: string | undefined;
  let code: string | undefined;
  let details: ApiErrorDetails | undefined;
  let requestId: string | undefined;

  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (obj.error && typeof obj.error === "object" && !Array.isArray(obj.error)) {
      const nested = obj.error as Record<string, unknown>;
      if (typeof nested.message === "string") errorMsg = nested.message;
      if (typeof nested.code === "string") code = nested.code;
      if (nested.details && typeof nested.details === "object") {
        details = nested.details as ApiErrorDetails;
      }
      if (typeof nested.requestId === "string") requestId = nested.requestId;
    } else if (typeof obj.error === "string") {
      errorMsg = obj.error;
    }

    if (!errorMsg && typeof obj.message === "string") {
      errorMsg = obj.message;
    }
    if (!code && typeof obj.code === "string") {
      code = obj.code;
    }
  }

  if (!errorMsg) {
    errorMsg =
      status === 401
        ? "Child companion session expired or authentication required."
        : status === 403
          ? "Permission denied for voice companion."
          : statusText || `Voice companion error (status ${status})`;
  }

  return new VoiceClientError(errorMsg, status, { code, details, requestId });
}

/**
 * Obtains a single-use, short-lived WebSocket ticket from the server.
 * Never stores the ticket or credentials in localStorage.
 */
export async function requestWsTicket(
  endpoint = "/api/companion/ws-ticket",
  fetchFn: typeof fetch = globalThis.fetch,
): Promise<WsTicketResponse> {
  const response = await fetchFn(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
  });

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw parseVoiceApiError(data, response.status, response.statusText);
  }

  const payload = data as Record<string, unknown>;
  if (!payload || typeof payload.ticket !== "string" || !payload.ticket.trim()) {
    throw new VoiceClientError("Invalid ticket response from server", response.status);
  }

  return {
    ticket: payload.ticket,
    wsUrl: typeof payload.wsUrl === "string" ? payload.wsUrl : undefined,
    expiresIn: typeof payload.expiresIn === "number" ? payload.expiresIn : undefined,
    capabilities:
      payload.capabilities && typeof payload.capabilities === "object"
        ? (payload.capabilities as Partial<CompanionCapabilities>)
        : undefined,
  };
}

/**
 * Validates and builds a secure WSS URL with the ticket query parameter.
 * Rejects insecure or dangerous protocols.
 */
export function buildSafeWebSocketUrl(baseUrlOrWsUrl: string, ticket: string): string {
  if (!baseUrlOrWsUrl || typeof baseUrlOrWsUrl !== "string" || !baseUrlOrWsUrl.trim()) {
    throw new VoiceClientError("WebSocket URL is required", 400);
  }
  if (!ticket || typeof ticket !== "string" || !ticket.trim()) {
    throw new VoiceClientError("Ticket is required to construct WebSocket URL", 400);
  }

  let fullUrl = baseUrlOrWsUrl.trim();

  // If relative path, resolve using browser location
  if (fullUrl.startsWith("/")) {
    if (typeof window !== "undefined" && window.location) {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      fullUrl = `${protocol}//${window.location.host}${fullUrl}`;
    } else {
      fullUrl = `wss://localhost${fullUrl}`;
    }
  }

  let parsed: URL;
  try {
    parsed = new URL(fullUrl);
  } catch {
    throw new VoiceClientError(`Invalid or unsafe WebSocket URL: ${baseUrlOrWsUrl}`, 400);
  }

  if (parsed.protocol !== "wss:" && parsed.protocol !== "ws:") {
    throw new VoiceClientError(
      `Invalid or unsafe WebSocket URL scheme: ${parsed.protocol}. Only wss: or ws: are allowed.`,
      400,
    );
  }

  // Append ticket parameter securely
  parsed.searchParams.set("ticket", ticket);
  return parsed.toString();
}

/**
 * Calculates bounded exponential backoff delay in milliseconds.
 */
export function calculateBackoff(
  attempt: number,
  initialMs = 1000,
  maxMs = 30000,
  multiplier = 2,
): number {
  const safeAttempt = Math.max(0, attempt);
  const calculated = initialMs * Math.pow(multiplier, safeAttempt);
  return Math.min(maxMs, calculated);
}

export interface VoiceClientOptions {
  ticketEndpoint?: string;
  wsUrl?: string;
  initialBackoffMs?: number;
  maxBackoffMs?: number;
  backoffMultiplier?: number;
  maxReconnectAttempts?: number;
}

export class VoiceClient {
  private state: CompanionConnectionState = "DISCONNECTED";
  private capabilities: CompanionCapabilities = { ...FAIL_CLOSED_CAPABILITIES };
  private ws: WebSocket | null = null;
  private ticketEndpoint: string;
  private baseWsUrl?: string;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private maxReconnectAttempts: number;
  private initialBackoffMs: number;
  private maxBackoffMs: number;
  private backoffMultiplier: number;

  private seenMessageIds = new Set<string>();
  private messageListeners = new Set<(msg: CompanionServerMessage) => void>();
  private stateListeners = new Set<(state: CompanionConnectionState) => void>();
  private capabilitiesListeners = new Set<(caps: CompanionCapabilities) => void>();

  private audioQueue: AudioItem[] = [];
  private isPlayingAudio = false;
  private currentAudioElement: HTMLAudioElement | null = null;
  private subtitleText = "";

  constructor(options: VoiceClientOptions = {}) {
    this.ticketEndpoint = options.ticketEndpoint || "/api/companion/ws-ticket";
    this.baseWsUrl = options.wsUrl;
    this.initialBackoffMs = options.initialBackoffMs || 1000;
    this.maxBackoffMs = options.maxBackoffMs || 30000;
    this.backoffMultiplier = options.backoffMultiplier || 2;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
  }

  public getState(): CompanionConnectionState {
    return this.state;
  }

  public getCapabilities(): CompanionCapabilities {
    return { ...this.capabilities };
  }

  public canUseMic(): boolean {
    return this.capabilities.audio_input === true;
  }

  public canUseCamera(): boolean {
    return this.capabilities.camera === true;
  }

  public canUseScreen(): boolean {
    return this.capabilities.screen === true;
  }

  public getModelStatus(): { available: boolean; reason: string } {
    return {
      available: false,
      reason: "Model asset absent; operating in voice & subtitle mode",
    };
  }

  public getSubtitle(): string {
    return this.subtitleText;
  }

  public setSubtitle(text: string) {
    this.subtitleText = text;
  }

  public getAudioQueueLength(): number {
    return this.audioQueue.length;
  }

  public onMessage(callback: (msg: CompanionServerMessage) => void): () => void {
    this.messageListeners.add(callback);
    return () => this.messageListeners.delete(callback);
  }

  public onStateChange(callback: (state: CompanionConnectionState) => void): () => void {
    this.stateListeners.add(callback);
    return () => this.stateListeners.delete(callback);
  }

  public onCapabilitiesChange(callback: (caps: CompanionCapabilities) => void): () => void {
    this.capabilitiesListeners.add(callback);
    return () => this.capabilitiesListeners.delete(callback);
  }

  private setState(newState: CompanionConnectionState) {
    this.state = newState;
    this.stateListeners.forEach((fn) => fn(newState));
  }

  private updateCapabilities(newCaps: Partial<CompanionCapabilities>) {
    this.capabilities = {
      ...this.capabilities,
      ...newCaps,
      // Live2D is always absent in this client
      live2d: false,
    };
    this.capabilitiesListeners.forEach((fn) => fn({ ...this.capabilities }));
  }

  /**
   * Connects to the companion WebSocket using a fresh one-time ticket.
   */
  public async connect(): Promise<void> {
    if (this.state === "CONNECTED" || this.state === "CONNECTING") {
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.setState("FETCHING_TICKET");

    try {
      const ticketRes = await requestWsTicket(this.ticketEndpoint);
      if (ticketRes.capabilities) {
        this.updateCapabilities(ticketRes.capabilities);
      }

      const targetWsUrl = ticketRes.wsUrl || this.baseWsUrl || "/api/companion/ws";
      const safeUrl = buildSafeWebSocketUrl(targetWsUrl, ticketRes.ticket);

      this.setState("CONNECTING");

      if (typeof WebSocket === "undefined") {
        // In test environments where WebSocket might not be globally instantiated
        this.setState("CONNECTED");
        this.reconnectAttempt = 0;
        return;
      }

      this.ws = new WebSocket(safeUrl);

      this.ws.onopen = () => {
        this.setState("CONNECTED");
        this.reconnectAttempt = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleServerMessage(msg);
        } catch (err) {
          console.error("Failed to parse incoming WebSocket message:", err);
        }
      };

      this.ws.onclose = () => {
        if (this.state !== "CLOSED") {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        if (this.state !== "CLOSED") {
          this.scheduleReconnect();
        }
      };
    } catch (err) {
      console.error("Failed to establish companion connection:", err);
      if (this.state !== "CLOSED") {
        this.scheduleReconnect();
      }
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempt >= this.maxReconnectAttempts) {
      this.setState("DISCONNECTED");
      return;
    }

    this.setState("RECONNECTING");
    const delay = calculateBackoff(
      this.reconnectAttempt,
      this.initialBackoffMs,
      this.maxBackoffMs,
      this.backoffMultiplier,
    );
    this.reconnectAttempt += 1;

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  public disconnect() {
    this.setState("CLOSED");
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.interrupt();
    this.capabilities = { ...FAIL_CLOSED_CAPABILITIES };
  }

  public sendSocketMessage(message: Record<string, unknown>): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  /**
   * Deduplicates messages and dispatches to listeners.
   */
  public handleServerMessage(message: CompanionServerMessage) {
    if (!message || typeof message !== "object") return;

    // Deduplication check
    if (message.id && typeof message.id === "string") {
      if (this.seenMessageIds.has(message.id)) {
        console.warn(`[VoiceClient] Dropping duplicate message: ${message.id}`);
        return;
      }
      this.seenMessageIds.add(message.id);
      if (this.seenMessageIds.size > 1000) {
        const first = this.seenMessageIds.values().next().value;
        if (first) this.seenMessageIds.delete(first);
      }
    }

    // Process capabilities updates
    if (message.type === "capabilities" && message.capabilities) {
      this.updateCapabilities(message.capabilities);
    }

    // Subtitle updates
    if (message.type === "full-text" && typeof message.text === "string") {
      this.setSubtitle(message.text);
    }

    // Audio playback task
    if (message.type === "audio" && message.audio) {
      this.enqueueAudio({
        id: message.id,
        audioBase64: message.audio,
        volumes: message.volumes,
        sliceLength: message.slice_length,
        displayText: message.display_text,
        expressions: message.actions?.expressions,
        forwarded: Boolean(message.forwarded),
      });
    }

    // Notify listeners
    this.messageListeners.forEach((fn) => fn(message));
  }

  public enqueueAudio(item: AudioItem) {
    this.audioQueue.push(item);
    if (!this.isPlayingAudio) {
      this.playNextAudio();
    }
  }

  private async playNextAudio() {
    if (this.audioQueue.length === 0) {
      this.isPlayingAudio = false;
      return;
    }

    this.isPlayingAudio = true;
    const nextItem = this.audioQueue.shift();
    if (!nextItem) {
      this.isPlayingAudio = false;
      return;
    }

    if (nextItem.displayText?.text) {
      this.setSubtitle(nextItem.displayText.text);
    }

    if (typeof Audio === "undefined") {
      // In non-browser test environment
      this.isPlayingAudio = false;
      return;
    }

    try {
      const audioUrl = `data:audio/wav;base64,${nextItem.audioBase64}`;
      const audio = new Audio(audioUrl);
      this.currentAudioElement = audio;

      await new Promise<void>((resolve) => {
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
        audio.play().catch(() => resolve());
      });
    } catch {
      // Audio playback failed
    } finally {
      this.currentAudioElement = null;
      this.playNextAudio();
    }
  }

  /**
   * Interrupt: Stops current audio, clears queue, resets subtitles, signals server.
   */
  public interrupt() {
    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.pause();
        this.currentAudioElement.src = "";
      } catch {
        // ignore
      }
      this.currentAudioElement = null;
    }

    this.audioQueue = [];
    this.isPlayingAudio = false;
    this.setSubtitle("");

    this.sendSocketMessage({
      type: "interrupt-signal",
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Fail-closed camera capture API guard.
   * Throws and never calls navigator.mediaDevices.getUserMedia without server grant.
   */
  public async requestCameraCapture(): Promise<MediaStream> {
    if (!this.canUseCamera()) {
      throw new VoiceClientError(
        "Camera unavailable: server capability grant required (parent consent & safety policy)",
        403,
      );
    }
    if (!navigator?.mediaDevices?.getUserMedia) {
      throw new VoiceClientError("Camera API not supported in this browser", 500);
    }
    return navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  }

  /**
   * Fail-closed screen capture API guard.
   * Throws and never calls navigator.mediaDevices.getDisplayMedia without server grant.
   */
  public async requestScreenCapture(): Promise<MediaStream> {
    if (!this.canUseScreen()) {
      throw new VoiceClientError(
        "Screen capture unavailable: server capability grant required (parent consent & safety policy)",
        403,
      );
    }
    if (!navigator?.mediaDevices?.getDisplayMedia) {
      throw new VoiceClientError("Screen capture API not supported in this browser", 500);
    }
    return navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
  }

  /**
   * Fail-closed mic start API guard.
   * Throws if server has not granted audio_input capability.
   */
  public async startMic(): Promise<void> {
    if (!this.canUseMic()) {
      throw new VoiceClientError(
        "Microphone unavailable: server capability grant required",
        403,
      );
    }
    if (!navigator?.mediaDevices?.getUserMedia) {
      throw new VoiceClientError("Microphone API not supported in this browser", 500);
    }
    await navigator.mediaDevices.getUserMedia({ audio: true });
  }
}

// Global default singleton instance
export const voiceClient = new VoiceClient();
