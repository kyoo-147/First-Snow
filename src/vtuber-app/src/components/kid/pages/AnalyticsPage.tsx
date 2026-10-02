import { Box, SimpleGrid, VStack, HStack, Text, Heading } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { FiTrendingUp, FiCheckCircle, FiActivity } from "react-icons/fi";

interface KidProfile {
  id: string;
  name: string;
  age: number;
  avatar: string;
  points?: number;
}

export default function AnalyticsPage(): React.JSX.Element {
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
          Analytics & EQ Development Dashboard
        </Heading>
        <Text fontSize="xs" color="#64748B">
          Báo cáo chi tiết về mức độ tiến bộ năng lực cảm xúc, điểm rèn luyện và thời lượng học tập.
        </Text>
      </VStack>

      <SimpleGrid columns={{ base: 1, lg: 3 }} spaceX={6} spaceY={6}>
        
        {/* Card 1: Points summary */}
        <Box p={6} bg="#FFFFFF" borderRadius="3xl" border="1px solid" borderColor="#E2E8F0" boxShadow="xs" display="flex" flexDirection="column" justifyContent="space-between" h="180px">
          <VStack spaceY={2.5} alignItems="flex-start">
            <HStack spaceX={2} color="#7C3AED">
              <FiTrendingUp size={16} />
              <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="0.05em">Điểm tích lũy rèn luyện</Text>
            </HStack>
            <Heading size="2xl" color="#0F172A" fontWeight="extrabold" letterSpacing="-0.02em" mt={1}>
              {kidPoints} XP
            </Heading>
          </VStack>
          <Text fontSize="10px" color="#94A3B8" fontWeight="semibold">
            Bé đạt top 10% học sinh xuất sắc nhất tuần này!
          </Text>
        </Box>

        {/* Card 2: Learning time */}
        <Box p={6} bg="#FFFFFF" borderRadius="3xl" border="1px solid" borderColor="#E2E8F0" boxShadow="xs" display="flex" flexDirection="column" justifyContent="space-between" h="180px">
          <VStack spaceY={2.5} alignItems="flex-start">
            <HStack spaceX={2} color="#0EA5E9">
              <FiActivity size={16} />
              <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="0.05em">Thời gian rèn luyện tuần</Text>
            </HStack>
            <Heading size="2xl" color="#0F172A" fontWeight="extrabold" letterSpacing="-0.02em" mt={1}>
              8.5 giờ
            </Heading>
          </VStack>
          <Text fontSize="10px" color="#94A3B8" fontWeight="semibold">
            Giới hạn tối đa khuyên nghị: 10 giờ / tuần.
          </Text>
        </Box>

        {/* Card 3: Lessons Completed */}
        <Box p={6} bg="#FFFFFF" borderRadius="3xl" border="1px solid" borderColor="#E2E8F0" boxShadow="xs" display="flex" flexDirection="column" justifyContent="space-between" h="180px">
          <VStack spaceY={2.5} alignItems="flex-start">
            <HStack spaceX={2} color="#10B981">
              <FiCheckCircle size={16} />
              <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" letterSpacing="0.05em">Bài học đã hoàn thành</Text>
            </HStack>
            <Heading size="2xl" color="#0F172A" fontWeight="extrabold" letterSpacing="-0.02em" mt={1}>
              {kidPoints >= 300 ? "3 / 3" : "0 / 3"} bài
            </Heading>
          </VStack>
          <Text fontSize="10px" color="#94A3B8" fontWeight="semibold">
            Đã hoàn thành toàn bộ khóa nhận thức cơ bản!
          </Text>
        </Box>

      </SimpleGrid>

      {/* Detail EQ Radar Breakdown */}
      <Box p={6} bg="#FFFFFF" borderRadius="3xl" border="1px solid" borderColor="#E2E8F0" boxShadow="xs" mt={6}>
        <Heading size="xs" color="#0F172A" fontWeight="bold" mb={5}>
          Chi tiết 5 nhóm năng lực trí tuệ cảm xúc (EQ) của {kidName}
        </Heading>

        <VStack spaceY={4.5} alignItems="stretch">
          {[
            { label: "1. Tự nhận thức (Self-Awareness) - Nhận diện biểu cảm khuôn mặt", val: "85%", color: "#7C3AED", desc: "Bé phản ứng rất nhanh với nụ cười và ánh mắt thân thiện của Momo." },
            { label: "2. Tự điều chỉnh (Self-Regulation) - Giữ bình tĩnh trước mâu thuẫn", val: "90%", color: "#EC4899", desc: "Bé chọn giải pháp ôn hòa cùng bạn nặn lại mô hình đất sét bị hỏng." },
            { label: "3. Thấu cảm (Empathy) - Hiểu và chia sẻ cảm xúc", val: "75%", color: "#0EA5E9", desc: "Bé thể hiện mong muốn được ôm gấu bông an ủi khi người khác buồn." },
            { label: "4. Động lực (Motivation) - Ham học hỏi và vươn lên", val: "80%", color: "#F59E0B", desc: "Bé hăng hái tham gia bài tập tình huống để tích lũy điểm thưởng." },
            { label: "5. Kỹ năng xã hội (Social Skills) - Giao tiếp ôn hòa", val: "85%", color: "#10B981", desc: "Bé tự tin chào hỏi và có phản xạ trò chuyện lịch sự tự nhiên." }
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
