import { Box, SimpleGrid, VStack, HStack, Text, Heading } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FiTrendingUp, FiCheckCircle, FiActivity } from "react-icons/fi";

interface KidProfile {
  id: string;
  name: string;
  age: number;
  avatar: string;
  points?: number;
}

export default function AnalyticsPage(): React.JSX.Element {
  const { t } = useTranslation();
  const [activeProfile, setActiveProfile] = useState<KidProfile | null>(null);

  useEffect(() => {
    const profile = localStorage.getItem("kid_active_profile");
    if (profile) {
      setActiveProfile(JSON.parse(profile));
    }
  }, []);

  const kidName = activeProfile ? activeProfile.name : "Bé Leo";
  const kidPoints = activeProfile ? activeProfile.points || 0 : 450;

  return (
    <Box width="100%">
      
      {/* Page Title & Desc */}
      <VStack spaceY={1.5} alignItems="flex-start" mb={6}>
        <Heading size="md" color="#0F172A" fontWeight="bold">
          {t("kid.analyticsEqTitle")}
        </Heading>
        <Text fontSize="xs" color="#64748B">
          {t("kid.analyticsDesc")}
        </Text>
      </VStack>

      <SimpleGrid columns={{ base: 1, lg: 3 }} spaceX={6} spaceY={6}>
        
        {/* Card 1: Points summary */}
        <Box p={6} bg="#FFFFFF" borderRadius="3xl" border="1px solid" borderColor="#E2E8F0" boxShadow="xs" display="flex" flexDirection="column" justifyContent="space-between" h="180px">
          <VStack spaceY={2.5} alignItems="flex-start">
            <HStack spaceX={2} color="#7C3AED">
              <FiTrendingUp size={16} />
              <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="0.05em">{t("kid.trainingPoints")}</Text>
            </HStack>
            <Heading size="2xl" color="#0F172A" fontWeight="extrabold" letterSpacing="-0.02em" mt={1}>
              {kidPoints} XP
            </Heading>
          </VStack>
          <Text fontSize="10px" color="#94A3B8" fontWeight="semibold">
            {t("kid.topTenPercent")}
          </Text>
        </Box>

        {/* Card 2: Learning time */}
        <Box p={6} bg="#FFFFFF" borderRadius="3xl" border="1px solid" borderColor="#E2E8F0" boxShadow="xs" display="flex" flexDirection="column" justifyContent="space-between" h="180px">
          <VStack spaceY={2.5} alignItems="flex-start">
            <HStack spaceX={2} color="#0EA5E9">
              <FiActivity size={16} />
              <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="0.05em">{t("kid.weeklyTrainingTime")}</Text>
            </HStack>
            <Heading size="2xl" color="#0F172A" fontWeight="extrabold" letterSpacing="-0.02em" mt={1}>
              {t("kid.weeklyHoursValue")}
            </Heading>
          </VStack>
          <Text fontSize="10px" color="#94A3B8" fontWeight="semibold">
            {t("kid.weeklyTimeLimitNote")}
          </Text>
        </Box>

        {/* Card 3: Lessons Completed */}
        <Box p={6} bg="#FFFFFF" borderRadius="3xl" border="1px solid" borderColor="#E2E8F0" boxShadow="xs" display="flex" flexDirection="column" justifyContent="space-between" h="180px">
          <VStack spaceY={2.5} alignItems="flex-start">
            <HStack spaceX={2} color="#10B981">
              <FiCheckCircle size={16} />
              <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="0.05em">{t("kid.completedLessons")}</Text>
            </HStack>
            <Heading size="2xl" color="#0F172A" fontWeight="extrabold" letterSpacing="-0.02em" mt={1}>
              {t("kid.completedLessonsCount", { count: kidPoints >= 300 ? "3" : "0" })}
            </Heading>
          </VStack>
          <Text fontSize="10px" color="#94A3B8" fontWeight="semibold">
            {t("kid.completedCourseNote")}
          </Text>
        </Box>

      </SimpleGrid>

      {/* Detail EQ Radar Breakdown */}
      <Box p={6} bg="#FFFFFF" borderRadius="3xl" border="1px solid" borderColor="#E2E8F0" boxShadow="xs" mt={6}>
        <Heading size="xs" color="#0F172A" fontWeight="bold" mb={5}>
          {t("kid.eqBreakdownTitle", { name: kidName })}
        </Heading>

        <VStack spaceY={4.5} alignItems="stretch">
          {[
            { label: t("kid.eqGroup1Label"), val: "85%", color: "#7C3AED", desc: t("kid.eqGroup1Desc") },
            { label: t("kid.eqGroup2Label"), val: "90%", color: "#EC4899", desc: t("kid.eqGroup2Desc") },
            { label: t("kid.eqGroup3Label"), val: "75%", color: "#0EA5E9", desc: t("kid.eqGroup3Desc") },
            { label: t("kid.eqGroup4Label"), val: "80%", color: "#F59E0B", desc: t("kid.eqGroup4Desc") },
            { label: t("kid.eqGroup5Label"), val: "85%", color: "#10B981", desc: t("kid.eqGroup5Desc") }
          ].map((item, idx) => (
            <VStack key={idx} spaceY={1.5} alignItems="stretch">
              <HStack justifyContent="space-between" fontSize="xs" fontWeight="bold" color="#334155">
                <Text>{item.label}</Text>
                <Text color={item.color}>{item.val}</Text>
              </HStack>
              <Box w="100%" bg="#F1F5F9" h="8px" borderRadius="full" overflow="hidden">
                <Box w={item.val} bg={item.color} h="100%" borderRadius="full" />
              </Box>
              <Text fontSize="10px" color="#64748B" pl={1} mt={-0.5} fontWeight="medium">
                {item.desc}
              </Text>
            </VStack>
          ))}
        </VStack>
      </Box>

    </Box>
  );
}
