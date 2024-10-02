import React from 'react';
import { BlockTestimonialsType } from '@/src/lib/types';
import { client } from '@/src/lib/directus';
import WysiwygContent from '@/src/components/WysiwygContent';
import { readItems } from '@directus/sdk';
import dynamic from 'next/dynamic';
import Testimonial from '@/src/components/Testimonial';

// Dynamically import the CarouselWrapper component
const CarouselWrapper = dynamic(() => import('@/src/components/CarouselWrapper'), {
  ssr: false
});

type BlockTestimonialsProps = {
  block: {
    id: string;
    collection: string;
    item: BlockTestimonialsType;
  };
};

const getBlockWithTestimonials = async (blockId: string) => {
  try {
    const response = await client.request<BlockTestimonialsType[]>(
      readItems('block_testimonials', {
        filter: {
          id: {
            _eq: blockId,
          },
        },
        fields: [
          'headline',
          'title',
          'testimonials.testimonials_id.*',
        ],
      }),
    );

    if (response && response.length > 0) {
      const block = response[0];
      return {
        headline: block.headline,
        title: block.title,
        testimonials: block.testimonials.map((item: any) => ({
          id: item.testimonials_id.id,
          company: item.testimonials_id.company,
          company_logo: item.testimonials_id.company_logo,
          image: item.testimonials_id.image,
          link: item.testimonials_id.link,
          title: item.testimonials_id.title,
          subtitle: item.testimonials_id.subtitle,
          content: item.testimonials_id.content,
          status: item.testimonials_id.status,
        })),
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching block with testimonials:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    return null;
  }
};

const BlockTestimonials: React.FC<BlockTestimonialsProps> = async ({ block }) => {
  if (!block.id) {
    return null;
  }

  const blockData = await getBlockWithTestimonials(block.item.id);

  if (!blockData) {
    return <div>Error loading testimonials. Please try again later.</div>;
  }

  return (
    <CarouselWrapper title={blockData.title} headline={blockData.headline}>
      {blockData.testimonials.map((testimonial) => (
        <Testimonial key={testimonial.id} {...testimonial} />
      ))}
    </CarouselWrapper>
  );
};

export default BlockTestimonials;
