'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { DIRECTUS_PUBLIC_ASSETS_URL } from '@/lib/directus';
import WysiwygContent from './WysiwygContent';

type Step = {
  id: string;
  title: string;
  content: string;
  image: string;
};

type StepsShowcaseProps = {
  blockData: {
    title: string;
    headline?: string;
    tag: string;
    show_step_numbers?: boolean;
    steps: Step[];
  };
};

const StepsShowcase: React.FC<StepsShowcaseProps> = ({ blockData }) => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isImageVisible, setIsImageVisible] = useState(true);

  const handleStepChange = (index: number) => {
    setIsImageVisible(false);
    setTimeout(() => {
      setActiveStep(index);
      setIsImageVisible(true);
    }, 300); // Match this timing with CSS transition duration
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="flex flex-col gap-8 md:flex-row">
        {/* Left column with steps */}
        <div className="flex w-full flex-col md:w-1/3 justify-between">
          <div className="mb-4">
            {blockData.tag && (
              <span className="mb-4 inline-block rounded-full bg-secondary px-3 py-1 text-base font-medium text-secondary-foreground">
                {blockData.tag}
              </span>
            )}
            {blockData.headline && (
              <h2 className="text-4xl leading-tight xl:text-6xl">
                {blockData.headline}
              </h2>
            )}
          </div>

          <div className="overflow-y-auto">
            {blockData.steps.map((step, index) => (
              <button
                key={step.id}
                onMouseEnter={() => handleStepChange(index)}
                className={`w-full rounded-lg p-4 text-left transition-all ${
                  activeStep === index
                    ? 'bg-secondary/10 border-l-4 border-secondary'
                    : 'hover:bg-muted-background'
                }`}
              >
                <div className="flex items-start gap-4">
                  {blockData.show_step_numbers && (
                    <span className="font-mono text-sm text-secondary">
                      {(index + 1).toString().padStart(2, '0')}
                    </span>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                    <WysiwygContent content={step.content} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right column with image */}
        <div className="w-full md:w-2/3">
          <div className="relative aspect-square">
            {blockData.steps.map((step, index) => (
              <Image
                key={step.id}
                src={`${DIRECTUS_PUBLIC_ASSETS_URL}${step.image}`}
                alt={step.title}
                fill
                className={`rounded-lg object-cover transition-opacity duration-300 ${
                  activeStep === index ? 'z-10 opacity-100' : 'z-0 opacity-0'
                }`}
                priority={index === 0}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepsShowcase;
