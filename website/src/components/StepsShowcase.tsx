'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  const [isSticky, setIsSticky] = useState(true);
  const [isImageVisible, setIsImageVisible] = useState(true);
  const stepsRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || !stepsRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const stepsRect = stepsRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Calculate if we should stick or unstick the image
      setIsSticky(
        containerRect.top <= 0 && 
        containerRect.bottom >= windowHeight
      );
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Add new function to handle step changes with fade
  const handleStepChange = (index: number) => {
    setIsImageVisible(false);
    setTimeout(() => {
      setActiveStep(index);
      setIsImageVisible(true);
    }, 300); // Match this timing with CSS transition duration
  };

  return (
    <div ref={containerRef} className="container mx-auto px-4 py-16 max-h-90vh">
      <div className="flex flex-col gap-8 md:flex-row ">
        {/* Left column with steps */}
        <div
          ref={stepsRef}
          className="flex w-full flex-col justify-between gap-8 md:w-1/3"
        >
          <div className="mb-8">
            {blockData.tag && (
              <span className="mb-4 inline-block rounded-full bg-accent px-3 py-1 text-base font-medium text-background">
                {blockData.tag}
              </span>
            )}
            {blockData.headline && (
              <h2 className="text-4xl leading-tight xl:text-6xl">
                {blockData.headline}
              </h2>
            )}
          </div>

          <div className="max-h-[70vh] space-y-6 overflow-y-auto">
            {blockData.steps.map((step, index) => (
              <button
                key={step.id}
                onMouseEnter={() => handleStepChange(index)}
                className={`w-full rounded-lg p-4 text-left transition-all ${
                  activeStep === index
                    ? 'bg-accent/10 border-l-4 border-accent'
                    : 'hover:bg-muted-background'
                }`}
              >
                <div className="flex items-start gap-4">
                  {blockData.show_step_numbers && (
                    <span className="font-mono text-sm text-accent">
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
          <div
            className={`${
              isSticky ? 'md:sticky md:top-24' : ''
            } relative transition-all duration-300`}
          >
            {blockData.steps.map((step, index) => (
              <Image
                key={step.id}
                src={`${DIRECTUS_PUBLIC_ASSETS_URL}${step.image}`}
                alt={step.title}
                width={1400}
                height={1400}
                className={`h-auto w-full rounded-lg object-cover transition-opacity duration-300 ${
                  index === 0 ? '' : 'absolute left-0 top-0'
                } ${
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
