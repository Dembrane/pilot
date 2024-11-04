import { createDirectus, rest, readItems } from '@directus/sdk';
import BlocksRenderer from '@/components/blocks/BlocksRenderer';
import { Pages } from '@/lib/types';
import { client } from '@/lib/directus';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getGlobalsByLang } from '@lib/globals';
import { initLingui } from '@/initLingui';
import { Trans } from '@lingui/macro';

type PageProps = {
  params: Promise<{
    lang: string;
  }>;
};

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const { lang } = params;
  const globals = await getGlobalsByLang(lang);
  // Fetch localized metadata from Directus if available
  // Example: title, description, etc.

  return {
    title: `${globals?.title || 'Dembrane'} - ${globals?.tagline || 'People Know How'}`,
    // Add other metadata fields as needed
  };
}

export async function generateStaticParams() {
  const locales = ['en-US', 'nl-NL']; // Fetch from Next.js config or Directus if dynamic
  // Generate params for each locale
  return locales.map((lang) => ({ lang }));
}

async function HomePage({ params }: PageProps) {
  const { lang } = (await params);
  initLingui(lang as 'en-US' | 'nl-NL');

  if (!client) {
    throw new Error('Directus client not initialized');
  }

  try {
    const pages = await client.request(
      readItems('pages', {
        filter: { permalink: { _eq: '/' } },
        fields: [
          'permalink',
          { blocks: ['id', 'collection', 'item.*'] },
          { translations: ['languages_code', 'title'] },
        ],
      }),
    );

    if (pages.length === 0) {
      console.log('No pages found');
    }

    const page = pages[0];

    const translation = page?.translations.find((t) => t.languages_code === lang);
    // @ts-ignore
    const localizedTitle = translation?.title || page?.title!;

    return (
        <div>
          {/* @ts-ignore */}
          {page.blocks && <BlocksRenderer blocks={page.blocks} lang={lang} />}
        </div>
    );
  } catch (error) {
    console.error('Error fetching page:', error);
    return <Trans>Error loading page. Please try again later.</Trans>;
  }
}

export default HomePage;
