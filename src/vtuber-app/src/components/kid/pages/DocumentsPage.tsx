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
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử nhật ký cảm xúc của bé?")) {
      const defaultLogs = [
        { id: "1", emotion: "Vui vẻ 😄", note: "Bé đã học bài nhận biết cảm xúc đạt điểm tối đa.", date: "24 Thg 8, 2026" },
        { id: "2", emotion: "Hào hứng 😻", note: "Bé trò chuyện cùng người bạn thông minh Momo rất ngoan.", date: "25 Thg 8, 2026" },
        { id: "3", emotion: "Lo sợ 😨", note: "Bé ban đầu còn bỡ ngỡ nhưng đã nhanh chóng tự tin dọn dẹp đồ chơi.", date: "26 Thg 8, 2026" }
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
          Biểu đồ phân tích mức độ cân bằng cảm xúc của bé và các thông số cài đặt quản trị của phụ huynh.
        </Text>
      </VStack>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spaceX={{ base: 0, lg: 6 }} spaceY={{ base: 6, lg: 0 }}>
        
        {/* Left Column: Emotion Charts & Advisor */}
        <VStack spaceY={6} alignItems="stretch">
          
          {/* Weekly Emotion Chart */}
          <Box p={6} bg="#FFFFFF" borderRadius="3xl" border="1px solid" borderColor="#E2E8F0" boxShadow="xs">
            <Heading size="xs" color="#0F172A" fontWeight="bold" mb={4}>
              Biểu đồ xu hướng cảm xúc tuần này
            </Heading>
            
            <VStack spaceY={4} alignItems="stretch">
              {/* Happy emotion bar */}
              <VStack spaceY={1.5} alignItems="stretch">
                <HStack justifyContent="space-between" fontSize="xs" fontWeight="bold" color="#334155">
                  <Text>Vui vẻ & Hạnh phúc (😊)</Text>
                  <Text color="#7C3AED">60% thời gian</Text>
                </HStack>
                <Box w="100%" bg="#F1F5F9" h="8px" borderRadius="full" overflow="hidden">
                  <Box w="60%" bg="#7C3AED" h="100%" borderRadius="full" />
                </Box>
              </VStack>

              {/* Proud emotion bar */}
              <VStack spaceY={1.5} alignItems="stretch">
                <HStack justifyContent="space-between" fontSize="xs" fontWeight="bold" color="#334155">
                  <Text>Tự hào & Tự tin (😻)</Text>
                  <Text color="#0EA5E9">25% thời gian</Text>
                </HStack>
                <Box w="100%" bg="#F1F5F9" h="8px" borderRadius="full" overflow="hidden">
                  <Box w="25%" bg="#0EA5E9" h="100%" borderRadius="full" />
                </Box>
              </VStack>

              {/* Anxious emotion bar */}
              <VStack spaceY={1.5} alignItems="stretch">
                <HStack justifyContent="space-between" fontSize="xs" fontWeight="bold" color="#334155">
                  <Text>Lo lắng & Sợ hãi (😰)</Text>
                  <Text color="#D97706">15% thời gian</Text>
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
              <Heading size="xs" fontWeight="extrabold">Tư vấn giáo dục từ Momo AI</Heading>
            </HStack>
            <Text fontSize="xs" color="#5B21B6" lineHeight="relaxed" fontWeight="medium">
              Bé <strong>{kidName}</strong> thể hiện sự phản xạ thấu cảm và dũng cảm rất cao trong 3 bài tập cảm xúc thực tế. Khuyên ba mẹ tiếp tục khích lệ bé nói lời cảm ơn và giúp đỡ việc nhỏ trong gia đình.
            </Text>
          </Box>

        </VStack>

        {/* Right Column: Time Limits & History actions */}
        <VStack spaceY={6} alignItems="stretch">
          
          {/* Time & Privacy settings */}
          <Box p={6} bg="#FFFFFF" borderRadius="3xl" border="1px solid" borderColor="#E2E8F0" boxShadow="xs">
            <Heading size="xs" color="#0F172A" fontWeight="bold" mb={4}>
              Quản lý thời gian & Quyền riêng tư
            </Heading>

            <VStack spaceY={4} alignItems="stretch">
              
              {/* Playtime Slider */}
              <VStack spaceY={2.5} alignItems="stretch">
                <HStack justifyContent="space-between" fontSize="xs" fontWeight="bold" color="#334155">
                  <HStack spaceX={1.5} color="#64748B">
                    <FiClock size={12} />
                    <Text>Giới hạn thời gian sử dụng</Text>
                  </HStack>
                  <Text color="#7C3AED">{playTime} phút</Text>
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
                <Text fontSize="xs" fontWeight="bold" color="#334155">Gửi báo cáo qua Email hàng tuần</Text>
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
                <Text fontSize="xs" fontWeight="bold" color="#334155">Nhận thông báo khi bé gặp khó khăn cảm xúc</Text>
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
                Xóa lịch sử nhật ký cảm xúc
              </Button>

            </VStack>
          </Box>

        </VStack>

      </SimpleGrid>

    </Box>
  );
}
