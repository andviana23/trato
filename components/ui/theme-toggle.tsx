"use client";

import { Switch } from "@chakra-ui/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <Switch defaultChecked={theme === 'dark'} onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')}>
      Modo Escuro
    </Switch>
  );
} 

