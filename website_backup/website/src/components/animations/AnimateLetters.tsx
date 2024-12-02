'use client';

import React from 'react';
import { motion, useInView } from 'framer-motion';
import { MotionDiv } from './MotionComponents';

interface AnimateLettersProps {
  text: string;
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // Adjust the stagger timing as needed
      delayChildren: 0, // Adjust the delay before children start animating
    },
  },
};

const letterVariants = {
  hidden: { opacity: 0, y: 50 },
  show: { opacity: 1, y: 0 },
};

const AnimateLetters: React.FC<AnimateLettersProps> = ({
  text,
  className = '',
}) => {
  const words = text.split(' ');
  const ref = React.useRef<Element | null>(null);
  // @ts-ignore
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <MotionDiv
      // @ts-ignore
      ref={ref}
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'show' : 'hidden'}
    >
      {words.map((word, wordIndex) => (
        <span key={wordIndex} className="inline-block whitespace-nowrap">
          {word.split('').map((char, charIndex) => (
            <motion.span
              key={`${wordIndex}-${charIndex}`}
              variants={letterVariants}
              style={{ display: 'inline-block' }} // Ensure letters don't wrap
            >
              {char}
            </motion.span>
          ))}
          {wordIndex < words.length - 1 && '\u00A0'} {/* Preserve space */}
        </span>
      ))}
    </MotionDiv>
  );
};

export default AnimateLetters;
