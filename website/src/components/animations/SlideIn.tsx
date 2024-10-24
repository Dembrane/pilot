'use client';

import React from 'react';
import { motion, useInView } from 'framer-motion';

const SlideIn: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 100 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 100 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
};

export default SlideIn;
