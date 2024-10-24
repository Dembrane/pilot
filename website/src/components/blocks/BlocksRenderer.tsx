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

const BlocksRenderer: React.FC<BlocksRendererProps> = ({ blocks = [], lang }) => {
  if (!blocks || !Array.isArray(blocks)) {
    console.warn('BlocksRenderer received invalid blocks prop:', blocks);
    return null;
  }

  return (
    <>
      {blocks.map((block) => {
        const blockName = `Block${block.collection
          .replace('block_', '')
          .charAt(0)
          .toUpperCase()}${block.collection.replace('block_', '').slice(1)}`;

        const BlockComponent = dynamic(() => import(`./${blockName}`), {
          loading: () => (
            <Skeleton className="h-64 w-full my-4 rounded-md" />
          ),
        }) as DynamicBlockComponent;

        return <BlockComponent key={block.id} block={block} lang={lang} />;
      })}
    </>
  );
};

export default BlocksRenderer;
