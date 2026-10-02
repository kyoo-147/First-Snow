import { Box, SimpleGrid, VStack, HStack, Text, Heading } from "@chakra-ui/react";
import { Button } from "../../ui/button";

const momoMascot = "./images/momo_mascot.png";

interface Assistant {
  id: string;
  name: string;
  avatar: string;
  role: string;
  color: string;
  skills: string[];
}

const ASSISTANTS: Assistant[] = [
  {
    id: "coteacher",
    name: "AI Coteacher",
    avatar: momoMascot,
    role: "Hỗ trợ học tập đa môn",
    color: "#6366F1",
    skills: ["Giải toán tiểu học", "Kể chuyện lịch sử", "Đố vui địa lý"]
  },
  {
    id: "commoncore",
    name: "Common Core Bot",
    avatar: momoMascot,
    role: "Ôn tập kiến thức nền tảng",
    color: "#E11D48",
    skills: ["Tiếng Việt lớp 1-3", "Tập viết chữ số", "Phép nhân cơ bản"]
  },
  {
    id: "curriculum",
    name: "Curriculum Advisor",
    avatar: momoMascot,
    role: "Lên thời khóa biểu & lộ trình",
    color: "#06B6D4",
    skills: ["Gợi ý lộ trình EQ", "Phân phối giờ chơi", "Lời khuyên ba mẹ"]
  }
];

export default function AssistantsPage(): React.JSX.Element {
  return (
    <Box width="100%">
      
      {/* Page Title & Desc */}
      <VStack spaceY={1.5} alignItems="flex-start" mb={6}>
        <Heading size="md" color="#0F172A" fontWeight="bold">
          AI Assistants Playground
        </Heading>
        <Text fontSize="xs" color="#64748B">
          Gặp gỡ biệt đội trợ lý AI học tập đa tài giúp bé rèn luyện kỹ năng toàn diện.
        </Text>
      </VStack>

      <SimpleGrid columns={{ base: 1, md: 3 }} spaceX={6} spaceY={6}>
        {ASSISTANTS.map((ass) => (
          <Box
            key={ass.id}
            p={6}
            bg="#FFFFFF"
            border="1px solid"
            borderColor="#E2E8F0"
            borderRadius="3xl"
            boxShadow="xs"
            display="flex"
            flexDirection="column"
            justifyContent="space-between"
            h="240px"
          >
            <VStack spaceY={3.5} alignItems="flex-start" width="100%">
              <HStack spaceX={3}>
                <Box w="42px" h="42px" borderRadius="xl" bg="#F8FAFC" p={1.5}>
                  <img src={ass.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </Box>
                <VStack spaceY={0} alignItems="flex-start">
                  <Heading size="xs" color="#0F172A" fontWeight="bold">{ass.name}</Heading>
                  <Text fontSize="10px" color={ass.color} fontWeight="bold">{ass.role}</Text>
                </VStack>
              </HStack>

              <HStack wrap="wrap" gap={1.5} pt={1} width="100%">
                {ass.skills.map((skill, index) => (
                  <Box
                    key={index}
                    px={2.5}
                    py={1}
                    bg="#F1F5F9"
                    color="#475569"
                    borderRadius="lg"
                    fontSize="10px"
                    fontWeight="bold"
                  >
                    {skill}
                  </Box>
                ))}
              </HStack>
            </VStack>

            <Button
              w="100%"
              h="36px"
              bg="#F8FAFC"
              color="#0F172A"
              border="1px solid"
              borderColor="#E2E8F0"
              borderRadius="xl"
              fontSize="xs"
              fontWeight="bold"
              _hover={{ bg: "#F1F5F9", borderColor: "#CBD5E1" }}
            >
              Trò chuyện ngay
            </Button>
          </Box>
        ))}
      </SimpleGrid>

    </Box>
  );
}
