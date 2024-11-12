import React from 'react';
import { BlockSteps as BlockStepsType } from '@/lib/types';
import { client } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import StepsShowcase from '@/components/StepsShowcase';

type BlockStepsProps = {
  block: {
    id: string;
    collection: string;
    item: BlockStepsType;
  };
  lang: string;
};

const getBlockWithSteps = async (blockId: string, lang: string) => {
  try {
    const response = await client.request<BlockStepsType[]>(
      readItems('block_steps', {
        filter: {
          id: {
            _eq: blockId,
          },
        },
        fields: [
          'id',
          'title',
          'show_step_numbers',
          {
            translations: ['languages_code', 'title', 'headline', 'tag'],
          },
          {
            steps: [
              'id',
              'title',
              'content',
              'image',
              'sort',
              'translations.*',
            ],
          },
        ],
        // @ts-ignore
        sort: ['steps.sort'],
      }),
    );

    if (!response || response.length === 0) return null;

    const block = response[0];
    const blockTranslation = block?.translations?.find(
      (t: any) => t.languages_code === lang,
    );

    const steps = block?.steps.map((step: any) => {
      const stepTranslation = step.translations?.find(
        (t: any) => t.languages_code === lang,
      );
      return {
        id: step.id,
        title: stepTranslation?.title || step.title,
        content: stepTranslation?.content || step.content,
        image: step.image,
      };
    });

    return {
      title: blockTranslation?.title ?? block?.title ?? '',
      headline: blockTranslation?.headline ?? '',
      tag: blockTranslation?.tag ?? '',
      show_step_numbers: block?.show_step_numbers ?? false,
      steps: steps ?? [],
    };
  } catch (error) {
    console.error('Error fetching block steps:', error);
    return null;
  }
};

const BlockSteps: React.FC<BlockStepsProps> = async ({ block, lang }) => {
  const blockData = await getBlockWithSteps(block.item.id, lang);

  if (!blockData) {
    return <div>Error loading steps block. Please try again later.</div>;
  }

  return <StepsShowcase blockData={blockData ?? []} />;
};

export default BlockSteps;
