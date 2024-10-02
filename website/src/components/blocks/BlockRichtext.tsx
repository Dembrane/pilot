import React from 'react';
import { BlockRichtext as BlockRichtextType } from '../../lib/types';

type BlockRichtextProps = {
  block: BlockRichtextType;
};

const BlockRichtext: React.FC<BlockRichtextProps> = ({ block }) => {
  return (
    <div className="w-full px-4 py-8">
      <div className={`max-w-3xl mx-auto ${block.alignment === 'center' ? 'text-center' : block.alignment === 'right' ? 'text-right' : 'text-left'}`}>
        {block.title && (
          <h2 className="text-2xl md:text-3xl font-bold mb-4">{block.title}</h2>
        )}
        {block.headline && (
          <h3 className="text-xl md:text-2xl mb-4">{block.headline}</h3>
        )}
        {block.content && (
          <div 
            className="prose prose-sm sm:prose lg:prose-lg"
            dangerouslySetInnerHTML={{ __html: block.content }}
          />
        )}
      </div>
    </div>
  );
};

export default BlockRichtext;
