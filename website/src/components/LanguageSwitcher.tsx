'use client';

import { useRouter, usePathname } from 'next/navigation';
import i18nConfig from '@/i18nConfig';

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const { locales } = i18nConfig;

  const currentLang = pathname.split('/')[1];

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = event.target.value;
    const newPathname = pathname.replace(`/${currentLang}`, `/${newLang}`);
    router.push(newPathname);
  };

  return (
    <select onChange={handleChange} value={currentLang}>
      {locales.map((locale) => (
        <option key={locale} value={locale}>
          {locale}
        </option>
      ))}
    </select>
  );
}
