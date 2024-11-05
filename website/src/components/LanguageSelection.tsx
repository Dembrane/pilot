'use client';

import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { t } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuLink,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { GlobeIcon } from '@radix-ui/react-icons';
import Link from 'next/link';

export default function LanguageChanger({ isMobile = false }) {
  const { i18n } = useLingui();
  const currentLocale = i18n.locale;
  const router = useRouter();
  const currentPathname = usePathname();

  const handleChange = (newLocale: string) => {
    if (currentPathname === '/' || currentPathname === `/${currentLocale}`) {
      router.push('/' + newLocale);
    } else {
      const newPathname = currentPathname.replace(
        `/${currentLocale}`,
        `/${newLocale}`,
      );
      router.push(newPathname);
    }
    router.refresh();
  };

  const languageButtons = (
    <>
      <button
        onClick={() => handleChange('en-US')}
        className={`block w-full select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground ${
          currentLocale === 'en-US' ? 'bg-accent' : ''
        }`}
      >
        <div className="text-sm leading-none">
          {i18n._(t`english`)}
        </div>
      </button>
      <button
        onClick={() => handleChange('nl-NL')}
        className={`block w-full select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground ${
          currentLocale === 'nl-NL' ? 'bg-accent' : ''
        }`}
      >
        <div className="text-sm leading-none">
          {i18n._(t`dutch`)}
        </div>
      </button>
    </>
  );

  if (isMobile) {
    return (
      <AccordionItem value="language">
        <AccordionTrigger className="flex gap-2">
          <span className="flex items-center gap-2">
            <GlobeIcon className="h-4 w-4" />
            {currentLocale === 'en-US' ? 'English' : 'Nederlands'}
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2">{languageButtons}</div>
        </AccordionContent>
      </AccordionItem>
    );
  }

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger className="gap-2">
        <GlobeIcon className="h-4 w-4" />
        {currentLocale === 'en-US' ? 'English' : 'Nederlands'}
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="grid w-[min(400px,90vw)] gap-3 p-4 md:w-[min(500px,90vw)] md:grid-cols-2 lg:w-[min(600px,90vw)]">
          <li>
            <NavigationMenuLink asChild>
              <button
                onClick={() => handleChange('en-US')}
                className={`block w-full select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground ${
                  currentLocale === 'en-US' ? 'bg-accent' : ''
                }`}
              >
                <div className="text-sm font-medium leading-none">
                  {i18n._(t`english`)}
                </div>
              </button>
            </NavigationMenuLink>
          </li>
          <li>
            <NavigationMenuLink asChild>
              <button
                onClick={() => handleChange('nl-NL')}
                className={`block w-full select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground ${
                  currentLocale === 'nl-NL' ? 'bg-accent' : ''
                }`}
              >
                <div className="text-sm font-medium leading-none">
                  {i18n._(t`dutch`)}
                </div>
              </button>
            </NavigationMenuLink>
          </li>
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
}
