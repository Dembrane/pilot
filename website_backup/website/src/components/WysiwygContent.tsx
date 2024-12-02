'use client';

import React from 'react';

interface WysiwygContentProps {
  content: string;
  className?: string;
}

const WysiwygContent: React.FC<WysiwygContentProps> = ({ content, className = '' }) => {
  return (
    <div className={`wysiwyg-content ${className}`}>
      <style jsx>{`
        .wysiwyg-content ul {
          list-style-type: disc;
          padding-left: 20px;
        }
        .wysiwyg-content ul li {
          margin-bottom: 8px;
        }
      `}</style>
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
};

export default WysiwygContent;
