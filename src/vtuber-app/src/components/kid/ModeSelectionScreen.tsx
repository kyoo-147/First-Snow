import { useState, useEffect } from "react";
import { Box, Flex, Text, Heading, SimpleGrid, VStack, HStack, Input } from "@chakra-ui/react";
import { Button } from "../ui/button";
import { toaster } from "../ui/toaster";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiHome,
  FiMessageSquare,
  FiBookOpen,
  FiActivity,
  FiUser,
  // FiLogOut,
  FiCalendar,
  FiSearch,
  FiBell,
  FiPlus,
  // FiCheckCircle,
  // FiSettings,
  FiChevronRight,
  FiChevronLeft,
  FiClock,
  FiSmile,
  FiEdit3,
  FiChevronDown,
  FiMail,
  // FiFolder,
  FiFileText,
  FiVolume2,
  FiGrid,
  FiBriefcase
} from "react-icons/fi";
import { useTranslation } from "react-i18next";

const momoMascot = "./images/momo-mascot-v2.png";

const MotionBox = motion(Box);
// const MotionFlex = motion(Flex);

interface KidProfile {
  id: string;
  name: string;
  age: number;
  avatar: string;
  status: "Active Session" | "Resting" | "Ready";
  color: string;
  points?: number;
}

interface ModeSelectionScreenProps {
  userEmail: string;
  onSelectMode: (mode: "vtuber" | "lessons" | "parent") => void;
  onLogout: () => void;
  onChangeProfile: () => void;
}

interface LessonQuiz {
  id: string;
  titleKey: string;
  descKey: string;
  color: string;
  emoji: string;
  scenarioKey: string;
  options: { key: string; textKey: string; isCorrect: boolean }[];
  correctFeedbackKey: string;
  wrongFeedbackKey: string;
}

const LESSONS: LessonQuiz[] = [
  {
    id: "lesson-1",
    titleKey: "kid.lesson1QuizTitle",
    descKey: "kid.lesson1QuizDesc",
    color: "#7C3AED", // Violet
    emoji: "😊",
    scenarioKey: "kid.modeScenario1",
    options: [
      { key: "A", textKey: "kid.lesson1Opt1", isCorrect: true },
      { key: "B", textKey: "kid.lesson1Opt2", isCorrect: false },
      { key: "C", textKey: "kid.lesson1Opt3", isCorrect: false },
    ],
    correctFeedbackKey: "kid.lesson1Feedback",
    wrongFeedbackKey: "kid.toastTryAgain"
  },
  {
    id: "lesson-2",
    titleKey: "kid.lesson2QuizTitle",
    descKey: "kid.lesson2QuizDesc",
    color: "#E11D48", // Pink
    emoji: "🤝",
    scenarioKey: "kid.modeScenario2",
    options: [
      { key: "A", textKey: "kid.modeScenario2OptA", isCorrect: false },
      { key: "B", textKey: "kid.modeScenario2OptB", isCorrect: false },
      { key: "C", textKey: "kid.modeScenario2OptC", isCorrect: true },
    ],
    correctFeedbackKey: "kid.modeScenario2Feedback",
    wrongFeedbackKey: "kid.modeScenario2Wrong"
  },
  {
    id: "lesson-3",
    titleKey: "kid.lesson3QuizTitle",
    descKey: "kid.lesson3QuizDesc",
    color: "#D97706", // Amber
    emoji: "🧸",
    scenarioKey: "kid.modeScenario3",
    options: [
      { key: "A", textKey: "kid.modeScenario3OptA", isCorrect: true },
      { key: "B", textKey: "kid.modeScenario3OptB", isCorrect: false },
      { key: "C", textKey: "kid.modeScenario3OptC", isCorrect: false },
    ],
    correctFeedbackKey: "kid.modeScenario3Feedback",
    wrongFeedbackKey: "kid.modeScenario3Wrong"
  }
];

