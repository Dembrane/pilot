import React from 'react';
import { BlockHtml as BlockHtmlType } from '@/lib/types';
import { client } from '@/lib/directus';
import { readItems } from '@directus/sdk';

type BlockHtmlProps = {
  block: {
    id: string;
    collection: string;
    item: BlockHtmlType;
  };
  lang: string;
};

const getBlockWithTranslations = async (blockId: string, lang: string) => {
  try {
    const response = await client.request<BlockHtmlType[]>(
      readItems('block_html', {
        filter: {
          id: {
            _eq: blockId,
          },
        },
        fields: [
          'raw_html',
          'translations',
          'translations.languages_code',
          'translations.raw_html',
        ],
      }),
    );

    if (response && response.length > 0) {
      const block = response[0];
      if (!block) {
        return null;
      }
      // Pick the translation that matches the language code
      const blockTranslation = block.translations.find((t: any) => t.languages_code === lang);

      return {
        raw_html: blockTranslation?.raw_html,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching block with translations:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    return null;
  }
};

const BlockHtml: React.FC<BlockHtmlProps> = async ({ block, lang }) => {
  if (!block.id) {
    return null;
  }

  const blockData = await getBlockWithTranslations(block.item.id, lang);

  if (!blockData) {
    return <div>Error loading HTML content. Please try again later.</div>;
  }

  return (
    <div className="w-full max-w-full overflow-x-auto">
      {blockData.raw_html && (
        <div
          className="prose prose-sm sm:prose lg:prose-lg mx-auto"
          dangerouslySetInnerHTML={{ __html: blockData.raw_html }}
        />
      )}
    </div>
  );
};

export default BlockHtml;
