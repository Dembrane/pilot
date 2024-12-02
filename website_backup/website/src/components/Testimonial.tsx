"use client";

import React from 'react';
import Image from 'next/image';
import WysiwygContent from './WysiwygContent';
import { useTheme } from 'next-themes';

export type TestimonialProps = {
  id: string;
  content: string;
  title: string;
  subtitle: string;
  image: {
    id: string;
  };
  company: string;
  company_logo?: {
    id: string;
  };
  link?: string;
};

const Testimonial: React.FC<TestimonialProps> = ({
  id,
  content,
  title,
  subtitle,
  company,
  company_logo,
  link,
  image,
}) => {
  const { theme } = useTheme();
  
  const lightModeColors = ['bg-custom-green', 'bg-custom-cyan', 'bg-custom-pink'];
  const darkModeColors = ['bg-custom-bright-green', 'bg-custom-bright-cyan', 'bg-custom-bright-pink'];
  
  const randomColor = () => {
    const colors = theme === 'dark' ? darkModeColors : lightModeColors;
    console.log("colors", colors);
    return colors[Math.floor(Math.random() * colors.length)];
  };
  console.log("randomColor", randomColor);

  return (
    <div
      key={id}
      className="border border-border bg-card p-6 text-foreground shadow-md"
    >
      {content && (
        <div className="mb-4 italic text-muted-foreground">
          <WysiwygContent content={content} />
        </div>
      )}
      <div className="flex items-center">
        <div className="relative mr-4 flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-muted">
          {image.id ? (
            <Image
              src={`/assets/${image.id}`}
              alt={
                title
              }
              width={48}
              height={48}
              objectFit="cover"
            />
          ) : (
            <div className={`flex h-[48px] w-[48px] items-center justify-center rounded-full ${randomColor()} text-lg font-semibold text-background`}>
              {title
                ? title
                    .split(' ')
                    .slice(0, 2)
                    .map((word) => word[0])
                    .join('')
                    .toUpperCase()
                : '?'}
            </div>
          )}
        </div>
        <div>
          <p className="font-semibold text-card-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </div>
  );
};

export default Testimonial;
