import React from 'react';
import { BlockHtml as BlockHtmlType } from '../../lib/types';

type BlockHtmlProps = {
  block: BlockHtmlType;
};

const BlockHtml: React.FC<BlockHtmlProps> = ({ block }) => {
  return (
    <div className="w-full max-w-full overflow-x-auto">
      {block.raw_html && (
        <div
          className="prose prose-sm sm:prose lg:prose-lg mx-auto"
          dangerouslySetInnerHTML={{ __html: block.raw_html }}
        />
      )}
    </div>
  );
};

export default BlockHtml;
