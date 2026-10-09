import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { toaster } from "@/components/ui/toaster";
import { wsService } from '@/services/websocket-service';

interface ScreenCaptureContextType {
  stream: MediaStream | null;
  isStreaming: boolean;
  isScreenGranted: boolean;
  error: string;
  startCapture: () => Promise<void>;
  stopCapture: () => void;
}

const ScreenCaptureContext = createContext<ScreenCaptureContextType | undefined>(undefined);

export function ScreenCaptureProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isScreenGranted, setIsScreenGranted] = useState(
    () => wsService.getCapabilities().screen,
  );
  const [error, setError] = useState('');

  useEffect(() => {
    const sub = wsService.onCapabilitiesChange((caps) => {
      setIsScreenGranted(caps.screen);
      if (!caps.screen && stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
        setIsStreaming(false);
      }
    });
    return () => sub.unsubscribe();
  }, [stream]);

  const startCapture = async () => {
    try {
      if (!wsService.getCapabilities().screen) {
        const errMsg = t('error.screenGrantRequired');
        setError(errMsg);
        toaster.create({
          title: errMsg,
          type: 'error',
          duration: 3000,
        });
        return;
      }
      let mediaStream: MediaStream;

      if (window.electron) {
        const sourceId = await window.electron.ipcRenderer.invoke('get-screen-capture');

        const displayMediaOptions: DisplayMediaStreamOptions = {
          video: {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            mandatory: {
              chromeMediaSource: "desktop",
              chromeMediaSourceId: sourceId,
              minWidth: 1280,
              maxWidth: 1280,
              minHeight: 720,
              maxHeight: 720,
            },
          },
          audio: false,
        };

        mediaStream = await navigator.mediaDevices.getUserMedia(displayMediaOptions);
      } else {
        const displayMediaOptions: DisplayMediaStreamOptions = {
          video: true,
          audio: false,
        };
        mediaStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
      }

      setStream(mediaStream);
      setIsStreaming(true);
      setError('');
    } catch (err) {
      setError(t('error.failedStartScreenCapture'));
      toaster.create({
        title: `${t('error.failedStartScreenCapture')}: ${err}`,
        type: 'error',
        duration: 2000,
      });
      console.error(err);
    }
  };

  const stopCapture = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsStreaming(false);
    }
  };

  return (
    <ScreenCaptureContext.Provider
      // eslint-disable-next-line react/jsx-no-constructed-context-values
      value={{
        stream,
        isStreaming,
        isScreenGranted,
        error,
        startCapture,
        stopCapture,
      }}
    >
      {children}
    </ScreenCaptureContext.Provider>
  );
}

export const useScreenCaptureContext = () => {
  const context = useContext(ScreenCaptureContext);
  if (context === undefined) {
    throw new Error('useScreenCaptureContext must be used within a ScreenCaptureProvider');
  }
  return context;
};
