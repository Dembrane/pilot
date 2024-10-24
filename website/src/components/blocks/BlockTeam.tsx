import React from 'react';
import { BlockTeam as BlockTeamType, Team } from '@/lib/types';
import { client } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import TeamShowcase from '@/components/TeamShowcase';

type BlockTeamProps = {
  block: {
    id: string;
    collection: string;
    item: BlockTeamType;
  };
  lang: string;
};

const getBlockWithTranslations = async (blockId: string, lang: string) => {
  try {
    const response = await client.request<BlockTeamType[]>(
      readItems('block_team', {
        filter: {
          id: {
            _eq: blockId,
          },
        },
        fields: [
          'title',
          'headline',
          'content',
          'icon_name',
          'translations',
          'translations.languages_code',
          'translations.title',
          'translations.headline',
          'translations.content',
        ],
      }),
    );

    if (response && response.length > 0) {
      const block = response[0];
      if (!block) {
        return null;
      }
      const blockTranslation = block.translations.find((t: any) => t.languages_code === lang);

      return {
        title: blockTranslation?.title || block.title,
        headline: blockTranslation?.headline,
        content: blockTranslation?.content,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching block team:', error);
    return null;
  }
};

const getTeamMembers = async (lang: string) => {
  try {
    const response = await client.request<Team[]>(
      readItems('team', {
        fields: [
          'id',
          'name',
          'icon_name',
          'image',
          'translations',
          'translations.languages_code',
          'translations.name',
          'translations.job_title',
          'translations.bio',
          'translations.cta',
        ],
        filter: {
          status: {
            _eq: 'published',
          },
        },
        sort: ['sort'],
      }),
    );

    return response.map(member => {
      const memberTranslation = member.translations.find((t: any) => t.languages_code === lang);
      return {
        id: member.id,
        name: memberTranslation?.name || member.name,
        icon_name: member.icon_name,
        image: member.image,
        job_title: memberTranslation?.job_title,
        bio: memberTranslation?.bio,
        cta: memberTranslation?.cta,
      };
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return [];
  }
};

const BlockTeam: React.FC<BlockTeamProps> = async ({ block, lang }) => {
  if (!block.id) {
    return null;
  }

  const [blockData, teamMembers] = await Promise.all([
    getBlockWithTranslations(block.item.id, lang),
    getTeamMembers(lang),
  ]);

  if (!blockData) {
    return <div>Error loading team block. Please try again later.</div>;
  }

  return <TeamShowcase blockData={blockData} teamMembers={teamMembers} />;
};

export default BlockTeam;
