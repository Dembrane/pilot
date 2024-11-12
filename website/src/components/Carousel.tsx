'use client';

import React, {
  useEffect,
  useRef,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { motion, useAnimation, PanInfo } from 'framer-motion';
import { MotionDiv } from './animations/MotionComponents';

interface InfiniteCarouselProps {
  id?: string;
  className?: string;
  title?: string;
  children: ReactNode[];
  itemWidth: string; // e.g., '300px', '25%', etc.
}

export default function InfiniteCarousel({
  id,
  className,
  title,
  children,
  itemWidth = '300px',
}: InfiniteCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<ReactNode[]>([]);
  const controls = useAnimation();

  useEffect(() => {
    if (children.length >= 4) {
      setItems([...children, ...children, ...children]);
    } else {
      setItems(children);
    }
  }, [children]);

  const handleDrag = (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    if (carouselRef.current) {
      carouselRef.current.scrollLeft -= info.delta.x;
    }
  };

  const onScroll = useCallback(() => {
    if (children.length >= 4 && carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      if (scrollLeft > scrollWidth - clientWidth - 500) {
        setItems((prevItems) => [...prevItems, ...children]);
      }
    }
  }, [children]);

  useEffect(() => {
    const refCurrent = carouselRef.current;
    if (refCurrent) {
      refCurrent.addEventListener('scroll', onScroll);
    }
    return () => {
      if (refCurrent) {
        refCurrent.removeEventListener('scroll', onScroll);
      }
    };
  }, [children, onScroll]);

  return (
    <div className="flex w-full flex-col">
      {title && (
        <h1 className="mb-2 min-w-full max-w-[80vw] px-2 text-5xl font-thin md:px-4 md:text-6xl lg:px-8">
          {title}
        </h1>
      )}
      <MotionDiv
        id={id}
        ref={carouselRef}
        className={`${className} relative mb-4 flex w-full snap-x snap-mandatory gap-8 overflow-x-auto p-2 md:p-4 lg:p-8`}
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.8}
        // @ts-ignore
        onDrag={handleDrag}
      >
        {items.map((item, index) => (
          <div
            key={index}
            style={{ width: itemWidth, flexShrink: 0 }}
            className="snap-start scroll-mx-2 md:scroll-mx-4 lg:scroll-mx-8"
          >
            {item}
          </div>
        ))}
      </MotionDiv>
    </div>
  );
}
