'use client';

import { useRouter, usePathname } from 'next/navigation';

export function useLanguageSwitch() {
  const router = useRouter();
  const pathname = usePathname();

  const currentLocale = pathname.split('/')[1] || 'en-US';

  const handleLanguageChange = (newLocale: string) => {
    const newPath =
      pathname === '/' || pathname === `/${currentLocale}`
        ? `/${newLocale}`
        : pathname.replace(`/${currentLocale}`, `/${newLocale}`);

    // router.push(newPath);
    // router.refresh();
    window.location.href = newPath;
  };

  return {
    currentLocale,
    handleLanguageChange,
    availableLocales: ['en-US', 'nl-NL'] as const,
  };
}
