import { Box, Text, Flex } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarGroup } from '@/components/ui/avatar';
import { Message } from '@/services/websocket-service';

// Type definitions
interface ChatBubbleProps {
  message: Message;
  isSelected?: boolean;
  onClick?: () => void;
}

// Main component
export function ChatBubble({ message, isSelected, onClick }: ChatBubbleProps): React.JSX.Element {
  const { t } = useTranslation();
  const isAI = message.role === 'ai';
  const displayName = message.name || (isAI ? t('chat.ai') : t('chat.me'));

  return (
    <Box
      onClick={onClick}
      cursor="pointer"
      bg={isSelected ? 'gray.100' : 'transparent'}
      _hover={{ bg: 'gray.50' }}
      p={2}
      borderRadius="md"
      transition="background-color 0.2s"
    >
      <Flex gap={3}>
        <AvatarGroup>
          <Avatar
            size="sm"
            name={displayName}
            bg={isAI ? 'blue.500' : 'green.500'}
            color="white"
          />
        </AvatarGroup>
        <Box flex={1}>
          <Text fontSize="sm" fontWeight="bold" color="gray.700">
            {displayName}
          </Text>
          <Text
            fontSize="sm"
            color="gray.600"
            truncate
          >
            {message.content}
          </Text>
          <Text fontSize="xs" color="gray.400" mt={1}>
            {new Date(message.timestamp).toLocaleTimeString()}
          </Text>
        </Box>
      </Flex>
    </Box>
  );
}
