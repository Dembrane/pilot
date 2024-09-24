import { demos } from '#/lib/demos';
import { client } from '#/lib/directus';
import { FeelFreeToDelete } from '#/types';
import { readItem } from '@directus/sdk';
import Link from 'next/link';

export default async function Page() {
  const query = await client.request<FeelFreeToDelete>(
    readItem('feel_free_to_delete', 1),
  );

  return (
    <div className="space-y-8">
      <h1 className="animate-bounce text-6xl text-vercel-pink">
        FROM DIRECTUS: {query.text ?? 'ERROR'}
      </h1>

      <h1 className="text-xl font-medium text-gray-300">Examples</h1>

      <div className="space-y-10 text-white">
        {demos.map((section) => {
          return (
            <div key={section.name} className="space-y-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                {section.name}
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {section.items.map((item) => {
                  return (
                    <Link
                      href={`/${item.slug}`}
                      key={item.name}
                      className="group block space-y-1.5 rounded-lg bg-gray-900 px-5 py-3 hover:bg-gray-800"
                    >
                      <div className="font-medium text-gray-200 group-hover:text-gray-50">
                        {item.name}
                      </div>

                      {item.description ? (
                        <div className="line-clamp-3 text-sm text-gray-400 group-hover:text-gray-300">
                          {item.description}
                        </div>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
