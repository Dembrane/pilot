'use client';

import React from 'react';
import { motion } from 'framer-motion';

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
    <motion.div
      variants={fadeVariants}
      initial="hidden"
      animate="visible"
      custom={index}
      className={`h-full ${className || ''}`}
    >
      {children}
    </motion.div>
  );
};

export default FadeIn;
