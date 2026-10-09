import { Box, VStack, HStack, Text, Heading, SimpleGrid } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../ui/button";

const momoMascot = "./images/momo_mascot.png";

interface Companion {
  id: string;
  nameKey: string;
  avatar: string;
  roleKey: string;
  descriptionKey: string;
  color: string;
  status: "Active" | "Resting" | "Offline";
}

const COMPANIONS: Companion[] = [
  {
    id: "momo",
    nameKey: "kid.compMomoName",
    avatar: momoMascot,
    roleKey: "kid.roleEmotionalCompanion",
    descriptionKey: "kid.compMomoDesc",
    color: "#7C3AED",
    status: "Active"
  },
  {
    id: "luna",
    nameKey: "kid.compLunaName",
    avatar: momoMascot,
    roleKey: "kid.roleLanguageTutor",
    descriptionKey: "kid.compLunaDesc",
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
          {t("kid.writerTitle")}
        </Heading>
        <Text fontSize="xs" color="#64748B">
          {t("kid.writerDesc")}
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
                  {t(comp.nameKey)}
                </Heading>
                <Text fontSize="10px" color={comp.color} fontWeight="bold">
                  {t(comp.roleKey)}
                </Text>
              </VStack>

              <Text fontSize="11px" color="#64748B" lineHeight="relaxed">
                {t(comp.descriptionKey)}
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
              {comp.id === "momo" ? t("kid.launchVtuberBtn") : t("kid.inDevelopmentBtn")}
            </Button>
          </Box>
        ))}
      </SimpleGrid>

    </Box>
  );
}
