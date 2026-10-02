import { Box, VStack, HStack, Text, Heading, Input } from "@chakra-ui/react";
import { useState } from "react";
import { Button } from "../../ui/button";

export default function VoiceoverPage(): React.JSX.Element {
  const [inputText, setInputText] = useState<string>("Xin chào các bạn nhỏ! Mình là Momo đây! Hôm nay chúng ta cùng học bài mới nhé!");
  const [selectedEmotion, setSelectedEmotion] = useState<string>("happy");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const handleSpeakClick = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      setTimeout(() => {
        setIsPlaying(false);
      }, 3000);
    }
  };

  return (
    <Box width="100%">
      
      {/* Page Title & Desc */}
      <VStack spaceY={1.5} alignItems="flex-start" mb={6}>
        <Heading size="md" color="#0F172A" fontWeight="bold">
          Phòng tạo giọng nói Momo AI
        </Heading>
        <Text fontSize="xs" color="#64748B">
          Nhập văn bản và chọn ngữ điệu cảm xúc để Momo phát âm thành giọng nói ngộ nghĩnh!
        </Text>
      </VStack>

      <VStack spaceY={6} alignItems="stretch" bg="#FFFFFF" p={7} borderRadius="3xl" border="1px solid" borderColor="#E2E8F0" boxShadow="xs" maxW="600px" mx="auto">
        
        {/* Input Textbox */}
        <VStack spaceY={2} alignItems="flex-start">
          <Text fontSize="xs" fontWeight="bold" color="#334155">Nhập câu nói muốn Momo nói:</Text>
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ví dụ: Xin chào các bạn nhỏ..."
            size="sm"
            borderRadius="xl"
            borderColor="#E2E8F0"
            px={4}
            h="44px"
            fontSize="xs"
            _focus={{ borderColor: "#7C3AED", boxShadow: "none" }}
          />
        </VStack>

        {/* Emotion Presets */}
        <VStack spaceY={2.5} alignItems="flex-start">
          <Text fontSize="xs" fontWeight="bold" color="#334155">Chọn âm điệu cảm xúc:</Text>
          <HStack spaceX={2.5} width="100%" overflowX="auto" pb={1} css={{ "&::-webkit-scrollbar": { display: "none" } }}>
            {[
              { id: "happy", label: "Vui vẻ (Happy)", emoji: "😊" },
              { id: "calm", label: "Điềm tĩnh (Calm)", emoji: "🧘" },
              { id: "excited", label: "Hào hứng (Excited)", emoji: "🎉" },
              { id: "sleepy", label: "Buồn ngủ (Sleepy)", emoji: "😴" }
            ].map((emo) => (
              <Box
                key={emo.id}
                onClick={() => setSelectedEmotion(emo.id)}
                cursor="pointer"
                px={3.5}
                py={2}
                borderRadius="xl"
                border="1.5px solid"
                borderColor={selectedEmotion === emo.id ? "#7C3AED" : "#E2E8F0"}
                bg={selectedEmotion === emo.id ? "#F5F3FF" : "#FFFFFF"}
                color={selectedEmotion === emo.id ? "#7C3AED" : "#475569"}
                fontSize="xs"
                fontWeight="bold"
                display="flex"
                alignItems="center"
                _hover={{ borderColor: "#7C3AED", color: "#7C3AED" }}
              >
                <span style={{ marginRight: "6px" }}>{emo.emoji}</span>
                {emo.label}
              </Box>
            ))}
          </HStack>
        </VStack>

        <Box borderTop="1px solid" borderColor="#F1F5F9" my={1} />

        {/* Playback Controls & Wave mockup */}
        <VStack spaceY={4} alignItems="center">
          
          {isPlaying && (
            <HStack spaceX={1.5} h="24px" alignItems="center">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((i) => {
                const randomHeight = Math.floor(Math.random() * 18) + 6;
                return (
                  <Box
                    key={i}
                    w="3px"
                    h={`${randomHeight}px`}
                    bg="#7C3AED"
                    borderRadius="full"
                    animation="pulse 0.8s infinite"
                  />
                );
              })}
            </HStack>
          )}

          <Button
            onClick={handleSpeakClick}
            disabled={!inputText}
            w="100%"
            h="44px"
            bg="#7C3AED"
            color="white"
            borderRadius="2xl"
            fontWeight="bold"
            fontSize="xs"
            _hover={{ filter: "brightness(0.9)" }}
          >
            {isPlaying ? "Dừng giọng nói" : "🔊 Cho Momo nói câu này"}
          </Button>
        </VStack>

      </VStack>

    </Box>
  );
}
