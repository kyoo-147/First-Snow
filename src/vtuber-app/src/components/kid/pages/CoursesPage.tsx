import { Box, Flex, SimpleGrid, VStack, HStack, Text, Heading } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../ui/button";
import { FiHeart } from "react-icons/fi";

interface RecommendedLesson {
  id: string;
  title: string;
  category: string;
  categoryColor: string;
  time: string;
  description: string;
  progress: number;
  image: string;
  buttonText: string;
}

interface LessonItem {
  id: string;
  title: string;
  category: string;
  categoryColor: string;
  time: string;
  image: string;
}

const RECOMMENDED: RecommendedLesson[] = [
  {
    id: "rec-1",
    title: "Taking Deep Breaths",
    category: "Emotional Reg.",
    categoryColor: "#0E7490",
    time: "15 mins",
    description: "Mastering calm responses to unexpected changes in routine.",
    progress: 65,
    image: "./images/taking_deep_breaths_illustration.png",
    buttonText: "Start Lesson"
  },
  {
    id: "rec-2",
    title: "Taking Turns",
    category: "Social Skills",
    categoryColor: "#7C3AED",
    time: "10 mins",
    description: "Interactive scenarios about sharing toys and conversation flow.",
    progress: 0,
    image: "./images/taking_turns_illustration.png",
    buttonText: "Begin Module"
  }
];

const LESSONS: LessonItem[] = [
  {
    id: "lesson-1",
    title: "Brushing Teeth",
    category: "Daily Life",
    categoryColor: "#059669",
    time: "5m",
    image: "./images/brushing_teeth_photo.png"
  },
  {
    id: "lesson-2",
    title: "Indoor Voice",
    category: "Social Skills",
    categoryColor: "#7C3AED",
    time: "8m",
    image: "./images/indoor_voice_photo.png"
  },
  {
    id: "lesson-3",
    title: "Asking Nicely",
    category: "Social Skills",
    categoryColor: "#7C3AED",
    time: "12m",
    image: "./images/asking_nicely_photo.png"
  },
  {
    id: "lesson-4",
    title: "Going to the Park",
    category: "Daily Life",
    categoryColor: "#059669",
    time: "15m",
    image: "./images/going_to_the_park_photo.png"
  }
];

