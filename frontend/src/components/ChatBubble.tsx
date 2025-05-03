import {
  Avatar,
  Box,
  HStack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import ReactMarkdown from "react-markdown";

interface Props {
  role: "user" | "bot";
  content: string;
}

const ChatBubble = ({ role, content }: Props) => {
  const isUser = role === "user";

  const userBg = "blue.500";
  const botBg = useColorModeValue("gray.200", "gray.600");
  const bubbleBg = isUser ? userBg : botBg;
  const textColor = isUser ? "white" : undefined;

  return (
    <HStack
      align="flex-start"
      justify={isUser ? "flex-end" : "flex-start"}
      mb={4}
    >
      {!isUser && <Avatar name="Bot" size="sm" bg="blue.600" />}
      <Box
        maxW="70%"
        bg={bubbleBg}
        color={textColor}
        px={4}
        py={2}
        borderRadius="lg"
        boxShadow="sm"
        whiteSpace="pre-wrap"
      >
        <ReactMarkdown>{content}</ReactMarkdown>
      </Box>
      {isUser && <Avatar name="You" size="sm" bg="blue.500" />}
    </HStack>
  );
};

export default ChatBubble;
