"use client";

import {
  defineConfig,
  defineTokens,
  defineGlobalStyles,
  createSystem,
  defaultConfig,
} from "@chakra-ui/react";

const tokens = defineTokens({
  colors: {
    brand: {
      50: { value: "#e6f0ff" },
      100: { value: "#bfd4ff" },
      200: { value: "#99b8ff" },
      300: { value: "#739cff" },
      400: { value: "#4d80ff" },
      500: { value: "#1f64ff" },
      600: { value: "#184fcc" },
      700: { value: "#123a99" },
      800: { value: "#0b2666" },
      900: { value: "#051333" },
      gold: { value: "#d4af37" },
    },
  },
});

const globalCss = defineGlobalStyles({
  "html, body, #__next": { height: "100%" },
  body: { bg: "white", color: "gray.900" },
});

const appConfig = defineConfig({
	theme: { tokens },
	globalCss,
});

export const theme = createSystem(defaultConfig, appConfig);
export default theme;


