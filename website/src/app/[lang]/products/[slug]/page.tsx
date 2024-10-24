import BlocksRenderer from '@/components/blocks/BlocksRenderer';
import { client } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { notFound } from 'next/navigation';
import { getI18nInstance } from '@/appRouterI18n';
import { Trans } from '@lingui/react';
import { withLinguiPage } from '@/withLingUI';
import { getGlobalsByLang } from '@/lib/globals';
import { Metadata } from 'next';
import ProductHero from '@/components/ProductHero';
import { DIRECTUS_PUBLIC_ASSETS_URL } from '@/lib/directus';

type PageProps = {
  params: Promise<{
    lang: string;
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const locales = ['en-US', 'nl-NL']; // Fetch from Next.js config or Directus if dynamic

  const pages = await client.request(
    readItems('products', {
      fields: ['slug'],
    }),
  );

  const params = locales.flatMap((lang) =>
    pages.map((page: any) => ({
      lang,
      slug: page.permalink,
    }))
  );

  return params;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const { lang, slug } = params;
  const globals = await getGlobalsByLang(lang);

  const products = await client.request(
    readItems('products', {
      filter: { slug: { _eq: slug } },
      fields: [
        'slug',
        'name',
        { translations: ['languages_code', 'name', 'description'] },
      ],
    }),
  );

  const product = products[0] || {};
  const translation = product.translations?.find(
    (t: any) => t.languages_code === lang
  ) || {};

  const localizedName = translation.name || product.name || 'Untitled Product';

  return {
    title: `${localizedName} | ${globals?.title || 'Dembrane'}`,
    description: translation.description || '',
    // Add other metadata fields as needed
  };
}

async function ProductPage({ params }: PageProps) {
  const { lang, slug } = params;
  const i18n = getI18nInstance(lang as 'en-US' | 'nl-NL');

  try {
    const products = await client.request(
      readItems('products', {
        filter: { slug: { _eq: slug } },
        fields: [
          'id',
          'slug',
          'cover',
          'type',
          'name',
          { blocks: ['id', 'collection', 'item.*'] },
          {
            translations: [
              'languages_code',
              'name',
              'description',
              'headline',
              'type',
            ],
          },
        ],
      }),
    );

    const product = products[0];
    if (!product) {
      return notFound();
    }

    const translation = product.translations?.find(
      (t: any) => t.languages_code === lang
    );
    const localizedName = product.name || 'Untitled Product';
    const localizedDescription = translation?.description || '';
    const localizedHeadline = translation?.headline || '';
    const localizedType = translation?.type || product.type || '';

    return (
      <main className="">
        <ProductHero
          coverImage={product.cover}
          title={localizedName}
          type={localizedType}
          headline={localizedHeadline}
          description={localizedDescription}
        />
        <div className="mt-12 md:mt-24">
          {product.blocks && <BlocksRenderer blocks={product.blocks} lang={lang} />}
        </div>
      </main>
    );
  } catch (error) {
    console.error('Error fetching product:', error);
    return (
      <Trans id="error.loadingProduct">
        Error loading product. Please try again later.
      </Trans>
    );
  }
}

export default withLinguiPage(ProductPage);
