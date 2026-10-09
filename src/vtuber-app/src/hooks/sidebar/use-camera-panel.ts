/* eslint-disable no-shadow */
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCamera } from '@/context/camera-context';

export const useCameraPanel = () => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string>('');
  const [isHovering, setIsHovering] = useState(false);
  const {
    isStreaming, stream, isCameraGranted, startCamera, stopCamera,
  } = useCamera();

  const toggleCamera = async (): Promise<void> => {
    if (!isCameraGranted) {
      setError(t('error.cameraGrantRequired'));
      return;
    }

    try {
      if (isStreaming) {
        stopCamera();
      } else {
        await startCamera();
      }
      setError('');
    } catch (error) {
      let errorMessage = t('error.unableToAccessCamera');
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setError(errorMessage);
    }
  };

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);

  return {
    videoRef,
    error,
    isHovering,
    isStreaming,
    isCameraGranted,
    stream,
    toggleCamera,
    handleMouseEnter,
    handleMouseLeave,
  };
};
