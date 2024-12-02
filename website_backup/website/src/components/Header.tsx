import Link from 'next/link';
import Image from 'next/image';
import { MobileNav } from '@/components/navigation/MobileNav';
import { DesktopNav } from '@/components/navigation/DesktopNav';
import { getNavigationItems, getProducts } from '@/lib/services/navigation';
import { getGlobalsByLang } from '@lib/globals';
import { ThemeToggle } from './settings/ThemeToggle';
import LanguageSwitcher from './LanguageSelection';
import { DIRECTUS_PUBLIC_ASSETS_URL } from '@lib/directus';
import Logo from '@/components/Logo';

interface HeaderProps {
  lang: string;
}

export async function Header({ lang }: HeaderProps) {
  const navigationItems = await getNavigationItems(lang);
  const products = await getProducts(lang);
  const globals = await getGlobalsByLang(lang);

  return (
    <header className="border-b border-border bg-background py-2 text-foreground md:py-4 sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 md:container">
        <div className="flex items-center">
          {/* add logo */}
          <div className="h-auto w-10 pr-2">
            <Logo />
          </div>
          <Link
            href={`/${lang}`}
            className="text-xl text-foreground md:text-2xl"
          >
            {globals?.title || 'Dembrane'}
          </Link>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <MobileNav navigationItems={navigationItems} products={products} />
        </div>

        {/* Desktop Navigation */}
        <DesktopNav navigationItems={navigationItems} products={products} />

      </div>
    </header>
  );
}
