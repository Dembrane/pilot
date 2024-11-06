'use client';

import { NotionRenderer } from 'react-notion-x';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';

const Collection = dynamic(() =>
  import('react-notion-x/build/third-party/collection').then((m) => m.Collection)
);

interface NotionClientRendererProps {
  recordMap: any;
}

export default function NotionClientRenderer({ recordMap }: NotionClientRendererProps) {
  console.log(recordMap);
  return (
    <div className="my-12">
      <h1>Hello</h1>
      <NotionRenderer
        recordMap={recordMap}
        fullPage={true}
        darkMode={false}
        previewImages={false}
        components={{
          nextImage: Image,
          nextLink: Link,
          Collection,
        }}
      />
    </div>
  );
}
