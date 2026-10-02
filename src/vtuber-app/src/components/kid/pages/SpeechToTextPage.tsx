import { Box, VStack, Text, Heading } from "@chakra-ui/react";
import { useState } from "react";
// import { Button } from "../../ui/button";

export default function SpeechToTextPage(): React.JSX.Element {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  const [momoReply, setMomoReply] = useState<string>("");

  const handleMicClick = () => {
    if (isRecording) {
      setIsRecording(false);
      setTranscript("Chào bạn Momo! Hôm nay mình đi học được cô giáo khen vì đã giúp đỡ bạn nặn tượng đất sét!");
      setTimeout(() => {
        setMomoReply("Ôi, Momo nghe thấy rồi nè! Con ngoan quá, biết thấu cảm và giúp đỡ bạn bè là phẩm chất cực tốt của siêu nhân cảm xúc đó! Momo thưởng cho con 1 điểm cộng nhé! 🌟");
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
          Phòng luyện nói cùng Momo AI
        </Heading>
        <Text fontSize="xs" color="#64748B">
          Nói chuyện trực tiếp với microphone, xem giọng nói dịch thành chữ và nghe Momo phản hồi ngay lập tức!
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
            {isRecording ? "Đang lắng nghe bé nói..." : "Ấn vào Micro để bắt đầu nói"}
          </Text>
          <Text fontSize="10px" color="#94A3B8" fontWeight="semibold">
            (Ví dụ: Con hãy kể về một việc tốt đã làm hôm nay)
          </Text>
        </VStack>

        {/* Transcript result boxes */}
        {(transcript || isRecording) && (
          <VStack spaceY={4} alignItems="stretch" width="100%" pt={4} borderTop="1px solid" borderColor="#F1F5F9">
            
            {/* Kid transcript box */}
            <VStack spaceY={1.5} alignItems="flex-start">
              <Text fontSize="10px" fontWeight="bold" color="#64748B" textTransform="uppercase">Giọng nói dịch thành chữ:</Text>
              <Box p={4} bg="#F8FAFC" borderRadius="2xl" border="1px solid" borderColor="#E2E8F0" width="100%">
                <Text fontSize="xs" color="#0F172A" fontWeight="medium">
                  {transcript || (isRecording ? "..." : "")}
                </Text>
              </Box>
            </VStack>

            {/* Momo AI reply box */}
            {momoReply && (
              <VStack spaceY={1.5} alignItems="flex-start">
                <Text fontSize="10px" fontWeight="bold" color="#7C3AED" textTransform="uppercase">Phản hồi từ Momo:</Text>
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
