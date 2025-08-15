"use client"

import { ChakraProvider, defaultSystem } from "@chakra-ui/react"
import {
  ColorModeProvider,
  DarkMode,
  type ColorModeProviderProps,
} from "./color-mode"

export function Provider(props: ColorModeProviderProps) {
  // Chakra v3 Provider único, forçando tema claro por padrão via ColorModeProvider
  return (
    <ChakraProvider value={defaultSystem}>
      <ColorModeProvider {...props}>
        {props.children}
      </ColorModeProvider>
    </ChakraProvider>
  )
}
