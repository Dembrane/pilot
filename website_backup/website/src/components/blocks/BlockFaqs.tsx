import React from 'react';
import { BlockFaqs as BlockFaqsType, Faqs } from '@/lib/types';
import { client } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import FaqAccordion from '@/components/FaqAccordion';

type BlockFaqsProps = {
  block: {
    id: string;
    collection: string;
    item: BlockFaqsType;
  };
  lang: string;
};

const getBlockWithFaqs = async (blockId: string, lang: string) => {
  try {
    const blockData = await client.request<BlockFaqsType[]>(
      readItems('block_faqs', {
        filter: { id: { _eq: blockId } },
        fields: [
          'id',
          'title',
          'translations.*',
          {
            qanda: [
              '*',
              {
                faqs_id: [
                  'id',
                  'icon_name',
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

    const faqsData = block.qanda.map((faqLink: any) => {
      const faq = faqLink.faqs_id;
      const faqTranslation = faq.translations.find(
        (t: any) => t.languages_code === lang
      );
      return {
        id: faq.id,
        icon_name: faq.icon_name,
        question: faqTranslation?.question,
        answer: faqTranslation?.answer,
      };
    });

    return {
      title: blockTranslation.title,
      headline: blockTranslation.headline,
      faqs: faqsData,
    };
  } catch (error) {
    console.error('Error fetching block with FAQs:', error);
    throw error;
  }
};

const BlockFaqs: React.FC<BlockFaqsProps> = async ({ block, lang }) => {
  const blockData = await getBlockWithFaqs(block.item.id, lang);

  if (!blockData) {
    return <div>Error loading FAQ block. Please try again later.</div>;
  }

  return <FaqAccordion blockData={blockData} faqs={blockData.faqs} />;
};

export default BlockFaqs;
