'use client';

import { t } from '@lingui/macro';
import { useLanguageSwitch } from '@/hooks/useLanguageSwitch';

interface LanguageButtonProps {
  locale: string;
  className?: string;
}

export function LanguageButton({ locale, className = '' }: LanguageButtonProps) {
  const { handleChange, currentLocale, i18n } = useLanguageSwitch();
  
  return (
    <button
      onClick={() => handleChange(locale)}
      className={`block w-full select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-secondary hover:text-secondary-foreground focus:bg-secondary focus:text-secondary-foreground ${
        currentLocale === locale ? 'bg-secondary' : ''
      } ${className}`}
    >
      <div className="text-sm font-medium leading-none">
        {i18n._(t`${locale === 'en-US' ? 'english' : 'dutch'}`)}
      </div>
    </button>
  );
} 