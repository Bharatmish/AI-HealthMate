import {
  Box,
  Button,
  Flex,
  Icon,
  Input,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiUpload } from "react-icons/fi";
import { useRef, useState } from "react";

interface Props {
  onExtract: (text: string) => void;
  onXrayResult: (result: string) => void;
}

const FileUpload = ({ onExtract, onXrayResult }: Props) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const cardBg = useColorModeValue("gray.100", "gray.700");

  const handleFile = async (type: "image" | "pdf" | "xray") => {
    const file = inputRef.current?.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const formData = new FormData();
    formData.append("file", file);

    const endpoint =
      type === "image" ? "ocr/image" :
      type === "pdf"   ? "ocr/pdf"   : "xray";

    try {
      const res = await fetch(`http://localhost:8000/${endpoint}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (type === "xray") {
        onXrayResult(data.result || "🩻 No findings.");
      } else {
        onExtract(data.text || "✅ File processed.");
      }

    } catch {
      const failMsg = "❌ File processing failed.";
      type === "xray" ? onXrayResult(failMsg) : onExtract(failMsg);
    } finally {
      if (inputRef.current) inputRef.current.value = "";
      setFileName("");
    }
  };

  return (
    <Box
      bg={cardBg}
      p={4}
      borderRadius="lg"
      boxShadow="sm"
      border="1px dashed"
      borderColor="gray.300"
    >
      <Flex
        direction={{ base: "column", md: "row" }}
        align="center"
        justify="space-between"
        gap={3}
      >
        {/* File chooser */}
        <Flex align="center" gap={2}>
          <Icon as={FiUpload} boxSize={6} color="purple.500" />
          <Input
            ref={inputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
            variant="unstyled"
            w="220px"
          />
        </Flex>

        {/* Show file name */}
        {fileName && (
          <Text fontSize="sm" color="gray.600" noOfLines={1} maxW="200px">
            {fileName}
          </Text>
        )}

        {/* Action buttons */}
        <Flex gap={2}>
          <Button
            colorScheme="purple"
            variant="outline"
            onClick={() => handleFile("image")}
          >
            OCR Image
          </Button>
          <Button
            colorScheme="orange"
            variant="solid"
            onClick={() => handleFile("pdf")}
          >
            OCR PDF
          </Button>
          <Button
            colorScheme="red"
            variant="ghost"
            onClick={() => handleFile("xray")}
          >
            Analyze X-ray
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
};

export default FileUpload;
