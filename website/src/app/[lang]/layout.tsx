import '@styles/globals.css';
import '@/styles/notion.css';
import { Space_Grotesk } from 'next/font/google';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { notFound } from 'next/navigation';
import { LinguiClientProvider } from '@/components/LinguiClientProvider';
import { allMessages } from '@/appRouterI18n';
import ThemeProviders from '@/components/ThemeProviders';
import DembraneBackground from '@/components/animations/DembraneBackground';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { BackgroundProvider } from '@/lib/contexts/BackgroundContext';
import { Toaster } from '@/components/ui/sonner';
import Head from 'next/head';
import Script from 'next/script';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

type LayoutProps = {
  params: Promise<{ lang: string }>;
  children: React.ReactNode;
};

export default async function RootLayout(props: LayoutProps) {
  const params = await props.params;

  const { children } = props;

  const { lang } = params;

  return (
    <html lang={lang} suppressHydrationWarning>

        <Script defer data-domain="dembrane.com" src="https://plausible.io/js/script.js"></Script>
      <body className={`${spaceGrotesk.className} bg-background`}>
        <ErrorBoundary>
          <LinguiClientProvider
            initialLocale={lang}
            initialMessages={allMessages[lang]!}
          >
            <ThemeProviders>
              <BackgroundProvider>
                <Header lang={lang} />
                <main>{children}</main>
                <Footer navigationId="footer" lang={lang} />
                <DembraneBackground />
                <Toaster />
              </BackgroundProvider>
            </ThemeProviders>
          </LinguiClientProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
