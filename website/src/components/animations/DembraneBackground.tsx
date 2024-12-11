'use client';

import { useState, useEffect } from 'react';
import { DembraneSketch } from '@/components/animations/Dots';
import { useTheme } from 'next-themes';
import { useBackground } from '@/lib/contexts/BackgroundContext';

export default function DembraneBackground() {
  const { theme } = useTheme();
  const [opacity, setOpacity] = useState(0.4);
  const [paused, setPaused] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { isBackgroundEnabled } = useBackground();

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Don't render if background is disabled
  if (!mounted || !isBackgroundEnabled) {
    return null;
  }

  return (
    <div
      className="fixed left-0 top-0 -z-50 h-screen w-screen filter-blur-xl"
      style={{
        opacity,
        backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
        filter: theme === 'dark' 
          ? 'blur(0px)' 
          : 'blur(0px)',
      }}
    >
      <DembraneSketch pageWidth={1000} paused={paused} theme={theme} />
    </div>
  );
}
