import React from 'react';
import { motion } from 'framer-motion';
import {
  BlockButtonGroup as BlockButtonGroupType,
  BlockButton,
} from '../../lib/types';
import { client } from '@/lib/directus';
import { readItem } from '@directus/sdk';
import FadeIn from '@/components/animations/FadeIn';
import Link from 'next/link';

type BlockButtonGroupProps = {
  id: string;
  lang: string;
};

const buttonVariants = {
  hidden: { opacity: 0, y: 100 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.2,
      duration: 0.5,
    },
  }),
};

const BlockButtonGroup: React.FC<BlockButtonGroupProps> = async ({
  id,
  lang,
}) => {
  const data = await getBlockButtonGroupData(id, lang);

  if (!data) {
    return null;
  }

  const { alignment, buttons } = data;

  const getButtonClass = (button: BlockButton) => {
    let baseClass =
      'px-6 py-3 rounded-full transition-colors duration-300 h-full shrink-0 ';

    switch (button.variant) {
      case 'primary':
        baseClass +=
          'bg-blue-600 text-white border-2 border-blue-600 hover:bg-blue-700 hover:border-blue-700';
        break;
      case 'secondary':
        baseClass +=
          'bg-transparent text-blue-600 border-2 border-blue-600 hover:bg-blue-100';
        break;
      case 'tertiary':
        baseClass +=
          'bg-transparent text-blue-600 hover:text-blue-700 border-2 border-transparent';
        break;
      case 'disabled':
        baseClass +=
          'bg-transparent text-gray-400 border-2 border-gray-300 cursor-not-allowed';
        break;
      default:
        baseClass +=
          'bg-blue-600 text-white border-2 border-blue-600 hover:bg-blue-700 hover:border-blue-700';
        break;
    }

    return baseClass;
  };

  return (
    <div
      className={`flex h-full flex-wrap justify-center gap-4 md:justify-start`}
    >
      {buttons.map((button, index) => {
        const translation =
          button.translations.find((t) => t.languages_code === lang) ||
          button.translations[0];
        return (
          <FadeIn key={button.id} index={index} className="flex h-full">
            <Link
              href={button.external_url || 'https://tally.so/r/npL14Z'}
              target="_blank"
              rel="noopener noreferrer"
              className={`${getButtonClass(button)} flex items-center`}
            >
              {translation.label}
            </Link>
          </FadeIn>
        );
      })}
    </div>
  );
};

async function getBlockButtonGroupData(
  id: string,
  lang: string,
): Promise<BlockButtonGroupType | null> {
  try {
    const response = await client.request<BlockButtonGroupType>(
      readItem('block_button_group', id, {
        fields: [
          'id',
          'alignment',
          'buttons.id',
          'buttons.variant',
          'buttons.translations.*',
        ],
        sort: 'buttons.sort',
      }),
    );

    if (!response) {
      console.error('No data returned from Directus');
      return null;
    }

    return response;
  } catch (error) {
    console.error('Error fetching block button group data:', error);
    return null;
  }
}

export default BlockButtonGroup;
