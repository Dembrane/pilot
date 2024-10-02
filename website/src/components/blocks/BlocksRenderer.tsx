import React from 'react';
import dynamic from 'next/dynamic';
import { CustomDirectusTypes } from '@/src/lib/types';

type Block = {
  collection: string;
  id: string;
};

type BlocksRendererProps = {
  blocks?: Block[];
};

// Define a type for the props of block components
type BlockComponentProps = {
  block: Block;
};

// Create a type for the dynamically imported component
type DynamicBlockComponent = React.ComponentType<BlockComponentProps>;

const BlocksRenderer: React.FC<BlocksRendererProps> = ({ blocks = [] }) => {
  if (!blocks || !Array.isArray(blocks)) {
    console.warn('BlocksRenderer received invalid blocks prop:', blocks);
    return null;
  }

  return (
    <>
      {blocks.map((block) => {
        const BlockComponent = dynamic(() => import(`./Block${block.collection.replace('block_', '').charAt(0).toUpperCase() + block.collection.replace('block_', '').slice(1)}`), {
          loading: () => <p>Loading...</p>,
        }) as DynamicBlockComponent;

        return <BlockComponent key={block.id} block={block} />;
      })}
    </>
  );
};

export default BlocksRenderer;
