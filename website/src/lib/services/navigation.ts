import { client } from '@/lib/directus';
import { readItems } from '@directus/sdk';
import { Navigation, Products } from '@lib/types';

export type NavigationItem = {
  id: string;
  url: string;
  label: string;
  phosphor_icon?: string;
  children?: NavigationItem[];
};

export async function getNavigationItems(
  lang: string,
): Promise<NavigationItem[]> {
  try {
    const response = await client.request<Navigation[]>(
      readItems('navigation', {
        filter: {
          id: { _eq: 'main' },
        },
        fields: [
          '*',
          // @ts-ignore
          'translations.*',
          // @ts-ignore
          'items.*',
          // @ts-ignore
          'items.navigation_items_id.*',
          // @ts-ignore
          'items.navigation_items_id.translations.*',
          // @ts-ignore
          'items.navigation_items_id.children.*',
          // @ts-ignore
          'items.navigation_items_id.children.translations.*',
        ],
      }),
    );

    if (response && response[0]) {
      const navigation = response[0];

      const mappedItems = navigation.items.map((item: any) => ({
        id: item.navigation_items_id.id,
        url: item.navigation_items_id.url || '',
        label:
          item.navigation_items_id.translations?.find(
            (t: any) => t.languages_code === lang,
          )?.label || '',
        phosphor_icon: item.navigation_items_id.phosphor_icon || undefined,
        children:
          item.navigation_items_id.children?.map((child: any) => ({
            id: child.id,
            url: child.url || '',
            label:
              child.translations?.find((t: any) => t.languages_code === lang)
                ?.label || '',
            phosphor_icon: child.phosphor_icon || undefined,
          })) || undefined,
      }));

      return mappedItems;
    }
    return [];
  } catch (error) {
    console.error('Error fetching navigation items:', error);
    return [];
  }
}

export async function getProducts(lang: string): Promise<Products[]> {
  try {
    const products = await client.request<Products[]>(
      readItems('products', {
        filter: {
          status: { _eq: 'published' },
        },
        fields: [
          'id',
          'slug',
          'name',
          'cover',
          {
            translations: ['*'],
          },
        ],
      }),
    );

    return products.map((product) => ({
      url: `/products/${product.slug}`,
      cover: product.cover,
      label: product.name,
      description:
        product.translations?.find((t) => t.languages_code === lang)
          ?.description ?? '',
      headline:
        product.translations?.find((t) => t.languages_code === lang)
          ?.headline ?? '',
      type:
        product.translations?.find((t) => t.languages_code === lang)?.type ??
        '',
      ...product,
      id: product.id,
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}
