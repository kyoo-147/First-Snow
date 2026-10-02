import {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import { toaster } from '@/components/ui/toaster';
import { wsService } from '@/services/websocket-service';

/**
 * Camera configuration interface
 * @interface CameraConfig
 */
interface CameraConfig {
  width: number;
  height: number;
}

/**
 * Camera context state interface
 * @interface CameraContextState
 */
interface CameraContextState {
  isStreaming: boolean;
  isCameraGranted: boolean;
  stream: MediaStream | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  cameraConfig: CameraConfig;
  setCameraConfig: (config: CameraConfig) => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  backgroundStream: MediaStream | null;
  startBackgroundCamera: () => Promise<void>;
  stopBackgroundCamera: () => void;
  isBackgroundStreaming: boolean;
}

/**
 * Default values and constants
 */
const DEFAULT_CAMERA_CONFIG: CameraConfig = {
  width: 320,
  height: 240,
};

/**
 * Create the camera context
 */
const CameraContext = createContext<CameraContextState | null>(null);

/**
 * Camera Provider Component
 * @param {Object} props - Provider props
 * @param {React.ReactNode} props.children - Child components
 */
export function CameraProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  // State management
  const [isStreaming, setIsStreaming] = useState(false);
  const [isBackgroundStreaming, setIsBackgroundStreaming] = useState(false);
  const [cameraConfig, setCameraConfig] = useState<CameraConfig>(
    DEFAULT_CAMERA_CONFIG,
  );
  const streamRef = useRef<MediaStream | null>(null);
  const backgroundStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isCameraGranted, setIsCameraGranted] = useState(
    () => wsService.getCapabilities().camera,
  );

  useEffect(() => {
    const sub = wsService.onCapabilitiesChange((caps) => {
      setIsCameraGranted(caps.camera);
      if (!caps.camera) {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
          setIsStreaming(false);
        }
        if (backgroundStreamRef.current) {
          backgroundStreamRef.current.getTracks().forEach((track) => track.stop());
          backgroundStreamRef.current = null;
          setIsBackgroundStreaming(false);
        }
      }
    });
    return () => sub.unsubscribe();
  }, []);

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      if (!wsService.getCapabilities().camera) {
        const errorMsg = 'Camera unavailable: server capability grant required (parent consent & safety policy)';
        toaster.create({
          title: errorMsg,
          type: 'error',
          duration: 3000,
        });
        throw new Error(errorMsg);
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(t('error.cameraApiNotSupported'));
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = devices.some((device) => device.kind === 'videoinput');
      if (!hasCamera) {
        throw new Error(t('error.noCameraFound'));
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: cameraConfig.width },
          height: { ideal: cameraConfig.height },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsStreaming(true);
    } catch (err) {
      console.error('Failed to start camera:', err);
      toaster.create({
        title: `${t('error.failedStartCamera')}: ${err}`,
        type: 'error',
        duration: 2000,
      });
      throw err;
    }
  }, [cameraConfig, t]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setIsStreaming(false);
      // stopStreamingToBackend();
    }
  }, []);

  const startBackgroundCamera = useCallback(async () => {
    try {
      if (!wsService.getCapabilities().camera) {
        const errorMsg = 'Camera unavailable: server capability grant required (parent consent & safety policy)';
        toaster.create({
          title: errorMsg,
          type: 'error',
          duration: 3000,
        });
        throw new Error(errorMsg);
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(t('error.cameraApiNotSupported'));
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = devices.some((device) => device.kind === 'videoinput');
      if (!hasCamera) {
        throw new Error(t('error.noCameraFound'));
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: cameraConfig.width },
          height: { ideal: cameraConfig.height },
        },
      });

      backgroundStreamRef.current = stream;
      setIsBackgroundStreaming(true);
    } catch (err) {
      console.error('Failed to start background camera:', err);
      toaster.create({
        title: `${t('error.failedStartBackgroundCamera')}: ${err}`,
        type: 'error',
        duration: 2000,
      });
      throw err;
    }
  }, [cameraConfig, t]);

  const stopBackgroundCamera = useCallback(() => {
    if (backgroundStreamRef.current) {
      backgroundStreamRef.current.getTracks().forEach((track) => track.stop());
      backgroundStreamRef.current = null;
      setIsBackgroundStreaming(false);
    }
  }, []);

  // Memoized context value
  const contextValue = useMemo(
    () => ({
      isStreaming,
      isCameraGranted,
      stream: streamRef.current,
      startCamera,
      stopCamera,
      cameraConfig,
      setCameraConfig,
      videoRef,
      backgroundStream: backgroundStreamRef.current,
      startBackgroundCamera,
      stopBackgroundCamera,
      isBackgroundStreaming,
    }),
    [isStreaming, isCameraGranted, startCamera, stopCamera, cameraConfig, isBackgroundStreaming, startBackgroundCamera, stopBackgroundCamera],
  );

  return (
    <CameraContext.Provider value={contextValue}>
      {children}
    </CameraContext.Provider>
  );
}

/**
 * Custom hook to use the camera context
 * @throws {Error} If used outside of CameraProvider
 */
export function useCamera() {
  const context = useContext(CameraContext);

  if (!context) {
    throw new Error('useCamera must be used within a CameraProvider');
  }

  return context;
}
