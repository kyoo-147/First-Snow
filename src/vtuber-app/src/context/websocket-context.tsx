/* eslint-disable react/jsx-no-constructed-context-values */
import React, { useContext, useState, useEffect } from 'react';
import { wsService } from '@/services/websocket-service';
import {
  CompanionCapabilities,
  FAIL_CLOSED_CAPABILITIES,
} from '@/lib/voice-client';

const DEFAULT_WS_URL = '/api/companion/ws';
const DEFAULT_BASE_URL = '';

export interface HistoryInfo {
  uid: string;
  latest_message: {
    role: 'human' | 'ai';
    timestamp: string;
    content: string;
  } | null;
  timestamp: string | null;
}

interface WebSocketContextProps {
  sendMessage: (message: object) => void;
  wsState: string;
  reconnect: () => void;
  wsUrl: string;
  setWsUrl: (url: string) => void;
  baseUrl: string;
  setBaseUrl: (url: string) => void;
  capabilities: CompanionCapabilities;
  canUseMic: boolean;
  canUseCamera: boolean;
  canUseScreen: boolean;
}

export const WebSocketContext = React.createContext<WebSocketContextProps>({
  sendMessage: wsService.sendMessage.bind(wsService),
  wsState: 'CLOSED',
  reconnect: () => wsService.connect(DEFAULT_WS_URL),
  wsUrl: DEFAULT_WS_URL,
  setWsUrl: () => {},
  baseUrl: DEFAULT_BASE_URL,
  setBaseUrl: () => {},
  capabilities: { ...FAIL_CLOSED_CAPABILITIES },
  canUseMic: false,
  canUseCamera: false,
  canUseScreen: false,
});

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

export const defaultWsUrl = DEFAULT_WS_URL;
export const defaultBaseUrl = DEFAULT_BASE_URL;

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [wsUrl, setWsUrl] = useState(DEFAULT_WS_URL);
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);
  const [capabilities, setCapabilities] = useState<CompanionCapabilities>(
    () => wsService.getCapabilities(),
  );

  useEffect(() => {
    const sub = wsService.onCapabilitiesChange(setCapabilities);
    return () => sub.unsubscribe();
  }, []);

  const handleSetWsUrl = (url: string) => {
    setWsUrl(url);
    wsService.connect(url);
  };

  const value = {
    sendMessage: wsService.sendMessage.bind(wsService),
    wsState: 'CLOSED',
    reconnect: () => wsService.connect(wsUrl),
    wsUrl,
    setWsUrl: handleSetWsUrl,
    baseUrl,
    setBaseUrl,
    capabilities,
    canUseMic: capabilities.audio_input === true,
    canUseCamera: capabilities.camera === true,
    canUseScreen: capabilities.screen === true,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}