export default function CoursesPage(): React.JSX.Element {
  const { t } = useTranslation();
  const [kidName, setKidName] = useState<string>("Leo");
  const [activeFilter, setActiveFilter] = useState<string>("All Lessons");
  const [likedLessons, setLikedLessons] = useState<string[]>(["lesson-2"]); // Pre-fill "Indoor Voice" as liked matching mockup

  // Display labels keyed by the stable internal content values above.
  // Internal values stay English so filtering logic is untouched.
  const T: Record<string, string> = {
    "All Lessons": t("kid.filterAllLessons"),
    "Social Skills": t("kid.filterSocialSkills"),
    "Daily Life": t("kid.filterDailyLife"),
    "Emotional Reg.": t("kid.filterEmotionalReg"),
    "Language": t("kid.filterLanguage"),
    "Taking Deep Breaths": t("kid.rec1Title"),
    "Taking Turns": t("kid.rec2Title"),
    "Brushing Teeth": t("kid.lesson1Title"),
    "Indoor Voice": t("kid.lesson2Title"),
    "Asking Nicely": t("kid.lesson3Title"),
    "Going to the Park": t("kid.lesson4Title"),
    "15 mins": t("kid.rec1Time"),
    "10 mins": t("kid.rec2Time"),
    "5m": t("kid.lesson1Time"),
    "8m": t("kid.lesson2Time"),
    "12m": t("kid.lesson3Time"),
    "15m": t("kid.lesson4Time"),
    "Mastering calm responses to unexpected changes in routine.": t("kid.rec1Desc"),
    "Interactive scenarios about sharing toys and conversation flow.": t("kid.rec2Desc"),
    "Start Lesson": t("kid.rec1Button"),
    "Begin Module": t("kid.rec2Button"),
  };

  useEffect(() => {
    const profileStr = localStorage.getItem("kid_active_profile");
    if (profileStr) {
      try {
        const profile = JSON.parse(profileStr);
        let name = profile.name;
        if (name.startsWith("Bé ")) {
          name = name.substring(3);
        }
        setKidName(name);
      } catch (e) {
        // Fallback
      }
    }
  }, []);

  const toggleLike = (id: string) => {
    if (likedLessons.includes(id)) {
      setLikedLessons(likedLessons.filter((item) => item !== id));
    } else {
      setLikedLessons([...likedLessons, id]);
    }
  };

  const isLiked = (id: string) => likedLessons.includes(id);

  // Filter logic
  const filteredLessons = LESSONS.filter((lesson) => {
    if (activeFilter === "All Lessons") return true;
    return lesson.category === activeFilter;
  });

  return (
    <Box width="100%" fontFamily="'Inter', system-ui, sans-serif">
      
      {/* Page Title & Desc */}
      <VStack spaceY={1.5} alignItems="flex-start" mb={7}>
        <Heading size="md" color="#0F172A" fontWeight="extrabold" letterSpacing="-0.02em">
          {t("kid.coursesTitle")}
        </Heading>
        <Text fontSize="xs" color="#64748B" fontWeight="medium">
          {t("kid.coursesDesc", { name: kidName })}
        </Text>
      </VStack>

      {/* RECOMMENDED FOR TODAY SECTION */}
      <VStack spaceY={4} alignItems="stretch" mb={8} width="100%">
        <HStack justifyContent="space-between" alignItems="center">
          <Heading size="xs" color="#1E293B" fontWeight="bold">
            {t("kid.recommendedToday")}
          </Heading>
          <Text fontSize="xs" color="#0EA5E9" fontWeight="bold" cursor="pointer" _hover={{ textDecoration: "underline" }}>
            {t("kid.viewSchedule")}
          </Text>
        </HStack>

        <SimpleGrid columns={{ base: 1, xl: 2 }} spaceX={6} spaceY={6} width="100%">
          {RECOMMENDED.map((rec) => (
            <Box
              key={rec.id}
              bg="#FFFFFF"
              borderRadius="3xl"
              border="1.5px solid"
              borderColor="#E2E8F0"
              p={5}
              display="flex"
              flexDirection={{ base: "column", md: "row" }}
              gap={5.5}
              alignItems="stretch"
              minH="220px"
              boxShadow="sm"
            >
              {/* Left Image Box */}
              <Box
                w={{ base: "100%", md: "180px" }}
                h={{ base: "160px", md: "auto" }}
                borderRadius="2xl"
                overflow="hidden"
                flexShrink={0}
              >
                <img src={rec.image} alt={T[rec.title]} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </Box>

              {/* Right Content Box */}
              <Flex flexGrow={1} flexDirection="column" justifyContent="space-between">
                <VStack spaceY={1.5} alignItems="flex-start" width="100%">
                  <HStack justifyContent="space-between" width="100%">
                    <Box
                      px={2.5}
                      py={0.5}
                      bg={rec.id === "rec-1" ? "#E0F2FE" : "#F3E8FF"}
                      color={rec.categoryColor}
                      borderRadius="lg"
                      fontSize="9px"
                      fontWeight="extrabold"
                    >
                      {T[rec.category]}
                    </Box>
                    <Text fontSize="10px" color="#94A3B8" fontWeight="bold">
                      {T[rec.time]}
                    </Text>
                  </HStack>
                  <Heading size="xs" color="#0F172A" fontWeight="bold" mt={1}>
                    {T[rec.title]}
                  </Heading>
                  <Text fontSize="11px" color="#64748B" lineHeight="relaxed">
                    {T[rec.description]}
                  </Text>
                </VStack>

                {/* Progress & Button */}
                <VStack spaceY={2.5} alignItems="stretch" width="100%" mt={4}>
                  <HStack justifyContent="space-between" fontSize="9px" fontWeight="bold" color="#64748B">
                    <Text>{t("kid.progress")}</Text>
                    <Text color={rec.categoryColor}>{rec.progress}%</Text>
                  </HStack>
                  <Box w="100%" bg="#F1F5F9" h="6px" borderRadius="full" overflow="hidden">
                    <Box w={`${rec.progress}%`} bg={rec.categoryColor} h="100%" borderRadius="full" />
                  </Box>
                  <Button
                    size="sm"
                    w="100%"
                    bg="#7DD3FC"
                    color="#0369A1"
                    borderRadius="xl"
                    fontWeight="extrabold"
                    fontSize="xs"
                    h="36px"
                    _hover={{ bg: "#bae6fd" }}
                    mt={1}
                  >
                    {T[rec.buttonText]}
                  </Button>
                </VStack>
              </Flex>
            </Box>
          ))}
        </SimpleGrid>
      </VStack>

      {/* FILTER BAR SECTION */}
      <HStack justifyContent="space-between" alignItems="center" mb={6} borderTop="1px solid" borderColor="#E2E8F0" pt={7} width="100%">
        <HStack spaceX={2.5} wrap="wrap" gap={2}>
          {["All Lessons", "Social Skills", "Daily Life", "Emotional Reg.", "Language"].map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <Box
                key={filter}
                onClick={() => setActiveFilter(filter)}
                cursor="pointer"
                px={4}
                py={2}
                borderRadius="full"
                bg={isActive ? "#0F172A" : "#E0F2FE"}
                color={isActive ? "#FFFFFF" : "#0369A1"}
                fontSize="xs"
                fontWeight="extrabold"
                _hover={{ filter: "brightness(0.95)" }}
                transition="all 0.15s"
              >
                {T[filter]}
              </Box>
            );
          })}
        </HStack>

        <HStack spaceX={1.5} fontSize="xs" fontWeight="bold" color="#475569" cursor="pointer">
          <Text>{t("kid.sortBy")}</Text>
          <Text color="#0EA5E9">{t("kid.recentlyAdded")}</Text>
        </HStack>
      </HStack>

      {/* ALL LESSONS GRID */}
      <SimpleGrid columns={{ base: 1, sm: 2, md: 3, xl: 4 }} spaceX={6} spaceY={6} width="100%">
        {filteredLessons.map((lesson) => (
          <Box
            key={lesson.id}
            bg="#FFFFFF"
            borderRadius="3xl"
            border="1.5px solid"
            borderColor="#E2E8F0"
            overflow="hidden"
            boxShadow="sm"
            display="flex"
            flexDirection="column"
            justifyContent="space-between"
            h="280px"
            transition="all 0.2s"
            _hover={{ transform: "translateY(-4px)", boxShadow: "md" }}
          >
            {/* Card Image */}
            <Box h="140px" w="100%" overflow="hidden" position="relative">
              <img src={lesson.image} alt={T[lesson.title]} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </Box>

            {/* Card Info */}
            <VStack p={4.5} spaceY={3} alignItems="stretch" flexGrow={1} justifyContent="space-between">
              <VStack spaceY={1} alignItems="flex-start">
                <Text fontSize="9px" fontWeight="bold" color={lesson.categoryColor} textTransform="uppercase" letterSpacing="wider">
                  {T[lesson.category]}
                </Text>
                <Heading size="xs" color="#0F172A" fontWeight="bold" lineClamp={2}>
                  {T[lesson.title]}
                </Heading>
              </VStack>

              <HStack justifyContent="space-between" alignItems="center">
                <HStack spaceX={1} color="#94A3B8" fontSize="10px" fontWeight="bold">
                  <span>⏱</span>
                   <Text>{T[lesson.time]}</Text>
                </HStack>

                <Box
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLike(lesson.id);
                  }}
                  cursor="pointer"
                  color={isLiked(lesson.id) ? "#EF4444" : "#94A3B8"}
                  _hover={{ color: "#EF4444" }}
                  transition="all 0.15s"
                >
                  <FiHeart size={14} fill={isLiked(lesson.id) ? "currentColor" : "transparent"} />
                </Box>
              </HStack>
            </VStack>
          </Box>
        ))}
      </SimpleGrid>

    </Box>
  );
}
