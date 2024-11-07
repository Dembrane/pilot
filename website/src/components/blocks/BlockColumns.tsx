import React from 'react';
import { BlockColumns as BlockColumnsType, BlockColumnsRows } from '@/lib/types';
import { client } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import WysiwygContent from '../WysiwygContent';
import CarouselWrapper from '../CarouselWrapper';
import Image from 'next/image';
import { DIRECTUS_PUBLIC_ASSETS_URL } from '@/lib/directus';

type BlockColumnsProps = {
    block: {
        id: string;
        item: BlockColumnsType;
    };
    lang: string;
};

type ColumnsBlock = {
    id: string;
    title: string;
    headline: string;
    content: string;
    rows: {
        id: string;
        title: string;
        headline: string;
        content: string;
        image: string;
    }[];
};

async function getColumnsBlock(id: string, lang: string): Promise<ColumnsBlock | null> {
    try {
        const columns = await client.request(readItems('block_columns', {
            filter: {
                id: {
                    _eq: id
                }
            },
            fields: [
                'id',
                'title',
                'rows.id',
                'rows.title',
                'rows.content',
                'rows.sort',
                'rows.image',
                'translations.languages_code',
                'translations.title',
                'translations.headline',
                'rows.translations.languages_code',
                'rows.translations.title',
                'rows.translations.headline',
                'rows.translations.content'
            ],
            sort: ['rows.sort']
        }));


        if (columns && columns.length > 0) {
            const column = columns[0];
            const columnTranslation = column.translations.find((t: any) => t.languages_code === lang);

            const reshapedColumn: ColumnsBlock = {
                id: column.id,
                title: columnTranslation?.title || column.title,
                headline: columnTranslation?.headline,
                rows: column.rows.map((row: any) => {
                    const rowTranslation = row.translations.find((t: any) => t.languages_code === lang);
                    return {
                        id: row.id,
                        title: rowTranslation?.title || row.title,
                        headline: rowTranslation?.headline,
                        content: rowTranslation?.content,
                        image: row.image,
                    };
                }),
            };

            return reshapedColumn;
        }
        return null;
    } catch (error) {
        console.error('Error fetching columns block:', error);
        return null;
    }
}

const BlockColumns: React.FC<BlockColumnsProps> = async ({ block, lang }) => {
    const columns = await getColumnsBlock(block.item.id, lang);

    if (!columns) {
        return <div>Error loading columns block. Please try again later.</div>;
    }

    return (
      <section className="container mt-12 flex min-h-screen flex-col justify-center md:mt-24">
        {columns.title && (
          <h2 className="lg:text-10xl mb-8 text-center text-6xl text-foreground md:text-8xl">
            {columns.title}
          </h2>
        )}
        {columns.headline && (
          <h3 className="lg:text-10xl mb-4 text-center text-6xl text-foreground md:text-8xl">
            {columns.headline}
          </h3>
        )}
        <div className="flex flex-col justify-center gap-16 md:flex-row">
          {columns.rows.map((row) => (
            <div
              key={row.id}
              className="column-item flex w-full md:w-1/2 max-w-sm flex-col items-center justify-center text-center self-center"
            >
              {row.image && (
                <Image
                  src={DIRECTUS_PUBLIC_ASSETS_URL + row.image}
                  alt={row.title}
                  width={400}
                  height={400}
                />
              )}
              <div className="w-full p-6 ">
                <h4 className="mb-2 text-4xl text-foreground">{row.title}</h4>
                {row.headline && (
                  <h5 className="mb-2 text-2xl text-foreground">
                    {row.headline}
                  </h5>
                )}
                {row.content && (
                  <div className="mt-3 text-left text-sm text-foreground">
                    <WysiwygContent content={row.content} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
};

export default BlockColumns;
