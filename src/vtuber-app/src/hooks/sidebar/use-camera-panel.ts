/* eslint-disable no-shadow */
import { useRef, useState } from 'react';
import { useCamera } from '@/context/camera-context';

export const useCameraPanel = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string>('');
  const [isHovering, setIsHovering] = useState(false);
  const {
    isStreaming, stream, isCameraGranted, startCamera, stopCamera,
  } = useCamera();

  const toggleCamera = async (): Promise<void> => {
    if (!isCameraGranted) {
      setError('Camera unavailable: server capability grant required (parent consent & safety policy)');
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
      let errorMessage = 'Unable to access camera';
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
