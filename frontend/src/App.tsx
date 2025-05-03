import { Flex, Box, Heading } from "@chakra-ui/react";
import ChatWrapper from "./components/ChatWrapper";

const App = () => (
  <Flex
    direction="column"
    minH="100vh"
    bgGradient="linear(to-br, blue.50, blue.100)"
    align="center"
    justify="center"
    overflow="hidden"
  >
    {/* ── Card ─────────────────────────────────────────── */}
    <Box
      width="100%"
      maxW="900px"
      height="100vh"
      borderWidth="1px"
      borderRadius="2xl"
      boxShadow="xl"
      overflow="hidden"
      display="flex"
      flexDirection="column"
    >
      {/* header */}
      <Box bg="blue.600" color="white" py={4} textAlign="center">
        <Heading size="lg" fontWeight="medium">
          Philips AI HealthMate
        </Heading>
      </Box>

      {/* main chat UI */}
      <ChatWrapper />
    </Box>
  </Flex>
);

export default App;
