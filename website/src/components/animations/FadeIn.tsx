'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MotionDiv } from './MotionComponents';

interface FadeInProps {
  children: React.ReactNode;
  index: number;
  className?: string;
}

const fadeVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
    },
  }),
};

const FadeIn: React.FC<FadeInProps> = ({ children, index, className }) => {
  return (
    <MotionDiv
      variants={fadeVariants}
      initial="hidden"
      animate="visible"
      custom={index}
      className={`h-full ${className || ''}`}
    >
      {children}
    </MotionDiv>
  );
};

export default FadeIn;
