import {
  Box,
  Flex,
  HStack,
  IconButton,
  Button,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { FaMicrophone, FaTrash, FaDownload } from "react-icons/fa";
import axios from "axios";
import { useEffect, useRef, useState } from "react";

import ChatBubble from "./ChatBubble";
import ChatInput from "./ChatInput";
import AudioRecorder from "./AudioRecorder";
import FileUpload from "./FileUpload";
import { sleep } from "../utils/sleep.js";

interface Message {
  role: "user" | "bot";
  content: string;
  id?: number;
}

const LOCAL_KEY = "chat_history";

const ChatWrapper = () => {
  const [chat, setChat] = useState<Message[]>([]);
  const [query, setQuery] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [wasStopped, setWasStopped] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const stopRef = useRef(false);
  const lastPromptRef = useRef("");
  const toast = useToast();

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_KEY);
    if (saved) {
      setChat(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(chat));
  }, [chat]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 50);
  };

  const clearWasStopped = () => {
    setWasStopped(false);
  };

  const onSend = async () => {
    if (!query.trim() || isGenerating) return;

    setWasStopped(false);
    setChat((prev) => [...prev, { role: "user", content: query }]);
    const userInput = query;
    lastPromptRef.current = userInput;
    setQuery("");
    setIsGenerating(true);
    stopRef.current = false;

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

      let partial = "";
      for (const char of fullText) {
        if (stopRef.current) break;
        partial += char;
        setChat((prev) =>
          prev.map((m) =>
            m.id === typingId ? { ...m, content: partial } : m
          )
        );
        await sleep(25);
      }

      if (stopRef.current) {
        setWasStopped(true);
        setChat((prev) =>
          prev.map((m) =>
            m.id === typingId
              ? {
                  ...m,
                  content:
                    partial + "\n\n⛔ Message generation stopped by user.",
                }
              : m
          )
        );
      }
    } catch {
      setChat((prev) =>
        prev.map((m) =>
          m.id === typingId
            ? { ...m, content: "❌ Error connecting to backend." }
            : m
        )
      );
    } finally {
      setIsGenerating(false);
      scrollToBottom();
    }
  };

  const onRetry = () => {
    if (!lastPromptRef.current || isGenerating) return;
    setQuery(lastPromptRef.current);
    setWasStopped(false);
    onSend();
  };

  const handleStop = () => {
    stopRef.current = true;
  };

  const onXrayResult = (result: string) => {
    const timestamp = Date.now();
    const formatted = formatTop3(result);

    setChat((prev) => [
      ...prev,
      {
        role: "user",
        content: "🩻 Here’s my chest X-ray. Please analyze.",
        id: timestamp + 1,
      },
      {
        role: "bot",
        content: `**X-ray Findings (Top Confidence):**\n\n${formatted}`,
        id: timestamp + 2,
      },
    ]);

    getLLMExplanation(formatted);
    scrollToBottom();
  };

  const getLLMExplanation = async (rawFindings: string) => {
    const prompt = `Explain the following X-ray findings in simple language for a patient:\n\n${rawFindings}`;
    const typingId = Date.now();

    setChat((prev) => [
      ...prev,
      { role: "bot", content: "💬 Generating explanation…", id: typingId },
    ]);

    try {
      const res = await axios.post("http://localhost:8000/chat", {
        query: prompt,
      });
      const reply = res.data.answer || "⚠️ No explanation available.";

      setChat((prev) =>
        prev.map((m) =>
          m.id === typingId ? { ...m, content: reply } : m
        )
      );
    } catch {
      setChat((prev) =>
        prev.map((m) =>
          m.id === typingId
            ? { ...m, content: "❌ Failed to generate explanation." }
            : m
        )
      );
    }
  };

  const formatTop3 = (raw: string) => {
    return raw
      .split("\n")
      .sort((a, b) => {
        const aVal = parseFloat(a.match(/([\d.]+)%/)?.[1] || "0");
        const bVal = parseFloat(b.match(/([\d.]+)%/)?.[1] || "0");
        return bVal - aVal;
      })
      .slice(0, 3)
      .join("\n");
  };

  const clearChat = () => {
    setChat([]);
    localStorage.removeItem(LOCAL_KEY);
    toast({ title: "Chat cleared", status: "info", duration: 2000 });
  };

  const exportChat = () => {
    const blob = new Blob(
      [chat.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n")],
      { type: "text/plain" }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "chat_export.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  const panelBg = useColorModeValue("white", "gray.800");
  const footerBg = useColorModeValue("gray.50", "gray.700");
  const borderClr = useColorModeValue("gray.200", "gray.600");

  return (
    <Flex
      direction="column"
      w="100%"
      maxW={{ base: "100%", md: "800px" }}
      mx="auto"
      my={4}
      minH="85vh"
      borderWidth="1px"
      borderColor={borderClr}
      borderRadius="2xl"
      boxShadow="lg"
      overflow="hidden"
      bg={panelBg}
    >
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

      <Box px={6} py={4} bg={footerBg}>
        <FileUpload onExtract={setQuery} onXrayResult={onXrayResult} />

        <HStack mt={4} spacing={2} align="stretch">
          <ChatInput
            query={query}
            setQuery={(val) => {
              setQuery(val);
              if (wasStopped) setWasStopped(false);
            }}
            onSend={onSend}
            onStop={handleStop}
            isGenerating={isGenerating}
            wasStopped={wasStopped}
            onRetry={onRetry}
            clearWasStopped={() => setWasStopped(false)}
          />
          <AudioRecorder onTranscript={setQuery}>
            <IconButton
              aria-label="Speak"
              icon={<FaMicrophone />}
              colorScheme="teal"
              size="lg"
              isDisabled={isGenerating}
            />
          </AudioRecorder>
        </HStack>

        <HStack mt={3} spacing={3} justify="flex-end">
          <Button
            leftIcon={<FaTrash />}
            colorScheme="red"
            variant="ghost"
            onClick={clearChat}
            size="sm"
          >
            Clear Chat
          </Button>
          <Button
            leftIcon={<FaDownload />}
            colorScheme="blue"
            variant="ghost"
            onClick={exportChat}
            size="sm"
          >
            Export Chat
          </Button>
        </HStack>
      </Box>
    </Flex>
  );
};

export default ChatWrapper;
