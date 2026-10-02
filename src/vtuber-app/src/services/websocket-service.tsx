/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-use-before-define */
import { Subject } from 'rxjs';
import { ModelInfo } from '@/context/live2d-config-context';
import { HistoryInfo } from '@/context/websocket-context';
import { ConfigFile } from '@/context/character-config-context';
import { toaster } from '@/components/ui/toaster';
import {
  CompanionCapabilities,
  FAIL_CLOSED_CAPABILITIES,
  requestWsTicket,
  buildSafeWebSocketUrl,
  calculateBackoff,
} from '@/lib/voice-client';

export interface DisplayText {
  text: string;
  name: string;
  avatar: string;
}

interface BackgroundFile {
  name: string;
  url: string;
}

export interface AudioPayload {
  type: 'audio';
  id?: string;
  audio?: string;
  volumes?: number[];
  slice_length?: number;
  display_text?: DisplayText;
  actions?: Actions;
}

export interface Message {
  id: string;
  content: string;
  role: "ai" | "human";
  timestamp: string;
  name?: string;
  avatar?: string;
  type?: 'text' | 'tool_call_status';
  tool_id?: string;
  tool_name?: string;
  status?: 'running' | 'completed' | 'error';
}

export interface Actions {
  expressions?: (string | number)[];
  pictures?: string[];
  sounds?: string[];
}

export interface MessageEvent {
  id?: string;
  tool_id?: any;
  tool_name?: any;
  name?: any;
  status?: any;
  content?: string;
  timestamp?: string;
  type: string;
  audio?: string;
  volumes?: number[];
  slice_length?: number;
  files?: BackgroundFile[];
  actions?: Actions;
  text?: string;
  model_info?: ModelInfo;
  conf_name?: string;
  conf_uid?: string;
  uids?: string[];
  messages?: Message[];
  history_uid?: string;
  success?: boolean;
  histories?: HistoryInfo[];
  configs?: ConfigFile[];
  message?: string;
  members?: string[];
  is_owner?: boolean;
  client_uid?: string;
  forwarded?: boolean;
  display_text?: DisplayText;
  live2d_model?: string;
  capabilities?: Partial<CompanionCapabilities>;
  browser_view?: {
    debuggerFullscreenUrl: string;
    debuggerUrl: string;
    pages: {
      id: string;
      url: string;
      faviconUrl: string;
      title: string;
      debuggerUrl: string;
      debuggerFullscreenUrl: string;
    }[];
    wsUrl: string;
    sessionId?: string;
  };
}

// Get translation function for error messages
const getTranslation = () => {
  try {
    const i18next = require('i18next').default;
    return i18next.t.bind(i18next);
  } catch (e) {
    return (key: string) => key;
  }
};

class WebSocketService {
  private static instance: WebSocketService;

  private ws: WebSocket | null = null;

  private messageSubject = new Subject<MessageEvent>();

  private stateSubject = new Subject<'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED'>();

  private currentState: 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED' = 'CLOSED';

  private capabilities: CompanionCapabilities = { ...FAIL_CLOSED_CAPABILITIES };

  private capabilitiesSubject = new Subject<CompanionCapabilities>();

  private seenMessageIds = new Set<string>();

  private reconnectAttempt = 0;

  private maxReconnectAttempts = 10;

  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  private isIntentionalDisconnect = false;

  private customWsUrl: string | null = null;

