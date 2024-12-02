import React from 'react';
import { BlockDivider as BlockDividerType } from '../../lib/types';

type BlockDividerProps = {
  block: BlockDividerType;
};

const BlockDivider: React.FC<BlockDividerProps> = ({ block }) => {
  return <hr title={block.title || 'Divider'} />;
};

export default BlockDivider;
