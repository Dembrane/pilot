import { NotionAPI } from 'notion-client';
import { Client } from '@notionhq/client';
import { notFound } from 'next/navigation';
import NotionClientRenderer from '@/components/NotionClientRenderer';
import { Metadata } from 'next';
import TranslationNotice from '@/components/TranslationNotice';

const notion = new NotionAPI({
  activeUser: process.env.NOTION_ACTIVE_USER,
  authToken: process.env.NOTION_TOKEN_V2,
});

const officialNotion = new Client({
  auth: process.env.NOTION_BLOG_TOKEN as string,
});

interface PageProps {
  params: {
    lang: string;
    slug: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const data = await officialNotion.databases.query({
      database_id: process.env.NOTION_BLOG_DATABASE_ID!,
      filter: {
        and: [
          {
            property: "Status",
            status: {
              equals: "published",
            },
          },
          {
            property: "slug_DO_NOT_CHANGE",
            rich_text: {
              equals: slug,
            },
          },
        ],
      },
    });

    if (!data.results.length) {
      return {
        title: 'Post Not Found',
      };
    }

    const page = data.results[0] as any;
    const title = page.properties.Name.title[0]?.plain_text || 'Untitled';
    const description = page.properties.Description?.rich_text[0]?.plain_text || '';

    return {
      title,
      description,
    };
  } catch (error) {
    console.error('Error fetching page metadata:', error);
    return {
      title: 'Blog Post',
    };
  }
}

export async function generateStaticParams() {
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

    const locales = ['en-US', 'nl-NL'];

    return data.results.flatMap((page: any) => {
      const slug = page.properties.slug_DO_NOT_CHANGE.rich_text[0]?.plain_text;
      if (!slug) return [];
      
      return locales.map(lang => ({
        lang,
        slug,
      }));
    });
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

export default async function BlogPost({ params }: PageProps) {
  const { slug } = await params;

  try {
    const data = await officialNotion.databases.query({
      database_id: process.env.NOTION_BLOG_DATABASE_ID!,
      filter: {
        and: [
          {
            property: "Status",
            status: {
              equals: "published",
            },
          },
          {
            property: "slug_DO_NOT_CHANGE",
            rich_text: {
              equals: slug,
            },
          },
        ],
      },
    });

    if (!data.results.length) {
      return notFound();
    }

    const pageId = data.results[0].id;
    const recordMap = await notion.getPage(pageId);

    return (
      <>
        <TranslationNotice />
        <NotionClientRenderer recordMap={recordMap} />
      </>
    );
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return notFound();
  }
}
