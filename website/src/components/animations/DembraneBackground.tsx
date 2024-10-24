'use client';

import { useState, useEffect } from 'react';
import { DembraneSketch } from '@/components/animations/Dots';
   import { useTheme } from 'next-themes';


export default function DembraneBackground() {
  const { theme } = useTheme();
  const [opacity, setOpacity] = useState(0.3);
  const [paused, setPaused] = useState(false);

     console.log('Current theme:', theme);

  useEffect(() => {
    const handleScroll = () => {
      const parentScroll =
        document.getElementById('parent-scroll') || document.body;
      const maxScroll = parentScroll.clientHeight * 2;
      const currentScroll = parentScroll.scrollTop;
      const opacity = (0.3 * (maxScroll - currentScroll)) / maxScroll;
      setOpacity(opacity);
      setPaused(opacity <= 0);
    };

    document
      .getElementById('parent-scroll')
      ?.addEventListener('scroll', handleScroll);

    return () => {
      document
        .getElementById('parent-scroll')
        ?.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div
      className="fixed left-0 top-0 -z-50 h-screen w-screen"
      style={{
        opacity,
        filter: theme === 'dark' ? 'invert(1)' : 'none',
      }}
    >
      <DembraneSketch pageWidth={1000} paused={paused} />
    </div>
  );
}
