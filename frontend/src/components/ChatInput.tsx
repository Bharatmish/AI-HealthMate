import { Input, Button, HStack, Spinner } from "@chakra-ui/react";
import { FiSend } from "react-icons/fi";
import { FaStop, FaRedo } from "react-icons/fa";

interface Props {
  query: string;
  setQuery: (val: string) => void;
  onSend: () => void;
  onStop: () => void;
  isGenerating: boolean;
  wasStopped: boolean;
  onRetry: () => void;
  clearWasStopped: () => void;
}

const ChatInput = ({
  query,
  setQuery,
  onSend,
  onStop,
  isGenerating,
  wasStopped,
  onRetry,
  clearWasStopped,
}: Props) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    if (wasStopped) clearWasStopped();
    setQuery(newVal);
  };

  return (
    <HStack flex="1" spacing={3}>
      <Input
        placeholder="Ask your question…"
        value={query}
        onChange={handleChange}
        onKeyDown={(e) => !isGenerating && e.key === "Enter" && onSend()}
        size="lg"
        bg="white"
        boxShadow="sm"
        isDisabled={isGenerating}
      />

      {wasStopped && !query.trim() ? (
        <Button
          leftIcon={<FaRedo />}
          colorScheme="yellow"
          onClick={onRetry}
          size="lg"
        >
          Retry
        </Button>
      ) : (
        <Button
          leftIcon={isGenerating ? <Spinner size="sm" speed="0.65s" /> : <FiSend />}
          colorScheme={isGenerating ? "red" : "blue"}
          px={6}
          onClick={isGenerating ? onStop : onSend}
          size="lg"
        >
          {isGenerating ? "Stop" : "Send"}
        </Button>
      )}
    </HStack>
  );
};

export default ChatInput;
