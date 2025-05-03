import { Flex, Container, Box, Heading } from "@chakra-ui/react";
import ChatWrapper from "./components/ChatWrapper";

const App = () => (
  <Flex
    minH="100vh"
    align="center"
    justify="center"
    bgGradient="linear(to-br, blue.50, blue.100)"  // Philips brand feel
  >
    <Container maxW="6xl" p={0}>
      {/* ── Card ─────────────────────────────────────────── */}
      <Box
        borderWidth="1px"
        borderRadius="2xl"
        boxShadow="xl"
        overflow="hidden"
      >
        {/* header */}
        <Box bg="blue.600" color="white" py={4} textAlign="center">
          <Heading size="lg" fontWeight="medium">
            Philips AI HealthMate
          </Heading>
        </Box>

        {/* main chat UI */}
        <ChatWrapper />
      </Box>
    </Container>
  </Flex>
);

export default App;
