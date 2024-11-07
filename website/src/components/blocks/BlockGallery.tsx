import React from 'react';
import Image from 'next/image';
import { BlockGallery as BlockGalleryType, BlockGalleryFiles } from '../../lib/types';

type BlockGalleryProps = {
  block: BlockGalleryType;
};

const BlockGallery: React.FC<BlockGalleryProps> = ({ block }) => {
    if (!block || !block.gallery_items) {
      return null; // or some fallback UI
    }
  return (
    <div className="container mx-auto px-4 py-8">
      {block.title && (
        <h2 className="text-3xl font-bold mb-2">{block.title}</h2>
      )}
      {block.headline && (
        <p className="text-xl mb-6">{block.headline}</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {block.gallery_items.map((item: BlockGalleryFiles, index: number) => (
          <div key={index} className="relative aspect-square overflow-hidden rounded-lg">
            {item.directus_files_id && typeof item.directus_files_id === 'object' && item.directus_files_id.id && (
              <Image
                src={`/assets/${item.directus_files_id.id}`}
                alt={item.directus_files_id.title || `Gallery image ${index + 1}`}
                layout="fill"
                objectFit="cover"
                className="transition-transform duration-300 hover:scale-110"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlockGallery;
