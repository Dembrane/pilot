// src/components/ThemeProviders.tsx
'use client';

import { ThemeProvider } from '@/components/ThemeProvider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ReactNode } from 'react';

interface ThemeProvidersProps {
  children: ReactNode;
}

export default function ThemeProviders({ children }: ThemeProvidersProps) {
  return (
    <ThemeProvider attribute="class" enableSystem>
      <TooltipProvider>{children}</TooltipProvider>
    </ThemeProvider>
  );
}
