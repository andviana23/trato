'use client';

import { Button, Tooltip } from '@/components/ui/chakra-adapters';
import { useTheme } from 'next-themes';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';

export function ColorModeSwitcher() {
  const { theme, setTheme } = useTheme();
  const isLight = theme !== 'dark';

  return (
    <Tooltip content={isLight ? 'Ativar tema escuro' : 'Ativar tema claro'}>
      <Button variant="ghost" onClick={() => setTheme(isLight ? 'dark' : 'light')} aria-label="Trocar tema">
        {isLight ? <MoonIcon className="w-5 h-5"/> : <SunIcon className="w-5 h-5"/>}
      </Button>
    </Tooltip>
  );
}


