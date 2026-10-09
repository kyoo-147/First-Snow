import { Box, Flex, SimpleGrid, VStack, HStack, Text, Heading, Input } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "../../ui/button";

export default function DashboardPage(): React.JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [kidName, setKidName] = useState<string>("Bé");

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

  return (
    <Box width="100%" fontFamily="'Inter', system-ui, sans-serif">
      
      {/* Category Nav Filters (Top Row) */}
      <HStack spaceX={2.5} mb={6} overflowX="auto" pb={1} css={{ "&::-webkit-scrollbar": { display: "none" } }}>
        <Box px={4} py={2} bg="#7C3AED" color="white" borderRadius="full" fontSize="12px" fontWeight="bold" cursor="pointer">
          ✦ Tất cả
        </Box>
        {["Bài học EQ", "Thời khóa biểu", "Bạn bè ảo", "Nhật ký của bé", "Báo cáo phụ huynh", "Cài đặt"].map((tag) => (
          <Box
            key={tag}
            px={4}
            py={2}
            bg="#FFFFFF"
            color="#475569"
            border="1px solid #E2E8F0"
            borderRadius="full"
            fontSize="12px"
            fontWeight="semibold"
            cursor="pointer"
            _hover={{ bg: "#F8FAFC", color: "#0F172A", borderColor: "#CBD5E1" }}
            transition="all 0.15s"
            display="flex"
            alignItems="center"
            gap="6px"
          >
            {tag === "Bài học EQ" && <span>🤖</span>}
            {tag === "Thời khóa biểu" && <span>📅</span>}
            {tag === "Bạn bè ảo" && <span>👥</span>}
            {tag === "Nhật ký của bé" && <span>🕒</span>}
            {tag === "Báo cáo phụ huynh" && <span>📄</span>}
            {tag === "Cài đặt" && <span>⚙️</span>}
            {tag}
          </Box>
        ))}
      </HStack>

      <Flex flexDirection={{ base: "column", xl: "row" }} gap={6} alignItems="flex-start" width="100%">
        
        {/* ================= LEFT MAIN COLUMN (~60%) ================= */}
        <VStack spaceY={6} alignItems="stretch" flex="1.4" minW={0} w="100%">
          
          {/* Hero Banner Box */}
          <Box p={7} bgGradient="linear(to-br, #FFF0F5, #E0F2FE)" borderRadius="3xl" position="relative" w="100%">
            <Heading size="md" color="#0F172A" fontWeight="bold" letterSpacing="-0.02em" mb={5}>
              Chào mừng {kidName} đến với Momo Land!
            </Heading>
            
            <Box bg="white" borderRadius="full" p={1.5} display="flex" alignItems="center" boxShadow="sm" maxW="450px" mb={5}>
              <Input
                variant="flushed"
                placeholder="Tìm chủ đề vui vẻ, vượt qua nỗi sợ..."
                pl={4}
                fontSize="13px"
                _placeholder={{ color: "#94A3B8", fontWeight: "medium" }}
                h="36px"
                flexGrow={1}
              />
              <Box
                w="36px"
                h="36px"
                borderRadius="full"
                bgGradient="linear(to-br, #A78BFA, #3B82F6)"
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="white"
                flexShrink={0}
                cursor="pointer"
                boxShadow="sm"
                _hover={{ filter: "brightness(1.1)" }}
              >
                ✦
              </Box>
            </Box>

            <HStack spaceX={3} flexWrap="wrap" gapY={2}>
              {["Giữ bình tĩnh", "Nhận biết biểu cảm", "Kể chuyện tối"].map((pill) => (
                <Box key={pill} px={4} py={1.5} bg="white" color="#64748B" borderRadius="full" fontSize="11px" fontWeight="bold" boxShadow="sm" cursor="pointer" _hover={{ color: "#7C3AED" }}>
                  {pill}
                </Box>
              ))}
            </HStack>
          </Box>

          {/* Recently Launched (Bài học gợi ý) */}
          <VStack alignItems="stretch" spaceY={4} w="100%">
            <HStack justify="space-between">
              <Heading size="sm" color="#0F172A" fontWeight="bold">Bài học gợi ý</Heading>
              <Box onClick={() => navigate("/ai-teachers")} px={4} py={1.5} border="1px solid #E2E8F0" borderRadius="full" fontSize="11px" fontWeight="bold" color="#475569" cursor="pointer" _hover={{ bg: "#F8FAFC" }}>
                Xem tất cả
              </Box>
            </HStack>
            
            <SimpleGrid columns={{ base: 1, md: 3 }} spaceX={4} spaceY={4}>
              {[
                { tag: "kid.tagEqCourse", title: "Nhận Biết Cảm Xúc", desc: "Học cách nhận biết Vui, Buồn, Giận dữ qua biểu cảm.", date: "Hôm nay", tagColor: "#8B5CF6", bgTag: "#EDE9FE" },
                { tag: "kid.tagEqCourse", title: "Giải Quyết Mâu Thuẫn", desc: "Làm gì khi bị bạn vô tình làm hỏng đồ chơi?", date: "Hôm qua", tagColor: "#EC4899", bgTag: "#FCE7F3" },
                { tag: "kid.tagEqCourse", title: "Vượt Qua Nỗi Sợ", desc: "Cách bé tự tạo cảm giác an toàn và dũng cảm.", date: "24 Thg 8, 2026", tagColor: "#F59E0B", bgTag: "#FEF3C7" },
              ].map((item, idx) => (
                <Box key={idx} p={4} bg="white" border="1px solid #E2E8F0" borderRadius="2xl" display="flex" flexDirection="column" justifyContent="space-between" h="160px" _hover={{ boxShadow: "sm", borderColor: "#CBD5E1" }} transition="all 0.2s">
                  <VStack alignItems="flex-start" spaceY={3}>
                    <Box px={2.5} py={0.5} bg={item.bgTag} color={item.tagColor} borderRadius="md" fontSize="9px" fontWeight="extrabold">{t(item.tag)}</Box>
                    <VStack alignItems="flex-start" spaceY={1}>
                      <Heading size="xs" color="#0F172A" fontWeight="bold" lineClamp={1}>{item.title}</Heading>
                      <Text fontSize="11px" color="#64748B" lineClamp={2} lineHeight="short">{item.desc}</Text>
                    </VStack>
                  </VStack>
                  <HStack justify="space-between" width="100%" pt={3} borderTop="1px dotted #E2E8F0">
                    <HStack spaceX={1.5} color="#94A3B8" fontSize="10px" fontWeight="medium">
                      <span>📅</span>
                      <Text>{item.date}</Text>
                    </HStack>
                    <Box as="span" bg="#7C3AED" color="white" borderRadius="full" w="20px" h="20px" display="flex" alignItems="center" justifyContent="center" fontSize="10px" cursor="pointer" _hover={{ bg: "#6D28D9" }}>➔</Box>
                  </HStack>
                </Box>
              ))}
            </SimpleGrid>
          </VStack>

          {/* Documents (Nhật ký hoạt động) */}
          <VStack alignItems="stretch" spaceY={4} w="100%">
            <HStack justify="space-between">
              <Heading size="sm" color="#0F172A" fontWeight="bold">Nhật ký hoạt động</Heading>
              <HStack spaceX={2}>
                <Box px={3} py={1.5} border="1px solid #E2E8F0" borderRadius="lg" fontSize="11px" fontWeight="bold" color="#475569" cursor="pointer" bg="white" _hover={{ bg: "#F8FAFC" }}>+ Ghi chép mới</Box>
                <Box px={2.5} py={1.5} border="1px solid #E2E8F0" borderRadius="lg" color="#475569" cursor="pointer" bg="white" _hover={{ bg: "#F8FAFC" }}>⋮</Box>
              </HStack>
            </HStack>

            <Box bg="white" p={5} borderRadius="3xl" border="1px solid #E2E8F0" display="flex" flexDirection="column" gap={0}>
              {[
                { icon: "😊", title: "Hoàn thành xuất sắc bài học", desc: "Quản lý cơn giận cùng Momo", date: "Hôm nay", color: "#8B5CF6" },
                { icon: "📚", title: "Trò chuyện cùng Luna", desc: "Học 10 từ vựng tiếng Anh", date: "Hôm qua", color: "#F59E0B" },
                { icon: "🌙", title: "Nghe kể chuyện tối", desc: "Chú rùa dũng cảm", date: "24 Thg 8, 2026", color: "#EC4899" }
              ].map((doc, idx) => (
                <HStack key={idx} justify="space-between" py={4} borderBottom={idx === 2 ? "none" : "1px solid #F1F5F9"}>
                  <HStack spaceX={4}>
                    <Box w="40px" h="40px" borderRadius="xl" bg={`${doc.color}15`} color={doc.color} display="flex" alignItems="center" justifyContent="center" fontSize="xl" flexShrink={0}>
                      {doc.icon}
                    </Box>
                    <VStack alignItems="flex-start" spaceY={0.5}>
                      <Heading size="xs" color="#0F172A" fontWeight="bold">{doc.title}</Heading>
                      <Text fontSize="11px" color="#64748B">{doc.desc}</Text>
                    </VStack>
                  </HStack>
                  <HStack spaceX={1.5} color="#94A3B8" fontSize="11px" fontWeight="medium">
                    <span>📅</span>
                    <Text display={{ base: "none", sm: "block" }}>{doc.date}</Text>
                  </HStack>
                </HStack>
              ))}
              <Button onClick={() => navigate("/documents")} w="100%" bg="#F5F3FF" color="#7C3AED" borderRadius="xl" fontSize="12px" fontWeight="bold" h="40px" _hover={{ bg: "#EDE9FE" }} mt={2}>
                Xem toàn bộ báo cáo
              </Button>
            </Box>
          </VStack>

        </VStack>


        {/* ================= RIGHT WIDGETS COLUMN (~40%) ================= */}
        <VStack spaceY={6} alignItems="stretch" flex="1" minW={0} w="100%">
          
          {/* Top Row: Screen Time & Quests */}
          <SimpleGrid columns={{ base: 1, sm: 2 }} spaceX={4} spaceY={4}>
            
            {/* Screen Time */}
            <Box bg="white" p={5} borderRadius="3xl" border="1px solid #E2E8F0" h="100%">
              <Heading size="xs" color="#0F172A" fontWeight="bold" mb={3}>Thời lượng sử dụng</Heading>
              <HStack alignItems="baseline" mb={4}>
                <Heading size="sm" color="#0F172A" fontWeight="bold">30 phút</Heading>
                <Text fontSize="11px" color="#64748B" fontWeight="medium">giới hạn mỗi ngày</Text>
              </HStack>
              <Box w="100%" h="6px" borderRadius="full" overflow="hidden" display="flex" mb={3}>
                <Box w="30%" bg="#8B5CF6" />
                <Box w="20%" bg="#3B82F6" />
                <Box w="50%" bg="#E2E8F0" />
              </Box>
              <HStack spaceX={3} fontSize="9px" fontWeight="bold" color="#64748B" mb={4} flexWrap="wrap" gapY={2}>
                <HStack spaceX={1}><Box w="6px" h="6px" borderRadius="full" bg="#8B5CF6"/><Text>Đã dùng</Text></HStack>
                <HStack spaceX={1}><Box w="6px" h="6px" borderRadius="full" bg="#3B82F6"/><Text>Gợi ý thêm</Text></HStack>
                <HStack spaceX={1}><Box w="6px" h="6px" borderRadius="full" bg="#E2E8F0" border="1px solid #CBD5E1"/><Text>Còn lại</Text></HStack>
              </HStack>
              <Text fontSize="10px" color="#64748B" lineHeight="relaxed">
                Thiết kế để bảo vệ mắt và cân bằng thời gian tương tác công nghệ cho bé.
              </Text>
            </Box>

            {/* Quests Checklist */}
            <Box bg="white" p={5} borderRadius="3xl" border="1px solid #E2E8F0" h="100%" position="relative">
              <Heading size="xs" color="#0F172A" fontWeight="bold" mb={3}>Nhiệm vụ EQ hôm nay</Heading>
              <VStack spaceY={2.5} alignItems="stretch" mb={4}>
                {[
                  { label: "Tương tác Momo 15p", done: true },
                  { label: "Hoàn thành 1 bài EQ", done: true },
                  { label: "Nghe kể chuyện", done: true },
                  { label: "Ôn tập toán tư duy", done: false },
                ].map((quest, idx) => (
                  <HStack key={idx} spaceX={2.5}>
                    <Box w="14px" h="14px" borderRadius="full" bg={quest.done ? "#3B82F6" : "transparent"} border={quest.done ? "none" : "1.5px solid #CBD5E1"} display="flex" alignItems="center" justifyContent="center" color="white" fontSize="8px" flexShrink={0}>
                      {quest.done && "✓"}
                    </Box>
                    <Text fontSize="11px" color={quest.done ? "#0F172A" : "#64748B"} fontWeight={quest.done ? "semibold" : "medium"}>{quest.label}</Text>
                  </HStack>
                ))}
              </VStack>
              <Box position="absolute" bottom={5} left={5}>
                <Box as="span" bg="#F5F3FF" color="#7C3AED" borderRadius="full" px={3} py={1} fontSize="10px" fontWeight="bold" cursor="pointer" _hover={{ bg: "#EDE9FE" }}>
                  Xem chi tiết ➔
                </Box>
              </Box>
            </Box>
            
          </SimpleGrid>

          {/* Assistants Block */}
          <Box bg="white" p={6} borderRadius="3xl" border="1px solid #E2E8F0">
            <Box bg="#8B5CF6" color="white" px={3} py={1} borderRadius="md" fontSize="10px" fontWeight="extrabold" display="inline-block" mb={5}>
              BẠN BÈ ẢO
            </Box>
            <SimpleGrid columns={2} spaceX={4}>
              <VStack alignItems="stretch" spaceY={4}>
                <Heading size="xs" color="#0F172A" fontWeight="bold">Trò chuyện cùng...</Heading>
                <VStack alignItems="stretch" spaceY={3}>
                  <HStack spaceX={2.5}><Box w="24px" h="24px" borderRadius="full" bg="#F5F3FF" display="flex" alignItems="center" justifyContent="center" fontSize="12px">🤖</Box><Text fontSize="11px" color="#475569" fontWeight="medium">Momo (EQ)</Text></HStack>
                  <HStack spaceX={2.5}><Box w="24px" h="24px" borderRadius="full" bg="#FCE7F3" display="flex" alignItems="center" justifyContent="center" fontSize="12px">👩</Box><Text fontSize="11px" color="#475569" fontWeight="medium">{t("kid.assistantLunaEnglish")}</Text></HStack>
                  <HStack spaceX={2.5}><Box w="24px" h="24px" borderRadius="full" bg="#E0F2FE" display="flex" alignItems="center" justifyContent="center" fontSize="12px">🦊</Box><Text fontSize="11px" color="#475569" fontWeight="medium">Leo (Khám phá)</Text></HStack>
                </VStack>
                <Box onClick={() => navigate("/assistants")} mt={2} px={3} py={1} bg="#F5F3FF" color="#7C3AED" borderRadius="full" fontSize="10px" fontWeight="bold" display="inline-block" alignSelf="flex-start" cursor="pointer" _hover={{ bg: "#EDE9FE" }}>
                  Xem thêm ➔
                </Box>
              </VStack>

              <VStack alignItems="stretch" spaceY={4}>
                <Heading size="xs" color="#0F172A" fontWeight="bold">Khám phá...</Heading>
                <VStack alignItems="stretch" spaceY={3}>
                  <HStack spaceX={2.5}><Box w="24px" h="24px" borderRadius="lg" bg="#EEF2FF" display="flex" alignItems="center" justifyContent="center" fontSize="12px">📚</Box><Text fontSize="11px" color="#475569" fontWeight="medium">Bài học cảm xúc</Text></HStack>
                  <HStack spaceX={2.5}><Box w="24px" h="24px" borderRadius="lg" bg="#FEF3C7" display="flex" alignItems="center" justifyContent="center" fontSize="12px">🌙</Box><Text fontSize="11px" color="#475569" fontWeight="medium">Kể chuyện tối</Text></HStack>
                  <HStack spaceX={2.5}><Box w="24px" h="24px" borderRadius="lg" bg="#E0E7FF" display="flex" alignItems="center" justifyContent="center" fontSize="12px">🎨</Box><Text fontSize="11px" color="#475569" fontWeight="medium">Vẽ tranh AI</Text></HStack>
                </VStack>
              </VStack>
            </SimpleGrid>
          </Box>

          {/* Learning Schedule */}
          <Box bg="white" p={6} borderRadius="3xl" border="1px solid #E2E8F0">
            <HStack justify="space-between" mb={6}>
              <Heading size="sm" color="#0F172A" fontWeight="bold">Lịch trình học tập</Heading>
              <HStack spaceX={1.5} border="1px solid #E2E8F0" px={3} py={1.5} borderRadius="lg" cursor="pointer" _hover={{ bg: "#F8FAFC" }}>
                <Text fontSize="11px" fontWeight="bold" color="#475569">Tháng này</Text>
                <span>📅</span>
              </HStack>
            </HStack>

            <HStack justify="space-between" mb={5}>
              <Heading size="xs" color="#0F172A" fontWeight="bold">Tháng 6 2026</Heading>
              <HStack spaceX={2}>
                <Box w="24px" h="24px" bg="#F1F5F9" borderRadius="md" display="flex" alignItems="center" justifyContent="center" fontSize="10px" color="#64748B" cursor="pointer" _hover={{ bg: "#E2E8F0" }}>◀</Box>
                <Box w="24px" h="24px" bg="#F1F5F9" borderRadius="md" display="flex" alignItems="center" justifyContent="center" fontSize="10px" color="#64748B" cursor="pointer" _hover={{ bg: "#E2E8F0" }}>▶</Box>
              </HStack>
            </HStack>

            <SimpleGrid columns={7} textAlign="center" mb={3}>
              {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map(d => <Text key={d} fontSize="11px" fontWeight="bold" color="#94A3B8">{d}</Text>)}
            </SimpleGrid>
            <SimpleGrid columns={7} textAlign="center" mb={6}>
              {[8, 9, 10, 11, 12, 13, 14].map(d => (
                <Box key={d} display="flex" justifyContent="center">
                  <Box w="28px" h="28px" borderRadius="full" bg={d === 9 ? "#7C3AED" : "transparent"} color={d === 9 ? "white" : "#0F172A"} display="flex" alignItems="center" justifyContent="center" fontSize="12px" fontWeight="bold">
                    {d}
                  </Box>
                </Box>
              ))}
            </SimpleGrid>

            <Text fontSize="11px" fontWeight="bold" color="#64748B" mb={3}>Hôm nay</Text>
            <HStack p={4} bg="#F8FAFC" borderRadius="2xl" borderLeft="4px solid #7C3AED" spaceX={4}>
              <Box w="36px" h="36px" bg="white" borderRadius="xl" display="flex" alignItems="center" justifyContent="center" boxShadow="sm" flexShrink={0}>
                🤖
              </Box>
              <VStack alignItems="flex-start" spaceY={1} flexGrow={1}>
                <Heading size="xs" color="#0F172A" fontWeight="bold" lineClamp={1}>Trò chuyện: Nhận biết nụ cười</Heading>
                <Text fontSize="10px" color="#64748B" fontWeight="medium">12:00 - 01:00 PM</Text>
              </VStack>
              <Box onClick={() => navigate("/events")} px={3} py={1.5} bg="#7C3AED" color="white" borderRadius="lg" fontSize="10px" fontWeight="bold" cursor="pointer" flexShrink={0} _hover={{ bg: "#6D28D9" }}>
                Tham gia
              </Box>
            </HStack>
          </Box>

        </VStack>

      </Flex>
    </Box>
  );
}
