import React from 'react';
import { BlockQuote as BlockQuoteType } from '@/lib/types';
import { client } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import QuoteShowcase from '@/components/QuoteShowcase';

type BlockQuoteProps = {
  block: {
    id: string;
    collection: string;
    item: BlockQuoteType;
  };
  lang: string;
};

const getBlockWithTranslations = async (blockId: string, lang: string) => {
  try {
    const response = await client.request<BlockQuoteType[]>(
      readItems('block_quote', {
        filter: {
          id: {
            _eq: blockId,
          },
        },
        fields: [
          'content',
          'title',
          'subtitle',
          'translations.*',
        ],
      }),
    );

    if (response && response.length > 0) {
      const block = response[0];
      if (!block) {
        return null;
      }
      const blockTranslation = block.translations?.find((t: any) => t.languages_code === lang);

      return {
        content: blockTranslation?.content || block.content,
        title: blockTranslation?.title || block.title,
        subtitle: blockTranslation?.subtitle || block.subtitle,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching block quote:', error);
    return null;
  }
};

const BlockQuote: React.FC<BlockQuoteProps> = async ({ block, lang }) => {
  if (!block.id) {
    return null;
  }

  const blockData = await getBlockWithTranslations(block.item.id, lang);

  if (!blockData) {
    return <div>Error loading quote. Please try again later.</div>;
  }

  return <QuoteShowcase {...blockData} />;
};

export default BlockQuote;
