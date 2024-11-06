'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import WysiwygContent from '@/components/WysiwygContent';
import { DIRECTUS_PUBLIC_ASSETS_URL } from '@/lib/directus';
import BlockButtonGroup from '@/components/blocks/BlockButtonGroup';

type AnimatedHeroContentProps = {
  title?: string;
  headline?: string;
  content?: string;
  image?: string;
  imagePosition?: 'left' | 'right';
  buttonGroup?: string;
  lang: string;
  };


const AnimatedHeroContent: React.FC<AnimatedHeroContentProps> = ({
  title,
  headline,
  content,
  image,
  imagePosition = 'right',
  buttonGroup,
  lang
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
      },
    },
  };

  const titleVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1, // Adjust the staggering delay as needed
      },
    },
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.2, 0.65, 0.3, 0.9],
      },
    },
  };

  const imageVariants = {
    hidden: { opacity: 0, x: imagePosition === 'left' ? -50 : 50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.8,
        ease: [0.6, -0.05, 0.01, 0.99],
      },
    },
  };

  return (
    <div className="relative flex min-h-[50vh] w-full flex-col items-center justify-around px-4 py-12 md:flex-row">
      <motion.div
        className="flex w-full flex-col items-center justify-center px-8 py-4 text-center md:w-1/2 md:items-start md:p-8 md:text-left"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {title && (
          <motion.h1
            className="mb-4 text-6xl md:text-8xl lg:text-9xl"
            variants={titleVariants}
          >
            {title.split(' ').map((word, wordIndex) => (
              <span key={`word-${wordIndex}`} className="inline-block whitespace-nowrap mr-[0.25em]">
                {word.split('').map((char, charIndex) => (
                  <motion.span
                    key={`char-${wordIndex}-${charIndex}`}
                    variants={letterVariants}
                    style={{ display: 'inline-block' }}
                  >
                    {char}
                  </motion.span>
                ))}
              </span>
            ))}
          </motion.h1>
        )}
        {headline && (
          <motion.div variants={containerVariants}>
            <WysiwygContent
              content={headline}
              className="mb-12 text-xl md:text-2xl lg:text-3xl"
            />
          </motion.div>
        )}
        {content && (
          <motion.div variants={containerVariants}>
            <WysiwygContent
              content={content}
              className="mb-12 text-base md:text-lg"
            />
          </motion.div>
        )}
        
        {buttonGroup && <BlockButtonGroup id={buttonGroup} lang={lang} />}
      </motion.div>

      {image && (
        <motion.div
          className={`relative w-full md:h-full md:w-1/2 ${
            imagePosition === 'left' ? 'order-first' : 'order-last'
          }`}
          variants={imageVariants}
          initial="hidden"
          animate="visible"
        >
          <Image
            src={`${DIRECTUS_PUBLIC_ASSETS_URL}${image}`}
            alt={title || 'Hero image'}
            width={1080}
            height={1080}
            priority
            className={`h-full w-full object-cover ${
              imagePosition === 'left' ? 'object-left' : 'object-center' // Corrected 'object-top' to 'object-left'
            }`}
          />
        </motion.div>
      )}
    </div>
  );
};

export default AnimatedHeroContent;