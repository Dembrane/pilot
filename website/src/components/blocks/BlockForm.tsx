import React from 'react';
import { BlockForm as BlockFormType } from '../../lib/types';

type BlockFormProps = {
  block: BlockFormType;
};

const BlockForm: React.FC<BlockFormProps> = ({ block }) => {
  // Sanitize the form URL
  const sanitizeFormUrl = (url: string): string => {
    try {
      const parsedUrl = new URL(url);
      // Add additional checks here if needed
      // Check if the URL is a valid Tally form embed URL
      if (!parsedUrl.hostname.endsWith('tally.so') || !parsedUrl.pathname.startsWith('/embed/')) {
        console.error('Invalid Tally form URL');
        return '';
      }
      return parsedUrl.toString();
    } catch {
      console.error('Invalid form URL');
      return '';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {block.title && (
        <h2 className="text-3xl font-bold mb-2">{block.title}</h2>
      )}
      {block.headline && (
        <p className="text-xl mb-6">{block.headline}</p>
      )}
      {block.tally_embed && (
        <div className="w-full">
          <div
            dangerouslySetInnerHTML={{ __html: block.tally_embed }}
            className="w-full h-[500px] overflow-auto"
          ></div>
        </div>
      )}
    </div>
  );
};

export default BlockForm;
