"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Flex, ChakraProvider, defaultSystem } from "@chakra-ui/react";
import "@/vtuber-app/src/i18n";
import { AiStateProvider } from "@/vtuber-app/src/context/ai-state-context";
import { Live2DConfigProvider } from "@/vtuber-app/src/context/live2d-config-context";
import { SubtitleProvider } from "@/vtuber-app/src/context/subtitle-context";
import { BgUrlProvider } from "@/vtuber-app/src/context/bgurl-context";
import { layoutStyles } from "@/vtuber-app/src/layout";
import WebSocketHandler from "@/vtuber-app/src/services/websocket-handler";
import { CameraProvider } from "@/vtuber-app/src/context/camera-context";
import { ChatHistoryProvider } from "@/vtuber-app/src/context/chat-history-context";
import { CharacterConfigProvider } from "@/vtuber-app/src/context/character-config-context";
import { Toaster } from "@/vtuber-app/src/components/ui/toaster";
import { VADProvider } from "@/vtuber-app/src/context/vad-context";
import { Live2D } from "@/vtuber-app/src/components/canvas/live2d";
import { ProactiveSpeakProvider } from "@/vtuber-app/src/context/proactive-speak-context";
import { ScreenCaptureProvider } from "@/vtuber-app/src/context/screen-capture-context";
import { GroupProvider } from "@/vtuber-app/src/context/group-context";
import { BrowserProvider } from "@/vtuber-app/src/context/browser-context";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import Background from "@/vtuber-app/src/components/canvas/background";
import WebSocketStatus from "@/vtuber-app/src/components/canvas/ws-status";
import Subtitle from "@/vtuber-app/src/components/canvas/subtitle";
import { ModeProvider } from "@/vtuber-app/src/context/mode-context";
import Sidebar from "@/vtuber-app/src/components/sidebar/sidebar";
import Footer from "@/vtuber-app/src/components/footer/footer";

declare global {
  interface Window {
    getLAppAdapter?: () => unknown;
  }
}

function VtuberScreen() {
  const [showSidebar, setShowSidebar] = useState(true);
  const [isFooterCollapsed, setIsFooterCollapsed] = useState(false);
  const live2dContainerRef = useRef<HTMLDivElement>(null);

  const live2dBaseStyle = {
    position: "absolute" as const,
    overflow: "hidden",
    transition: "all 0.3s ease-in-out",
    pointerEvents: "auto" as const,
  };

  const getResponsiveLive2DWindowStyle = (sidebarVisible: boolean) => ({
    ...live2dBaseStyle,
    top: "0px",
    height: "100%",
    zIndex: 5,
    left: {
      base: "0px",
      md: sidebarVisible ? "440px" : "24px",
    },
    width: {
      base: "100%",
      md: `calc(100% - ${sidebarVisible ? "440px" : "24px"})`,
    },
  });

  return (
    <>
      <Box
        ref={live2dContainerRef}
        {...getResponsiveLive2DWindowStyle(showSidebar)}
      >
        <Live2D />
      </Box>

      <Flex {...layoutStyles.appContainer}>
        <Box
          {...layoutStyles.sidebar}
          {...(!showSidebar && { width: "24px" })}
        >
          <Sidebar
            isCollapsed={!showSidebar}
            onToggle={() => setShowSidebar(!showSidebar)}
          />
        </Box>
        <Box {...layoutStyles.mainContent}>
          <Background />
          <Box position="absolute" top="20px" left="20px" zIndex={10}>
            <WebSocketStatus />
          </Box>

          <Box
            position="absolute"
            bottom={isFooterCollapsed ? "39px" : "135px"}
            left="50%"
            transform="translateX(-50%)"
            zIndex={10}
            width="60%"
          >
            <Subtitle />
          </Box>
          <Box
            {...layoutStyles.footer}
            zIndex={10}
            {...(isFooterCollapsed && layoutStyles.collapsedFooter)}
          >
            <Footer
              isCollapsed={isFooterCollapsed}
              onToggle={() => setIsFooterCollapsed(!isFooterCollapsed)}
            />
          </Box>
        </Box>
      </Flex>
    </>
  );
}

export function VtuberApp() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadLive2DCore = () => {
      return new Promise<void>((resolve) => {
        if (typeof document === "undefined") {
          resolve();
          return;
        }
        if (document.getElementById("live2dcore")) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.id = "live2dcore";
        script.src = "/libs/live2dcubismcore.js";
        script.onload = () => {
          import("@/vtuber-app/WebSDK/src/lappadapter")
            .then(({ LAppAdapter }) => {
              window.getLAppAdapter = () => LAppAdapter.getInstance();
              resolve();
            })
            .catch(() => resolve());
        };
        script.onerror = () => {
          console.warn("Live2D engine assets unavailable. Operating in voice & subtitle mode.");
          resolve();
        };
        document.head.appendChild(script);
      });
    };

    loadLive2DCore()
      .then(() => setIsLoaded(true))
      .catch(() => setIsLoaded(true));
  }, []);

  if (!isLoaded) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-10 text-white">
        <div className="size-8 animate-spin rounded-full border-3 border-snow-primary-soft border-t-white" />
        <p className="mt-4 text-sm font-semibold tracking-wide text-white/90">
          Initializing voice companion...
        </p>
      </div>
    );
  }

  return (
    <ChakraProvider value={defaultSystem}>
      <ModeProvider>
        <CameraProvider>
          <ScreenCaptureProvider>
            <CharacterConfigProvider>
              <ChatHistoryProvider>
                <AiStateProvider>
                  <ProactiveSpeakProvider>
                    <Live2DConfigProvider>
                      <SubtitleProvider>
                        <VADProvider>
                          <BgUrlProvider>
                            <GroupProvider>
                              <BrowserProvider>
                                <WebSocketHandler>
                                  <Toaster />
                                  <VtuberScreen />
                                </WebSocketHandler>
                              </BrowserProvider>
                            </GroupProvider>
                          </BgUrlProvider>
                        </VADProvider>
                      </SubtitleProvider>
                    </Live2DConfigProvider>
                  </ProactiveSpeakProvider>
                </AiStateProvider>
              </ChatHistoryProvider>
            </CharacterConfigProvider>
          </ScreenCaptureProvider>
        </CameraProvider>
      </ModeProvider>
    </ChakraProvider>
  );
}