export default function ModeSelectionScreen({
  userEmail: _userEmail,
  onSelectMode,
  onLogout,
  onChangeProfile,
}: ModeSelectionScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"dashboard" | "vtuber" | "lessons" | "parent">("dashboard");
  const [activeProfile, setActiveProfile] = useState<KidProfile | null>(null);
  
  // Active lesson quiz modal state
  const [currentQuiz, setCurrentQuiz] = useState<LessonQuiz | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  // Load profile state
  useEffect(() => {
    const profileStr = localStorage.getItem("kid_active_profile");
    if (profileStr) {
      setActiveProfile(JSON.parse(profileStr));
    }
  }, []);

  // Retrieve or initialize emotion diary logs
  const [diaryLogs, setDiaryLogs] = useState<any[]>(() => {
    const logs = localStorage.getItem("kid_emotion_diary");
    if (logs) return JSON.parse(logs);
    
    const defaultLogs = [
      { id: "1", emotion: t("kid.defaultLog1Emotion"), note: t("kid.defaultLog1Note"), date: t("kid.defaultLog1Date"), color: "#7C3AED" },
      { id: "2", emotion: t("kid.defaultLog2Emotion"), note: t("kid.defaultLog2Note"), date: t("kid.defaultLog2Date"), color: "#D97706" },
      { id: "3", emotion: t("kid.defaultLog3Emotion"), note: t("kid.defaultLog3Note"), date: t("kid.defaultLog3Date"), color: "#E11D48" }
    ];
    localStorage.setItem("kid_emotion_diary", JSON.stringify(defaultLogs));
    return defaultLogs;
  });

  const [timeLimit, setTimeLimit] = useState<number>(30); // Parent time limit setting

  // Handle selected quiz option
  const handleAnswerSubmit = (optionKey: string, isCorrect: boolean) => {
    if (isAnswered) return;
    
    setSelectedOption(optionKey);
    setIsAnswered(true);
    
    if (isCorrect) {
      setQuizFeedback(currentQuiz ? t(currentQuiz.correctFeedbackKey) : "");
      
      // Add points to child profile
      if (activeProfile) {
        const updatedProfile = {
          ...activeProfile,
          points: (activeProfile.points || 0) + 100
        };
        setActiveProfile(updatedProfile);
        localStorage.setItem("kid_active_profile", JSON.stringify(updatedProfile));
        
        // Update profile in list too
        const profilesStr = localStorage.getItem("kid_profiles") || "[]";
        const profiles = JSON.parse(profilesStr);
        const updatedProfiles = profiles.map((p: any) => p.id === activeProfile.id ? updatedProfile : p);
        localStorage.setItem("kid_profiles", JSON.stringify(updatedProfiles));
      }

      // Add to emotion logs
      const newLog = {
        id: Date.now().toString(),
        emotion: t("kid.emotionProudLabel"),
        note: `${t("kid.diaryItem1Title")}: ${currentQuiz ? t(currentQuiz.titleKey) : ""}`,
        date: t("kid.defaultLog1Date"),
        color: "#7C3AED"
      };
      const updatedLogs = [newLog, ...diaryLogs];
      setDiaryLogs(updatedLogs);
      localStorage.setItem("kid_emotion_diary", JSON.stringify(updatedLogs));

      toaster.create({
        title: t("kid.toastCorrectPlus100"),
        type: "success",
        duration: 2500
      });
    } else {
      setQuizFeedback(currentQuiz ? t(currentQuiz.wrongFeedbackKey) : "");
      toaster.create({
        title: t("kid.toastTryAgain"),
        type: "error",
        duration: 2000
      });
    }
  };

  const closeQuizModal = () => {
    setCurrentQuiz(null);
    setSelectedOption(null);
    setQuizFeedback(null);
    setIsAnswered(false);
  };

  const clearLogs = () => {
    localStorage.removeItem("kid_emotion_diary");
    setDiaryLogs([]);
    toaster.create({
      title: t("kid.toastDiaryCleared"),
      type: "info",
      duration: 2000
    });
  };

  const username = activeProfile ? activeProfile.name : "Bé Leo";
  const userAvatar = activeProfile ? activeProfile.avatar : "./images/leo-avatar-v2.png";
  const _userColor = activeProfile ? activeProfile.color : "#7C3AED";
  const _userPoints = activeProfile?.points || 150;

  return (
    <Flex width="100vw" height="100vh" bg="#F8FAFC" overflow="hidden" fontFamily="'Inter', system-ui, sans-serif">
      
      {/* LEFT SIDEBAR (Exact Eduler Mockup Style) */}
      <Flex
        width="240px"
        height="100%"
        bg="#FFFFFF"
        borderRight="1px solid"
        borderColor="#E2E8F0"
        flexDirection="column"
        justifyContent="space-between"
        p={5}
        flexShrink={0}
      >
        <VStack spaceY={5} alignItems="stretch" width="100%">
          
          {/* Logo & Collapse Header */}
          <HStack justifyContent="space-between" alignItems="center" px={1}>
            <HStack spaceX={2.5}>
              <Box
                w="32px"
                h="32px"
                borderRadius="lg"
                bg="#6366F1"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <span style={{ fontSize: "16px", color: "white", fontWeight: "bold" }}>📚</span>
              </Box>
              <Text fontSize="md" fontWeight="bold" color="#0F172A" letterSpacing="-0.01em">
                Eduler
              </Text>
            </HStack>
            <Box cursor="pointer" color="#94A3B8" _hover={{ color: "#0F172A" }}>
              {/* Collapse Icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 3v18" />
                <path d="m16 15-3-3 3-3" />
              </svg>
            </Box>
          </HStack>

          {/* Search Input Box */}
          <Box position="relative" width="100%">
            <Input
              placeholder={t("kid.searchPlaceholder")}
              size="sm"
              borderRadius="xl"
              borderColor="#E2E8F0"
              bg="#FFFFFF"
              pl="32px"
              pr="32px"
              h="36px"
              fontSize="xs"
              _focus={{ borderColor: "#6366F1", boxShadow: "none" }}
            />
            <Box position="absolute" left="10px" top="50%" transform="translateY(-50%)" color="#94A3B8">
              <FiSearch size={13} />
            </Box>
            <Box position="absolute" right="10px" top="50%" transform="translateY(-50%)" color="#94A3B8" cursor="pointer">
              <FiEdit3 size={13} />
            </Box>
          </Box>

          {/* Core Menu List */}
          <VStack spaceY={1} alignItems="stretch" width="100%">
            {/* Dashboard (Active - Pink/Blue Gradient active overlay as in mockup) */}
            <Box
              onClick={() => setActiveTab("dashboard")}
              cursor="pointer"
              borderRadius="xl"
              position="relative"
              h="38px"
              display="flex"
              alignItems="center"
              px={3.5}
              bg={activeTab === "dashboard" ? "transparent" : "transparent"}
              _hover={{ bg: "#F8FAFC" }}
            >
              {activeTab === "dashboard" && (
                <Box
                  position="absolute"
                  inset={0}
                  borderRadius="xl"
                  bgGradient="to-r(from rgba(224, 242, 254, 0.8), to rgba(253, 244, 245, 0.8))"
                  zIndex={0}
                />
              )}
              <HStack spaceX={3} zIndex={1}>
                <FiHome size={14} color={activeTab === "dashboard" ? "#6366F1" : "#64748B"} />
                <Text fontSize="xs" fontWeight={activeTab === "dashboard" ? "bold" : "semibold"} color={activeTab === "dashboard" ? "#0F172A" : "#64748B"}>
                  {t("kid.dashboard")}
                </Text>
              </HStack>
            </Box>

            {/* Documents Menu Item */}
            <Box
              onClick={() => setActiveTab("parent")}
              cursor="pointer"
              borderRadius="xl"
              position="relative"
              h="38px"
              display="flex"
              alignItems="center"
              px={3.5}
              bg={activeTab === "parent" ? "transparent" : "transparent"}
              _hover={{ bg: "#F8FAFC" }}
            >
              {activeTab === "parent" && (
                <Box
                  position="absolute"
                  inset={0}
                  borderRadius="xl"
                  bgGradient="to-r(from rgba(224, 242, 254, 0.8), to rgba(253, 244, 245, 0.8))"
                  zIndex={0}
                />
              )}
              <HStack spaceX={3} zIndex={1}>
                <FiFileText size={14} color={activeTab === "parent" ? "#6366F1" : "#64748B"} />
                <Text fontSize="xs" fontWeight={activeTab === "parent" ? "bold" : "semibold"} color={activeTab === "parent" ? "#0F172A" : "#64748B"}>
                  {t("kid.documents")}
                </Text>
              </HStack>
            </Box>
          </VStack>

          {/* Section: Study Tools */}
          <VStack spaceY={1} alignItems="stretch" width="100%">
            <HStack justifyContent="space-between" px={3.5} py={1}>
              <Text fontSize="10px" fontWeight="extrabold" color="#94A3B8" textTransform="uppercase" letterSpacing="0.05em">
                {t("kid.sectionStudyTools")}
              </Text>
              <Box color="#94A3B8" cursor="pointer"><FiPlus size={10} /></Box>
            </HStack>

            {/* AI Writer */}
            <Box
              onClick={() => setActiveTab("vtuber")}
              cursor="pointer"
              borderRadius="xl"
              position="relative"
              h="36px"
              display="flex"
              alignItems="center"
              px={3.5}
              _hover={{ bg: "#F8FAFC" }}
            >
              {activeTab === "vtuber" && (
                <Box
                  position="absolute"
                  inset={0}
                  borderRadius="xl"
                  bgGradient="to-r(from rgba(224, 242, 254, 0.8), to rgba(253, 244, 245, 0.8))"
                  zIndex={0}
                />
              )}
              <HStack spaceX={3} zIndex={1}>
                <FiEdit3 size={13} color={activeTab === "vtuber" ? "#6366F1" : "#64748B"} />
                <Text fontSize="xs" fontWeight={activeTab === "vtuber" ? "bold" : "semibold"} color={activeTab === "vtuber" ? "#0F172A" : "#64748B"}>
                  {t("kid.aiWriter")}
                </Text>
              </HStack>
            </Box>

            {/* AI Teachers */}
            <Box
              onClick={() => setActiveTab("lessons")}
              cursor="pointer"
              borderRadius="xl"
              position="relative"
              h="36px"
              display="flex"
              alignItems="center"
              px={3.5}
              _hover={{ bg: "#F8FAFC" }}
            >
              {activeTab === "lessons" && (
                <Box
                  position="absolute"
                  inset={0}
                  borderRadius="xl"
                  bgGradient="to-r(from rgba(224, 242, 254, 0.8), to rgba(253, 244, 245, 0.8))"
                  zIndex={0}
                />
              )}
              <HStack spaceX={3} zIndex={1}>
                <FiBookOpen size={13} color={activeTab === "lessons" ? "#6366F1" : "#64748B"} />
                <Text fontSize="xs" fontWeight={activeTab === "lessons" ? "bold" : "semibold"} color={activeTab === "lessons" ? "#0F172A" : "#64748B"}>
                  {t("kid.aiTeachers")}
                </Text>
              </HStack>
            </Box>

            {/* Assistants */}
            <HStack spaceX={3} h="36px" px={3.5} cursor="pointer" borderRadius="xl" _hover={{ bg: "#F8FAFC" }} color="#64748B">
              <FiUser size={13} />
              <Text fontSize="xs" fontWeight="semibold">{t("kid.assistants")}</Text>
            </HStack>

            {/* Analytics */}
            <HStack spaceX={3} h="36px" px={3.5} cursor="pointer" borderRadius="xl" _hover={{ bg: "#F8FAFC" }} color="#64748B">
              <FiActivity size={13} />
              <Text fontSize="xs" fontWeight="semibold">{t("kid.analytics")}</Text>
            </HStack>

            {/* Courses */}
            <HStack spaceX={3} h="36px" px={3.5} cursor="pointer" borderRadius="xl" _hover={{ bg: "#F8FAFC" }} color="#64748B">
              <FiGrid size={13} />
              <Text fontSize="xs" fontWeight="semibold">{t("kid.courses")}</Text>
            </HStack>

            {/* Events */}
            <HStack spaceX={3} h="36px" px={3.5} cursor="pointer" borderRadius="xl" _hover={{ bg: "#F8FAFC" }} color="#64748B">
              <FiCalendar size={13} />
              <Text fontSize="xs" fontWeight="semibold">{t("kid.events")}</Text>
            </HStack>
          </VStack>

          {/* Section: AI Voice Tools */}
          <VStack spaceY={1} alignItems="stretch" width="100%">
            <HStack justifyContent="space-between" px={3.5} py={1}>
              <Text fontSize="10px" fontWeight="extrabold" color="#94A3B8" textTransform="uppercase" letterSpacing="0.05em">
                {t("kid.sectionAiVoiceTools")}
              </Text>
              <Box color="#94A3B8" cursor="pointer"><FiPlus size={10} /></Box>
            </HStack>

            {/* Speech to Text */}
            <HStack spaceX={3} h="36px" px={3.5} cursor="pointer" borderRadius="xl" _hover={{ bg: "#F8FAFC" }} color="#64748B">
              <FiVolume2 size={13} />
              <Text fontSize="xs" fontWeight="semibold">{t("kid.speechToText")}</Text>
            </HStack>

            {/* Voiceover */}
            <HStack spaceX={3} h="36px" px={3.5} cursor="pointer" borderRadius="xl" _hover={{ bg: "#F8FAFC" }} color="#64748B">
              <FiVolume2 size={13} />
              <Text fontSize="xs" fontWeight="semibold">{t("kid.voiceover")}</Text>
            </HStack>
          </VStack>
        </VStack>

        {/* BOTTOM METRIC CARD (Words & Images Widget in Purple style) */}
        <VStack spaceY={4} alignItems="stretch" width="100%">
          
          {/* Progress Widget Card */}
          <Box p={4} bg="#F5F3FF" borderRadius="2xl" border="1px solid" borderColor="#DDD6FE">
            <VStack spaceY={2.5} alignItems="stretch">
              <HStack justifyContent="space-between" fontSize="11px" fontWeight="bold" color="#6D28D9">
                <Text>{t("kid.words")}</Text>
                <Text>9,959</Text>
              </HStack>
              <HStack justifyContent="space-between" fontSize="11px" fontWeight="bold" color="#6D28D9" mt={-1}>
                <Text>{t("kid.images")}</Text>
                <Text>10</Text>
              </HStack>

              {/* Progress bar */}
              <Box w="100%" bg="#E9D5FF" h="6px" borderRadius="full" overflow="hidden" mt={1}>
                <Box w="75%" bg="#7C3AED" h="100%" borderRadius="full" />
              </Box>

              <Button
                size="sm"
                bg="#FFFFFF"
                color="#7C3AED"
                border="1px solid"
                borderColor="#C084FC"
                borderRadius="full"
                h="32px"
                fontWeight="bold"
                fontSize="xs"
                _hover={{ bg: "#F3E8FF" }}
                mt={1}
              >
                {t("kid.upgrade")}
              </Button>
            </VStack>
          </Box>

          {/* Help & Support / Get 1 Month Free */}
          <VStack spaceY={1.5} px={1}>
            <HStack spaceX={3} py={1} cursor="pointer" color="#64748B" _hover={{ color: "#0F172A" }}>
              <FiBriefcase size={13} />
              <Text fontSize="xs" fontWeight="semibold">{t("kid.freeMonth")}</Text>
            </HStack>
            
            <HStack spaceX={3} py={1} cursor="pointer" color="#64748B" _hover={{ color: "#0F172A" }}>
              <FiMessageSquare size={13} />
              <Text fontSize="xs" fontWeight="semibold">{t("kid.helpSupport")}</Text>
            </HStack>

            <Box borderTop="1px solid" borderColor="#E2E8F0" my={1} />

            {/* Profile actions switcher */}
            <HStack justifyContent="space-between">
              <Button
                onClick={onChangeProfile}
                variant="ghost"
                size="xs"
                color="#64748B"
                fontSize="10px"
                h="28px"
                p={0}
                _hover={{ bg: "transparent", color: "#0F172A" }}
              >
                {t("kid.switchProfile")}
              </Button>
              <Button
                onClick={onLogout}
                variant="ghost"
                size="xs"
                color="#E11D48"
                fontSize="10px"
                h="28px"
                p={0}
                _hover={{ bg: "transparent", color: "#9F1239" }}
              >
                {t("kid.logout")}
              </Button>
            </HStack>
          </VStack>
        </VStack>
      </Flex>

      {/* MAIN CONTAINER */}
      <Flex flexGrow={1} flexDirection="column" overflow="hidden">
        
        {/* TOP BAR / HEADER (Exact Eduler Mockup Style) */}
        <Flex
          h="64px"
          bg="#FFFFFF"
          borderBottom="1px solid"
          borderColor="#E2E8F0"
          px={8}
          alignItems="center"
          justifyContent="space-between"
          flexShrink={0}
        >
          {/* Page Title */}
          <Heading size="lg" color="#0F172A" fontWeight="bold" letterSpacing="-0.02em">
            {t("kid.dashboard")}
          </Heading>

          {/* Search bar inside header */}
          <Box position="relative" width="280px">
            <Input
              placeholder={t("kid.searchAnything")}
              size="sm"
              borderRadius="xl"
              borderColor="#E2E8F0"
              bg="#F1F5F9"
              pl="34px"
              pr="45px"
              h="36px"
              fontSize="xs"
              border="none"
              _focus={{ bg: "#E2E8F0", boxShadow: "none" }}
            />
            <Box position="absolute" left="12px" top="50%" transform="translateY(-50%)" color="#94A3B8">
              <FiSearch size={13} />
            </Box>
            {/* Keyboard shortcut label badge */}
            <HStack
              position="absolute"
              right="10px"
              top="50%"
              transform="translateY(-50%)"
              spaceX={0.5}
              px={1.5}
              py={0.5}
              bg="#FFFFFF"
              borderRadius="md"
              border="1px solid"
              borderColor="#E2E8F0"
              fontSize="9px"
              fontWeight="bold"
              color="#94A3B8"
            >
              <Text>⌘</Text>
              <Text>F</Text>
            </HStack>
          </Box>

          {/* Header Action Menu Profile details */}
          <HStack spaceX={4.5}>
            {/* Mail Box Button */}
            <Box
              cursor="pointer"
              w="36px"
              h="36px"
              borderRadius="full"
              border="1px solid"
              borderColor="#E2E8F0"
              display="flex"
              alignItems="center"
              justifyContent="center"
              color="#64748B"
              _hover={{ bg: "#F1F5F9", color: "#0F172A" }}
            >
              <FiMail size={15} />
            </Box>

            {/* Bell Box Button */}
            <Box
              cursor="pointer"
              w="36px"
              h="36px"
              borderRadius="full"
              border="1px solid"
              borderColor="#E2E8F0"
              display="flex"
              alignItems="center"
              justifyContent="center"
              color="#64748B"
              position="relative"
              _hover={{ bg: "#F1F5F9", color: "#0F172A" }}
            >
              <FiBell size={15} />
              {/* Notification Badge Dot */}
              <Box position="absolute" top="10px" right="10px" w="6px" h="6px" borderRadius="full" bg="#E11D48" />
            </Box>

            {/* Divider bar */}
            <Box borderLeft="1px solid" borderColor="#E2E8F0" h="24px" />

            {/* Profile Dropdown card */}
            <HStack spaceX={2.5} cursor="pointer">
              <Box
                w="36px"
                h="36px"
                borderRadius="full"
                overflow="hidden"
                border="1.5px solid"
                borderColor="#E2E8F0"
              >
                <img src={userAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </Box>
              <VStack spaceY={0} alignItems="flex-start" display={{ base: "none", md: "flex" }}>
                <Text fontSize="xs" fontWeight="bold" color="#0F172A">
                  {username}
                </Text>
                <Text fontSize="9px" color="#94A3B8" fontWeight="semibold" mt={-0.5}>
                  {t("kid.student")}
                </Text>
              </VStack>
              <FiChevronDown size={12} color="#94A3B8" />
            </HStack>
          </HStack>
        </Flex>

        {/* WORKSPACE CONTENT SCROLL */}
        <Box flexGrow={1} overflowY="auto" p={8} bg="#F8FAFC">
          
          <AnimatePresence mode="wait">
            
            {/* VIEW 1: DASHBOARD TAB */}
            {activeTab === "dashboard" && (
              <MotionBox
                key="dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.3 }}
                width="100%"
              >
                {/* Horizontal pill list tag filters */}
                <HStack spaceX={2} mb={6} overflowX="auto" pb={1} css={{ "&::-webkit-scrollbar": { display: "none" } }}>
                  <Box px={3.5} py={1.5} bg="#7C3AED" color="#FFFFFF" borderRadius="full" fontSize="xs" fontWeight="bold" cursor="pointer">
                    {t("kid.all")}
                  </Box>
                  {["tagAiAssistant", "tagYourPlan", "tagFriends", "tagRecent", "documents", "tagTemplates", "tagOverview"].map((tagKey) => (
                    <Box
                      key={tagKey}
                      px={3.5}
                      py={1.5}
                      bg="#FFFFFF"
                      color="#64748B"
                      border="1px solid"
                      borderColor="#E2E8F0"
                      borderRadius="full"
                      fontSize="xs"
                      fontWeight="bold"
                      cursor="pointer"
                      display="flex"
                      alignItems="center"
                      _hover={{ borderColor: "#7C3AED", color: "#7C3AED" }}
                    >
                      <span style={{ color: "#7C3AED", marginRight: "5px", fontSize: "10px" }}>●</span>
                      {t(`kid.${tagKey}`)}
                    </Box>
                  ))}
                </HStack>

                {/* 3 Columns Layout exactly matching Eduler Grid */}
                <SimpleGrid columns={{ base: 1, xl: 3 }} spaceX={{ base: 0, xl: 6 }} spaceY={{ base: 6, xl: 0 }} alignItems="flex-start">
                  
                  {/* LEFT COLUMN: Hero Greeting Card + Recently Launched Section + Documents List (Span 2) */}
                  <VStack spaceY={6} alignItems="stretch" gridColumn={{ xl: "span 2" }}>
                    
                    {/* Hero Welcome Card */}
                    <Box
                      p={7}
                      bgGradient="to-r(from #FFFFFF, to #F5F3FF)"
                      borderRadius="3xl"
                      border="1px solid"
                      borderColor="#E2E8F0"
                      boxShadow="xs"
                      position="relative"
                    >
                      <VStack spaceY={4} alignItems="flex-start">
                        <Heading size="xl" color="#0F172A" fontWeight="bold" letterSpacing="-0.02em">
                          {t("kid.heroGreeting")}
                        </Heading>
                        
                        {/* Search bar inside Hero box */}
                        <Box position="relative" width="100%" maxW="480px">
                          <Input
                            placeholder={t("kid.searchTemplatesDocuments")}
                            size="sm"
                            borderRadius="2xl"
                            borderColor="#DDD6FE"
                            bg="#FFFFFF"
                            pl="16px"
                            pr="54px"
                            h="44px"
                            fontSize="xs"
                            _focus={{ borderColor: "#7C3AED", boxShadow: "none" }}
                          />
                          <Box
                            position="absolute"
                            right="6px"
                            top="50%"
                            transform="translateY(-50%)"
                            w="32px"
                            h="32px"
                            borderRadius="full"
                            bgGradient="to-r(from #6366F1, to #EC4899)"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            color="white"
                            cursor="pointer"
                            _hover={{ filter: "brightness(1.1)" }}
                          >
                            <span style={{ fontSize: "12px" }}>✦</span>
                          </Box>
                        </Box>

                        {/* Recommendation pills */}
                        <HStack spaceX={2}>
                          {["pillInvoiceTemplate", "pillAgreement", "pillStoryOutline"].map((pillKey) => (
                            <Box
                              key={pillKey}
                              px={3.5}
                              py={1.5}
                              bg="#FFFFFF"
                              color="#475569"
                              border="1px solid"
                              borderColor="#E2E8F0"
                              borderRadius="full"
                              fontSize="11px"
                              fontWeight="bold"
                              cursor="pointer"
                              _hover={{ borderColor: "#7C3AED", color: "#7C3AED" }}
                            >
                              {t(`kid.${pillKey}`)}
                            </Box>
                          ))}
                        </HStack>
                      </VStack>
                      {/* Mascot head floating element */}
                      <Box position="absolute" right="30px" top="50%" transform="translateY(-50%)" display={{ base: "none", md: "block" }}>
                        <img src={momoMascot} alt="" style={{ width: "95px", height: "auto", opacity: 0.8 }} />
                      </Box>
                    </Box>

                    {/* Recently Launched Cards Section */}
                    <Box>
                      <HStack justifyContent="space-between" mb={4}>
                        <Heading size="xs" color="#0F172A" fontWeight="bold" letterSpacing="-0.01em">
                          {t("kid.recentlyLaunched")}
                        </Heading>
                        <Button
                          onClick={() => setActiveTab("lessons")}
                          variant="ghost"
                          color="#64748B"
                          fontWeight="bold"
                          fontSize="xs"
                          _hover={{ bg: "transparent", color: "#0F172A" }}
                        >
                          {t("kid.viewAll")}
                        </Button>
                      </HStack>

                      {/* 3 cards grid layout matching mockup */}
                      <SimpleGrid columns={{ base: 1, md: 3 }} spaceX={4} spaceY={4}>
                        {LESSONS.map((lesson, idx) => {
                          const badgeBg = idx === 0 ? "#EDE9FE" : idx === 1 ? "#FFE4E6" : "#FEF3C7";
                          const badgeColor = idx === 0 ? "#7C3AED" : idx === 1 ? "#E11D48" : "#D97706";
                          
                          return (
                            <Box
                              key={lesson.id}
                              p={5}
                              bg="#FFFFFF"
                              border="1px solid"
                              borderColor="#E2E8F0"
                              borderRadius="2xl"
                              boxShadow="xs"
                              display="flex"
                              flexDirection="column"
                              justifyContent="space-between"
                              h="190px"
                              _hover={{ transform: "translateY(-3px)", boxShadow: "sm" }}
                              transition="all 0.2s"
                            >
                              <VStack spaceY={2.5} alignItems="flex-start" mb={4} width="100%">
                                <HStack justifyContent="space-between" width="100%" alignItems="center">
                                  <Box
                                    px={2.5}
                                    py={0.5}
                                    bg={badgeBg}
                                    color={badgeColor}
                                    borderRadius="lg"
                                    fontSize="9px"
                                    fontWeight="extrabold"
                                    textTransform="uppercase"
                                    letterSpacing="0.02em"
                                  >
                                    {t(lesson.titleKey)}
                                  </Box>
                                  <Box color="#94A3B8" cursor="pointer">•••</Box>
                                </HStack>

                                <Heading size="xs" color="#0F172A" fontWeight="bold" lineHeight="short">
                                  {t(lesson.descKey)}
                                </Heading>
                              </VStack>

                              <HStack justifyContent="space-between" width="100%">
                                <HStack spaceX={1.5} color="#94A3B8">
                                  <FiCalendar size={11} />
                                  <Text fontSize="10px" fontWeight="semibold">{t("kid.august2024")}</Text>
                                </HStack>

                                <HStack
                                  onClick={() => setCurrentQuiz(lesson)}
                                  cursor="pointer"
                                  spaceX={1.5}
                                  color="#7C3AED"
                                  fontWeight="bold"
                                  fontSize="10px"
                                  _hover={{ color: "#6D28D9" }}
                                >
                                  {t("kid.seeMore")}
                                  <Box
                                    w="16px"
                                    h="16px"
                                    borderRadius="full"
                                    bg="#7C3AED"
                                    color="white"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                    fontSize="8px"
                                  >
                                    ➔
                                  </Box>
                                </HStack>
                              </HStack>
                            </Box>
                          );
                        })}
                      </SimpleGrid>
                    </Box>

                    {/* Documents List Section */}
                    <Box bg="#FFFFFF" p={5} borderRadius="3xl" border="1px solid" borderColor="#E2E8F0" boxShadow="xs">
                      <HStack justifyContent="space-between" mb={5}>
                        <Heading size="xs" color="#0F172A" fontWeight="bold">
                          {t("kid.documents")}
                        </Heading>
                        <HStack spaceX={3}>
                          <Button
                            size="xs"
                            variant="outline"
                            borderColor="#E2E8F0"
                            borderRadius="xl"
                            color="#64748B"
                            fontWeight="bold"
                            bg="white"
                            _hover={{ bg: "#F8FAFC" }}
                          >
                            <FiPlus size={11} style={{ marginRight: "4px" }} /> {t("kid.newFolder")}
                          </Button>
                          <Box color="#64748B" cursor="pointer">•••</Box>
                        </HStack>
                      </HStack>

                      {/* Documents rows */}
                      <VStack spaceY={0} alignItems="stretch">
                        {diaryLogs.map((log, index) => {
                          const iconColor = index === 0 ? "#7C3AED" : index === 1 ? "#D97706" : "#E11D48";
                          const iconBg = index === 0 ? "#F5F3FF" : index === 1 ? "#FEF3C7" : "#FFE4E6";
                          
                          return (
                            <Box
                              key={log.id}
                              py={3.5}
                              borderBottom={index === diaryLogs.length - 1 ? "none" : "1px solid"}
                              borderColor="#F1F5F9"
                              display="flex"
                              alignItems="center"
                              justifyContent="space-between"
                            >
                              <HStack spaceX={3.5}>
                                <Box
                                  w="34px"
                                  h="34px"
                                  borderRadius="full"
                                  bg={iconBg}
                                  color={iconColor}
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                >
                                  <FiFileText size={14} />
                                </Box>
                                <VStack spaceY={0.5} alignItems="flex-start">
                                  <Text fontSize="xs" fontWeight="bold" color="#0F172A">
                                    {log.emotion}
                                  </Text>
                                  <Text fontSize="10px" color="#64748B" maxW="380px" lineClamp={1}>
                                    {log.note}
                                  </Text>
                                </VStack>
                              </HStack>

                              <HStack spaceX={3} color="#94A3B8">
                                <FiCalendar size={11} />
                                <Text fontSize="10px" fontWeight="semibold">{log.date}</Text>
                              </HStack>
                            </Box>
                          );
                        })}
                      </VStack>

                      {/* Full-width purple Show All footer button */}
                      <Box mt={4} pt={1}>
                        <Button
                          w="100%"
                          h="34px"
                          bg="#F5F3FF"
                          color="#7C3AED"
                          borderRadius="xl"
                          fontSize="xs"
                          fontWeight="bold"
                          _hover={{ bg: "#EDE9FE" }}
                        >
                          {t("kid.showAll")}
                        </Button>
                      </Box>
                    </Box>

                  </VStack>

                  {/* RIGHT COLUMN: Course Stats + Unlock AI + Assistants List + Learning Schedule calendar */}
                  <VStack spaceY={6} alignItems="stretch">
                    
                    {/* Personalized Course Stats */}
                    <Box p={5} bg="#FFFFFF" borderRadius="3xl" border="1px solid" borderColor="#E2E8F0" boxShadow="xs">
                      <Heading size="xs" color="#0F172A" fontWeight="bold" mb={3}>
                        {t("kid.personalizedCourse")}
                      </Heading>

                      <HStack spaceX={1.5} color="#64748B" mb={4}>
                        <FiClock size={11} />
                        <Text fontSize="10px" fontWeight="bold">{t("kid.courseTotalTime")}</Text>
                      </HStack>

                      {/* Tri-color segment progress bar */}
                      <Box w="100%" h="6px" bg="#F1F5F9" borderRadius="full" overflow="hidden" display="flex" mb={4}>
                        <Box w="40%" bg="#7C3AED" h="100%" /> {/* Violet segment */}
                        <Box w="35%" bg="#06B6D4" h="100%" /> {/* Cyan segment */}
                        <Box w="25%" bg="#F59E0B" h="100%" /> {/* Yellow segment */}
                      </Box>

                      {/* Radio dot indicators */}
                      <HStack spaceX={4} fontSize="9px" fontWeight="bold" color="#64748B" mb={4}>
                        <HStack spaceX={1}>
                          <Box w="6px" h="6px" borderRadius="full" bg="#7C3AED" />
                          <Text>{t("kid.segPause")}</Text>
                        </HStack>
                        <HStack spaceX={1}>
                          <Box w="6px" h="6px" borderRadius="full" bg="#06B6D4" />
                          <Text>{t("kid.segActive")}</Text>
                        </HStack>
                        <HStack spaceX={1}>
                          <Box w="6px" h="6px" borderRadius="full" bg="#F59E0B" />
                          <Text>{t("kid.segExtra")}</Text>
                        </HStack>
                      </HStack>

                      <Text fontSize="10px" color="#94A3B8" lineHeight="relaxed">
                        {t("kid.courseDesc")}
                      </Text>
                    </Box>

                    {/* Unlock AI Card */}
                    <Box p={5} bg="#FFFFFF" borderRadius="3xl" border="1px solid" borderColor="#E2E8F0" boxShadow="xs">
                      <Heading size="xs" color="#0F172A" fontWeight="bold" mb={4}>
                        {t("kid.unlockAiTitle")}
                      </Heading>

                      <SimpleGrid columns={2} spaceY={2.5} mb={4}>
                        {(t("kid.unlockBullets", { returnObjects: true }) as string[]).map((bullet) => (
                          <HStack key={bullet} spaceX={1.5} alignItems="center">
                            <Box color="#7C3AED">✔</Box>
                            <Text fontSize="9px" fontWeight="bold" color="#475569">{bullet}</Text>
                          </HStack>
                        ))}
                      </SimpleGrid>

                      <HStack
                        cursor="pointer"
                        spaceX={1.5}
                        color="#7C3AED"
                        fontWeight="bold"
                        fontSize="10px"
                        _hover={{ color: "#6D28D9" }}
                      >
                        <Text>{t("kid.seeMore")}</Text>
                        <Box
                          w="16px"
                          h="16px"
                          borderRadius="full"
                          bg="#7C3AED"
                          color="white"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          fontSize="8px"
                        >
                          ➔
                        </Box>
                      </HStack>
                    </Box>

                    {/* Assistants / Let's write a Column layout */}
                    <Box p={5} bg="#FFFFFF" borderRadius="3xl" border="1px solid" borderColor="#E2E8F0" boxShadow="xs">
                      <SimpleGrid columns={2} spaceX={4}>
                        
                        {/* Column 1: Assistants */}
                        <VStack spaceY={3} alignItems="stretch">
                          <Box alignSelf="flex-start" px={2} py={0.5} bg="#F5F3FF" color="#7C3AED" borderRadius="lg" fontSize="8px" fontWeight="extrabold" textTransform="uppercase">
                            {t("kid.assistants")}
                          </Box>
                          <Heading size="xs" color="#0F172A" fontWeight="bold" mt={1}>{t("kid.chatWith")}...</Heading>
                          
                          <VStack spaceY={2} alignItems="stretch" fontSize="10px" fontWeight="semibold" color="#475569">
                            <HStack spaceX={1.5} cursor="pointer" _hover={{ color: "#7C3AED" }}>
                              <span style={{ color: "#7C3AED" }}>👤</span>
                              <Text>{t("kid.assistant1Name")}</Text>
                            </HStack>
                            <HStack spaceX={1.5} cursor="pointer" _hover={{ color: "#E11D48" }}>
                              <span style={{ color: "#E11D48" }}>👤</span>
                              <Text>{t("kid.assistant2Name")}</Text>
                            </HStack>
                            <HStack spaceX={1.5} cursor="pointer" _hover={{ color: "#06B6D4" }}>
                              <span style={{ color: "#06B6D4" }}>👤</span>
                              <Text>{t("kid.assistant3Name")}</Text>
                            </HStack>
                          </VStack>

                          <HStack
                            cursor="pointer"
                            spaceX={1.5}
                            color="#7C3AED"
                            fontWeight="bold"
                            fontSize="9px"
                            mt={2}
                          >
                            <Text>{t("kid.seeMore")}</Text>
                            <Box w="12px" h="12px" borderRadius="full" bg="#7C3AED" color="white" display="flex" alignItems="center" justifyContent="center" fontSize="6px">➔</Box>
                          </HStack>
                        </VStack>

                        {/* Column 2: Let's write a... */}
                        <VStack spaceY={3} alignItems="stretch" borderLeft="1px solid" borderColor="#F1F5F9" pl={4}>
                          <Heading size="xs" color="#0F172A" fontWeight="bold" mt={4}>{t("kid.letsWrite")}...</Heading>
                          
                          <VStack spaceY={2} alignItems="stretch" fontSize="10px" fontWeight="semibold" color="#475569">
                            <HStack spaceX={1.5} cursor="pointer" _hover={{ color: "#6366F1" }}>
                              <FiFileText size={11} color="#6366F1" />
                              <Text>{t("kid.lessonPlan")}</Text>
                            </HStack>
                            <HStack spaceX={1.5} cursor="pointer" _hover={{ color: "#F59E0B" }}>
                              <FiFileText size={11} color="#F59E0B" />
                              <Text>{t("kid.worksheet")}</Text>
                            </HStack>
                            <HStack spaceX={1.5} cursor="pointer" _hover={{ color: "#10B981" }}>
                              <FiFileText size={11} color="#10B981" />
                              <Text>{t("kid.newsletter")}</Text>
                            </HStack>
                          </VStack>
                        </VStack>

                      </SimpleGrid>
                    </Box>

                    {/* Learning Schedule Calendar widget */}
                    <Box p={5} bg="#FFFFFF" borderRadius="3xl" border="1px solid" borderColor="#E2E8F0" boxShadow="xs">
                      
                      <HStack justifyContent="space-between" mb={4}>
                        <Heading size="xs" color="#0F172A" fontWeight="bold">
                          {t("kid.learningSchedule")}
                        </Heading>
                        <Button
                          size="xs"
                          variant="outline"
                          borderColor="#E2E8F0"
                          borderRadius="xl"
                          color="#64748B"
                          fontWeight="bold"
                          bg="white"
                          h="26px"
                          _hover={{ bg: "#F8FAFC" }}
                        >
                          <FiCalendar size={11} style={{ marginRight: "4px" }} /> {t("kid.monthly")}
                        </Button>
                      </HStack>

                      {/* Month arrow selector */}
                      <HStack justifyContent="space-between" mb={4}>
                        <Text fontSize="11px" fontWeight="extrabold" color="#0F172A">
                          {t("kid.august2024")}
                        </Text>
                        <HStack spaceX={1}>
                          <Box cursor="pointer" p={1} borderRadius="md" _hover={{ bg: "#F1F5F9" }}><FiChevronLeft size={12} /></Box>
                          <Box cursor="pointer" p={1} borderRadius="md" _hover={{ bg: "#F1F5F9" }}><FiChevronRight size={12} /></Box>
                        </HStack>
                      </HStack>

                      {/* Week calendar block Mon-Sun */}
                      <HStack justifyContent="space-between" css={{ fontSize: "9px" }} fontWeight="bold" textAlign="center" mb={5} px={1}>
                        <Box><Text color="#94A3B8">{t("kid.dayMon")}</Text><Text color="#0F172A" mt={1}>15</Text></Box>
                        <Box><Text color="#94A3B8">{t("kid.dayTue")}</Text><Text color="#0F172A" mt={1}>16</Text></Box>
                        <Box><Text color="#94A3B8">{t("kid.dayWed")}</Text><Text color="#0F172A" mt={1}>17</Text></Box>
                        <Box><Text color="#94A3B8">{t("kid.dayThu")}</Text><Text color="#0F172A" mt={1}>18</Text></Box>
                        
                        {/* Active Purple Highlight day */}
                        <Box
                          bg="#7C3AED"
                          color="white"
                          w="28px"
                          h="28px"
                          borderRadius="full"
                          display="flex"
                          flexDirection="column"
                          alignItems="center"
                          justifyContent="center"
                          mt={-1}
                        >
                          <Text fontSize="7px" fontWeight="bold">{t("kid.dayFri")}</Text>
                          <Text fontSize="9px" fontWeight="extrabold" mt={-0.5}>19</Text>
                        </Box>
                        
                        <Box><Text color="#94A3B8">{t("kid.daySat")}</Text><Text color="#0F172A" mt={1}>20</Text></Box>
                        <Box><Text color="#94A3B8">{t("kid.daySun")}</Text><Text color="#0F172A" mt={1}>21</Text></Box>
                      </HStack>

                      {/* Today list with event card */}
                      <VStack spaceY={2.5} alignItems="stretch">
                        <Text fontSize="10px" fontWeight="extrabold" color="#94A3B8" textTransform="uppercase" letterSpacing="0.05em">
                          {t("kid.today")}
                        </Text>
                        
                        {/* Event Card */}
                        <Box p={4} bg="#F5F3FF" borderRadius="2xl" border="1px solid" borderColor="#DDD6FE">
                          <HStack justifyContent="space-between" alignItems="flex-start">
                            <VStack spaceY={1.5} alignItems="flex-start">
                              <Heading size="xs" color="#6D28D9" fontWeight="bold" letterSpacing="-0.01em">
                                {t("kid.figmaDesignViews")}
                              </Heading>
                              <HStack spaceX={1.5} color="#7C3AED">
                                <FiClock size={11} />
                                <Text fontSize="10px" fontWeight="bold">12:00 - 01:00 PM</Text>
                              </HStack>

                              {/* Stacked avatars */}
                              <HStack spaceX={-2} mt={1}>
                                <Box w="20px" h="20px" borderRadius="full" border="1.5px solid white" overflow="hidden">
                                  <img src="./images/leo-avatar-v2.png" alt="" />
                                </Box>
                                <Box w="20px" h="20px" borderRadius="full" border="1.5px solid white" overflow="hidden">
                                  <img src="./images/nana-avatar-v2.png" alt="" />
                                </Box>
                              </HStack>
                            </VStack>

                            <Button
                              onClick={() => setActiveTab("vtuber")}
                              size="xs"
                              bg="#7C3AED"
                              color="white"
                              borderRadius="xl"
                              fontWeight="bold"
                              _hover={{ bg: "#6D28D9" }}
                              px={3.5}
                            >
                              {t("kid.join")}
                            </Button>
                          </HStack>
                        </Box>
                      </VStack>
                    </Box>

                  </VStack>

                </SimpleGrid>
              </MotionBox>
            )}

            {/* VIEW 2: VTUBER TAB (Launch Interface) */}
            {activeTab === "vtuber" && (
              <MotionBox
                key="vtuber"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.3 }}
                width="100%"
              >
                <Flex width="100%" justifyContent="center" py={8}>
                  <Box
                    bg="#FFFFFF"
                    border="1px solid"
                    borderColor="#E2E8F0"
                    borderRadius="3xl"
                    p={8}
                    maxW="600px"
                    width="100%"
                    textAlign="center"
                    boxShadow="sm"
                    position="relative"
                    overflow="hidden"
                  >
                    <Box position="absolute" top={0} left={0} width="100%" height="8px" bg="#7C3AED" />

                    <VStack spaceY={6} alignItems="center">
                      <MotionBox
                        animate={{
                          y: [0, -8, 0],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <img
                          src={momoMascot}
                          alt={t("kid.momoMascot")}
                          style={{
                            width: "200px",
                            height: "auto",
                            filter: "drop-shadow(0 20px 25px rgba(124, 58, 237, 0.15))",
                          }}
                        />
                      </MotionBox>

                      <VStack spaceY={2}>
                        <Heading size="xl" color="#7C3AED" fontWeight="bold">
                          {t("kid.modeMomoTitle")}
                        </Heading>
                        <Text color="#475569" fontSize="sm" maxW="450px">
                          {t("kid.modeMomoDesc")}
                        </Text>
                      </VStack>

                      <Box bg="#F5F3FF" p={4.5} borderRadius="2xl" border="1px solid" borderColor="#DDD6FE" width="100%" textAlign="left">
                        <Heading size="xs" color="#7C3AED" mb={2.5} fontWeight="bold">
                          {t("kid.instructionsForChild")}
                        </Heading>
                        <VStack spaceY={1.5} alignItems="flex-start" fontSize="xs" color="#6D28D9">
                          <Text>{t("kid.instructionStep1")}</Text>
                          <Text>{t("kid.instructionStep2")}</Text>
                          <Text>{t("kid.instructionStep3")}</Text>
                        </VStack>
                      </Box>

                      <Button
                        onClick={() => onSelectMode("vtuber")}
                        size="lg"
                        w="100%"
                        bg="#7C3AED"
                        color="white"
                        borderRadius="2xl"
                        fontWeight="bold"
                        _hover={{ bg: "#6D28D9" }}
                        shadow="md"
                        h="50px"
                      >
                        {t("kid.startChattingBtn")} <FiChevronRight style={{ marginLeft: "4px" }} />
                      </Button>
                    </VStack>
                  </Box>
                </Flex>
              </MotionBox>
            )}

            {/* VIEW 3: LESSONS TAB (Interactive courses quizzes) */}
            {activeTab === "lessons" && (
              <MotionBox
                key="lessons"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.3 }}
                width="100%"
              >
                <Heading size="md" color="#1E293B" fontWeight="bold" mb={2}>
                  {t("kid.aiTeachers")}
                </Heading>
                <Text color="#64748B" fontSize="sm" mb={6}>
                  {t("kid.coursesDesc", { name: username })}
                </Text>

                <SimpleGrid columns={{ base: 1, md: 3 }} spaceX={6} spaceY={6}>
                  {LESSONS.map((lesson) => (
                    <Box
                      key={lesson.id}
                      bg="#FFFFFF"
                      border="1px solid"
                      borderColor="#E2E8F0"
                      borderRadius="3xl"
                      p={6}
                      height="190px"
                      display="flex"
                      flexDirection="column"
                      justifyContent="space-between"
                      position="relative"
                      overflow="hidden"
                      _hover={{ transform: "translateY(-4px)", borderColor: lesson.color, boxShadow: "sm" }}
                      transition="all 0.2s"
                    >
                      <Box position="absolute" top={0} left={0} width="100%" height="6px" bg={lesson.color} />

                      <VStack spaceY={3} alignItems="flex-start" mb={4}>
                        <Flex
                          w="44px"
                          h="44px"
                          borderRadius="2xl"
                          bg={`${lesson.color}15`}
                          alignItems="center"
                          justifyContent="center"
                          fontSize="2xl"
                        >
                          {lesson.emoji}
                        </Flex>

                        <Heading size="xs" color="#1E293B" fontWeight="bold">
                          {t(lesson.titleKey)}
                        </Heading>
                      </VStack>

                      <Button
                        onClick={() => setCurrentQuiz(lesson)}
                        width="100%"
                        size="sm"
                        borderRadius="xl"
                        bg={lesson.color}
                        color="white"
                        fontWeight="bold"
                        _hover={{ filter: "brightness(0.9)" }}
                      >
                        {t("kid.rec1Button")}
                      </Button>
                    </Box>
                  ))}
                </SimpleGrid>
              </MotionBox>
            )}

            {/* VIEW 4: DOCUMENTS / PARENT TAB (Reports & controls) */}
            {activeTab === "parent" && (
              <MotionBox
                key="parent"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.3 }}
                width="100%"
              >
                <Heading size="md" color="#1E293B" fontWeight="bold" mb={2}>
                  {t("kid.documentsParentReports")}
                </Heading>
                <Text color="#64748B" fontSize="sm" mb={6}>
                  {t("kid.documentsDesc")}
                </Text>

                <SimpleGrid columns={{ base: 1, lg: 2 }} spaceX={6} spaceY={6}>
                  
                  {/* Left Column: Stats & Recommendations */}
                  <VStack spaceY={6} alignItems="stretch">
                    
                    {/* Emotion percentage stats */}
                    <Box p={6} bg="#FFFFFF" borderRadius="3xl" border="1px solid" borderColor="#E2E8F0" boxShadow="xs">
                      <Heading size="xs" color="#0F172A" fontWeight="bold" mb={4}>
                        {t("kid.weeklyTrendChart")}
                      </Heading>

                      <VStack spaceY={4} alignItems="stretch">
                        <Box>
                          <HStack justifyContent="space-between" mb={1} fontSize="xs">
                            <Text fontWeight="semibold" color="#475569">{t("kid.emotionHappyLabel")}</Text>
                            <Text fontWeight="extrabold" color="#7C3AED">{t("kid.emotionHappyTime")}</Text>
                          </HStack>
                          <Box w="100%" bg="#F1F5F9" h="8px" borderRadius="full" overflow="hidden">
                            <Box w="60%" bg="#7C3AED" h="100%" borderRadius="full" />
                          </Box>
                        </Box>

                        <Box>
                          <HStack justifyContent="space-between" mb={1} fontSize="xs">
                            <Text fontWeight="semibold" color="#475569">{t("kid.emotionProudLabel")}</Text>
                            <Text fontWeight="extrabold" color="#0EA5E9">{t("kid.emotionProudTime")}</Text>
                          </HStack>
                          <Box w="100%" bg="#F1F5F9" h="8px" borderRadius="full" overflow="hidden">
                            <Box w="25%" bg="#0EA5E9" h="100%" borderRadius="full" />
                          </Box>
                        </Box>

                        <Box>
                          <HStack justifyContent="space-between" mb={1} fontSize="xs">
                            <Text fontWeight="semibold" color="#475569">{t("kid.emotionAnxiousLabel")}</Text>
                            <Text fontWeight="extrabold" color="#D97706">{t("kid.emotionAnxiousTime")}</Text>
                          </HStack>
                          <Box w="100%" bg="#F1F5F9" h="8px" borderRadius="full" overflow="hidden">
                            <Box w="15%" bg="#D97706" h="100%" borderRadius="full" />
                          </Box>
                        </Box>
                      </VStack>
                    </Box>

                    {/* AI Advisory */}
                    <Box p={6} bg="#F5F3FF" borderRadius="3xl" border="1px solid" borderColor="#DDD6FE">
                      <VStack spaceY={3} alignItems="flex-start">
                        <HStack spaceX={2} color="#6D28D9">
                          <FiSmile size={18} />
                          <Heading size="xs" fontWeight="bold">
                            {t("kid.parentAdvisorTitle")}
                          </Heading>
                        </HStack>

                        <Text fontSize="xs" color="#6D28D9" lineHeight="tall">
                          {t("kid.parentAdvisorAdvice", { name: username })}
                        </Text>
                      </VStack>
                    </Box>

                  </VStack>

                  {/* Right Column: Settings */}
                  <VStack spaceY={6} alignItems="stretch">
                    
                    {/* Time limit controls */}
                    <Box p={6} bg="#FFFFFF" borderRadius="3xl" border="1px solid" borderColor="#E2E8F0" boxShadow="xs">
                      <Heading size="xs" color="#0F172A" fontWeight="bold" mb={4}>
                        {t("kid.timePrivacyTitle")}
                      </Heading>

                      <VStack spaceY={5} alignItems="stretch">
                        <Box>
                          <HStack justifyContent="space-between" mb={2}>
                            <HStack spaceX={2} color="#475569">
                              <FiClock size={13} />
                              <Text fontSize="xs" fontWeight="semibold">{t("kid.usageTimeLimit")}</Text>
                            </HStack>
                            <Text fontSize="xs" fontWeight="bold" color="#7C3AED">{t("kid.minutesValue", { count: timeLimit })}</Text>
                          </HStack>
                          
                          <input
                            type="range"
                            min="10"
                            max="60"
                            step="5"
                            value={timeLimit}
                            onChange={(e) => setTimeLimit(Number(e.target.value))}
                            style={{ width: "100%", cursor: "pointer", accentColor: "#7C3AED" }}
                          />
                        </Box>

                        <VStack spaceY={3} alignItems="stretch" pt={4} borderTop="1px solid" borderColor="#F1F5F9">
                          <HStack justifyContent="space-between" fontSize="xs">
                            <Text fontWeight="semibold" color="#475569">{t("kid.emailWeeklyReport")}</Text>
                            <input type="checkbox" defaultChecked style={{ accentColor: "#7C3AED" }} />
                          </HStack>

                          <HStack justifyContent="space-between" fontSize="xs">
                            <Text fontWeight="semibold" color="#475569">{t("kid.alertDifficultyLabel")}</Text>
                            <input type="checkbox" defaultChecked style={{ accentColor: "#7C3AED" }} />
                          </HStack>
                        </VStack>

                        <Box pt={4} borderTop="1px solid" borderColor="#F1F5F9">
                          <Button
                            onClick={clearLogs}
                            variant="outline"
                            borderColor="#FDA4AF"
                            color="#E11D48"
                            borderRadius="xl"
                            w="100%"
                            size="sm"
                            fontWeight="bold"
                            _hover={{ bg: "#FFF1F2" }}
                          >
                            {t("kid.clearDiaryHistoryBtn")}
                          </Button>
                        </Box>
                      </VStack>
                    </Box>

                  </VStack>

                </SimpleGrid>
              </MotionBox>
            )}

          </AnimatePresence>

        </Box>

      </Flex>

      {/* QUIZ INTERACTIVE DIALOG MODAL (Lớp học cảm xúc) */}
      <AnimatePresence>
        {currentQuiz && (
          <Flex
            position="fixed"
            top={0}
            left={0}
            w="100vw"
            h="100vh"
            bg="rgba(15, 23, 42, 0.4)"
            backdropFilter="blur(6px)"
            zIndex={100}
            alignItems="center"
            justifyContent="center"
            p={4}
          >
            <MotionBox
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.2 }}
              bg="#FFFFFF"
              borderRadius="3xl"
              border="2px solid"
              borderColor={currentQuiz.color}
              maxW="540px"
              w="100%"
              p={6}
              position="relative"
              boxShadow="xl"
            >
              {/* Modal Close Button */}
              <Box
                position="absolute"
                top="16px"
                right="16px"
                cursor="pointer"
                fontSize="xl"
                color="#94A3B8"
                onClick={closeQuizModal}
                _hover={{ color: "#0F172A" }}
              >
                ✕
              </Box>

              <VStack spaceY={5} alignItems="stretch">
                
                {/* Header Lesson Title */}
                <HStack spaceX={3}>
                  <Flex
                    w="40px"
                    h="40px"
                    borderRadius="xl"
                    bg={`${currentQuiz.color}15`}
                    alignItems="center"
                    justifyContent="center"
                    fontSize="2xl"
                  >
                    {currentQuiz.emoji}
                  </Flex>
                  <VStack spaceY={0} alignItems="flex-start">
                    <Text fontSize="9px" color={currentQuiz.color} fontWeight="extrabold" textTransform="uppercase" letterSpacing="0.05em">
                      {t("kid.aiTeachers")}
                    </Text>
                    <Heading size="xs" color="#0F172A" fontWeight="bold">
                      {t("kid.lessonPlan")}: {t(currentQuiz.titleKey)}
                    </Heading>
                  </VStack>
                </HStack>

                <Box borderTop="1px solid" borderColor="#F1F5F9" />

                {/* Momo Mascot dialog box */}
                <HStack spaceX={4} bg="#F5F3FF" p={4} borderRadius="2xl" border="1px solid" borderColor="#E9D5FF" alignItems="flex-start">
                  <img src={momoMascot} alt="" style={{ width: "45px", height: "auto", marginTop: "2px" }} />
                  <VStack spaceY={1} alignItems="flex-start">
                    <Text fontSize="9px" color="#7C3AED" fontWeight="extrabold">🤖 {t("live2d.companionName")}:</Text>
                    <Text fontSize="xs" fontWeight="bold" color="#1E293B" lineHeight="relaxed">
                      {t(currentQuiz.scenarioKey)}
                    </Text>
                  </VStack>
                </HStack>

                {/* Options list */}
                <VStack spaceY={3} alignItems="stretch">
                  {currentQuiz.options.map((option) => (
                    <Button
                      key={option.key}
                      onClick={() => handleAnswerSubmit(option.key, option.isCorrect)}
                      disabled={isAnswered}
                      variant="outline"
                      w="100%"
                      h="48px"
                      borderRadius="2xl"
                      borderColor={selectedOption === option.key ? (option.isCorrect ? "#10B981" : "#EF4444") : "#E2E8F0"}
                      bg={selectedOption === option.key ? (option.isCorrect ? "#ECFDF5" : "#FEF2F2") : "white"}
                      justifyContent="flex-start"
                      px={5}
                      fontSize="xs"
                      fontWeight="bold"
                      color={selectedOption === option.key ? (option.isCorrect ? "#065F46" : "#991B1B") : "#475569"}
                      _hover={!isAnswered ? { bg: "#F8FAFC", borderColor: currentQuiz.color } : {}}
                      position="relative"
                    >
                      <Text>{t(option.textKey)}</Text>
                      {isAnswered && option.isCorrect && (
                        <Box position="absolute" right="16px" color="#10B981" fontSize="md">✓</Box>
                      )}
                      {isAnswered && selectedOption === option.key && !option.isCorrect && (
                        <Box position="absolute" right="16px" color="#EF4444" fontSize="md">✗</Box>
                      )}
                    </Button>
                  ))}
                </VStack>

                {/* Result Feedback Dialog */}
                {quizFeedback && (
                  <MotionBox
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    bg={selectedOption === currentQuiz.options.find(o => o.isCorrect)?.key ? "#F0FDF4" : "#FFF1F2"}
                    p={4}
                    borderRadius="2xl"
                    border="1px solid"
                    borderColor={selectedOption === currentQuiz.options.find(o => o.isCorrect)?.key ? "#DCFCE7" : "#FDA4AF"}
                  >
                    <Text fontSize="xs" color={selectedOption === currentQuiz.options.find(o => o.isCorrect)?.key ? "#15803D" : "#B91C1C"} lineHeight="relaxed" fontWeight="bold">
                      {quizFeedback}
                    </Text>
                  </MotionBox>
                )}

                {/* Next/Close button */}
                {isAnswered && (
                  <Button
                    onClick={closeQuizModal}
                    w="100%"
                    bg={selectedOption === currentQuiz.options.find(o => o.isCorrect)?.key ? "#10B981" : "#64748B"}
                    color="white"
                    borderRadius="2xl"
                    fontWeight="bold"
                    _hover={{ opacity: 0.9 }}
                  >
                    {selectedOption === currentQuiz.options.find(o => o.isCorrect)?.key ? t("kid.diaryItem1Title") : t("kid.closeAndLearnAgain")}
                  </Button>
                )}

              </VStack>
            </MotionBox>
          </Flex>
        )}
      </AnimatePresence>

    </Flex>
  );
}
