import BlocksRenderer from '@/components/blocks/BlocksRenderer';
import { client } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { notFound } from 'next/navigation';
import { getI18nInstance } from '@/appRouterI18n';
import { Trans } from '@lingui/macro';
import { initLingui } from '@/initLingui';

type PageProps = {
  params: Promise<{
    lang: string;
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const locales = ['en-US', 'nl-NL']; // Fetch from Next.js config or Directus if dynamic

  const pages = await client.request(
    readItems('pages', {
      fields: ['permalink'],
    })
  );
  console.log(pages);

  const params = locales.flatMap((lang) =>
    pages.map((page: any) => ({
      lang,
      slug: page.permalink,
    }))
  );

  return params;
}

export async function generateMetadata(props: PageProps) {
  const params = await props.params;
  const { lang, slug } = params;
  // Fetch localized metadata from Directus if available
  // Example: title, description, etc.
  const pages = await client.request(
    readItems('pages', {
      filter: { permalink: { _eq: slug } },
      fields: [
        'permalink',
        { translations: ['languages_code', 'title', 'description'] },
      ],
    })
  );

  const page = pages[0] || {};
  const translation = page.translations?.find(
    (t: any) => t.languages_code === lang
  ) || {};
  const localizedTitle = translation.title || page.title || 'Untitled';

  return {
    title: localizedTitle,
    description: translation.description || '',
    // Add other metadata fields as needed
  };
}

async function DynamicPage({ params }: PageProps) {
  const { lang, slug } = (await params);
  initLingui(lang as 'en-US' | 'nl-NL');

  const slugWithLeadingSlash = `/${slug}`;

  try {
    const pages = await client.request(
      readItems('pages', {
        filter: { permalink: { _eq: slugWithLeadingSlash } },
        fields: [
          'id',
          'permalink',
          { blocks: ['id', 'collection', 'item.*'] },
          { translations: ['languages_code', 'title'] },
        ],
      })
    );
    console.log(pages);

    const page = pages[0];
    if (!page) {
      return notFound();
    }

    const translation = page.translations?.find(
      (t: any) => t.languages_code === lang
    );
    const localizedTitle = translation?.title || page.title || 'Untitled';

    return (
      <main className="bg-background pt-16">
        <h1 className="mb-6 px-4 text-4xl font-bold text-foreground">
          {localizedTitle}
        </h1>
        <BlocksRenderer blocks={page.blocks} lang={lang} />
      </main>
    );
  } catch (error) {
    console.error('Error fetching page:', error);
    return (
      <Trans id="error.loadingPage">
        Error loading page. Please try again later.
      </Trans>
    );
  }
}

export default DynamicPage;
