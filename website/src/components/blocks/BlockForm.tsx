import React from 'react';
import { BlockForm as BlockFormType } from '../../lib/types';
import { client } from '@/lib/directus';
import { readItems } from '@directus/sdk';

type BlockFormProps = {
  block: {
    id: string;
    collection: string;
    item: BlockFormType;
  };
  lang: string;
};

const getBlockWithTranslations = async (blockId: string, lang: string) => {
  try {
    const response = await client.request<BlockFormType[]>(
      readItems('block_form', {
        filter: {
          id: {
            _eq: blockId,
          },
        },
        fields: [
          'title',
          'headline',
          'tally_embed',
          'translations',
          'translations.languages_code',
          'translations.title',
          'translations.headline',
        ],
      }),
    );

    if (response && response.length > 0) {
      const block = response[0];

      if (!block) {
        return null;
      }
      // pick the translation that matches the language code
      const blockTranslation = block.translations.find((t: any) => t.languages_code === lang);

      return {
        title: blockTranslation?.title || block.title,
        headline: blockTranslation?.headline,
        tally_embed: blockTranslation?.tally_embed,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching block form:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    return null;
  }
};

const BlockForm: React.FC<BlockFormProps> = async ({ block, lang }) => {
  if (!block.id) {
    return null;
  }

  const blockData = await getBlockWithTranslations(block.item.id, lang);

  if (!blockData) {
    return <div>Error loading form. Please try again later.</div>;
  }

  // Sanitize the form URL
  const sanitizeFormUrl = (url: string): string => {
    try {
      const parsedUrl = new URL(url);
      // Add additional checks here if needed
      // Check if the URL is a valid Tally form embed URL
      if (!parsedUrl.hostname.endsWith('tally.so') || !parsedUrl.pathname.startsWith('/embed/')) {
        console.error('Invalid Tally form URL');
        return '';
      }
      return parsedUrl.toString();
    } catch {
      console.error('Invalid form URL');
      return '';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {blockData.title && (
        <h2 className="text-3xl font-bold mb-2">{blockData.title}</h2>
      )}
      {blockData.headline && (
        <p className="text-xl mb-6">{blockData.headline}</p>
      )}
      {blockData.tally_embed && (
        <div className="w-full">
          <iframe
            src={sanitizeFormUrl(blockData.tally_embed)}
            className="w-full h-[500px] overflow-auto"
            title="Tally Form"
          />
        </div>
      )}
    </div>
  );
};

export default BlockForm;
