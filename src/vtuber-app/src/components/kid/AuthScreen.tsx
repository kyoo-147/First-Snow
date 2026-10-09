import { Box, Flex, Heading, Text, VStack } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/button";

interface AuthScreenProps {
  onLoginSuccess?: (email: string) => void;
}

/**
 * Legacy VTuber-shell entrypoint.
 *
 * Authentication is owned by Snow's server-backed child session flow. This
 * screen intentionally does not accept credentials or simulate authentication.
 */
export default function AuthScreen(_props: AuthScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const continueToSnow = () => {
    window.location.assign("/child-login?callbackUrl=%2Fcompanion%2Favatar");
  };

  return (
    <Flex minH="100vh" alignItems="center" justifyContent="center" bg="#F8FAFC" p={6}>
      <Box maxW="460px" width="100%" rounded="3xl" border="1px solid" borderColor="#E2E8F0" bg="white" p={{ base: 7, md: 10 }}>
        <VStack align="stretch" gap={5}>
          <Text color="#0E7490" fontSize="sm" fontWeight="bold">
            AgentKid Snow
          </Text>
          <Heading color="#0F172A" size="2xl">
            {t("auth.title")}
          </Heading>
          <Text color="#475569" lineHeight="tall">
            {t("auth.desc")}
          </Text>
          <Button onClick={continueToSnow} width="100%" borderRadius="full" bg="#0EA5E9" color="white">
            {t("auth.continue")}
          </Button>
        </VStack>
      </Box>
    </Flex>
  );
}
