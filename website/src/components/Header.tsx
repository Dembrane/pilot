'use client';

import Link from 'next/link';
import LanguageSwitcher from './LanguageSwitcher';
import { usePathname } from 'next/navigation';

export function Header() {
    const pathname = usePathname();
    const lang = pathname.split('/')[1];
    
  return (
    <header className="bg-gray-800 py-4 text-white">
      <div className="container mx-auto flex items-center justify-between px-4">
        <Link href={`/${lang}`} className="text-2xl font-bold">
          My Site
        </Link>
        <nav>
          <ul className="flex space-x-4">
            <li>
              <Link href={`/${lang}/`} className="hover:text-gray-300">
                Home
              </Link>
            </li>
            <li>
              <Link href={`/${lang}/about`} className="hover:text-gray-300">
                About
              </Link>
            </li>
            <li>
              <Link href={`/${lang}/contact`} className="hover:text-gray-300">
                Contact
              </Link>
            </li>
          </ul>
        </nav>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
