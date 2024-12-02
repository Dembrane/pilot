'use client';

import { useLanguageSwitch } from '@/hooks/useLanguageSwitch';

export interface LanguageOption {
  locale: string;
  label: string;
}

interface LanguageSelectionProps {
  children: ((props: {
    currentLocale: string;
    availableLocales: readonly ['en-US', 'nl-NL'];
    onLanguageChange: (locale: string) => void;
    getLanguageLabel: (locale: string) => string;
  }) => React.ReactNode) | React.ReactNode;
}

export default function LanguageSelection({ children }: LanguageSelectionProps) {
  const { currentLocale, handleLanguageChange, availableLocales } = useLanguageSwitch();
  
  const getLanguageLabel = (locale: string) => {
    return locale === 'en-US' ? 'English' : 'Nederlands';
  };

  const props = {
    currentLocale,
    availableLocales,
    onLanguageChange: handleLanguageChange,
    getLanguageLabel,
  };

  return typeof children === 'function' ? children(props) : children;
}
