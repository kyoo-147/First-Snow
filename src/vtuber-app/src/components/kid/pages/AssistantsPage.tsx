import { Box, SimpleGrid, VStack, HStack, Text, Heading } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { Button } from "../../ui/button";

const momoMascot = "./images/momo-mascot-v2.png";

interface Assistant {
  id: string;
  name: string;
  nameKey: string;
  avatar: string;
  roleKey: string;
  color: string;
  skillsKeys: string[];
}

const ASSISTANTS: Assistant[] = [
  {
    id: "coteacher",
    name: "AI Coteacher",
    nameKey: "kid.assistant1Name",
    avatar: momoMascot,
    roleKey: "kid.assistant1Role",
    color: "#6366F1",
    skillsKeys: ["kid.assistant1Skill1", "kid.assistant1Skill2", "kid.assistant1Skill3"]
  },
  {
    id: "commoncore",
    name: "Common Core Bot",
    nameKey: "kid.assistant2Name",
    avatar: momoMascot,
    roleKey: "kid.assistant2Role",
    color: "#E11D48",
    skillsKeys: ["kid.assistant2Skill1", "kid.assistant2Skill2", "kid.assistant2Skill3"]
  },
  {
    id: "curriculum",
    name: "Curriculum Advisor",
    nameKey: "kid.assistant3Name",
    avatar: momoMascot,
    roleKey: "kid.assistant3Role",
    color: "#06B6D4",
    skillsKeys: ["kid.assistant3Skill1", "kid.assistant3Skill2", "kid.assistant3Skill3"]
  }
];

export default function AssistantsPage(): React.JSX.Element {
  const { t } = useTranslation();
  return (
    <Box width="100%">
      
      {/* Page Title & Desc */}
      <VStack spaceY={1.5} alignItems="flex-start" mb={6}>
        <Heading size="md" color="#0F172A" fontWeight="bold">
          {t("kid.assistantsPlayground")}
        </Heading>
        <Text fontSize="xs" color="#64748B">
          {t("kid.assistantsDesc")}
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
                  <Heading size="xs" color="#0F172A" fontWeight="bold">{t(ass.nameKey)}</Heading>
                  <Text fontSize="10px" color={ass.color} fontWeight="bold">{t(ass.roleKey)}</Text>
                </VStack>
              </HStack>

              <HStack wrap="wrap" gap={1.5} pt={1} width="100%">
                {ass.skillsKeys.map((skillKey, index) => (
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
                    {t(skillKey)}
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
              {t("kid.chatNowBtn")}
            </Button>
          </Box>
        ))}
      </SimpleGrid>

    </Box>
  );
}
