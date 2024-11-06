import React from 'react';
import Link from 'next/link';
import LanguageSwitcher from './LanguageSelection';
import { client } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { ThemeToggle } from './settings/ThemeToggle';
import { getGlobalsByLang } from '@lib/globals';

type FooterProps = {
  navigationId: string;
  lang: string;
};

type NavigationItem = {
  navigation_items_id: string;
  id: string;
  url: string;
  translations: {
    languages_code: string;
    label: string;
  }[];
};

type Navigation = {
  id: string;
  translations: {
    languages_code: string;
    title: string;
  }[];
  items: NavigationItem[];
};



const getNavigationItems = async (navigationId: string, lang: string) => {
  try {
    const response = await client.request<Navigation[]>(
      readItems('navigation', {
        filter: {
          id: {
            _eq: navigationId,
          },
        },
        fields: [
          'translations',
          'translations.*',
          'items',
          'items.navigation_items_id',
          'items.navigation_items_id.translations',
          'items.navigation_items_id.translations.*',
        ],
      }),
    );

    if (response && response.length > 0) {
      const navigation = response[0];

      if (!navigation) {
        console.warn('No navigation found in the response');
        return { title: '', items: [] };
      }
      
      const title = navigation.translations.find(t => t.languages_code === lang)?.title || '';
      
      if (navigation.items) {
        const items = navigation.items
          .filter(item => item.navigation_items_id)
          .map((item) => ({
            id: item.navigation_items_id.id,
            url: item.navigation_items_id.url || '',
            label: item.navigation_items_id.translations?.find((t) => t.languages_code === lang)?.label || '',
          }));
        return { title, items };
      } else {
        console.warn('Navigation items not found in the response');
        return { title, items: [] };
      }
    }
    console.warn('No navigation found in the response');
    return { title: '', items: [] };
  } catch (error) {
    console.error('Error fetching navigation items:', error);
    return { title: '', items: [] };
  }
};

export const Footer: React.FC<FooterProps> = async ({ navigationId, lang }) => {
  const { title, items: navigationItems } = await getNavigationItems(navigationId, lang);
  const globals = await getGlobalsByLang(lang);

  return (
    <footer className="py-6 bg-background text-foreground border-t border-border mt-16">
      <div className="px-4 md:container">
        <div className="flex flex-wrap items-center justify-between">
          <div className="mb-4 w-full md:mb-0 md:w-1/3">
            <h3 className="mb-2 text-lg font-bold text-foreground">{globals?.title || 'error'}</h3>
            <p className="text-sm text-muted-foreground">© 2023 {globals?.title || 'error'}. All rights reserved.</p>
          </div>
          <nav className="mb-4 w-full md:mb-0 md:w-1/3">
            <h4 className="mb-2 text-md font-semibold text-foreground">{title}</h4>
            <ul className="flex flex-wrap justify-center space-x-4 md:justify-end">
              {navigationItems.map((item, index) => (
                  <li key={index}>
                    <Link key={item.id} href={"/"} className="hover:text-secondary">
                      {item.label || 'Unnamed Link'}
                    </Link>
                  </li>
              ))}
            </ul>
          </nav>
          <div className="w-full text-center md:w-1/3 md:text-right">
            <div className="flex items-center justify-end space-x-4">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
