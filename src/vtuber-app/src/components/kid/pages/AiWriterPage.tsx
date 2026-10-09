import { Box, VStack, HStack, Text, Heading, SimpleGrid } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../ui/button";

const momoMascot = "./images/momo_mascot.png";

interface Companion {
  id: string;
  name: string;
  avatar: string;
  role: string;
  description: string;
  color: string;
  status: "Active" | "Resting" | "Offline";
}

const COMPANIONS: Companion[] = [
  {
    id: "momo",
    name: "Bạn đồng hành Momo",
    avatar: momoMascot,
    role: "kid.roleEmotionalCompanion",
    description: "Người bạn ảo 3D/Live2D đáng yêu sẵn sàng trò chuyện, kể chuyện cổ tích, giải đáp các thắc mắc và ôm ấp vỗ về cảm xúc của con suốt cả ngày.",
    color: "#7C3AED",
    status: "Active"
  },
  {
    id: "luna",
    name: "Gia sư Tiếng Anh Luna",
    avatar: momoMascot,
    role: "kid.roleLanguageTutor",
    description: "Giáo viên tiếng Anh bản xứ ảo giúp con làm quen từ vựng, học giao tiếp phản xạ tự nhiên thông qua hình thức đố vui tiếng Anh ngộ nghĩnh.",
    color: "#EC4899",
    status: "Resting"
  }
];

interface AiWriterPageProps {
  onLaunchVtuber: () => void;
}

export default function AiWriterPage({ onLaunchVtuber }: AiWriterPageProps): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <Box width="100%">
      
      {/* Page Title & Desc */}
      <VStack spaceY={1.5} alignItems="flex-start" mb={6}>
        <Heading size="md" color="#0F172A" fontWeight="bold">
          Không gian bạn đồng hành Momo AI
        </Heading>
        <Text fontSize="xs" color="#64748B">
          Lựa chọn người bạn học tập thông minh và khởi chạy không gian Live2D Vtuber tương tác giọng nói trực tiếp.
        </Text>
      </VStack>

      <SimpleGrid columns={{ base: 1, md: 2 }} spaceX={6} spaceY={6}>
        {COMPANIONS.map((comp) => (
          <Box
            key={comp.id}
            p={6}
            bg="#FFFFFF"
            border="1px solid"
            borderColor="#E2E8F0"
            borderRadius="3xl"
            boxShadow="xs"
            display="flex"
            flexDirection="column"
            justifyContent="space-between"
            h="280px"
            position="relative"
            overflow="hidden"
          >
            {/* Background glowing sphere decoration */}
            <Box
              position="absolute"
              right="-20px"
              bottom="-20px"
              w="120px"
              h="120px"
              borderRadius="full"
              bg={comp.color}
              opacity="0.04"
              filter="blur(16px)"
            />

            <VStack spaceY={3} alignItems="flex-start">
              <HStack justifyContent="space-between" width="100%">
                <Box
                  w="54px"
                  h="54px"
                  borderRadius="2xl"
                  bg="#F5F3FF"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  p={2}
                >
                  <img src={comp.avatar} alt="" style={{ width: "100%", height: "auto", objectFit: "contain" }} />
                </Box>
                
                <Box
                  px={2.5}
                  py={0.5}
                  bg={comp.status === "Active" ? "#ECFDF5" : "#F1F5F9"}
                  color={comp.status === "Active" ? "#10B981" : "#64748B"}
                  borderRadius="full"
                  fontSize="9px"
                  fontWeight="extrabold"
                >
                  {comp.status === "Active"
                    ? t("kid.companionActive")
                    : comp.status === "Resting"
                      ? t("kid.companionResting")
                      : t("kid.companionOffline")}
                </Box>
              </HStack>

              <VStack spaceY={0.5} alignItems="flex-start" mt={2}>
                <Heading size="xs" color="#0F172A" fontWeight="bold">
                  {comp.name}
                </Heading>
                <Text fontSize="10px" color={comp.color} fontWeight="bold">
                  {t(comp.role)}
                </Text>
              </VStack>

              <Text fontSize="11px" color="#64748B" lineHeight="relaxed">
                {comp.description}
              </Text>
            </VStack>

            <Button
              onClick={comp.id === "momo" ? onLaunchVtuber : undefined}
              disabled={comp.id !== "momo"}
              w="100%"
              h="40px"
              bg={comp.id === "momo" ? comp.color : "#E2E8F0"}
              color={comp.id === "momo" ? "white" : "#94A3B8"}
              borderRadius="xl"
              fontSize="xs"
              fontWeight="bold"
              _hover={comp.id === "momo" ? { filter: "brightness(0.9)" } : {}}
            >
              {comp.id === "momo" ? "Khởi chạy Bạn đồng hành (Live2D)" : "Đang phát triển"}
            </Button>
          </Box>
        ))}
      </SimpleGrid>

    </Box>
  );
}
