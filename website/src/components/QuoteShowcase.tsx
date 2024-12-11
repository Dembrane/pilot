'use client';

import React from 'react';
import SlideIn from '@/components/animations/SlideIn';
import WysiwygContent from '@/components/WysiwygContent';
import { Quotes } from '@phosphor-icons/react';

type QuoteShowcaseProps = {
  content: string;
  title?: string;
  subtitle?: string;
};

const QuoteShowcase: React.FC<QuoteShowcaseProps> = ({
  content,
  title,
  subtitle,
}) => {
  return (
    <SlideIn>
      <div className="container flex min-h-[70vh] flex-col items-center justify-center px-4 py-8 text-center ">
        <div className="relative h-min w-full px-12 py-6 backdrop-blur-lg">
          <div className="mx-auto max-w-3xl">
            <span className="absolute left-0 top-0">
              <Quotes
                size={45}
                style={{ transform: 'scaleX(-1)' }}
                weight="thin"
              />
            </span>
            <WysiwygContent
              content={content}
              className="relative mb-4 text-2xl leading-loose md:text-4xl"
            />
            <span className="absolute bottom-0 right-0">
              <Quotes size={45} weight="thin" />
            </span>
          </div>
        </div>
        <div className="mt-8 flex flex-col items-center">
          {title && <cite className="text-lg">{title}</cite>}
          {subtitle && <span className="text-sm">{subtitle}</span>}
        </div>
      </div>
    </SlideIn>
  );
};

export default QuoteShowcase;
