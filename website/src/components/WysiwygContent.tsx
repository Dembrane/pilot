import React from 'react';

interface WysiwygContentProps {
  content: string;
  className?: string;
}

const WysiwygContent: React.FC<WysiwygContentProps> = ({ content, className = '' }) => {
  return (
    <div className={`wysiwyg-content ${className}`}>
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
};

export default WysiwygContent;
