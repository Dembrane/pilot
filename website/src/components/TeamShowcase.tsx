'use client';

import React from 'react';
import Image from 'next/image';
import { Team } from '@/lib/types';
import { DIRECTUS_PUBLIC_ASSETS_URL } from '@/lib/directus';
import Carousel from './Carousel';
import WysiwygContent from './WysiwygContent';
import * as PIcon from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import CarouselWrapper from './CarouselWrapper';
import Link from 'next/link';

type TeamShowcaseProps = {
  blockData: {
    title: string;
    headline: string | undefined;
    content: string | undefined;
  };
  teamMembers: TeamMember[];
};

type TeamMember = {
  id: string;
  name: string;
  job_title: string;
  bio: string;
  image: string;
  icon_name: string;
  cta: {
    label: string;
    url: string;
    icon: string;
  }[];
};

const TeamShowcase: React.FC<TeamShowcaseProps> = ({ blockData, teamMembers }) => {
  const getIconComponent = (iconName: string, className?: string) => {
    const IconComponent = (PIcon as unknown as Record<string, React.ComponentType<PIcon.IconProps> | undefined>)[iconName];
    return IconComponent ? <IconComponent size={42} weight="light" className={className} /> : null;
  };

  return (
    <section className="team-showcase mt-12 flex min-h-screen flex-col justify-center md:mt-24">
      <CarouselWrapper title={blockData.title} headline={blockData.headline}>
        {teamMembers.map((member) => (
          <motion.div
            key={member.id}
            className="team-member my-4 flex max-w-[80vw] flex-col items-start rounded-lg bg-card shadow-md transition-shadow duration-300 hover:shadow-lg sm:max-w-[400px]"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'ease' }}
          >
            {member.image && (
              <Image
                src={`${DIRECTUS_PUBLIC_ASSETS_URL}${member.image}`}
                alt={member.name || ''}
                width={400}
                height={400}
                draggable="false"
                style={{ pointerEvents: 'none' }}
                className="select-none rounded-t-lg"
              />
            )}
            <div className="w-full p-6">
              <div className="mb-2 flex items-start">
                {getIconComponent(member.icon_name, 'mr-2 flex-shrink-0')}
                <h4 className="text-4xl font-light text-foreground">
                  {member.name}
                </h4>
              </div>
              <p className="text-xl text-foreground">{member.job_title}</p>
              {member.bio && (
                <p className="mt-3 text-left text-sm text-foreground">
                  {member.bio}
                </p>
              )}
              {member.cta && (
                <div className="mt-4 flex gap-2 overflow-hidden">
                  {member.cta.map(
                    (item, index) =>
                      item.url && (
                        <Link
                          key={index}
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`group flex items-center justify-center rounded-md p-2 shadow-sm transition-all duration-200 hover:shadow-md ${
                            index === 0
                              ? 'bg-secondary text-secondary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {getIconComponent(item.icon, 'w-6 h-6')}
                          <span className="max-w-0 overflow-hidden whitespace-nowrap transition-all duration-200 group-hover:ml-2 group-hover:mr-2 group-hover:max-w-xs">
                            {item.label}
                          </span>
                        </Link>
                      ),
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </CarouselWrapper>
    </section>
  );
};

export default TeamShowcase;
