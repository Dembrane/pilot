'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform, stagger } from 'framer-motion';
import { DIRECTUS_PUBLIC_ASSETS_URL } from '@/lib/directus';
import AnimateLetters from './animations/AnimateLetters';
import WysiwygContent from './WysiwygContent';

interface ProductHeroProps {
  coverImage: string | null;
  title: string;
  type: string;
  headline: string;
  description: string;
}

const ProductHero: React.FC<ProductHeroProps> = ({ coverImage, title, type, headline, description }) => {
  const [heroHeight, setHeroHeight] = useState(0);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, heroHeight], [0, heroHeight / 2]);

  useEffect(() => {
    setHeroHeight(window.innerHeight);
  }, []);

  const imageVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 1.5 } },
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
      } 
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.8, ease: [0.2, 0.65, 0.3, 0.9] } 
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
      <motion.div
        className="relative h-screen overflow-hidden"
        variants={imageVariants}
        initial="hidden"
        animate="visible"
      >
        {coverImage && (
          <Image
            src={`${DIRECTUS_PUBLIC_ASSETS_URL}${coverImage}`}
            alt={title}
            layout="fill"
            objectFit="cover"
            priority
          />
        )}
      </motion.div>

      <motion.div
        className="flex min-h-screen flex-col items-center justify-center space-y-16 p-8 text-center text-foreground"
        variants={contentVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.h1
          className="md:text-12xl text-8xl lg:text-[16rem]"
          variants={itemVariants}
        >
          <AnimateLetters text={title} />
        </motion.h1>

        <motion.div className="relative w-full" variants={itemVariants}>
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-foreground"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-4 text-xs uppercase tracking-widest">
              {type}
            </span>
          </div>
        </motion.div>

        <motion.h2
          className="mb-8 max-w-3xl text-6xl font-semibold"
          variants={itemVariants}
        >
          {headline}
        </motion.h2>

        <WysiwygContent className="max-w-3xl text-xl" content={description} />
      </motion.div>
    </div>
  );
};

export default ProductHero;
