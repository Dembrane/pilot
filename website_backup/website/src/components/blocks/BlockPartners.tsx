import React from 'react';
import { BlockPartners as BlockPartnersType, Partners } from '@/lib/types';
import { client } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import Image from 'next/image';
import AngledShowcase from '@/components/AngledShowcase';
import { DIRECTUS_PUBLIC_ASSETS_URL } from '@/lib/directus';

type BlockPartnersProps = {
  block: {
    id: string;
    collection: string;
    item: BlockPartnersType;
  };
  lang: string;
};

const getBlockWithPartners = async (blockId: string, lang: string) => {
  try {
    const [block, partners] = await Promise.all([
      client.request<BlockPartnersType[]>(
        readItems('block_partners', {
          filter: { id: { _eq: blockId } },
          fields: ['id', 'title', 'translations.*'],
        }),
      ),
      client.request<Partners[]>(
        readItems('partners', {
          filter: { status: { _eq: 'published' } },
          fields: ['id', 'name', 'logo'],
        }),
      ),
    ]);

    if (!block || block.length === 0 || !partners) {
      console.error('No data returned from Directus');
      return null;
    }

    const blockData = block[0];
    const blockTranslation = blockData.translations.find(
      (t: any) => t.languages_code === lang,
    );

    if (!blockTranslation) {
      console.error(`No translation found for language: ${lang}`);
      return null;
    }

    return {
      title: blockData.title,
      subtitle: blockTranslation.subtitle,
      partners: partners,
    };
  } catch (error) {
    console.error('Error fetching block with partners:', error);
    throw error;
  }
};

const BlockPartners: React.FC<BlockPartnersProps> = async ({ block, lang }) => {
  if (!block.item) {
    return null;
  }
  const blockData = await getBlockWithPartners(block.item.id, lang);

  if (!blockData) {
    return <div>Error loading partners. Please try again later.</div>;
  }

  return (
    <div className="relative">
      <AngledShowcase>
        {blockData.partners.map((partner) => (
            <Image
              src={`${DIRECTUS_PUBLIC_ASSETS_URL}/${partner.logo}`}
              alt={partner.name || ''}
              className='object-contain'
              width={400}
              height={400}
              key={partner.id}
            />
        ))}
      </AngledShowcase>
    </div>
  );
};

export default BlockPartners;
