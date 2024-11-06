'use client';

import React from 'react';
import * as PIcon from '@phosphor-icons/react';

type PhosphorIconProps = {
  name: string;
  size?: number;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill';
  className?: string;
};

export default function PhosphorIcon({ 
  name, 
  size = 24, 
  weight = 'light',
  className = '' 
}: PhosphorIconProps) {
  const IconComponent = (PIcon as unknown as Record<string, React.ComponentType<PIcon.IconProps> | undefined>)[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in Phosphor Icons`);
    return null;
  }

  return <IconComponent size={size} weight={weight} className={className} />;
}
