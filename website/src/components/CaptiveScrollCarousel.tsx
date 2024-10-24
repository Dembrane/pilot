'use client';

import React, { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';

interface CaptiveScrollCarouselProps {
  background: string; // URL for image or color string
  children: React.ReactNode[];
}

const CaptiveScrollCarousel: React.FC<CaptiveScrollCarouselProps> = ({
  background,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current && containerRef.current) {
      const contentScrollWidth = contentRef.current.scrollWidth;
      const contentOffsetWidth = contentRef.current.offsetWidth;
      const containerWidth = containerRef.current.offsetWidth;
      
      // Calculate the extra width needed for scrolling
      const extraWidth = Math.max(0, contentScrollWidth - containerWidth);
      setContentWidth(extraWidth);

      // Set container height based on whether scrolling is needed
      setContainerHeight(extraWidth > 0 ? 200 : 100);
    }
  }, [children]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const contentX = useTransform(scrollYProgress, [0, 1], [0, -contentWidth]);

  const isBackgroundImage =
    background.startsWith('http') || background.startsWith('/');

  return (
    <motion.div
      ref={containerRef}
      className="relative h-[200vh]" // Adjust this to control when scrolling ends
    >
      <motion.div
        className="sticky top-0 h-screen overflow-hidden"
        style={{
          willChange: 'transform',
        }}
      >
        {isBackgroundImage ? (
          <Image
            src={background}
            alt="Background"
            layout="fill"
            objectFit="cover"
            priority
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ backgroundColor: background }}
          />
        )}
        <motion.div
          ref={contentRef}
          className="absolute inset-0 flex items-center"
          style={{ x: contentX }}
        >
          <div className="flex space-x-8 px-8 w-full">
            {children.map((child, index) => (
              <div key={index} className="flex-shrink-0">
                {child}
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default CaptiveScrollCarousel;
