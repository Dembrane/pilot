import Link from 'next/link';
import LanguageSwitcher from './LanguageSwitcher';

export function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-between items-center">
          <div className="w-full md:w-1/3 mb-4 md:mb-0">
            <h3 className="text-lg font-bold mb-2">My Site</h3>
            <p className="text-sm">© 2023 My Site. All rights reserved.</p>
          </div>
          <nav className="w-full md:w-1/3 mb-4 md:mb-0">
            <div className="mb-4 flex justify-center md:justify-end">
              <LanguageSwitcher />
            </div>
            <ul className="flex flex-wrap justify-center md:justify-end space-x-4">
              <li>
                <Link href="/" className="hover:text-gray-300">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-gray-300">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-gray-300">
                  Contact
                </Link>
              </li>
            </ul>
          </nav>
          <div className="w-full md:w-1/3 text-center md:text-right">
            <p className="text-sm">
              Created with Next.js and Directus
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
