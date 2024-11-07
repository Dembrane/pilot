import React from 'react';
import { BlockCta as BlockCtaType } from '../../lib/types';

type BlockCtaProps = {
  block: BlockCtaType;
};

const BlockCta: React.FC<BlockCtaProps> = ({ block }) => {
  return (
    <div>
      <h2>{block.headline || 'Call to Action'}</h2>
      <p>{block.content || 'CTA Content'}</p>
      {/* Render button group if exists */}
      {block.button_group && <div>Render Button Group Here</div>}
    </div>
  );
};

export default BlockCta;
