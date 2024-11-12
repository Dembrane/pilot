import { NotionAPI } from 'notion-client';
import NotionClientRenderer from '@/components/NotionClientRenderer';
import TranslationNotice from '@/components/TranslationNotice';

interface PageProps {
  params: {
    pageId: string;
  };
}

const notion = new NotionAPI({
  activeUser: process.env.NOTION_ACTIVE_USER,
  authToken: process.env.NOTION_TOKEN_V2,
});

export default async function NotionPage({ params }: PageProps) {
  const { pageId } = await params;

  // Add validation to prevent processing invalid pageIds
  if (!pageId.match(/^[0-9a-f]{32}$/)) {
    return <div>Invalid Notion page ID format</div>;
  }

  const recordMap = await notion.getPage(pageId);
  console.log(pageId);

  return (
    <>
      <TranslationNotice />
      <NotionClientRenderer recordMap={recordMap} />
    </>
  );
}

export const dynamic = 'force-dynamic';
