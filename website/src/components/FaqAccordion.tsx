'use client';

import React, { useState } from 'react';
import { Faqs } from '@/lib/types';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input'; // Assuming you have an Input component from ShadCN
import * as PIcon from '@phosphor-icons/react';
import WysiwygContent from './WysiwygContent';
import { t } from '@lingui/macro';
import { useLingui } from '@lingui/react';


type FaqAccordionProps = {
  blockData: {
    title: string;
    headline?: string;
  };
  faqs: Array<{
    id: string;
    icon_name?: string;
    question?: string;
    answer?: string;
  }>;
};

const FaqAccordion: React.FC<FaqAccordionProps> = ({ blockData, faqs }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { i18n } = useLingui();

  const getIconComponent = (iconName: string, className?: string) => {
    const IconComponent = (PIcon as unknown as Record<string, React.ComponentType<PIcon.IconProps> | undefined>)[iconName];
    return IconComponent ? <IconComponent size={42} weight="light" className={className} /> : null;
  };

  const filteredFaqs = faqs.filter(
    faq =>
      faq.question?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="faq-accordion container mt-40 space-y-6">
      <div className="mb-12 space-y-10">
        <h2 className="text-6xl md:text-8xl">{blockData.title}</h2>
        {blockData.headline && (
          <p className="text-2xl text-muted-foreground">{blockData.headline}</p>
        )}

        <Input
          type="text"
          placeholder={i18n._(t({ id: 'search_faqs' }))}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md"
        />
      </div>

      <Accordion type="single" collapsible className="w-full">
        {filteredFaqs.map((faq) => (
          <AccordionItem key={faq.id} value={faq.id}>
            <AccordionTrigger className="flex items-center text-muted-foreground transition-colors hover:text-foreground">
              <div className="flex items-center">
                {faq.icon_name &&
                  getIconComponent(faq.icon_name, 'mr-2 h-8 w-8')}
                <span className="text-2xl">{faq.question}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <WysiwygContent
                className="mb-10 max-w-3xl text-lg text-foreground"
                content={faq.answer || ''}
              />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default FaqAccordion;
