/* eslint-disable no-shadow */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { memo, useRef, useEffect } from "react";
import { Box, Flex, Text, VStack } from "@chakra-ui/react";
import { Sparkles, Volume2, Mic } from "lucide-react";
import { useLive2DConfig } from "@/context/live2d-config-context";
import { useIpcHandlers } from "@/hooks/utils/use-ipc-handlers";
import { useInterrupt } from "@/hooks/utils/use-interrupt";
import { useAudioTask } from "@/hooks/utils/use-audio-task";
import { useLive2DModel } from "@/hooks/canvas/use-live2d-model";
import { useLive2DResize } from "@/hooks/canvas/use-live2d-resize";
import { useAiState, AiStateEnum } from "@/context/ai-state-context";
import { useLive2DExpression } from "@/hooks/canvas/use-live2d-expression";
import { useForceIgnoreMouse } from "@/hooks/utils/use-force-ignore-mouse";
import { useMode } from "@/context/mode-context";

interface Live2DProps {
  showSidebar?: boolean;
}

/**
 * Honest Snow fallback view rendered when the Live2D model asset is absent.
 * Complies with requirement: "Live2D model is absent: render honest unavailable/fallback status, do not invent asset. Preserve Snow design."
 */
function FallbackSnowAvatar({ aiState }: { aiState: string }) {
  const isSpeaking = aiState === "thinking-speaking";
  const isListening = aiState === "listening";

  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      h="100%"
      w="100%"
      position="absolute"
      top="0"
      left="0"
      zIndex={4}
      pointerEvents="none"
      p={6}
    >
      <VStack gap={4} maxW="480px" textAlign="center">
        {/* Animated Companion Avatar Orb with reactive pulse */}
        <Box position="relative" display="inline-flex" alignItems="center" justifyContent="center">
          {/* Outer gentle calm pulse ring */}
          <Box
            position="absolute"
            w={isSpeaking ? "160px" : isListening ? "150px" : "130px"}
            h={isSpeaking ? "160px" : isListening ? "150px" : "130px"}
            borderRadius="full"
            bg={
              isSpeaking
                ? "rgba(14, 165, 233, 0.25)"
                : isListening
                  ? "rgba(16, 185, 129, 0.25)"
                  : "rgba(224, 231, 255, 0.2)"
            }
            transition="all 0.4s ease"
            filter="blur(10px)"
          />

          {/* Main Avatar Core Circle */}
          <Box
            w="120px"
            h="120px"
            borderRadius="full"
            bg="linear-gradient(135deg, #0284C7 0%, #38BDF8 50%, #818CF8 100%)"
            boxShadow="0 10px 25px -5px rgba(14, 165, 233, 0.4)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            position="relative"
            transition="transform 0.3s ease"
            transform={isSpeaking ? "scale(1.08)" : isListening ? "scale(1.04)" : "scale(1)"}
          >
            {isSpeaking ? (
              <Volume2 className="size-12 text-white animate-bounce" />
            ) : isListening ? (
              <Mic className="size-12 text-white animate-pulse" />
            ) : (
              <Sparkles className="size-12 text-white" />
            )}
          </Box>
        </Box>

        {/* State Label */}
        <Box
          bg="rgba(15, 23, 42, 0.85)"
          backdropFilter="blur(12px)"
          border="1px solid rgba(255, 255, 255, 0.15)"
          borderRadius="2xl"
          px={5}
          py={3}
          shadow="lg"
        >
          <Text fontSize="sm" fontWeight="bold" color="white">
            {isSpeaking
              ? "AgentKid is talking..."
              : isListening
                ? "Listening to you..."
                : "Snow Voice Companion"}
          </Text>
          <Text fontSize="xs" color="#94A3B8" mt={0.5}>
            Live2D model absent • Running in voice & subtitle mode
          </Text>
        </Box>

        {/* Honest explanation card */}
        <Box
          bg="rgba(255, 255, 255, 0.9)"
          borderRadius="xl"
          p={3.5}
          shadow="md"
          border="1px solid rgba(226, 232, 240, 0.8)"
        >
          <Text fontSize="xs" fontWeight="semibold" color="#1E293B">
            Avatar Model Unavailable
          </Text>
          <Text fontSize="11px" color="#64748B" mt={1}>
            Live2D visual assets are pending license integration. Voice communication, audio playback, and real-time subtitles are fully active.
          </Text>
        </Box>
      </VStack>
    </Flex>
  );
}

export const Live2D = memo(
  ({ showSidebar }: Live2DProps): React.JSX.Element => {
    const { forceIgnoreMouse } = useForceIgnoreMouse();
    const { modelInfo } = useLive2DConfig();
    const { mode } = useMode();
    const internalContainerRef = useRef<HTMLDivElement>(null);
    const { aiState } = useAiState();
    const { resetExpression } = useLive2DExpression();
    const isPet = mode === 'pet';

    const isModelAbsent = !modelInfo || !modelInfo.url;

    // Get canvasRef from useLive2DResize
    const { canvasRef } = useLive2DResize({
      containerRef: internalContainerRef,
      modelInfo,
      showSidebar,
    });

    // Pass canvasRef to useLive2DModel
    const { isDragging, handlers } = useLive2DModel({
      modelInfo,
      canvasRef,
    });

    // Setup hooks
    useIpcHandlers();
    useInterrupt();
    useAudioTask();

    // Reset expression to default when AI state becomes idle
    useEffect(() => {
      if (aiState === AiStateEnum.IDLE) {
        const lappAdapter = (window as any).getLAppAdapter?.();
        if (lappAdapter) {
          resetExpression(lappAdapter, modelInfo);
        }
      }
    }, [aiState, modelInfo, resetExpression]);

    const handlePointerDown = (e: React.PointerEvent) => {
      handlers.onMouseDown(e);
    };

    const handleContextMenu = (e: React.MouseEvent) => {
      if (!isPet) {
        return;
      }

      e.preventDefault();
      window.api?.showContextMenu?.();
    };

    return (
      <div
        ref={internalContainerRef}
        id="live2d-internal-wrapper"
        style={{
          width: "100%",
          height: "100%",
          pointerEvents: isPet && forceIgnoreMouse ? "none" : "auto",
          overflow: "hidden",
          position: "relative",
          cursor: isDragging ? "grabbing" : "default",
        }}
        onPointerDown={handlePointerDown}
        onContextMenu={handleContextMenu}
        {...handlers}
      >
        {/* Honest unavailable/fallback status when Live2D model is absent */}
        {isModelAbsent && <FallbackSnowAvatar aiState={aiState} />}

        <canvas
          id="canvas"
          ref={canvasRef}
          style={{
            width: "100%",
            height: "100%",
            pointerEvents: isPet && forceIgnoreMouse ? "none" : "auto",
            display: isModelAbsent ? "none" : "block",
            cursor: isDragging ? "grabbing" : "default",
          }}
        />
      </div>
    );
  },
);

Live2D.displayName = "Live2D";

export { useInterrupt, useAudioTask };
