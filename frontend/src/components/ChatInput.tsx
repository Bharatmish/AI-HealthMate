import { Input, Button, HStack } from "@chakra-ui/react";
import { FiSend } from "react-icons/fi";

interface Props {
  query: string;
  setQuery: (val: string) => void;
  onSend: () => void;
}

const ChatInput = ({ query, setQuery, onSend }: Props) => (
  <HStack flex="1" spacing={3}>
    <Input
      placeholder="Ask your question…"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && onSend()}
      size="lg"
      bg="white"
      boxShadow="sm"
    />
    <Button
      leftIcon={<FiSend />}
      colorScheme="blue"
      px={6}
      onClick={onSend}
      size="lg"
    >
      Send
    </Button>
  </HStack>
);

export default ChatInput;
