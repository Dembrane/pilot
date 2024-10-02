import React from 'react';
import Image from 'next/image';
import { BlockColumnsRows as BlockColumnsRowsType, BlockButtonGroup as BlockButtonGroupType } from '@/src/lib/types';
import BlockButtonGroup from './BlockButtonGroup';

type BlockColumnsRowsProps = {
  block: BlockColumnsRowsType;
};

const BlockColumnsRows: React.FC<BlockColumnsRowsProps> = ({ block }) => {
  return (
    <div className="flex flex-col space-y-8">
      {block.title && (
        <h3 className="text-2xl font-semibold">{block.title}</h3>
      )}
      {block.headline && (
        <h4 className="text-xl">{block.headline}</h4>
      )}
      {block.content && (
        <p className="text-gray-600">{block.content}</p>
      )}
      {block.image && (
        <div className={`w-full h-48 relative ${
          block.image_position === 'top' ? 'order-first' : 'order-last'
        }`}>
          <Image
            src={block.image.toString()}
            alt={block.title || ''}
            layout="fill"
            objectFit="cover"
          />
        </div>
      )}
      {block.button_group && typeof block.button_group === 'object' && (
        <div className="mt-4">
          <BlockButtonGroup {...block.button_group as BlockButtonGroupType} />
        </div>
      )}
    </div>
  );
};

export default BlockColumnsRows;
