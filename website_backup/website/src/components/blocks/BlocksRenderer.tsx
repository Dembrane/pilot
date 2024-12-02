import React from 'react';
import dynamic from 'next/dynamic';
import { CustomDirectusTypes } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

type Block = {
  collection: string;
  id: string;
};

type BlocksRendererProps = {
  blocks?: Block[];
  lang: string;
};

// Define a type for the props of block components
type BlockComponentProps = {
  block: Block;
  lang: string;
};

// Create a type for the dynamically imported component
type DynamicBlockComponent = React.ComponentType<BlockComponentProps>;

const BlocksRenderer: React.FC<BlocksRendererProps> = async ({ blocks = [], lang }) => {
  if (!blocks || !Array.isArray(blocks)) {
    console.warn('BlocksRenderer received invalid blocks prop:', blocks);
    return null;
  }

  const blockComponents = await Promise.all(
    blocks.map(async (block) => {
      const blockName = `Block${block.collection
        .replace('block_', '')
        .charAt(0)
        .toUpperCase()}${block.collection.replace('block_', '').slice(1)}`;

      const BlockComponent = (await import(`./${blockName}`)).default;

      return <BlockComponent key={block.id} block={block} lang={lang} />;
    })
  );

  return <>{blockComponents}</>;
};

export default BlocksRenderer;
