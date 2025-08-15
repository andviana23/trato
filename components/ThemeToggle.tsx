"use client";

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { IconButton } from '@chakra-ui/react';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-10 h-6 bg-gray-200 rounded-full" />;
  }

  const Icon = theme === 'dark' ? MoonIcon : SunIcon;
  return (
    <IconButton
      aria-label="Alternar tema"
      size="sm"
      variant="ghost"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      <Icon className="w-5 h-5" />
    </IconButton>
  );
} 
