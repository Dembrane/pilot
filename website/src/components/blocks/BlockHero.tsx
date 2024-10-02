import React from 'react';
import Image from 'next/image';
import { BlockHero as BlockHeroType, BlockButtonGroup as BlockButtonGroupType } from '@/src/lib/types';
import BlockButtonGroup from './BlockButtonGroup';

type BlockHeroProps = {
  block: BlockHeroType;
  buttonGroup: BlockButtonGroupType;
};

const BlockHero: React.FC<BlockHeroProps> = ({ block, buttonGroup }) => {

  return (
    <div className="relative w-full min-h-[50vh] flex flex-col justify-center items-center px-4 py-12 text-center">
      {block.image && (
        <div className="absolute inset-0 z-0">
          <Image
            src={typeof block.image === 'string' ? block.image : block.image.id}
            alt={block.title || 'Hero image'}
            layout="fill"
            objectFit="cover"
            className={`${block.image_position === 'top' ? 'object-top' : 'object-center'}`}
          />
        </div>
      )}
      <div className="relative z-10 max-w-3xl">
        {block.title && (
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">{block.title}</h1>
        )}
        {block.headline && (
          <h2 className="text-xl md:text-2xl lg:text-3xl mb-6">{block.headline}</h2>
        )}
        {block.content && (
          <p className="text-base md:text-lg mb-8">{block.content}</p>
        )}
        {buttonGroup && (
          <BlockButtonGroup {...buttonGroup} />
        )}
      </div>
    </div>
  );
};

export default BlockHero;
