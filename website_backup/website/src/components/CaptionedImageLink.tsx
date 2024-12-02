'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import WysiwygContent from '@/components/WysiwygContent';
import AnimateLetters from './animations/AnimateLetters';
import { RiArrowRightUpLine } from 'react-icons/ri';
import { useFocus } from '@/hooks/useFocus';
import { MotionDiv } from './animations/MotionComponents';

interface CaptionedImageLinkProps {
  imageSrc: string;
  imageAlt: string;
  title: string;
  description: string;
  tag?: string;
  href: string;
  isLarge?: boolean;
}

const cardVariants = {
  initial: { opacity: 0, scale: 0.5 },
  active: { opacity: 1, scale: 1.2 },
};

const imageVariants = {
  initial: { opacity: 0.9, scale: 1.05 },
  active: { opacity: 1, scale: 1 },
};

const overlayVariants = {
  initial: { opacity: 0 },
  active: { opacity: 1 },
};

const titleVariants = {
  initial: { width: 'auto' },
  active: { width: '100%', transition: { duration: 0.3, ease: 'easeInOut' } },
};

const contentVariants = {
  initial: { opacity: 0, height: 0 },
  active: { opacity: 1, height: 'auto' },
};

const arrowVariants = {
  initial: { opacity: 0, x: -50 },
  active: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
};

const CaptionedImageLink: React.FC<CaptionedImageLinkProps> = ({
  imageSrc,
  imageAlt,
  title,
  description,
  tag,
  href,
  isLarge = false,
}) => {
  const [isActive, setIsActive] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const canFocus = useFocus();

  useEffect(() => {
    if (!canFocus && ref.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry && entry.isIntersecting) {
            const rect = entry.boundingClientRect;
            const viewportHeight = window.innerHeight;
            const elementCenterY = rect.top + rect.height / 2;
            const viewportCenterY = viewportHeight / 2;
            const distanceFromCenter = Math.abs(
              elementCenterY - viewportCenterY,
            );

            const activeAreaSize = viewportHeight * 0.8;
            setIsActive(distanceFromCenter < activeAreaSize / 2);
          } else {
            setIsActive(false);
          }
        },
        {
          threshold: 0.5,
          rootMargin: '-40% 0px -40% 0px',
        },
      );

      observer.observe(ref.current);

      return () => observer.disconnect();
    }

    if (canFocus) {
      setIsActive(false);
    }
  }, [canFocus]);

  const handleMouseEnter = () => {
    if (canFocus) setIsActive(true);
  };

  const handleMouseLeave = () => {
    if (canFocus) setIsActive(false);
  };

  return (
    <div
      ref={ref}
      className="relative block h-full cursor-pointer overflow-hidden rounded-[50px] rounded-bl-none"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link href={href} className="group block h-full">
        <MotionDiv
          className="relative h-full"
          animate={isActive ? 'active' : 'initial'}
          transition={{ duration: 0.1 }}
        >
          <MotionDiv
            className="absolute inset-0 -z-20 origin-center bg-muted blur-xl"
            variants={cardVariants}
            transition={{ duration: 0.3 }}
          />
          <MotionDiv
            className="origin-center"
            variants={imageVariants}
            transition={{ duration: 0.5 }}
          >
            {imageSrc == null ? (
              <div className="h-[50vh] w-full bg-gradient-to-tr from-custom-cyan to-custom-green"></div>
            ) : (
              <Image
                src={imageSrc}
                alt={imageAlt}
                className="h-fullw-full object-fill"
                width={1920}
                height={1080}
              />
            )}
          </MotionDiv>

          <MotionDiv
            className="absolute inset-0"
            variants={overlayVariants}
            transition={{ duration: 0.3 }}
          />

          <MotionDiv
            className="absolute bottom-2 left-2 origin-bottom-left overflow-hidden transition-all duration-300 ease-in-out"
            variants={titleVariants}
            initial="initial"
            animate={isActive ? 'active' : 'initial'}
            transition={{ duration: 0.3 }}
          >
            <div className="w-min min-w-[70vw] rounded-[20px] rounded-bl-none bg-background px-6 py-4 text-foreground md:min-w-min">
              <div className="flex">
                <h3
                  className={`${isLarge ? 'text-4xl md:text-8xl' : 'text-2xl md:text-4xl'} whitespace-nowrap`}
                >
                  {title}
                </h3>
                <AnimatePresence>
                  {isActive && (
                    <MotionDiv
                      className="mr-2 flex-shrink-0"
                      variants={arrowVariants}
                      initial="initial"
                      animate="active"
                      exit="exit"
                      transition={{ duration: 0.3 }}
                    >
                      <RiArrowRightUpLine
                        className={`${isLarge ? 'h-10 w-10 md:h-24 md:w-24' : 'h-8 w-8 md:h-10 md:w-10'} `}
                      />
                    </MotionDiv>
                  )}
                </AnimatePresence>
              </div>
              <AnimatePresence>
                {isActive && (
                  <MotionDiv
                    className="mt-2"
                    variants={contentVariants}
                    initial="initial"
                    animate="active"
                    exit="initial"
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center">
                      <div className="text-xl">
                        <WysiwygContent content={`${tag}: ${description}`} />
                      </div>
                    </div>
                  </MotionDiv>
                )}
              </AnimatePresence>
            </div>
          </MotionDiv>
        </MotionDiv>
      </Link>
    </div>
  );
};

export default CaptionedImageLink;
