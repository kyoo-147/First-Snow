import { Box, Text, VStack } from "@chakra-ui/react";
import { FiMonitor, FiLock } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { Tooltip } from "@/components/ui/tooltip";
import { sidebarStyles } from "./sidebar-styles";
import { useCaptureScreen } from "@/hooks/sidebar/use-capture-screen";

// Reusable components
function ScreenIndicator() {
  const { t } = useTranslation();
  
  return (
    <Box color="red.500" display="flex" alignItems="center" gap={2}>
      <Box
        w="8px"
        h="8px"
        borderRadius="full"
        bg="red.500"
        animation="pulse 2s infinite"
      />
      <Text fontSize="sm">{t('sidebar.screen')}</Text>
    </Box>
  );
}

function ScreenPlaceholder() {
  const { t } = useTranslation();
  
  return (
    <Box
      position="absolute"
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={2}
    >
      <FiMonitor size={24} />
      <Text color="whiteAlpha.600" fontSize="sm" textAlign="center">
        {t('footer.screenControl')}
      </Text>
    </Box>
  );
}

function ScreenFailClosedNotice() {
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
        Screen Sharing Unavailable
      </Text>
      <Text color="whiteAlpha.600" fontSize="10px" lineHeight="1.3">
        Fail-closed: Awaiting server capability grant (parental consent & safety policy required)
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
      style={sidebarStyles.screenPanel.video}
      {...(isStreaming ? {} : { display: "none" })}
    />
  );
}

function ScreenPanel(): React.JSX.Element {
  const { t } = useTranslation();
  const {
    videoRef,
    error,
    isHovering,
    isStreaming,
    isScreenGranted,
    toggleCapture,
    handleMouseEnter,
    handleMouseLeave,
  } = useCaptureScreen();

  return (
    <Box {...sidebarStyles.screenPanel.container}>
      <Box {...sidebarStyles.screenPanel.header}>
        {isStreaming && <ScreenIndicator />}
      </Box>

      <Tooltip
        showArrow
        content={
          !isScreenGranted
            ? 'Screen sharing unavailable: Server grant required'
            : isStreaming
              ? t('footer.screenStopping')
              : t('footer.screenControl')
        }
        open={isHovering && !error}
      >
        <Box
          {...sidebarStyles.screenPanel.screenContainer}
          onClick={isScreenGranted ? toggleCapture : undefined}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          cursor={isScreenGranted ? "pointer" : "not-allowed"}
          position="relative"
          _hover={{
            bg: isScreenGranted ? "whiteAlpha.100" : "transparent",
          }}
        >
          {!isScreenGranted ? (
            <ScreenFailClosedNotice />
          ) : error ? (
            <Text color="red.300" fontSize="sm" textAlign="center">
              {error}
            </Text>
          ) : (
            <>
              <VideoStream videoRef={videoRef} isStreaming={isStreaming} />
              {!isStreaming && <ScreenPlaceholder />}
            </>
          )}
        </Box>
      </Tooltip>
    </Box>
  );
}

export default ScreenPanel;
