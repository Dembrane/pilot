// lib/notion.ts
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_BLOG_TOKEN });

export async function getDatabasesFromPage(pageId: string) {
  const response = await notion.blocks.children.list({
    block_id: pageId,
  });

  const databases = response.results.filter(
    (block: any) => block.type === 'child_database',
  );
  return databases;
}

export async function getDatabaseItems(databaseId: string) {
  const response = await notion.databases.query({
    database_id: databaseId,
  });

  return response.results.map((result: any) => ({
    title: result.properties.Name.title[0]?.plain_text || 'No title',
    description:
      result.properties.Description.rich_text[0]?.plain_text ||
      'No description',
    icon: result.properties.Icon.url || '',

    // Add other fields as necessary
  }));
}
