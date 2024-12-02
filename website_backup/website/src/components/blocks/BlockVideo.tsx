import React from 'react';
import { BlockVideo as BlockVideoType } from '@/lib/types';

type BlockVideoProps = {
  block: BlockVideoType;
};

const BlockVideo: React.FC<BlockVideoProps> = ({ block }) => {
  return (
    <div className="w-full px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {block.title && (
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-center">{block.title}</h2>
        )}
        {block.headline && (
          <p className="text-lg md:text-xl mb-6 text-center text-gray-600">{block.headline}</p>
        )}
        <div className="aspect-w-16 aspect-h-9">
          {block.video_url ? (
            <iframe
              src={block.video_url}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          ) : block.video_file && typeof block.video_file === 'object' ? (
            <video
              className="w-full h-full object-cover"
              controls
            >
              <source src={`/assets/${block.video_file.id}`} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
              No video available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlockVideo;
