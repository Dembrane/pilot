'use client';

import React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import WysiwygContent from '@/components/WysiwygContent';
import type { CarouselApi } from '@/components/ui/carousel';
import AutoScrollPlugin from 'embla-carousel-auto-scroll';

const AngledShowcase: React.FC<AngledShowcaseProps> = ({
  title,
  headline,
  children,
}) => {
  const [api, setApi] = React.useState<CarouselApi>();
  const [plugins, setPlugins] = React.useState<AutoScrollPlugin[]>([]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      import('embla-carousel-auto-scroll').then((AutoScrollModule) => {
        const autoScrollPlugin = AutoScrollModule.default({
          speed: 2, // Adjust speed as needed
          direction: 'backward',
          stopOnInteraction: false,
          stopOnMouseEnter: false, // Optional: stops scrolling when mouse enters
        });
        setPlugins([autoScrollPlugin]);
      });
    }
  }, []);

  return (
      <div className="">
        <Carousel
          opts={{
            align: 'start',
            loop: true,
            skipSnaps: false,
            dragFree: true,
          }}
          plugins={plugins}
          setApi={setApi}
          className="w-full"
        >
          {/* Title and headline sections */}
          <CarouselContent className="ml-0">
            {React.Children.map(children, (child, index) => (
              <CarouselItem
                key={index}
                className="basis-4/5 sm:basis-1/3 pb-4 pl-4 dark:invert md:basis-1/4 lg:basis-1/6"
              >{child}
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
  );
};

export default AngledShowcase;
