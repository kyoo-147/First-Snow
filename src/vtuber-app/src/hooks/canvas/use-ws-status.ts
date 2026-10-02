import { useMemo, useCallback } from 'react';
import { useWebSocket } from '@/context/websocket-context';
import { CompanionCapabilities } from '@/lib/voice-client';

interface WSStatusInfo {
  color: string;
  textKey: string;
  isDisconnected: boolean;
  handleClick: () => void;
  capabilities: CompanionCapabilities;
  canUseMic: boolean;
  canUseCamera: boolean;
  canUseScreen: boolean;
  modelAbsent: boolean;
}

export const useWSStatus = (): WSStatusInfo => {
  const {
    wsState,
    reconnect,
    capabilities,
    canUseMic,
    canUseCamera,
    canUseScreen,
  } = useWebSocket();

  const handleClick = useCallback(() => {
    if (wsState !== 'OPEN' && wsState !== 'CONNECTING') {
      reconnect();
    }
  }, [wsState, reconnect]);

  const statusInfo = useMemo((): WSStatusInfo => {
    let color = 'red.500';
    let textKey = 'wsStatus.clickToReconnect';
    let isDisconnected = true;

    if (wsState === 'OPEN') {
      color = 'green.500';
      textKey = 'wsStatus.connected';
      isDisconnected = false;
    } else if (wsState === 'CONNECTING') {
      color = 'yellow.500';
      textKey = 'wsStatus.connecting';
      isDisconnected = false;
    }

    return {
      color,
      textKey,
      isDisconnected,
      handleClick,
      capabilities,
      canUseMic,
      canUseCamera,
      canUseScreen,
      modelAbsent: true, // Live2D model is absent in this deployment
    };
  }, [wsState, handleClick, capabilities, canUseMic, canUseCamera, canUseScreen]);

  return statusInfo;
};
