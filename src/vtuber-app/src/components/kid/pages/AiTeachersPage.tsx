import { Box, SimpleGrid, VStack, HStack, Text, Heading } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { Button } from "../../ui/button";

const momoMascot = "./images/momo_mascot.png";

interface LessonQuiz {
  id: string;
  title: string;
  desc: string;
  color: string;
  emoji: string;
  question: string;
  options: string[];
  correctAnswer: number;
  correctFeedback: string;
}

const LESSONS: LessonQuiz[] = [
  {
    id: "lesson-1",
    title: "Nhận Biết Cảm Xúc",
    desc: "Học cách nhận biết Vui, Buồn, Giận dữ thông qua biểu cảm khuôn mặt cùng Momo.",
    color: "#7C3AED",
    emoji: "😊",
    question: "Momo đang cười tươi rói, hai mắt híp lại và vẫy tay chào con như thế này. Đố bé biết Momo đang cảm thấy thế nào?",
    options: [
      "Momo đang rất Vui vẻ và Hạnh phúc",
      "Momo đang Buồn bã muốn khóc",
      "Momo đang Giận dữ muốn la hét"
    ],
    correctAnswer: 0,
    correctFeedback: "Chính xác rồi! Bé giỏi quá! Khi vui cười hân hoan, chúng ta sẽ mở lòng và tràn đầy năng lượng tích cực đấy! 🌟"
  },
  {
    id: "lesson-2",
    title: "Giải Quyết Mâu Thuẫn",
    desc: "Làm gì khi bị bạn vô tình làm hỏng đồ chơi? Học cách ứng xử thấu cảm.",
    color: "#E11D48",
    emoji: "🤝",
    question: "Bạn Bin vô tình giẫm lên mô hình đất sét Momo vừa nặn xong làm nó bẹp dúm. Con nên làm gì để giải quyết mâu thuẫn này?",
    options: [
      "La hét mắng bạn và đẩy bạn ngã đền mô hình mới",
      "Hít thở sâu để bình tĩnh, lắng nghe lời xin lỗi của bạn và cùng bạn nặn lại mô hình mới",
      "Khóc lóc ăn vạ và bảo ba mẹ mắng phạt bạn Bin"
    ],
    correctAnswer: 1,
    correctFeedback: "Tuyệt vời! Con rất biết giữ bình tĩnh và tha thứ. Cùng nhau sửa chữa lỗi lầm sẽ giúp tình bạn thêm bền chặt! 💖"
  },
  {
    id: "lesson-3",
    title: "Vượt Qua Nỗi Sợ",
    desc: "Cách bé tự tạo cảm giác an toàn và dũng cảm đối diện với nỗi sợ bóng tối.",
    color: "#D97706",
    emoji: "🧸",
    question: "Buổi tối khi ngủ tắt đèn, phòng tối ôm làm con cảm thấy lo lắng sợ hãi có quái vật. Con sẽ làm gì để dũng cảm vượt qua nỗi sợ?",
    options: [
      "Trùm chăn kín đầu khóc thút thít cả đêm",
      "Hét to lên kêu ba mẹ sang nằm cùng",
      "Ôm gấu bông Momo ngoan ngoãn, hít thở đều và nghĩ về thế giới kẹo ngọt vui vẻ"
    ],
    correctAnswer: 2,
    correctFeedback: "Đúng rồi! Gấu bông và suy nghĩ tích cực là liều thuốc dũng cảm giúp xua tan bóng tối và ngủ ngon lành! 😴"
  }
];

export default function AiTeachersPage(): React.JSX.Element {
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
        emotion: `Tự hào 🌟 (+100 điểm)`,
        note: `Hoàn thành xuất sắc bài học: "${activeLesson?.title}"`,
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
          Lớp học cảm xúc cùng Momo
        </Heading>
        <Text fontSize="xs" color="#64748B">
          Các bài tập xử lý tình huống mẫu giúp bé rèn luyện trí tuệ cảm xúc (EQ) và khả năng ứng xử ôn hòa.
        </Text>
      </VStack>

      {/* Grid of lessons */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spaceX={6} spaceY={6}>
        {LESSONS.map((lesson) => (
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
                {lesson.title}
              </Heading>
              <Text fontSize="11px" color="#64748B" lineHeight="relaxed">
                {lesson.desc}
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
              Bắt đầu bài tập
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
                    Lớp học cảm xúc cùng Momo
                  </Text>
                  <Text fontSize="xs" fontWeight="bold" color="#0F172A" mt={-0.5}>
                    Bài học: {activeLesson.title}
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
                  🤖 Momo hỏi:
                </Text>
                <Text fontSize="xs" color="#0369A1" fontWeight="bold" lineHeight="relaxed">
                  {activeLesson.question}
                </Text>
              </VStack>
            </HStack>

            {/* Multiple Choice Options */}
            <VStack spaceY={3.5} alignItems="stretch" mb={4}>
              {activeLesson.options.map((option, idx) => {
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
                      <Text>{option}</Text>
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
                      ? activeLesson.correctFeedback
                      : "Ơ kìa, chưa đúng rồi con ơi! Hãy thử suy nghĩ lại cách giải quyết tốt và ôn hòa hơn xem nhé! 💡"}
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
                  Hoàn thành
                </Button>
              </VStack>
            )}

          </Box>
        </Box>
      )}

    </Box>
  );
}
