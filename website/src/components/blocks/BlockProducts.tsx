import React from 'react';
import { BlockProducts as BlockProductsType, Products } from '@/lib/types';
import { client } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import SlideIn from '@/components/animations/SlideIn';
import AnimateLetters from '@/components/animations/AnimateLetters';
import { DIRECTUS_PUBLIC_ASSETS_URL } from '@/lib/directus';
import CaptionedImageLink from '@/components/CaptionedImageLink';
import WysiwygContent from '@components/WysiwygContent';

type BlockProductsProps = {
  block: {
    id: string;
    collection: string;
    item: BlockProductsType;
  };
  lang: string;
};

const getBlockWithProducts = async (blockId: string, lang: string) => {
  try {
    const blockData = await client.request<BlockProductsType[]>(
      readItems('block_products', {
        filter: { id: { _eq: blockId } },
        fields: [
          'id',
          'title',
          'translations.*',
          {
            products: [
              '*',
              {
                products_id: [
                  'id',
                  'name',
                  'slug',
                  'cover',
                  'type',
                  'translations.*',
                ],
              },
            ],
          },
        ],
      })
    );

    if (!blockData || blockData.length === 0) {
      console.error('No data returned from Directus');
      return null;
    }

    const block = blockData[0];

    const blockTranslation = block.translations.find(
      (t: any) => t.languages_code === lang
    );

    if (!blockTranslation) {
      console.error(`No translation found for language: ${lang}`);
      return null;
    }

    const productsData = block.products.map((productLink: any) => {
      const product = productLink.products_id;
      const productTranslation = product.translations.find(
        (t: any) => t.languages_code === lang
      );
      return {
        id: product.id,
        name: product.name,
        cover: product.cover,
        description: productTranslation?.description,
        headline: productTranslation?.headline,
        tag: productTranslation?.type,
        slug: product.slug,
      };
    });

    return {
      title: blockTranslation.title,
      subtitle: blockTranslation.headline,
      products: productsData,
    };
  } catch (error) {
    console.error('Error fetching block with products:', error);
    throw error;
  }
};

const BlockProducts: React.FC<BlockProductsProps> = async ({ block, lang }) => {
  const blockData = await getBlockWithProducts(block.item.id, lang);

  if (!blockData) {
    return <div>Error loading products. Please try again later.</div>;
  }

  return (
    <SlideIn>
      <div className="mx-auto mt-12 p-2 md:container md:mt-40">
        {blockData.title && (
          <AnimateLetters
            className="text-center text-4xl md:text-8xl"
            text={blockData.title}
          />
        )}
        {blockData.subtitle && (
          <SlideIn>
            <WysiwygContent
              className="text-center text-2xl md:text-4xl "
              content={blockData.subtitle}
            />
          </SlideIn>
        )}
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {blockData.products.map((product, index) => (
            <div
              key={product.id}
              className={`${
                index < 2 ? 'col-span-full md:col-span-2 lg:col-span-3' : ''
              } h-full`}
            >
              <CaptionedImageLink
                imageSrc={
                  product.cover
                    ? `${DIRECTUS_PUBLIC_ASSETS_URL}${product.cover}`
                    : null
                }
                imageAlt={product.name || 'Product Image'}
                title={product.name || 'Unnamed Product'}
                description={product.headline || ''}
                tag={product.tag || ''}
                href={`/products/${product.slug}`}
                isLarge={index < 2}
              />
            </div>
          ))}
        </div>
      </div>
    </SlideIn>
  );
};

export default BlockProducts;
