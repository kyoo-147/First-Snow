import { Box, Flex, HStack, Text } from '@chakra-ui/react';
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { canvasStyles } from './canvas-styles';
import { useWSStatus } from '@/hooks/canvas/use-ws-status';

interface StatusContentProps {
  textKey: string;
}

const StatusContent: React.FC<StatusContentProps> = ({ textKey }) => {
  const { t } = useTranslation();
  return t(textKey);
};
const MemoizedStatusContent = memo(StatusContent);

const WebSocketStatus = memo((): React.JSX.Element => {
  const {
    color,
    textKey,
    handleClick,
    isDisconnected,
    canUseMic,
    canUseCamera,
    canUseScreen,
    modelAbsent,
  } = useWSStatus();

  return (
    <Flex direction="column" gap={2} pointerEvents="auto">
      {/* WebSocket connection badge */}
      <HStack gap={2} wrap="wrap">
        <Box
          {...canvasStyles.wsStatus.container}
          backgroundColor={color}
          onClick={handleClick}
          cursor={isDisconnected ? 'pointer' : 'default'}
          _hover={{
            opacity: isDisconnected ? 0.8 : 1,
          }}
          borderRadius="full"
          px={3}
          py={1}
          shadow="sm"
          display="inline-flex"
          alignItems="center"
          gap={1.5}
        >
          <Box w="6px" h="6px" borderRadius="full" bg="white" />
          <Text fontSize="xs" fontWeight="bold" color="white">
            <MemoizedStatusContent textKey={textKey} />
          </Text>
        </Box>

        {/* Live2D absent model status badge */}
        {modelAbsent && (
          <Box
            bg="rgba(15, 23, 42, 0.75)"
            color="white"
            borderRadius="full"
            px={3}
            py={1}
            fontSize="xs"
            fontWeight="medium"
            backdropFilter="blur(8px)"
            border="1px solid rgba(255, 255, 255, 0.15)"
            title="Live2D model asset absent: Voice & Subtitle mode active"
          >
            👤 Avatar Model Absent (Voice Mode)
          </Box>
        )}
      </HStack>

      {/* Visible Fail-Closed Capability Status Badges */}
      <HStack gap={1.5} wrap="wrap">
        <Box
          bg={canUseMic ? "rgba(16, 185, 129, 0.85)" : "rgba(71, 85, 105, 0.85)"}
          color="white"
          borderRadius="md"
          px={2}
          py={0.5}
          fontSize="11px"
          fontWeight="semibold"
          backdropFilter="blur(4px)"
          title={canUseMic ? "Microphone capability granted" : "Microphone blocked: Server capability grant required"}
        >
          {canUseMic ? "🎤 Mic: Ready" : "🎤 Mic: Awaiting Grant"}
        </Box>

        <Box
          bg={canUseCamera ? "rgba(16, 185, 129, 0.85)" : "rgba(71, 85, 105, 0.85)"}
          color="white"
          borderRadius="md"
          px={2}
          py={0.5}
          fontSize="11px"
          fontWeight="semibold"
          backdropFilter="blur(4px)"
          title={canUseCamera ? "Camera capability granted" : "Camera fail-closed: No server grant"}
        >
          {canUseCamera ? "📷 Camera: Enabled" : "📷 Camera: Fail-Closed"}
        </Box>

        <Box
          bg={canUseScreen ? "rgba(16, 185, 129, 0.85)" : "rgba(71, 85, 105, 0.85)"}
          color="white"
          borderRadius="md"
          px={2}
          py={0.5}
          fontSize="11px"
          fontWeight="semibold"
          backdropFilter="blur(4px)"
          title={canUseScreen ? "Screen capability granted" : "Screen fail-closed: No server grant"}
        >
          {canUseScreen ? "🖥️ Screen: Enabled" : "🖥️ Screen: Fail-Closed"}
        </Box>
      </HStack>
    </Flex>
  );
});

WebSocketStatus.displayName = 'WebSocketStatus';

export default WebSocketStatus;
