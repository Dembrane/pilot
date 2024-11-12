'use client';

import React from 'react';
import { motion, useInView } from 'framer-motion';
import { MotionDiv } from './MotionComponents';

const SlideIn: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ref = React.useRef<Element | null>(null);
  // @ts-ignore
  const isInView = useInView(ref, { once: true });

  return (
    <MotionDiv
      // @ts-ignore
      ref={ref}
      initial={{ opacity: 0, y: 100 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 100 }}
      transition={{ duration: 1 }}
    >
      {children}
    </MotionDiv>
  );
};

export default SlideIn;
