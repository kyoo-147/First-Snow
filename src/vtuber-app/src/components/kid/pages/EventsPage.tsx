import { Box, SimpleGrid, VStack, HStack, Text, Heading } from "@chakra-ui/react";
import { Button } from "../../ui/button";
import { FiClock, FiMapPin, FiCalendar } from "react-icons/fi";

interface EventItem {
  id: string;
  title: string;
  time: string;
  type: string;
  host: string;
  color: string;
  joined: boolean;
}

const EVENTS: EventItem[] = [
  {
    id: "event-1",
    title: "Trò chuyện EQ: Nhận biết nụ cười cùng Momo",
    time: "12:00 PM - 01:00 PM (Hôm nay)",
    type: "Momo Live Chat",
    host: "Companion Bot Momo",
    color: "#7C3AED",
    joined: false
  },
  {
    id: "event-2",
    title: "Học ngoại ngữ: Phát âm tiếng Anh chuẩn cùng Luna",
    time: "03:30 PM - 04:30 PM (Ngày mai)",
    type: "AI English Class",
    host: "Luna Tutor",
    color: "#EC4899",
    joined: true
  },
  {
    id: "event-3",
    title: "Kể chuyện tối: Câu chuyện về chú rùa dũng cảm",
    time: "08:00 PM - 09:00 PM (12/06)",
    type: "Bedtime Storytime",
    host: "Momo Assistant",
    color: "#D97706",
    joined: false
  }
];

export default function EventsPage(): React.JSX.Element {
  return (
    <Box width="100%">
      
      {/* Page Title & Desc */}
      <VStack spaceY={1.5} alignItems="flex-start" mb={6}>
        <Heading size="md" color="#0F172A" fontWeight="bold">
          Lịch hoạt động & Sự kiện học tập
        </Heading>
        <Text fontSize="xs" color="#64748B">
          Tham gia các buổi trò chuyện, lớp học tương tác trực tuyến cùng biệt đội Momo AI trợ lý.
        </Text>
      </VStack>

      <SimpleGrid columns={{ base: 1, lg: 3 }} spaceX={6} spaceY={6} alignItems="flex-start">
        
        {/* Calendar View (Left, Span 2) */}
        <VStack spaceY={6} alignItems="stretch" gridColumn={{ lg: "span 2" }}>
          
          {/* Monthly Calendar Mockup grid */}
          <Box p={6} bg="#FFFFFF" borderRadius="3xl" border="1px solid" borderColor="#E2E8F0" boxShadow="xs">
            <HStack justifyContent="space-between" mb={5}>
              <Heading size="xs" color="#0F172A" fontWeight="bold">
                Tháng 6, 2026
              </Heading>
              <HStack spaceX={2}>
                <Button size="xs" variant="outline" borderColor="#E2E8F0" borderRadius="lg" bg="white" color="#475569">◀</Button>
                <Button size="xs" variant="outline" borderColor="#E2E8F0" borderRadius="lg" bg="white" color="#475569">Tuần này</Button>
                <Button size="xs" variant="outline" borderColor="#E2E8F0" borderRadius="lg" bg="white" color="#475569">▶</Button>
              </HStack>
            </HStack>

            {/* Days grid layout matching mockup standard */}
            <SimpleGrid columns={7} spaceX={2} spaceY={2} textAlign="center" fontSize="11px" fontWeight="bold" color="#64748B" mb={2}>
              {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map(d => <Box key={d} py={1}>{d}</Box>)}
            </SimpleGrid>

            <SimpleGrid columns={7} spaceX={2} spaceY={2} textAlign="center" fontSize="11px" fontWeight="bold">
              {/* Offset prefix days */}
              {[31].map(d => (
                <Box key={d} py={2} color="#CBD5E1" bg="transparent" borderRadius="lg">{d}</Box>
              ))}
              
              {/* Normal June days */}
              {Array.from({ length: 30 }, (_, i) => i + 1).map(d => {
                const isToday = d === 9;
                return (
                  <Box
                    key={d}
                    py={2.5}
                    color={isToday ? "#FFFFFF" : "#475569"}
                    bg={isToday ? "#7C3AED" : "#F8FAFC"}
                    borderRadius="xl"
                    cursor="pointer"
                    _hover={isToday ? {} : { bg: "#EDE9FE", color: "#7C3AED" }}
                  >
                    {d}
                  </Box>
                );
              })}
            </SimpleGrid>
          </Box>

        </VStack>

        {/* Upcoming events timeline list (Right Column) */}
        <VStack spaceY={4} alignItems="stretch">
          <Heading size="xs" color="#0F172A" fontWeight="bold">
            Sự kiện sắp diễn ra
          </Heading>

          {EVENTS.map((event) => (
            <Box
              key={event.id}
              p={5}
              bg="#FFFFFF"
              border="1px solid"
              borderColor="#E2E8F0"
              borderLeft="4px solid"
              borderLeftColor={event.color}
              borderRadius="2xl"
              boxShadow="xs"
            >
              <VStack spaceY={2} alignItems="flex-start" width="100%">
                <HStack justifyContent="space-between" width="100%" alignItems="center">
                  <Box
                    px={2}
                    py={0.5}
                    bg="#F1F5F9"
                    color="#475569"
                    borderRadius="md"
                    fontSize="8px"
                    fontWeight="extrabold"
                    textTransform="uppercase"
                  >
                    {event.type}
                  </Box>
                  {event.joined && (
                    <Text fontSize="9px" color="#10B981" fontWeight="bold">✓ Đã đăng ký</Text>
                  )}
                </HStack>

                <Heading size="xs" color="#0F172A" fontWeight="bold" lineHeight="short">
                  {event.title}
                </Heading>

                <HStack spaceX={1.5} color="#64748B" fontSize="10px" fontWeight="semibold" pt={1}>
                  <FiClock size={11} />
                  <Text>{event.time}</Text>
                </HStack>
                
                <HStack spaceX={1.5} color="#64748B" fontSize="10px" fontWeight="semibold" mt={-1}>
                  <FiMapPin size={11} />
                  <Text>Host: {event.host}</Text>
                </HStack>

                <Button
                  size="sm"
                  w="100%"
                  bg={event.joined ? "#ECFDF5" : event.color}
                  color={event.joined ? "#10B981" : "white"}
                  border={event.joined ? "1px solid" : "none"}
                  borderColor={event.joined ? "#A7F3D0" : "none"}
                  borderRadius="xl"
                  fontWeight="bold"
                  fontSize="xs"
                  _hover={event.joined ? {} : { filter: "brightness(0.9)" }}
                  mt={2}
                >
                  {event.joined ? "Đang chờ lớp" : "Đăng ký tham gia"}
                </Button>
              </VStack>
            </Box>
          ))}
        </VStack>

      </SimpleGrid>

    </Box>
  );
}
