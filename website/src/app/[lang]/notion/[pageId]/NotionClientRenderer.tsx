'use client';

import { NotionRenderer } from 'react-notion-x';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import React from 'react';
import Loading from '@/app/[lang]/loading';

const Collection = dynamic(() =>
  import('react-notion-x/build/third-party/collection').then((m) => m.Collection)
);

interface NotionClientRendererProps {
  recordMap: any;
}

export default function NotionClientRenderer({ recordMap }: NotionClientRendererProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <Loading />;

  try {
    return (
      <NotionRenderer
        className={resolvedTheme === 'dark' ? 'dark-mode' : ''}
        recordMap={recordMap}
        fullPage={true}
        previewImages={false}
        components={{
          nextImage: Image,
          nextLink: Link,
          Collection,
        }}
      />
    );
  } catch (error) {
    console.error('Error rendering Notion page:', error);
    return <div>Error rendering Notion page</div>;
  }
}
