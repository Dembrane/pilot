import React from 'react';
import Image from 'next/image';
import WysiwygContent from './WysiwygContent';

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
}) => (
  <div key={id} className="rounded-3xl bg-white p-6 shadow-md text-pink-500">
    <div className="mb-4 italic text-gray-600">
      <WysiwygContent content={content} />
    </div>
    <div className="flex items-center">
      {image && (
        <div className="relative mr-4 h-12 w-12 overflow-hidden rounded-full">
          <Image
            src={`/assets/${image.id}`}
            alt={title || ''}
            width={48}
            height={48}
            objectFit="cover"
          />
        </div>
      )}
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
    </div>
  </div>
);

export default Testimonial;
