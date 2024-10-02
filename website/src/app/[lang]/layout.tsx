import '@/src/styles/globals.css';
import { Space_Grotesk } from 'next/font/google';
import { Header } from '@/src/components/Header';
import { Footer } from '@/src/components/Footer';
import { notFound } from 'next/navigation';
import i18nConfig from '@/i18nConfig';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

type LayoutProps = {
  params: { lang: string };
  children: React.ReactNode;
};

export default function RootLayout({ children, params }: LayoutProps) {
    const { lang } = params;
    const { locales } = i18nConfig;

    // Check if the current locale is supported
    if (!locales.includes(lang)) {
      notFound();
    }

  console.log(params.lang);
  return (
    <html lang={lang}>
      <body className={`${spaceGrotesk.variable} font-sans`}>
        <Header />
        <main className="">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
