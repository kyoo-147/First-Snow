import { useEffect } from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';
import { FiCamera, FiLock } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { Tooltip } from '@/components/ui/tooltip';
import { sidebarStyles } from './sidebar-styles';
import { useCameraPanel } from '@/hooks/sidebar/use-camera-panel';

// Reusable components
function LiveIndicator() {
  const { t } = useTranslation();

  return (
    <Box color="red.500" display="flex" alignItems="center" gap={2}>
      <Box w="8px" h="8px" borderRadius="full" bg="red.500" animation="pulse 2s infinite" />
      <Text fontSize="sm">{t('sidebar.live')}</Text>
    </Box>
  );
}

function CameraPlaceholder() {
  const { t } = useTranslation();

  return (
    <Box
      position="absolute"
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={2}
    >
      <FiCamera size={24} />
      <Text color="whiteAlpha.600" fontSize="sm" textAlign="center">
        {t('footer.cameraControl')}
      </Text>
    </Box>
  );
}

function CameraFailClosedNotice() {
  const { t } = useTranslation();

  return (
    <VStack
      position="absolute"
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={2}
      p={3}
      textAlign="center"
    >
      <Box p={2} borderRadius="full" bg="whiteAlpha.200" color="orange.300">
        <FiLock size={20} />
      </Box>
      <Text color="whiteAlpha.900" fontSize="xs" fontWeight="bold">
        {t('camera.unavailable')}
      </Text>
      <Text color="whiteAlpha.600" fontSize="10px" lineHeight="1.3">
        {t('camera.failClosedNote')}
      </Text>
    </VStack>
  );
}

function VideoStream({
  videoRef,
  isStreaming,
}: {
  videoRef: React.RefObject<HTMLVideoElement>;
  isStreaming: boolean;
}) {
  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      style={sidebarStyles.cameraPanel.video}
      {...(isStreaming ? {} : { display: 'none' })}
    />
  );
}

// Main component
function CameraPanel(): React.JSX.Element {
  const { t } = useTranslation();
  const {
    videoRef,
    error,
    isHovering,
    isStreaming,
    isCameraGranted,
    stream,
    toggleCamera,
    handleMouseEnter,
    handleMouseLeave,
  } = useCameraPanel();

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <Box {...sidebarStyles.cameraPanel.container}>
      <Box {...sidebarStyles.cameraPanel.header}>
        {isStreaming && <LiveIndicator />}
      </Box>

      <Tooltip
        showArrow
        content={
          !isCameraGranted
            ? t('camera.unavailableTooltip')
            : isStreaming
              ? t('footer.cameraStopping')
              : t('footer.cameraControl')
        }
        open={isHovering && !error}
      >
        <Box
          {...sidebarStyles.cameraPanel.videoContainer}
          onClick={isCameraGranted ? toggleCamera : undefined}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          cursor={isCameraGranted ? 'pointer' : 'not-allowed'}
          position="relative"
          _hover={{
            bg: isCameraGranted ? 'whiteAlpha.100' : 'transparent',
          }}
        >
          {!isCameraGranted ? (
            <CameraFailClosedNotice />
          ) : error ? (
            <Text color="red.300" fontSize="sm" textAlign="center">
              {error}
            </Text>
          ) : (
            <>
              <VideoStream videoRef={videoRef} isStreaming={isStreaming} />
              {!isStreaming && <CameraPlaceholder />}
            </>
          )}
        </Box>
      </Tooltip>
    </Box>
  );
}

export default CameraPanel;
