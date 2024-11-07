import React from 'react';
import Link from 'next/link';
import { BlockButton as BlockButtonType } from '@/lib/types';

type BlockButtonProps = {
  block: BlockButtonType;
};

const BlockButton: React.FC<BlockButtonProps> = ({ block }) => {
  const buttonClasses = `
    px-4 py-2 rounded transition-colors
    ${block.color ? `bg-${block.color}-500 hover:bg-${block.color}-600 text-white` : 'bg-blue-500 hover:bg-blue-600 text-white'}
    ${block.variant === 'outline' ? `border border-${block.color || 'blue'}-500 bg-transparent text-${block.color || 'blue'}-500 hover:bg-${block.color || 'blue'}-500 hover:text-white` : ''}
  `;

  const ButtonContent = () => (
    <button className={buttonClasses}>
      {block.label || 'Default Button'}
    </button>
  );

  if (block.external_url) {
    return (
      <a href={block.external_url} target="_blank" rel="noopener noreferrer">
        <ButtonContent />
      </a>
    );
  }

  if (block.page) {
    return (
      <Link href={`/${block.page}`}>
        <ButtonContent />
      </Link>
    );
  }

  if (block.post) {
    return (
      <Link href={`/blog/${block.post}`}>
        <ButtonContent />
      </Link>
    );
  }

  return <ButtonContent />;
};

export default BlockButton;
