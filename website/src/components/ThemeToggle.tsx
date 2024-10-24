'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { MoonIcon, SunIcon } from '@radix-ui/react-icons';
import { IconSwitch } from '@/components/ui/icon-switch';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <IconSwitch
      checked={theme === 'dark'}
      onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
      className="border border-input"
      iconChecked={<SunIcon className="h-4 w-4" />}
      iconUnchecked={<MoonIcon className="h-4 w-4" />}
      aria-label="Toggle theme"
    />
  );
}
