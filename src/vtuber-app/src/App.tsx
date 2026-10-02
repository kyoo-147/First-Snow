/* eslint-disable no-shadow */
import { Box, Flex, ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { useState, useEffect, useRef } from "react";
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./components/sidebar/sidebar";
import Footer from "./components/footer/footer";
import { AiStateProvider } from "./context/ai-state-context";
import { Live2DConfigProvider } from "./context/live2d-config-context";
import { SubtitleProvider } from "./context/subtitle-context";
import { BgUrlProvider } from "./context/bgurl-context";
import { layoutStyles } from "./layout";
import WebSocketHandler from "./services/websocket-handler";
import { CameraProvider } from "./context/camera-context";
import { ChatHistoryProvider } from "./context/chat-history-context";
import { CharacterConfigProvider } from "./context/character-config-context";
import { Toaster } from "./components/ui/toaster";
import { VADProvider } from "./context/vad-context";
import { Live2D } from "./components/canvas/live2d";
import TitleBar from "./components/electron/title-bar";
import { InputSubtitle } from "./components/electron/input-subtitle";
import { ProactiveSpeakProvider } from "./context/proactive-speak-context";
import { ScreenCaptureProvider } from "./context/screen-capture-context";
import { GroupProvider } from "./context/group-context";
import { BrowserProvider } from "./context/browser-context";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import Background from "./components/canvas/background";
import WebSocketStatus from "./components/canvas/ws-status";
import Subtitle from "./components/canvas/subtitle";
import { ModeProvider, useMode } from "./context/mode-context";
import AuthScreen from "./components/kid/AuthScreen";
import ChildProfilesScreen from "./components/kid/ChildProfilesScreen";
import { Button } from "./components/ui/button";

// Subpage content components
import DashboardLayout from "./components/kid/DashboardLayout";
import DashboardPage from "./components/kid/pages/DashboardPage";
import DocumentsPage from "./components/kid/pages/DocumentsPage";
import AiTeachersPage from "./components/kid/pages/AiTeachersPage";
import AiWriterPage from "./components/kid/pages/AiWriterPage";
import AssistantsPage from "./components/kid/pages/AssistantsPage";
import AnalyticsPage from "./components/kid/pages/AnalyticsPage";
import CoursesPage from "./components/kid/pages/CoursesPage";
import EventsPage from "./components/kid/pages/EventsPage";
import SpeechToTextPage from "./components/kid/pages/SpeechToTextPage";
import VoiceoverPage from "./components/kid/pages/VoiceoverPage";

function AppContent(): React.JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode } = useMode();
  const isElectron = window.api !== undefined;
  const live2dContainerRef = useRef<HTMLDivElement>(null);

  const [showSidebar, setShowSidebar] = useState(true);
  const [isFooterCollapsed, setIsFooterCollapsed] = useState(false);

  const [userEmail, setUserEmail] = useState("");
  const [activeProfile, setActiveProfile] = useState<{ id: string; name: string } | null>(null);

  // Clean up any legacy plaintext keys from previous versions
  useEffect(() => {
    try {
      localStorage.removeItem("kid_app_users");
      localStorage.removeItem("kid_app_current_user");
      localStorage.removeItem("kid_active_profile");
    } catch {
      // ignore
    }
  }, []);

  // Route protection guard
  useEffect(() => {
    const path = location.pathname;

    if (!userEmail) {
      if (path !== "/login") {
        navigate("/login");
      }
    } else if (!activeProfile) {
      if (path !== "/profiles") {
        navigate("/profiles");
      }
    } else {
      // If logged in and profile is selected, redirect from login/profiles/root paths to dashboard
      if (path === "/" || path === "/login" || path === "/profiles") {
        navigate("/dashboard");
      }
    }
  }, [location.pathname, navigate, userEmail, activeProfile]);

  useEffect(() => {
    const handleResize = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
  document.documentElement.style.height = '100%';
  document.body.style.height = '100%';
  document.documentElement.style.position = 'fixed';
  document.body.style.position = 'fixed';
  document.documentElement.style.width = '100%';
  document.body.style.width = '100%';

  const live2dBaseStyle = {
    position: "absolute" as const,
    overflow: "hidden",
    transition: "all 0.3s ease-in-out",
    pointerEvents: "auto" as const,
  };

  const getResponsiveLive2DWindowStyle = (sidebarVisible: boolean) => ({
    ...live2dBaseStyle,
    top: isElectron ? "30px" : "0px",
    height: `calc(100% - ${isElectron ? "30px" : "0px"})`,
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

  const live2dPetStyle = {
    ...live2dBaseStyle,
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    zIndex: 15,
  };

  const dashboardWrapper = (element: React.ReactNode) => {
    return (
      <DashboardLayout
        onChangeProfile={() => navigate("/profiles")}
        onLogout={() => {
          setUserEmail("");
          setActiveProfile(null);
          navigate("/login");
        }}
      >
        {element}
      </DashboardLayout>
    );
  };

  return (
    <Routes>
      {/* Auth Screen */}
      <Route
        path="/login"
        element={
          <AuthScreen
            onLoginSuccess={(email) => {
              setUserEmail(email);
              navigate("/profiles");
            }}
          />
        }
      />

      {/* Profiles Screen */}
      <Route
        path="/profiles"
        element={
          <ChildProfilesScreen
            userEmail={userEmail}
            onSelectProfile={() => {
              navigate("/dashboard");
            }}
            onLogout={() => {
              setUserEmail("");
              setActiveProfile(null);
              navigate("/login");
            }}
          />
        }
      />

      {/* Dashboard Pages */}
      <Route path="/dashboard" element={dashboardWrapper(<DashboardPage />)} />
      <Route path="/documents" element={dashboardWrapper(<DocumentsPage />)} />
      <Route
        path="/ai-writer"
        element={dashboardWrapper(
          <AiWriterPage onLaunchVtuber={() => navigate("/vtuber")} />
        )}
      />
      <Route path="/ai-teachers" element={dashboardWrapper(<AiTeachersPage />)} />
      <Route path="/assistants" element={dashboardWrapper(<AssistantsPage />)} />
      <Route path="/analysis" element={dashboardWrapper(<AnalyticsPage />)} />
      <Route path="/course" element={dashboardWrapper(<CoursesPage />)} />
      <Route path="/events" element={dashboardWrapper(<EventsPage />)} />
      <Route path="/speech-to-text" element={dashboardWrapper(<SpeechToTextPage />)} />
      <Route path="/voiceover" element={dashboardWrapper(<VoiceoverPage />)} />

      {/* Live2D Companion Screen */}
      <Route
        path="/vtuber"
        element={
          <>
            <Box
              ref={live2dContainerRef}
              {...(mode === "window"
                ? getResponsiveLive2DWindowStyle(showSidebar)
                : live2dPetStyle)}
            >
              <Live2D />
            </Box>

            {mode === "window" && (
              <>
                {isElectron && <TitleBar />}
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

                    {/* Back Button */}
                    <Box position="absolute" top="20px" right="20px" zIndex={11}>
                      <Button
                        onClick={() => navigate("/dashboard")}
                        borderRadius="xl"
                        bg="#0EA5E9"
                        color="white"
                        fontWeight="bold"
                        size="sm"
                        shadow="md"
                        _hover={{ bg: "#0284C7" }}
                      >
                        Menu chính
                      </Button>
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
            )}

            {mode === "pet" && <InputSubtitle />}
          </>
        }
      />

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App(): React.JSX.Element {
  return (
    <ChakraProvider value={defaultSystem}>
      <HashRouter>
        <ModeProvider>
          <AppWithGlobalStyles />
        </ModeProvider>
      </HashRouter>
    </ChakraProvider>
  );
}

function AppWithGlobalStyles(): React.JSX.Element {
  return (
    <>
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
                                <AppContent />
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
    </>
  );
}

export default App;
