import React from 'react';
import { BlockFaqs as BlockFaqsType } from '@/src/lib/types';

type BlockFaqsProps = {
  block: BlockFaqsType;
};

const BlockFaqs: React.FC<BlockFaqsProps> = ({ block }) => {
  return (
    <div>
      {/* Render block-specific content */}
      {JSON.stringify(block)}
    </div>
  );
};

export default BlockFaqs;
