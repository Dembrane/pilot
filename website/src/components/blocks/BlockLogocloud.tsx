import React from 'react';
import Image from 'next/image';
import { BlockLogocloud as BlockLogocloudType, BlockLogocloudLogos } from '@/src/lib/types';

type BlockLogocloudProps = {
  block: BlockLogocloudType;
};

const BlockLogocloud: React.FC<BlockLogocloudProps> = ({ block }) => {
    if (!block || !block.logos) {
      return null; // or some fallback UI
    }
  return (
    <div className="container mx-auto px-4 py-8">
      {block.title && (
        <h2 className="text-2xl md:text-3xl font-bold mb-2 text-center">{block.title}</h2>
      )}
      {block.headline && (
        <p className="text-lg md:text-xl mb-6 text-center">{block.headline}</p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 items-center justify-items-center">
        {block.logos.map((logo: BlockLogocloudLogos, index: number) => (
          <div key={index} className="w-full h-24 relative">
            {logo.directus_files_id && typeof logo.directus_files_id === 'object' && logo.directus_files_id.id && (
              <Image
                src={`/assets/${logo.directus_files_id.id}`}
                alt={logo.directus_files_id.title || `Logo ${index + 1}`}
                layout="fill"
                objectFit="contain"
                className="filter grayscale hover:grayscale-0 transition-all duration-300"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlockLogocloud;
