import React from 'react';
import { BlockTestimonials as BlockTestimonialsType } from '@/lib/types';
import { client } from '@/lib/directus';
import WysiwygContent from '@/components/WysiwygContent';
import { readItems } from '@directus/sdk';
import dynamic from 'next/dynamic';
import Testimonial from '@/components/Testimonial';
import { Skeleton } from '@/components/ui/skeleton';
import { useTheme } from 'next-themes';


// Dynamically import the CarouselWrapper component
const CarouselWrapper = dynamic(() => import('@/components/CarouselWrapper'), {
  loading: () => <TestimonialsSkeleton />
});

type BlockTestimonialsProps = {
  block: {
    id: string;
    collection: string;
    item: BlockTestimonialsType;
  };
  lang: string;
};

const getBlockWithTestimonials = async (blockId: string, lang: string) => {
  try {
    const response = await client.request<BlockTestimonialsType[]>(
      readItems('block_testimonials', {
        filter: {
          id: {
            _eq: blockId,
          },
        },
        fields: [
          'title',
          'testimonials',
          'translations',
          'translations.languages_code',
          'translations.title',
          'translations.headline',
          'testimonials.testimonials_id.id',
          'testimonials.testimonials_id.company',
          'testimonials.testimonials_id.company_logo',
          'testimonials.testimonials_id.image',
          'testimonials.testimonials_id.link',
          'testimonials.testimonials_id.title',
          'testimonials.testimonials_id.translations.languages_code',
          'testimonials.testimonials_id.translations.subtitle',
          'testimonials.testimonials_id.translations.content',
        ],
      })
    );

    if (!response || response.length === 0) {
      console.error('No data returned from Directus');
      return null;
    }

    const block = response[0];

    if (!block) {
      console.error('Block data is undefined');
      return null;
    }
    console.log(JSON.stringify(block, null, 2));

    const blockTranslation = block.translations.find((t: any) => t.languages_code === lang);

    if (!blockTranslation) {
      console.error(`No translation found for language: ${lang}`);
      return null;
    }
    console.log(JSON.stringify(blockTranslation, null, 2));
    return {
      title: blockTranslation.title,
      headline: blockTranslation.headline,
      testimonials: block.testimonials.map((item: any) => {
        const testimonialTranslation = item.testimonials_id.translations.find((t: any) => t.languages_code === lang);
        if (!testimonialTranslation) {
          console.warn(`No translation found for testimonial ${item.testimonials_id.id} in language: ${lang}`);
        }
        return {
          id: item.testimonials_id.id,
          company: item.testimonials_id.company,
          company_logo: item.testimonials_id.company_logo,
          image: item.testimonials_id.image,
          link: item.testimonials_id.link,
          title: item.testimonials_id.title,
          subtitle: testimonialTranslation?.subtitle,
          content: testimonialTranslation?.content,
          status: item.testimonials_id.status,
        };
      }),
    };
  } catch (error) {
    console.error('Error fetching block with testimonials:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    // You might want to throw the error here instead of returning null,
    // depending on how you want to handle errors in the component
    throw error;
  }
};

const TestimonialsSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-10 w-3/4 max-w-sm" />
    <Skeleton className="h-6 w-1/2 max-w-xs" />
    <div className="flex space-x-4 overflow-x-auto py-4">
      {[...Array(3)].map((_, index) => (
        <div key={index} className="w-80 flex-shrink-0 space-y-2">
          <Skeleton className="h-40 w-full" />
        </div>
      ))}
    </div>
  </div>
);

const BlockTestimonials: React.FC<BlockTestimonialsProps> = async ({ block, lang }) => {
  if (!block.id) {
    return null;
  }

  const blockData = await getBlockWithTestimonials(block.item.id, lang);


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
