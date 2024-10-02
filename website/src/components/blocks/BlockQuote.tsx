import React from 'react';
import { BlockQuote as BlockQuoteType } from '@/src/lib/types';

type BlockQuoteProps = {
  block: BlockQuoteType;
};

const BlockQuote: React.FC<BlockQuoteProps> = ({ block }) => {
  return (
    <div className="w-full px-4 py-8 bg-gray-100">
      <div className="max-w-3xl mx-auto">
        {block.content && (
          <blockquote className="text-xl md:text-2xl font-serif italic text-gray-700 mb-4">
            "{block.content}"
          </blockquote>
        )}
        <div className="flex flex-col items-start">
          {block.title && (
            <cite className="text-lg font-semibold text-gray-900">
              {block.title}
            </cite>
          )}
          {block.subtitle && (
            <span className="text-sm text-gray-600">
              {block.subtitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlockQuote;
