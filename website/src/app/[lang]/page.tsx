import { createDirectus, rest, readItems } from '@directus/sdk';
import BlocksRenderer from '@/src/components/blocks/BlocksRenderer';
import { Pages } from '@/src/lib/types';
import { client } from '@/src/lib/directus';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getI18nInstance } from '@/src/appRouterI18n';
import { I18nProvider, Trans } from '@lingui/react';

type PageProps = {
  params: {
    lang: string;
  };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang } = params;
  // Fetch localized metadata from Directus if available
  // Example: title, description, etc.
  return {
    title: `My Site - ${lang}`,
    // Add other metadata fields as needed
  };
}

export async function generateStaticParams() {
  const locales = ['en-US', 'nl-NL']; // Fetch from Next.js config or Directus if dynamic
  // Generate params for each locale
  return locales.map((lang) => ({ lang }));
}

export default async function HomePage({ params }: PageProps) {
  const { lang } = params;
  const i18n = getI18nInstance(lang as 'en-US' | 'nl-NL');

  console.log(lang);

  if (!client) {
    throw new Error('Directus client not initialized');
  }

  try {
    const pages = await client.request(
      readItems('pages', {
        filter: { id: { _eq: '0945b7d7-9643-4a90-948d-a5d6659014e0' } },
        fields: [
          'id',
          'title',
          'blocks',
          'blocks.id',
          'blocks.collection',
          'blocks.item.*',
          'translations.*',
        ],
      }),
    );

    if (pages.length === 0) {
      console.log('No pages found');
      notFound();
    }

    const page = pages[0];
    const translation = page.translations.find((t) => t.languages_code === lang);
    const localizedTitle = translation?.title || page.title;

    return (
      <I18nProvider i18n={i18n}>
        <main className="">
          <h1 className="mb-6 text-3xl font-bold">{localizedTitle}</h1>
          <BlocksRenderer blocks={page.blocks} />
        </main>
      </I18nProvider>
    );
  } catch (error) {
    console.error('Error fetching page:', error);
    return <div>Error loading page. Please try again later.</div>;
  }
}
