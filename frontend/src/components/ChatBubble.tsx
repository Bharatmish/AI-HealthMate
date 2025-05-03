import {
  Avatar,
  Box,
  HStack,
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
        overflowWrap="break-word"
      >
        <ReactMarkdown
          components={{
            pre: ({ children, ...props }) => (
              <Box
                as="pre"
                overflowX="auto"
                whiteSpace="pre-wrap"
                wordBreak="break-word"
                p={2}
                bg={useColorModeValue("gray.100", "gray.700")}
                borderRadius="md"
                my={2}
                {...props}
              >
                {children}
              </Box>
            ),
            code: ({
              inline,
              children,
              ...props
            }: {
              inline?: boolean;
              children?: React.ReactNode;
            }) => (
              <Box
                as="code"
                backgroundColor={inline ? "none" : useColorModeValue("gray.100", "gray.700")}
                color={inline ? "inherit" : useColorModeValue("black", "white")}
                px={inline ? 0 : 2}
                py={inline ? 0 : 1}
                borderRadius="md"
                fontSize="sm"
                overflowX="auto"
                whiteSpace="pre-wrap"
                {...props}
              >
                {children}
              </Box>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </Box>
      {isUser && <Avatar name="You" size="sm" bg="blue.500" />}
    </HStack>
  );
};

export default ChatBubble;
