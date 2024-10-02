import React from 'react';
import Image from 'next/image';
import { BlockSteps as BlockStepsType, BlockStepItems } from '@/src/lib/types';

type BlockStepsProps = {
  block: BlockStepsType;
};

const BlockSteps = ({ block }: BlockStepsProps) => {
    
    if (!block || !block.id) {
      return null; // or some fallback UI
    }

    const {
      title,
      headline,
      alternate_image_position,
      show_step_numbers,
      steps = [],
    } = block;

  return (
    <div className="w-full px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {block.title && (
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-center">{block.title}</h2>
        )}
        {block.headline && (
          <p className="text-lg md:text-xl mb-6 text-center">{block.headline}</p>
        )}
        <div className="space-y-8 md:space-y-12">
          {steps.map((step: BlockStepItems, index: number) => (
            <div key={step.id} className={`flex flex-col ${block.alternate_image_position && index % 2 !== 0 ? 'md:flex-row-reverse' : 'md:flex-row'} items-center`}>
              {step.image && (
                <div className="w-full md:w-1/2 mb-4 md:mb-0">
                  <Image
                    src={`/assets/${step.image}`}
                    alt={step.title || `Step ${index + 1}`}
                    width={500}
                    height={300}
                    objectFit="cover"
                    className="rounded-lg"
                  />
                </div>
              )}
              <div className="w-full md:w-1/2 md:px-6">
                {block.show_step_numbers && (
                  <div className="text-2xl font-bold text-gray-300 mb-2">
                    {(index + 1).toString().padStart(2, '0')}
                  </div>
                )}
                {step.title && (
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                )}
                {step.content && (
                  <p className="text-gray-600">{step.content}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BlockSteps;
