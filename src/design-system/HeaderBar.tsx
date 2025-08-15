"use client";

import React from "react";
import { Flex, IconButton, Input, Box, Text, Avatar } from "@chakra-ui/react";
import { Search, Bell, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

export function HeaderBar(): JSX.Element {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const isDark = (resolvedTheme ?? theme) === "dark";

  const toggle = () => setTheme(isDark ? "light" : "dark");

  return (
    <Flex align="center" h="full" px={4} gap={3}>
      {/* Busca global */}
      <Box position="relative" maxW="560px" flex="1">
        <Box
          position="absolute"
          left={3}
          top="50%"
          transform="translateY(-50%)"
          color="whiteAlpha.700"
          pointerEvents="none"
        >
          <Search size={18} />
        </Box>
        <Input pl={9} placeholder="Search…" aria-label="Search all" />
      </Box>

      {/* Ações à direita */}
      <Flex ml="auto" align="center" gap={2}>
        <IconButton aria-label="Notificações" variant="ghost">
          <Bell size={18} />
        </IconButton>
        <IconButton aria-label="Alternar tema" variant="ghost" onClick={toggle}>
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </IconButton>
        <Avatar.Root size="sm">
          <Avatar.Fallback>A</Avatar.Fallback>
        </Avatar.Root>
        <Text fontSize="sm">Andrey</Text>
      </Flex>
    </Flex>
  );
}

export default HeaderBar;


