import React from 'react';
import { BlockColumns as BlockColumnsType, BlockColumnsRows } from '@/src/lib/types';
import { client } from '@/src/lib/directus';
import { readItems } from '@directus/sdk';
import WysiwygContent from '../WysiwygContent';
import Carousel from '../Carousel';

type BlockColumnsProps = {
    block: {
        id: string;
        item: BlockColumnsType;
    };
};

type ColumnsBlock = {
    id: string;
    title: string;
    headline: string;
    rows: BlockColumnsRows[];
};

async function getColumnsBlock(id: string): Promise<ColumnsBlock | null> {

    const columns = await client.request(readItems('block_columns', {
        filter: {
            id: {
                _eq: id
            }
        },
        fields: ["*", 'rows', 'rows.*'],
        sort: 'rows.sort'
    }));
    
    // Reshape the data to fit what is needed
    const reshapedColumns = columns.map((column: any) => ({
      id: column.id,
      title: column.title,
      headline: column.headline,
      rows: column.rows.map((row: any) => ({
        id: row.id,
        title: row.title,
        content: row.content,
      })),
    }));

    if (reshapedColumns && reshapedColumns.length > 0) {
      return reshapedColumns[0];
    }
    return null;
}

const BlockColumns: React.FC<BlockColumnsProps> = async ({ block }) => {

    const columns = await getColumnsBlock(block.item.id);

  return (
    <>
      {columns && (
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold">{columns.title}</h1>
          <WysiwygContent content={columns.headline} />
          <Carousel>    
            {columns.rows.map((row: BlockColumnsRows) => (
              <div key={row.id} className="bg-white p-4 basis-1">
                <h2 className="text-2xl font-bold">{row.title}</h2>
                <WysiwygContent content={row.content} />
              </div>
            ))}
          </Carousel>
        </div>
      )}
    </>
  );
};

export default BlockColumns;
