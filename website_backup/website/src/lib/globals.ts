import { client } from './directus';
import { readItems } from '@directus/sdk';
import { Globals, GlobalsTranslations } from './types';

export type GlobalsWithTranslation = Omit<Globals, 'translations'> & {
  tagline?: string;
  description?: string;
};

export async function getGlobals(): Promise<Globals | null> {
  try {
    const response = await client.request<Globals[]>(
      readItems('globals', {
        limit: 1,
        fields: [
          'title',
          'translations.*',
          'og_image.id',
          'seo.*',
          'seo.translations.*',
        ],
      })
    );

    if (!response || response.length === 0) {
      console.error('No globals data returned from Directus');
      return null;
    }

    return response;
  } catch (error) {
    console.error('Error fetching globals:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return null;
  }
}

export async function getGlobalsByLang(lang: string): Promise<GlobalsWithTranslation | null> {
  const globals = await getGlobals();

  if (!globals) {
    return null;
  }

  const translation = globals.translations?.find(t => t.languages_code === lang) as GlobalsTranslations | undefined;

  return {
    ...globals,
    tagline: translation?.tagline || globals.title,
    description: translation?.description || '',
  };
}
