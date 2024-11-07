'use client';

import React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import WysiwygContent from '@/components/WysiwygContent';
import type { CarouselApi } from '@/components/ui/carousel';
import type { AutoplayPlugin } from 'embla-carousel-autoplay';
import { Button } from '@/components/ui/button';
import { PlayIcon, PauseIcon } from '@radix-ui/react-icons';
import AnimateLetters from './animations/AnimateLetters';

type CarouselWrapperProps = {
  title?: string;
  headline?: string;
  children: React.ReactNode;
};

const CarouselWrapper: React.FC<CarouselWrapperProps> = ({ title, headline, children }) => {
  const [api, setApi] = React.useState<CarouselApi>();
  const [autoplay, setAutoplay] = React.useState<AutoplayPlugin | null>(null);
  const [plugins, setPlugins] = React.useState<AutoplayPlugin[]>([]);
  const [isAutoplayActive, setIsAutoplayActive] = React.useState(false);
  const autoplayTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      import('embla-carousel-autoplay').then((AutoplayModule) => {
        const autoplayPlugin = AutoplayModule.default({ 
          delay: 2000, 
          stopOnInteraction: true,
          stopOnMouseEnter: true,
          playOnInit: true,
        });
        setAutoplay(autoplayPlugin);
        setPlugins([autoplayPlugin]);
      });
    }
  }, []);

  const toggleAutoplay = React.useCallback(() => {
    if (autoplay) {
      if (isAutoplayActive) {
        autoplay.stop();
      } else {
        autoplay.play();
      }
      setIsAutoplayActive(!isAutoplayActive);
    }
  }, [autoplay, isAutoplayActive]);

  const resetAutoplayTimeout = React.useCallback(() => {
    if (autoplayTimeoutRef.current) {
      clearTimeout(autoplayTimeoutRef.current);
    }
    autoplayTimeoutRef.current = setTimeout(() => {
      if (autoplay) {
        autoplay.play();
        setIsAutoplayActive(true);
      }
    }, 0);
  }, [autoplay]);

  React.useEffect(() => {
    if (!api || !autoplay) return;

    const onSelect = () => {
      autoplay.stop();
      setIsAutoplayActive(false);
      resetAutoplayTimeout();
    };

    api.on('select', onSelect);
    return () => {
      api.off('select', onSelect);
    };
  }, [api, autoplay, resetAutoplayTimeout]);

  return (
    <div className="w-full overflow-visible mt-24">
      <Carousel
        opts={{
          align: 'start',
          loop: true,
          skipSnaps: false,
          inViewThreshold: 0.7,
          dragFree: true,
          containScroll: 'trimSnaps',
        }}
        plugins={plugins}
        setApi={setApi}
        className="w-full"
      >
        <div className="md:container">
          <div className="mb-8 flex items-center justify-between">
            {title && (
              <AnimateLetters
                text={title}
                className="px-4 text-left text-4xl text-foreground sm:text-6xl md:text-9xl"
              />
            )}
            <div className="flex items-center space-x-2 px-4">
              <CarouselPrevious className="relative inset-auto transform-none" />
              <Button
                variant="outline"
                size="icon"
                onClick={toggleAutoplay}
                className="relative inset-auto transform-none rounded-full"
              >
                {isAutoplayActive ? (
                  <PauseIcon className="h-4 w-4" />
                ) : (
                  <PlayIcon className="h-4 w-4" />
                )}
              </Button>
              <CarouselNext className="relative inset-auto transform-none" />
            </div>
          </div>

          {headline && (
            <div className="mb-4 max-w-3xl px-4 text-left text-2xl text-muted-foreground md:text-4xl">
              <WysiwygContent content={headline} />
            </div>
          )}
        </div>
        <CarouselContent className="ml-0 my-6">
          {React.Children.map(children, (child, index) => (
            <CarouselItem
              key={index}
              // className="basis-3/4 pb-4 pl-4 sm:basis-1/2 lg:basis-1/3 xl:basis-1/4 2xl:basis-1/5"
              className="max-w-[80vw] basis-[400px]"
            >
              {child}
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

export default CarouselWrapper;
