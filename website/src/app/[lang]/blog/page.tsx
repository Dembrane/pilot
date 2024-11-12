import { Client } from '@notionhq/client';
import { notFound } from 'next/navigation';
import BlogList from '@/components/BlogList';
import { initLingui } from '@/initLingui';
import { t, Trans } from '@lingui/macro';
import { i18n } from '@lingui/core';
import { getI18nInstance } from '@/appRouterI18n';

const officialNotion = new Client({
  auth: process.env.NOTION_BLOG_TOKEN as string,
});

interface PageProps {
  params: {
    lang: string;
  };
}

export async function generateMetadata({ params }: PageProps) {
  return {
    title: 'Blog',
    description: 'Latest articles and updates',
  };
}

export default async function BlogPage({ params }: PageProps) {
  const { lang } = await params;
  const i18n = getI18nInstance(lang);

  try {
    const data = await officialNotion.databases.query({
      database_id: process.env.NOTION_BLOG_DATABASE_ID!,
      filter: {
        property: "Status",
        status: {
          equals: "published",
        },
      },
    });

    const posts = data.results.map((post: any) => ({
      id: post.id,
      title: post.properties.Name.title[0]?.plain_text || 'Untitled',
      description: post.properties.Description?.rich_text[0]?.plain_text || '',
      slug: post.properties.slug_DO_NOT_CHANGE.rich_text[0]?.plain_text || '',
      date: post.created_time,
      emoji: post.icon?.emoji || '',
      cover: post.cover?.file?.url || post.cover?.external?.url || '',
    }));

    return (
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">
          {i18n._(t`Blog`)}
        </h1>
        <BlogList posts={posts} />
      </main>
    );
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return (
      <div className="text-center py-12">
        {i18n._(t`Error loading blog posts. Please try again later.`)}
      </div>
    );
  }
}
