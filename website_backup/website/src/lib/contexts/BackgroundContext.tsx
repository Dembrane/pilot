'use client';

import React, { createContext, useContext, useState } from 'react';

interface BackgroundContextType {
  isBackgroundEnabled: boolean;
  toggleBackground: () => void;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export function BackgroundProvider({ children }: { children: React.ReactNode }) {
  const [isBackgroundEnabled, setIsBackgroundEnabled] = useState(true);

  const toggleBackground = () => {
    setIsBackgroundEnabled(prev => !prev);
  };

  return (
    <BackgroundContext.Provider value={{ isBackgroundEnabled, toggleBackground }}>
      {children}
    </BackgroundContext.Provider>
  );
}

export function useBackground() {
  const context = useContext(BackgroundContext);
  if (undefined === context) {
    throw new Error('useBackground must be used within a BackgroundProvider');
  }
  return context;
}
