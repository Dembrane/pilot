import { NotionAPI } from 'notion-client';
import NotionClientRenderer from './NotionClientRenderer';

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
  const recordMap = await notion.getPage(pageId);
  console.log(pageId);

  return <NotionClientRenderer recordMap={recordMap} />;
}

export const dynamic = 'force-dynamic';
