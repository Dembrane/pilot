'use client';

import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { t } from '@lingui/macro';
import { Trans, useLingui } from '@lingui/react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function LanguageChanger() {
  const { i18n } = useLingui();
  const currentLocale = i18n.locale;

  const router = useRouter();
  const currentPathname = usePathname();

  const handleChange = (newLocale: string) => {
    // If the current path is at the root ("/"), handle the special case
    if (currentPathname === '/' || currentPathname === `/${currentLocale}`) {
      router.push('/' + newLocale);
    } else {
      // Replace the current locale in the pathname with the new locale
      const newPathname = currentPathname.replace(
        `/${currentLocale}`,
        `/${newLocale}`,
      );
      router.push(newPathname);
    }

    router.refresh();
  };

  return (
    <Select onValueChange={handleChange} defaultValue={currentLocale}>
      <SelectTrigger className="w-min border-none shadow-none">
        <SelectValue placeholder="Select a language" />
      </SelectTrigger>
      <SelectContent className="border border-input bg-background text-foreground">
        <SelectItem
          className="hover:bg-custom-green hover:text-accent-foreground"
          value="en-US"
        >
          {i18n._(t({ id: 'english' }))}
        </SelectItem>
        <SelectItem
          className="hover:bg-custom-green hover:text-accent-foreground"
          value="nl-NL"
        >
          {i18n._(t({ id: 'dutch' }))}
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
