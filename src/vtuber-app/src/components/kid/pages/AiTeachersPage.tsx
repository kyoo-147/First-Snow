import { Box, SimpleGrid, VStack, HStack, Text, Heading } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../ui/button";

const momoMascot = "./images/momo-mascot-v2.png";

interface LessonQuiz {
  id: string;
  titleKey: string;
  descKey: string;
  color: string;
  emoji: string;
  questionKey: string;
  optionsKeys: string[];
  correctAnswer: number;
  correctFeedbackKey: string;
}

const LESSON_CONFIGS: LessonQuiz[] = [
  {
    id: "lesson-1",
    titleKey: "kid.lesson1QuizTitle",
    descKey: "kid.lesson1QuizDesc",
    color: "#7C3AED",
    emoji: "😊",
    questionKey: "kid.lesson1Scenario",
    optionsKeys: [
      "kid.lesson1Opt1",
      "kid.lesson1Opt2",
      "kid.lesson1Opt3"
    ],
    correctAnswer: 0,
    correctFeedbackKey: "kid.lesson1Feedback"
  },
  {
    id: "lesson-2",
    titleKey: "kid.lesson2QuizTitle",
    descKey: "kid.lesson2QuizDesc",
    color: "#E11D48",
    emoji: "🤝",
    questionKey: "kid.lesson2Scenario",
    optionsKeys: [
      "kid.lesson2Opt1",
      "kid.lesson2Opt2",
      "kid.lesson2Opt3"
    ],
    correctAnswer: 1,
    correctFeedbackKey: "kid.lesson2Feedback"
  },
  {
    id: "lesson-3",
    titleKey: "kid.lesson3QuizTitle",
    descKey: "kid.lesson3QuizDesc",
    color: "#D97706",
    emoji: "🧸",
    questionKey: "kid.lesson3Scenario",
    optionsKeys: [
      "kid.lesson3Opt1",
      "kid.lesson3Opt2",
      "kid.lesson3Opt3"
    ],
    correctAnswer: 2,
    correctFeedbackKey: "kid.lesson3Feedback"
  }
];

