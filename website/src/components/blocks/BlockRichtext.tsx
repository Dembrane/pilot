import React from 'react';
import { BlockRichtext as BlockRichtextType } from '../../lib/types';
import { client } from '@/lib/directus';
import { readItems } from '@directus/sdk';

type BlockRichtextProps = {
  block: {
    id: string;
    collection: string;
    item: BlockRichtextType;
  };
  lang: string;
};

const getBlockWithTranslations = async (blockId: string, lang: string) => {
  try {
    const response = await client.request<BlockRichtextType[]>(
      readItems('block_richtext', {
        filter: {
          id: {
            _eq: blockId,
          },
        },
        fields: [
          'title',
          'headline',
          'content',
          'alignment',
          'translations',
          'translations.languages_code',
          'translations.title',
          'translations.headline',
          'translations.content',
        ],
      }),
    );

    if (response && response.length > 0) {
      const block = response[0];
      if (!block) {
        return null;
      }
      const blockTranslation = block.translations.find((t: any) => t.languages_code === lang);

      return {
        title: blockTranslation?.title || block.title,
        headline: blockTranslation?.headline,
        content: blockTranslation?.content,
        alignment: block.alignment,
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

const BlockRichtext: React.FC<BlockRichtextProps> = async ({ block, lang }) => {
  if (!block.id) {
    return null;
  }

  const blockData = await getBlockWithTranslations(block.item.id, lang);

  if (!blockData) {
    return <div>Error loading rich text content. Please try again later.</div>;
  }

  return (
    <div className="w-full px-4 py-8">
      <div className={`max-w-3xl mx-auto ${blockData.alignment === 'center' ? 'text-center' : blockData.alignment === 'right' ? 'text-right' : 'text-left'}`}>
        {blockData.title && (
          <h2 className="text-2xl md:text-3xl font-bold mb-4">{blockData.title}</h2>
        )}
        {blockData.headline && (
          <h3 className="text-xl md:text-2xl mb-4">{blockData.headline}</h3>
        )}
        {blockData.content && (
          <div 
            className="prose prose-sm sm:prose lg:prose-lg"
            dangerouslySetInnerHTML={{ __html: blockData.content }}
          />
        )}
      </div>
    </div>
  );
};

export default BlockRichtext;
