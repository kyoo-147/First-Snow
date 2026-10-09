import { Box, VStack, Text, Heading } from "@chakra-ui/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
// import { Button } from "../../ui/button";

export default function SpeechToTextPage(): React.JSX.Element {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  const [momoReply, setMomoReply] = useState<string>("");

  const handleMicClick = () => {
    if (isRecording) {
      setIsRecording(false);
      setTranscript(t("kid.defaultKidSpeech"));
      setTimeout(() => {
        setMomoReply(t("kid.defaultMomoSpeechReply"));
      }, 1000);
    } else {
      setIsRecording(true);
      setTranscript("");
      setMomoReply("");
    }
  };

  return (
    <Box width="100%">
      
      {/* Page Title & Desc */}
      <VStack spaceY={1.5} alignItems="flex-start" mb={6}>
        <Heading size="md" color="#0F172A" fontWeight="bold">
          {t("kid.speechTitle")}
        </Heading>
        <Text fontSize="xs" color="#64748B">
          {t("kid.speechDesc")}
        </Text>
      </VStack>

      <VStack spaceY={6} alignItems="center" bg="#FFFFFF" p={8} borderRadius="3xl" border="1px solid" borderColor="#E2E8F0" boxShadow="xs" maxW="600px" mx="auto">
        
        {/* Animated Microphone button */}
        <Box
          onClick={handleMicClick}
          cursor="pointer"
          w="84px"
          h="84px"
          borderRadius="full"
          bg={isRecording ? "#EF4444" : "#7C3AED"}
          color="white"
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontSize="3xl"
          position="relative"
          _hover={{ transform: "scale(1.05)" }}
          transition="all 0.2s"
          shadow="lg"
        >
          {isRecording && (
            <Box
              position="absolute"
              inset="-10px"
              borderRadius="full"
              border="2px solid #EF4444"
              opacity="0.5"
              animation="ping 1.5s infinite"
            />
          )}
          <span>🎙</span>
        </Box>

        <VStack spaceY={1} alignItems="center">
          <Text fontSize="sm" fontWeight="bold" color={isRecording ? "#EF4444" : "#0F172A"}>
            {isRecording ? t("kid.listeningState") : t("kid.clickMicToStart")}
          </Text>
          <Text fontSize="10px" color="#94A3B8" fontWeight="semibold">
            {t("kid.speechExampleHint")}
          </Text>
        </VStack>

        {/* Transcript result boxes */}
        {(transcript || isRecording) && (
          <VStack spaceY={4} alignItems="stretch" width="100%" pt={4} borderTop="1px solid" borderColor="#F1F5F9">
            
            {/* Kid transcript box */}
            <VStack spaceY={1.5} alignItems="flex-start">
              <Text fontSize="10px" fontWeight="bold" color="#64748B" textTransform="uppercase">{t("kid.speechTranscribeHeader")}</Text>
              <Box p={4} bg="#F8FAFC" borderRadius="2xl" border="1px solid" borderColor="#E2E8F0" width="100%">
                <Text fontSize="xs" color="#0F172A" fontWeight="medium">
                  {transcript || (isRecording ? "..." : "")}
                </Text>
              </Box>
            </VStack>

            {/* Momo AI reply box */}
            {momoReply && (
              <VStack spaceY={1.5} alignItems="flex-start">
                <Text fontSize="10px" fontWeight="bold" color="#7C3AED" textTransform="uppercase">{t("kid.momoResponseHeader")}</Text>
                <Box p={4} bg="#F5F3FF" borderRadius="2xl" border="1px solid" borderColor="#DDD6FE" width="100%">
                  <Text fontSize="xs" color="#5B21B6" fontWeight="bold" lineHeight="relaxed">
                    {momoReply}
                  </Text>
                </Box>
              </VStack>
            )}

          </VStack>
        )}

      </VStack>

    </Box>
  );
}