export default function AiTeachersPage(): React.JSX.Element {
  const { t } = useTranslation();
  const [activeLesson, setActiveLesson] = useState<LessonQuiz | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [_currentScore, setCurrentScore] = useState<number>(0);

  useEffect(() => {
    const profile = localStorage.getItem("kid_active_profile");
    if (profile) {
      setCurrentScore(JSON.parse(profile).points || 0);
    }
  }, []);

  const handleStartLesson = (lesson: LessonQuiz) => {
    setActiveLesson(lesson);
    setSelectedOption(null);
    setShowFeedback(false);
  };

  const handleSelectOption = (index: number) => {
    if (showFeedback) return;
    setSelectedOption(index);
    setShowFeedback(true);

    if (index === activeLesson?.correctAnswer) {
      // Award points
      const profileStr = localStorage.getItem("kid_active_profile");
      if (profileStr) {
        const profile = JSON.parse(profileStr);
        const newPoints = (profile.points || 0) + 100;
        profile.points = newPoints;
        localStorage.setItem("kid_active_profile", JSON.stringify(profile));
        setCurrentScore(newPoints);

        // Update list of kid profiles in localStorage
        const kidProfilesStr = localStorage.getItem("kid_profiles");
        if (kidProfilesStr) {
          const kidProfiles = JSON.parse(kidProfilesStr);
          const updatedProfiles = kidProfiles.map((kp: any) => {
            if (kp.id === profile.id) {
              return { ...kp, points: newPoints };
            }
            return kp;
          });
          localStorage.setItem("kid_profiles", JSON.stringify(updatedProfiles));
        }
      }

      // Add record to kid diary log
      const logsStr = localStorage.getItem("kid_emotion_diary");
      const logs = logsStr ? JSON.parse(logsStr) : [];
      const newLog = {
        id: Date.now().toString(),
        emotion: t("kid.prideRewardDiary"),
        note: t("kid.completedLessonDiary", { title: activeLesson ? t(activeLesson.titleKey) : "" }),
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      };
      localStorage.setItem("kid_emotion_diary", JSON.stringify([newLog, ...logs]));
    }
  };

  return (
    <Box width="100%">
      
      {/* Page Title & Desc */}
      <VStack spaceY={1.5} alignItems="flex-start" mb={6}>
        <Heading size="md" color="#0F172A" fontWeight="bold">
          {t("kid.teachersTitle")}
        </Heading>
        <Text fontSize="xs" color="#64748B">
          {t("kid.teachersDesc")}
        </Text>
      </VStack>

      {/* Grid of lessons */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spaceX={6} spaceY={6}>
        {LESSON_CONFIGS.map((lesson) => (
          <Box
            key={lesson.id}
            p={6}
            bg="#FFFFFF"
            border="1px solid"
            borderColor="#E2E8F0"
            borderTop="4px solid"
            borderTopColor={lesson.color}
            borderRadius="2xl"
            boxShadow="xs"
            display="flex"
            flexDirection="column"
            justifyContent="space-between"
            h="220px"
          >
            <VStack spaceY={3} alignItems="flex-start">
              <Box fontSize="2xl">{lesson.emoji}</Box>
              <Heading size="xs" color="#0F172A" fontWeight="bold">
                {t(lesson.titleKey)}
              </Heading>
              <Text fontSize="11px" color="#64748B" lineHeight="relaxed">
                {t(lesson.descKey)}
              </Text>
            </VStack>

            <Button
              onClick={() => handleStartLesson(lesson)}
              w="100%"
              h="36px"
              bg={lesson.color}
              color="white"
              borderRadius="xl"
              fontSize="xs"
              fontWeight="bold"
              _hover={{ filter: "brightness(0.9)" }}
            >
              {t("kid.startExercise")}
            </Button>
          </Box>
        ))}
      </SimpleGrid>

      {/* INTERACTIVE QUIZ DIALOG MODAL */}
      {activeLesson && (
        <Box
          position="fixed"
          inset={0}
          bg="rgba(15, 23, 42, 0.4)"
          backdropFilter="blur(8px)"
          zIndex={100}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p={4}
        >
          <Box
            w="100%"
            maxW="560px"
            bg="#FFFFFF"
            borderRadius="3xl"
            border="1px solid"
            borderColor="#E2E8F0"
            boxShadow="2xl"
            overflow="hidden"
            position="relative"
            p={7}
          >
            {/* Header Dialog */}
            <HStack justifyContent="space-between" mb={5} borderBottom="1px solid" borderColor="#F1F5F9" pb={4.5}>
              <HStack spaceX={2.5}>
                <Box fontSize="xl" w="32px" h="32px" borderRadius="full" bg="#F5F3FF" display="flex" alignItems="center" justifyContent="center">
                  {activeLesson.emoji}
                </Box>
                <VStack spaceY={0} alignItems="flex-start">
                  <Text fontSize="9px" fontWeight="bold" color="#7C3AED" textTransform="uppercase" letterSpacing="0.05em">
                    {t("kid.teachersTitle")}
                  </Text>
                  <Text fontSize="xs" fontWeight="bold" color="#0F172A" mt={-0.5}>
                    {t("kid.lessonPrefix", { title: t(activeLesson.titleKey) })}
                  </Text>
                </VStack>
              </HStack>

              <Box
                onClick={() => setActiveLesson(null)}
                cursor="pointer"
                color="#94A3B8"
                _hover={{ color: "#0F172A" }}
                style={{ fontSize: "16px", fontWeight: "bold" }}
              >
                ✕
              </Box>
            </HStack>

            {/* Chat Bubble Question styling */}
            <HStack spaceX={3.5} p={4.5} bg="#F5F3FF" borderRadius="2xl" mb={6} alignItems="flex-start">
              <Box w="36px" h="36px" borderRadius="lg" bg="#E0F2FE" display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                <img src={momoMascot} alt="" style={{ width: "24px", height: "auto" }} />
              </Box>
              <VStack spaceY={0.5} alignItems="flex-start">
                <Text fontSize="9px" fontWeight="extrabold" color="#0284C7" textTransform="uppercase">
                  🤖 {t("kid.momoAsks")}
                </Text>
                <Text fontSize="xs" color="#0369A1" fontWeight="bold" lineHeight="relaxed">
                  {t(activeLesson.questionKey)}
                </Text>
              </VStack>
            </HStack>

            {/* Multiple Choice Options */}
            <VStack spaceY={3.5} alignItems="stretch" mb={4}>
              {activeLesson.optionsKeys.map((optKey, idx) => {
                const isCorrect = idx === activeLesson.correctAnswer;
                const isSelected = selectedOption === idx;
                
                let borderTheme = "#E2E8F0";
                let bgTheme = "#FFFFFF";
                
                if (showFeedback) {
                  if (isCorrect) {
                    borderTheme = "#10B981";
                    bgTheme = "#ECFDF5";
                  } else if (isSelected) {
                    borderTheme = "#EF4444";
                    bgTheme = "#FEF2F2";
                  }
                } else if (isSelected) {
                  borderTheme = "#7C3AED";
                  bgTheme = "#F5F3FF";
                }

                return (
                  <Box
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    cursor={showFeedback ? "default" : "pointer"}
                    p={4}
                    borderRadius="2xl"
                    border="1.5px solid"
                    borderColor={borderTheme}
                    bg={bgTheme}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    fontWeight="semibold"
                    fontSize="xs"
                    color="#334155"
                    _hover={showFeedback ? {} : { borderColor: "#7C3AED", bg: "#F5F3FF" }}
                    transition="all 0.15s"
                  >
                    <HStack spaceX={2.5}>
                      <span>{idx === 0 ? "😀" : idx === 1 ? "🥺" : "😡"}</span>
                      <Text>{t(optKey)}</Text>
                    </HStack>

                    {showFeedback && isCorrect && <Text color="#10B981" fontWeight="extrabold">✓</Text>}
                    {showFeedback && isSelected && !isCorrect && <Text color="#EF4444" fontWeight="extrabold">✕</Text>}
                  </Box>
                );
              })}
            </VStack>

            {/* Interactive congratulatory box */}
            {showFeedback && (
              <VStack spaceY={4} alignItems="stretch" mt={5}>
                <Box
                  p={4}
                  bg={selectedOption === activeLesson.correctAnswer ? "#ECFDF5" : "#FEF2F2"}
                  borderRadius="2xl"
                  border="1px solid"
                  borderColor={selectedOption === activeLesson.correctAnswer ? "#A7F3D0" : "#FEE2E2"}
                >
                  <Text
                    fontSize="xs"
                    fontWeight="bold"
                    color={selectedOption === activeLesson.correctAnswer ? "#065F46" : "#991B1B"}
                    lineHeight="relaxed"
                  >
                    {selectedOption === activeLesson.correctAnswer
                      ? t(activeLesson.correctFeedbackKey)
                      : t("kid.retryIncorrect")}
                  </Text>
                </Box>

                <Button
                  onClick={() => setActiveLesson(null)}
                  w="100%"
                  h="44px"
                  bg={selectedOption === activeLesson.correctAnswer ? "#10B981" : "#EF4444"}
                  color="white"
                  borderRadius="2xl"
                  fontWeight="bold"
                  fontSize="xs"
                  _hover={{ filter: "brightness(0.9)" }}
                >
                  {t("kid.completeBtn")}
                </Button>
              </VStack>
            )}

          </Box>
        </Box>
      )}

    </Box>
  );
}
