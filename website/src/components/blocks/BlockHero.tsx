import React from 'react';
import Image from 'next/image';
import { BlockHero as BlockHeroType } from '@/lib/types';
import { client } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { DIRECTUS_PUBLIC_ASSETS_URL } from '@/lib/directus';
import BlockButtonGroup from './BlockButtonGroup';
import AnimateLetters from '@/components/animations/AnimateLetters';
import FadeIn from '@/components/animations/FadeIn';
import SlideIn from '@/components/animations/SlideIn';
import WysiwygContent from '@/components/WysiwygContent';

type BlockHeroProps = {
  block: {
    id: string;
    collection: string;
    item: BlockHeroType;
  };
  lang: string;
};

const getBlockHeroData = async (blockId: string, lang: string) => {
  try {
    const response = await client.request<BlockHeroType[]>(
      readItems('block_hero', {
        filter: { id: { _eq: blockId } },
        fields: [
          'id', 'title', 'image', 'image_position',
          'button_group.id',
          'translations.*',
        ],
      })
    );

    if (!response || response.length === 0) {
      console.error('No data returned from Directus');
      return null;
    }

    const block = response[0];
    const blockTranslation = block.translations.find((t: any) => t.languages_code === lang);

    if (!blockTranslation) {
      console.error(`No translation found for language: ${lang}`);
      return null;
    }



    return {
      ...block,
      title: blockTranslation.title || block.title,
      headline: blockTranslation.headline,
      content: blockTranslation.content,
      button_group: block.button_group.id,
      image: block.image,
      image_position: block.image_position,
    };
  } catch (error) {
    console.error('Error fetching block hero data:', error);
    throw error;
  }
};

const BlockHero: React.FC<BlockHeroProps> = async ({ block, lang }) => {
  if (!block.id) {
    return null;
  }

  const blockData = await getBlockHeroData(block.item.id, lang);

  if (!blockData) {
    return <div>Error loading hero block. Please try again later.</div>;
  }

  return (
    <div className="relative flex min-h-[100vh] w-full flex-col items-center px-2 py-4 md:px-4 md:py-8 lg:px-8 lg:py-16 md:flex-row h-full">
      <div
        className={`w-full md:w-1/2 justify-items-end ${blockData.image_position === 'left' ? 'md:order-first' : 'md:order-last'}`}
      >
        <FadeIn index={1} className="">
          <Image
            src={`${DIRECTUS_PUBLIC_ASSETS_URL}${blockData.image}`}
            alt={blockData.title || 'Hero image'}
            width={1080}
            height={1080}
            className="rounded-lg object-cover ml-auto"
          />
        </FadeIn>
      </div>
      <div className="w-full space-y-4 text-center md:w-1/2 md:text-left">
        <AnimateLetters className="text-7xl lg:text-[10vw] md:-translate-x-[0.2vw]" text={blockData.title}/>
        <SlideIn>
          <h2 className="text-xl md:text-3xl md:max-w-[30vw]">
            <WysiwygContent content={blockData.headline} />
          </h2>
        </SlideIn>
        {blockData.button_group && (
          <div className="mt-4">
            <BlockButtonGroup id={blockData.button_group} lang={lang} />
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockHero;
