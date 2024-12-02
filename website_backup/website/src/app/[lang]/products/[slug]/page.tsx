import BlocksRenderer from '@/components/blocks/BlocksRenderer';
import { client } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { notFound } from 'next/navigation';
import { getI18nInstance } from '@/appRouterI18n';
import { Trans } from '@lingui/macro';
import { getGlobalsByLang } from '@/lib/globals';
import { Metadata } from 'next';
import ProductHero from '@/components/ProductHero';
import { DIRECTUS_PUBLIC_ASSETS_URL } from '@/lib/directus';
import { initLingui } from '@/initLingui';
import { DirectusFiles, Products } from '@lib/types';

type PageProps = {
  params: Promise<{
    lang: string;
    slug: string;
  }>;
};

export const dynamic = 'error';

export async function generateStaticParams() {
  const locales = ['en-US', 'nl-NL']; // Fetch from Next.js config or Directus if dynamic

  const pages = await client.request<Products[]>(
    readItems('products', {
      fields: ['slug'],
      filter: {
        status: { _eq: 'published' },
      },
    }),
  );

  const params = locales.flatMap((lang) =>
    pages.map((page) => ({
      lang,
      slug: page.slug,
    })),
  );

  return params;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { lang, slug } = await props.params;
  initLingui(lang as 'en-US' | 'nl-NL');
  const globals = await getGlobalsByLang(lang);

  const products = await client.request<Products[]>(
    readItems('products', {
      filter: { slug: { _eq: slug } },
      fields: [
        'slug',
        'name',
        { translations: ['languages_code', 'description'] },
      ],
    }),
  );

  if (!products[0]) {
    return {
      title: 'Dembrane',
      description: '',
    };
  }

  const product = products[0];

  const translation = product.translations?.find(
    (t: any) => t.languages_code === lang,
  );

  const localizedName = product.name || 'Untitled Product';

  return {
    title: `${localizedName} | ${globals?.title || 'Dembrane'}`,
    description: translation?.description ?? '',
  };
}

async function ProductPage({ params }: PageProps) {
  const { lang, slug } = await params;
  const i18n = getI18nInstance(lang as 'en-US' | 'nl-NL');

  try {
    const products = await client.request(
      readItems('products', {
        filter: { slug: { _eq: slug } },
        fields: [
          'id',
          'slug',
          'cover',
          'name',
          { blocks: ['id', 'collection', 'item.*'] },
          {
            translations: ['languages_code', 'description', 'headline', 'type'],
          },
        ],
      }),
    );

    const product = products[0];
    if (!product) {
      return notFound();
    }

    const translation = product.translations?.find(
      (t: any) => t.languages_code === lang,
    );
    const localizedName = product.name || 'Untitled Product';
    const localizedDescription = translation?.description || '';
    const localizedHeadline = translation?.headline || '';
    const localizedType = translation?.type || '';

    return (
      <main className="">
        <ProductHero
          // @ts-ignore
          coverImage={product.cover}
          title={localizedName}
          type={localizedType}
          headline={localizedHeadline}
          description={localizedDescription}
        />
        <div className="mt-12 md:mt-24">
          {product.blocks && (
            // @ts-ignore
            <BlocksRenderer blocks={product.blocks} lang={lang} />
          )}
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

export default ProductPage;
