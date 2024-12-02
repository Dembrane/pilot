'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform, stagger } from 'framer-motion';
import { DIRECTUS_PUBLIC_ASSETS_URL } from '@/lib/directus';
import AnimateLetters from './animations/AnimateLetters';
import WysiwygContent from './WysiwygContent';
import { MotionDiv, MotionH1, MotionH2 } from './animations/MotionComponents';

interface ProductHeroProps {
  coverImage: string | null;
  title: string;
  type: string;
  headline: string;
  description: string;
}

const ProductHero: React.FC<ProductHeroProps> = ({
  coverImage,
  title,
  type,
  headline,
  description,
}) => {
  const [heroHeight, setHeroHeight] = useState(0);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, heroHeight], [0, heroHeight / 2]);

  useEffect(() => {
    setHeroHeight(window.innerHeight);
  }, []);

  const imageVariants = {
    hidden: {
      opacity: 0.05,
      filter: 'blur(20px)',
      transition: {
        duration: 5,
        ease: [0.2, 0.65, 0.3, 0.9],
      },
    },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
    },
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 1.2,
        staggerChildren: 0.3,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.2, 0.65, 0.3, 0.9] },
    },
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        ease: [0.2, 0.65, 0.3, 0.9],
      },
    },
  };

  return (
    <div className="relative">
      <MotionDiv
        className="fixed left-0 top-0 -z-50 h-screen w-full overflow-hidden"
        variants={imageVariants}
        initial="visible"
        whileInView="hidden"
        viewport={{ once: true }}
      >
        {coverImage && (
          <MotionDiv className="h-full w-full">
            <Image
              src={`${DIRECTUS_PUBLIC_ASSETS_URL}${coverImage}`}
              alt={title}
              layout="fill"
              objectFit="cover"
              priority
            />
          </MotionDiv>
        )}
      </MotionDiv>

      <MotionDiv
        className="flex min-h-screen flex-col items-center justify-center space-y-16 p-8 text-center text-foreground"
        variants={contentVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <MotionH1
          className="md:text-12xl text-8xl lg:text-[16rem]"
          variants={itemVariants}
        >
          <AnimateLetters text={title} />
        </MotionH1>

        <MotionDiv
          className="flex w-full items-center justify-center gap-8"
          variants={itemVariants}
        >
          <div className="w-full  border-t border-foreground"></div>
          <span className="flex-shrink-0 text-xs uppercase tracking-widest">
            {type}
          </span>
          <div className="w-full  border-t border-foreground"></div>
        </MotionDiv>

        <MotionH2
          className="mb-8 max-w-3xl text-6xl font-semibold"
          variants={itemVariants}
        >
          {headline}
        </MotionH2>

        <WysiwygContent className="max-w-3xl text-xl" content={description} />
      </MotionDiv>
    </div>
  );
};

export default ProductHero;
