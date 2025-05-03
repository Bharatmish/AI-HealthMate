import {
  Box,
  Flex,
  HStack,
  IconButton,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaMicrophone } from "react-icons/fa";
import axios from "axios";
import { useRef, useState } from "react";

import ChatBubble from "./ChatBubble";
import ChatInput from "./ChatInput";
import AudioRecorder from "./AudioRecorder";
import FileUpload from "./FileUpload";
import { sleep } from "../utils/sleep.js"; // Only if it's compiled to JS



interface Message {
  role: "user" | "bot";
  content: string;
  id?: number;          // used for temporary typing indicator
}

const ChatWrapper = () => {
  const [chat, setChat] = useState<Message[]>([]);
  const [query, setQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () =>
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });

  /* ─────────────────────────────────────────────────────────── */
  const onSend = async () => {
    if (!query.trim()) return;

    // 1. add user bubble
    setChat((prev) => [...prev, { role: "user", content: query }]);
    const userInput = query;
    setQuery("");

    // 2. typing placeholder
    const typingId = Date.now();
    setChat((prev) => [
      ...prev,
      { role: "bot", content: "⌛ Bot is typing…", id: typingId },
    ]);

    try {
      const res = await axios.post("http://localhost:8000/chat", {
        query: userInput,
      });
      const fullText = `**${res.data.source}**\n\n${res.data.answer}`;

      // 3. type‑writer reveal
      let partial = "";
      for (const char of fullText) {
        partial += char;
        setChat((prev) =>
          prev.map((m) =>
            m.id === typingId ? { ...m, content: partial } : m
          )
        );
        await sleep(25); // typing speed (ms per char)
      }
    } catch {
      setChat((prev) =>
        prev.map((m) =>
          m.id === typingId
            ? { role: "bot", content: "❌ Error connecting to backend." }
            : m
        )
      );
    } finally {
      setTimeout(scrollToBottom, 100);
    }
  };
  /* ─────────────────────────────────────────────────────────── */

  /* colors */
  const panelBg   = useColorModeValue("white", "gray.800");
  const footerBg  = useColorModeValue("gray.50", "gray.700");
  const borderClr = useColorModeValue("gray.200", "gray.600");

  return (
    <Flex
      direction="column"
      maxW="800px"
      mx="auto"
      my={6}
      minH="75vh"
      borderWidth="1px"
      borderColor={borderClr}
      borderRadius="2xl"
      boxShadow="lg"
      overflow="hidden"
      bg={panelBg}
    >
      {/* chat scroll */}
      <Box
        ref={scrollRef}
        flex="1"
        overflowY="auto"
        px={4}
        py={4}
        sx={{ "&::-webkit-scrollbar": { width: "6px" } }}
      >
        {chat.length === 0 ? (
          <Box
            h="100%"
            display="flex"
            alignItems="center"
            justifyContent="center"
            color="gray.400"
            fontSize="sm"
          >
            Ask your first question…
          </Box>
        ) : (
          chat.map((msg, i) => (
            <ChatBubble key={i} role={msg.role} content={msg.content} />
          ))
        )}
      </Box>

      {/* footer */}
      <Box px={6} py={4} bg={footerBg}>
        <FileUpload onExtract={setQuery} />

        <HStack mt={4} spacing={2}>
          <ChatInput query={query} setQuery={setQuery} onSend={onSend} />
          <AudioRecorder onTranscript={setQuery}>
            <IconButton
              aria-label="Speak"
              icon={<FaMicrophone />}
              colorScheme="teal"
              size="lg"
            />
          </AudioRecorder>
        </HStack>
      </Box>
    </Flex>
  );
};

export default ChatWrapper;