  static getInstance() {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public getCapabilities(): CompanionCapabilities {
    return { ...this.capabilities };
  }

  public onCapabilitiesChange(callback: (caps: CompanionCapabilities) => void) {
    return this.capabilitiesSubject.subscribe(callback);
  }

  private updateCapabilities(newCaps: Partial<CompanionCapabilities>) {
    this.capabilities = {
      ...this.capabilities,
      ...newCaps,
      live2d: false, // Model is always absent in this client
    };
    this.capabilitiesSubject.next({ ...this.capabilities });
  }

  public resetCapabilitiesFailClosed() {
    this.capabilities = { ...FAIL_CLOSED_CAPABILITIES };
    this.capabilitiesSubject.next({ ...this.capabilities });
  }

  private initializeConnection() {
    this.sendMessage({
      type: 'fetch-backgrounds',
    });
    this.sendMessage({
      type: 'fetch-configs',
    });
    this.sendMessage({
      type: 'fetch-history-list',
    });
    this.sendMessage({
      type: 'create-new-history',
    });
  }

  async connect(explicitUrl?: string) {
    if (explicitUrl) {
      this.customWsUrl = explicitUrl;
    }
    this.isIntentionalDisconnect = false;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
    }

    // Connect start: Reset capabilities to strictly fail-closed
    this.resetCapabilitiesFailClosed();

    this.currentState = 'CONNECTING';
    this.stateSubject.next('CONNECTING');

    try {
      // 1. Request short-lived one-time ticket from backend
      const ticketRes = await requestWsTicket();
      // NOTE: Ticket response alone MUST NOT enable capture. Only active socket capabilities message grants capabilities.

      // 2. Build safe WebSocket URL using ticket query param
      const targetWsUrl = this.customWsUrl || ticketRes.wsUrl || '/api/companion/ws';
      const safeUrl = buildSafeWebSocketUrl(targetWsUrl, ticketRes.ticket);

      if (typeof WebSocket === 'undefined') {
        this.currentState = 'OPEN';
        this.stateSubject.next('OPEN');
        this.reconnectAttempt = 0;
        return;
      }

      this.ws = new WebSocket(safeUrl);

      this.ws.onopen = () => {
        this.currentState = 'OPEN';
        this.stateSubject.next('OPEN');
        this.reconnectAttempt = 0;
        this.initializeConnection();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: MessageEvent = JSON.parse(event.data);

          // Deduplicate messages with message IDs
          if (message.id && typeof message.id === 'string') {
            if (this.seenMessageIds.has(message.id)) {
              console.warn(`[wsService] Dropping duplicate message: ${message.id}`);
              return;
            }
            this.seenMessageIds.add(message.id);
            if (this.seenMessageIds.size > 1000) {
              const first = this.seenMessageIds.values().next().value;
              if (first) this.seenMessageIds.delete(first);
            }
          }

          // Handle capabilities grant from server
          if (
            message.type === 'capabilities' &&
            message.capabilities &&
            this.currentState === 'OPEN' &&
            this.ws?.readyState === WebSocket.OPEN
          ) {
            this.updateCapabilities(message.capabilities);
          }

          this.messageSubject.next(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
          toaster.create({
            title: `${getTranslation()('error.failedParseWebSocket')}: ${error}`,
            type: "error",
            duration: 2000,
          });
        }
      };

      this.ws.onclose = () => {
        this.resetCapabilitiesFailClosed();
        this.currentState = 'CLOSED';
        this.stateSubject.next('CLOSED');
        if (!this.isIntentionalDisconnect) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (err) => {
        console.error('WebSocket connection error:', err);
        this.resetCapabilitiesFailClosed();
        this.currentState = 'CLOSED';
        this.stateSubject.next('CLOSED');
        if (!this.isIntentionalDisconnect) {
          this.scheduleReconnect();
        }
      };
    } catch (error) {
      console.error('Failed to connect to WebSocket via ticket:', error);
      this.resetCapabilitiesFailClosed();
      this.currentState = 'CLOSED';
      this.stateSubject.next('CLOSED');
      if (!this.isIntentionalDisconnect) {
        this.scheduleReconnect();
      }
    }
  }

  private scheduleReconnect() {
    if (this.isIntentionalDisconnect) {
      return;
    }

    // Browser error is commonly followed by close; schedule only once.
    if (this.reconnectTimeout) return;

    // Reconnect resets sensitive capabilities fail-closed
    this.resetCapabilitiesFailClosed();

    if (this.reconnectAttempt >= this.maxReconnectAttempts) {
      console.warn(`[wsService] Reached maximum reconnect attempts (${this.maxReconnectAttempts}). Stopping.`);
      return;
    }

    const delay = calculateBackoff(this.reconnectAttempt, 1000, 30000, 2);
    this.reconnectAttempt += 1;
    console.log(`[wsService] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempt}/${this.maxReconnectAttempts})...`);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, delay);
  }

  sendMessage(message: object) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not open. Unable to send message:', message);
      toaster.create({
        title: getTranslation()('error.websocketNotOpen'),
        type: 'error',
        duration: 2000,
      });
    }
  }

  onMessage(callback: (message: MessageEvent) => void) {
    return this.messageSubject.subscribe(callback);
  }

  onStateChange(callback: (state: 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED') => void) {
    return this.stateSubject.subscribe(callback);
  }

  disconnect() {
    this.isIntentionalDisconnect = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
    }
    this.resetCapabilitiesFailClosed();
    this.currentState = 'CLOSED';
    this.stateSubject.next('CLOSED');
  }

  getCurrentState() {
    return this.currentState;
  }
}

export const wsService = WebSocketService.getInstance();
