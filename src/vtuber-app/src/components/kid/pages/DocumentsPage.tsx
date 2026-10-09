import { Box, SimpleGrid, VStack, HStack, Text, Heading } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../ui/button";
import { FiClock } from "react-icons/fi";

interface KidProfile {
  id: string;
  name: string;
  age: number;
  avatar: string;
  status: string;
  color: string;
  points?: number;
}

export default function DocumentsPage(): React.JSX.Element {
  const { t } = useTranslation();
  const [activeProfile, setActiveProfile] = useState<KidProfile | null>(null);
  const [_diaryLogs, setDiaryLogs] = useState<any[]>([]);
  const [playTime, setPlayTime] = useState<number>(30);
  const [emailReport, setEmailReport] = useState<boolean>(true);
  const [alertDifficulty, setAlertDifficulty] = useState<boolean>(true);

  useEffect(() => {
    const profileStr = localStorage.getItem("kid_active_profile");
    if (profileStr) {
      setActiveProfile(JSON.parse(profileStr));
    }
    const logs = localStorage.getItem("kid_emotion_diary");
    if (logs) {
      setDiaryLogs(JSON.parse(logs));
    }
  }, []);

  const kidName = activeProfile ? activeProfile.name : "Bé Leo";

  const handleClearHistory = () => {
    if (window.confirm(t("kid.confirmClearDiary"))) {
      const defaultLogs = [
        { id: "1", emotion: t("kid.defaultLog1Emotion"), note: t("kid.defaultLog1Note"), date: t("kid.defaultLog1Date") },
        { id: "2", emotion: t("kid.defaultLog2Emotion"), note: t("kid.defaultLog2Note"), date: t("kid.defaultLog2Date") },
        { id: "3", emotion: t("kid.defaultLog3Emotion"), note: t("kid.defaultLog3Note"), date: t("kid.defaultLog3Date") }
      ];
      localStorage.setItem("kid_emotion_diary", JSON.stringify(defaultLogs));
      setDiaryLogs(defaultLogs);
    }
  };

  return (
    <Box width="100%">
      
      {/* Page Title & Desc */}
      <VStack spaceY={1.5} alignItems="flex-start" mb={6}>
        <Heading size="md" color="#0F172A" fontWeight="bold">
          {t("kid.documentsParentReports")}
        </Heading>
        <Text fontSize="xs" color="#64748B">
          {t("kid.documentsDesc")}
        </Text>
      </VStack>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spaceX={{ base: 0, lg: 6 }} spaceY={{ base: 6, lg: 0 }}>
        
        {/* Left Column: Emotion Charts & Advisor */}
        <VStack spaceY={6} alignItems="stretch">
          
          {/* Weekly Emotion Chart */}
          <Box p={6} bg="#FFFFFF" borderRadius="3xl" border="1px solid" borderColor="#E2E8F0" boxShadow="xs">
            <Heading size="xs" color="#0F172A" fontWeight="bold" mb={4}>
              {t("kid.weeklyTrendChart")}
            </Heading>
            
            <VStack spaceY={4} alignItems="stretch">
              {/* Happy emotion bar */}
              <VStack spaceY={1.5} alignItems="stretch">
                <HStack justifyContent="space-between" fontSize="xs" fontWeight="bold" color="#334155">
                  <Text>{t("kid.emotionHappyLabel")}</Text>
                  <Text color="#7C3AED">{t("kid.emotionHappyTime")}</Text>
                </HStack>
                <Box w="100%" bg="#F1F5F9" h="8px" borderRadius="full" overflow="hidden">
                  <Box w="60%" bg="#7C3AED" h="100%" borderRadius="full" />
                </Box>
              </VStack>

              {/* Proud emotion bar */}
              <VStack spaceY={1.5} alignItems="stretch">
                <HStack justifyContent="space-between" fontSize="xs" fontWeight="bold" color="#334155">
                  <Text>{t("kid.emotionProudLabel")}</Text>
                  <Text color="#0EA5E9">{t("kid.emotionProudTime")}</Text>
                </HStack>
                <Box w="100%" bg="#F1F5F9" h="8px" borderRadius="full" overflow="hidden">
                  <Box w="25%" bg="#0EA5E9" h="100%" borderRadius="full" />
                </Box>
              </VStack>

              {/* Anxious emotion bar */}
              <VStack spaceY={1.5} alignItems="stretch">
                <HStack justifyContent="space-between" fontSize="xs" fontWeight="bold" color="#334155">
                  <Text>{t("kid.emotionAnxiousLabel")}</Text>
                  <Text color="#D97706">{t("kid.emotionAnxiousTime")}</Text>
                </HStack>
                <Box w="100%" bg="#F1F5F9" h="8px" borderRadius="full" overflow="hidden">
                  <Box w="15%" bg="#D97706" h="100%" borderRadius="full" />
                </Box>
              </VStack>
            </VStack>
          </Box>

          {/* AI Parent Advisor */}
          <Box p={6} bg="#F5F3FF" borderRadius="3xl" border="1px solid" borderColor="#DDD6FE" boxShadow="xs">
            <HStack spaceX={2} mb={3} color="#7C3AED">
              <span>😊</span>
              <Heading size="xs" fontWeight="extrabold">{t("kid.parentAdvisorTitle")}</Heading>
            </HStack>
            <Text fontSize="xs" color="#5B21B6" lineHeight="relaxed" fontWeight="medium">
              {t("kid.parentAdvisorAdvice", { name: kidName })}
            </Text>
          </Box>

        </VStack>

        {/* Right Column: Time Limits & History actions */}
        <VStack spaceY={6} alignItems="stretch">
          
          {/* Time & Privacy settings */}
          <Box p={6} bg="#FFFFFF" borderRadius="3xl" border="1px solid" borderColor="#E2E8F0" boxShadow="xs">
            <Heading size="xs" color="#0F172A" fontWeight="bold" mb={4}>
              {t("kid.timePrivacyTitle")}
            </Heading>

            <VStack spaceY={4} alignItems="stretch">
              
              {/* Playtime Slider */}
              <VStack spaceY={2.5} alignItems="stretch">
                <HStack justifyContent="space-between" fontSize="xs" fontWeight="bold" color="#334155">
                  <HStack spaceX={1.5} color="#64748B">
                    <FiClock size={12} />
                    <Text>{t("kid.usageTimeLimit")}</Text>
                  </HStack>
                  <Text color="#7C3AED">{t("kid.minutesValue", { count: playTime })}</Text>
                </HStack>
                
                {/* Custom Range Slider input element */}
                <input
                  type="range"
                  min="10"
                  max="60"
                  value={playTime}
                  onChange={(e) => setPlayTime(parseInt(e.target.value))}
                  style={{
                    width: "100%",
                    accentColor: "#7C3AED",
                    cursor: "pointer",
                    height: "6px",
                    borderRadius: "3px",
                    backgroundColor: "#E2E8F0"
                  }}
                />
              </VStack>

              <Box borderTop="1px solid" borderColor="#F1F5F9" my={1} />

              {/* Email Report Checkbox */}
              <HStack justifyContent="space-between" cursor="pointer" onClick={() => setEmailReport(!emailReport)}>
                <Text fontSize="xs" fontWeight="bold" color="#334155">{t("kid.emailWeeklyReport")}</Text>
                <Box
                  w="18px"
                  h="18px"
                  borderRadius="md"
                  border="2px solid"
                  borderColor={emailReport ? "#7C3AED" : "#94A3B8"}
                  bg={emailReport ? "#7C3AED" : "transparent"}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  color="white"
                  fontSize="10px"
                  fontWeight="bold"
                >
                  {emailReport && "✓"}
                </Box>
              </HStack>

              {/* Alert checkbox */}
              <HStack justifyContent="space-between" cursor="pointer" onClick={() => setAlertDifficulty(!alertDifficulty)}>
                <Text fontSize="xs" fontWeight="bold" color="#334155">{t("kid.alertDifficultyLabel")}</Text>
                <Box
                  w="18px"
                  h="18px"
                  borderRadius="md"
                  border="2px solid"
                  borderColor={alertDifficulty ? "#7C3AED" : "#94A3B8"}
                  bg={alertDifficulty ? "#7C3AED" : "transparent"}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  color="white"
                  fontSize="10px"
                  fontWeight="bold"
                >
                  {alertDifficulty && "✓"}
                </Box>
              </HStack>

              <Box borderTop="1px solid" borderColor="#F1F5F9" my={1} />

              {/* Clear data button */}
              <Button
                onClick={handleClearHistory}
                variant="outline"
                borderColor="#E11D48"
                color="#E11D48"
                borderRadius="2xl"
                h="40px"
                fontWeight="bold"
                fontSize="xs"
                _hover={{ bg: "#FFE4E6" }}
              >
                {t("kid.clearDiaryHistoryBtn")}
              </Button>

            </VStack>
          </Box>

        </VStack>

      </SimpleGrid>

    </Box>
  );
}
