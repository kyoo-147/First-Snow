import { useRef, useState, useEffect } from 'react';
import { useScreenCaptureContext } from '@/context/screen-capture-context';

export function useCaptureScreen() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const { stream, isStreaming, isScreenGranted, error, startCapture, stopCapture } = useScreenCaptureContext();

  const toggleCapture = () => {
    if (!isScreenGranted) {
      return;
    }
    if (isStreaming) {
      stopCapture();
    } else {
      startCapture();
    }
  };

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return {
    videoRef,
    error,
    isHovering,
    isStreaming,
    isScreenGranted,
    stream,
    toggleCapture,
    handleMouseEnter,
    handleMouseLeave,
  };
}
