"use client";
import { IconButton } from "@chakra-ui/react";

// Compat v3: alterna data-theme no <html>, sem Tooltip para evitar tipos namespace
export default function ColorModeToggle() {
  const isDark = typeof document !== "undefined" && document.documentElement.dataset.theme === "dark";
  const toggle = () => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
  };
  return (
    <IconButton aria-label={isDark ? "Modo claro" : "Modo escuro"} onClick={toggle} variant="subtle">
      {isDark ? "☀️" : "🌙"}
    </IconButton>
  );
}


