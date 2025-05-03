// src/theme.ts
import { extendTheme, ThemeConfig } from "@chakra-ui/react";

// Optional: Set initial color mode to light
const config: ThemeConfig = {
  initialColorMode: "light",
  useSystemColorMode: false,
};

const theme = extendTheme({
  config,
  colors: {
    brand: {
      50: "#e3f2fd",
      100: "#bbdefb",
      200: "#90caf9",
      300: "#64b5f6",
      400: "#42a5f5",
      500: "#2196f3", // Primary blue
      600: "#1e88e5",
      700: "#1976d2",
      800: "#1565c0",
      900: "#0d47a1",
    },
    accent: {
      500: "#f97316", // Vibrant orange
    },
    danger: {
      500: "#e53e3e", // Red
    },
    neutral: {
      100: "#f7fafc",
      900: "#1a202c",
    },
  },
  fonts: {
    heading: `'Segoe UI', sans-serif`,
    body: `'Segoe UI', sans-serif`,
  },
  components: {
    Button: {
      baseStyle: {
        borderRadius: "lg",
        fontWeight: "medium",
      },
      variants: {
        solid: (props: any) => ({
          bg: props.colorMode === "light" ? "brand.500" : "brand.300",
          color: "white",
          _hover: {
            bg: "brand.600",
          },
        }),
      },
    },
  },
});

export default theme;
