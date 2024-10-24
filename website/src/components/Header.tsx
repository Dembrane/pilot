import Link from 'next/link';
import LanguageSwitcher from './LanguageSelection';
import { client } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { getGlobalsByLang } from '@lib/globals';

type NavigationItem = {
  id: string;
  url: string;
  label: string;
};

async function getNavigationItems(lang: string) {
  try {
    const response = await client.request<any[]>(
      readItems('navigation', {
        filter: {
          id: {
            _eq: 'header_navigation',
          },
        },
        fields: ['translations', 'translations.*', 'items', 'items.*'],
      })
    );

    if (response && response.length > 0) {
      const navigation = response[0];
      return navigation.items.map((item: any) => ({
        id: item.id,
        url: item.url,
        label: item.translations.find((t: any) => t.languages_code === lang)?.label || '',
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching navigation items:', error);
    return [];
  }
}

export async function Header({ lang }: { lang: string }) {
  const navigationItems = await getNavigationItems(lang);
  const globals = await getGlobalsByLang(lang); 

  return (
    <header className="border-b border-border bg-background py-4 text-foreground">
      <div className="flex items-center justify-between px-4 md:container">
        <div className="flex items-center space-x-4">
          <Link href={`/${lang}`} className="text-2xl font-bold text-foreground">
            {globals?.tagline || 'error'}
          </Link>
          <LanguageSwitcher />
        </div>
        <nav>
          <ul className="flex space-x-4">
            {navigationItems.map((item, index) => (
              <li key={index}>
                <Link
                  href={item.url}
                  className="transition-colors duration-200 hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
