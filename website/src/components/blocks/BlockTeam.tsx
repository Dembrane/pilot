import React from 'react';
import { BlockTeam as BlockTeamType } from '@/src/lib/types';

type BlockTeamProps = {
  block: BlockTeamType;
};

const BlockTeam: React.FC<BlockTeamProps> = ({ block }) => {
  return (
    <div className="w-full px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {block.title && (
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-center">{block.title}</h2>
        )}
        {block.headline && (
          <p className="text-lg md:text-xl mb-6 text-center text-gray-600">{block.headline}</p>
        )}
        {block.content && (
          <div 
            className="prose prose-sm sm:prose lg:prose-lg mx-auto"
            dangerouslySetInnerHTML={{ __html: block.content }}
          />
        )}
      </div>
    </div>
  );
};

export default BlockTeam;
