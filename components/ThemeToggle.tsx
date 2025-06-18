"use client";

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { Switch } from '@heroui/react';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-10 h-6 bg-gray-200 rounded-full" />;
  }

  return (
    <Switch
      isSelected={theme === 'dark'}
      onValueChange={(isDark) => setTheme(isDark ? 'dark' : 'light')}
      size="sm"
      color="primary"
      thumbIcon={({ isSelected }) =>
        isSelected ? (
          <MoonIcon className="w-3 h-3" />
        ) : (
          <SunIcon className="w-3 h-3" />
        )
      }
    />
  );
} 