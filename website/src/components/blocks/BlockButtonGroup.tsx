import React from 'react';
import { BlockButtonGroup as BlockButtonGroupType, BlockButton } from '../../lib/types';

const BlockButtonGroup: React.FC<BlockButtonGroupType> = ({ alignment = 'left', buttons }) => {
  const alignmentClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  return (
    <div className={`flex flex-wrap gap-2 ${alignmentClasses[alignment as keyof typeof alignmentClasses] || 'justify-start'}`}>
      {buttons.map((button: BlockButton, index: number) => (
        <button
          key={index}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          {button.label}
        </button>
      ))}
    </div>
  );
};

export default BlockButtonGroup;
